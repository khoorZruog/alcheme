"""alche:me Agent API Server — FastAPI wrapper around ADK agents.

Exposes HTTP endpoints for the Next.js BFF to call:
  POST /scan   — Image scan → inventory_agent → structured items
  POST /chat   — Chat message → concierge (SSE streaming)
  GET  /health — Health check
"""

import asyncio
import base64
import json
import logging
import os
import re
import uuid
from typing import Any

# Load .env before any ADK / genai imports
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService
from google.adk.memory import InMemoryMemoryService
from google.genai import types

from google.cloud import firestore as firestore_lib

from alcheme.agent import root_agent
from alcheme.agents.product_search import create_product_search_agent
from alcheme.tools.rakuten_api import search_rakuten_for_candidates
from alcheme.tools.simulator_tools import generate_preview_image

# Firestore client for user profile lookups
_firestore_db: firestore_lib.Client | None = None


def _get_firestore() -> firestore_lib.Client:
    global _firestore_db
    if _firestore_db is None:
        _firestore_db = firestore_lib.Client()
    return _firestore_db


def _build_user_state(user_id: str) -> dict:
    """Build initial session state with user profile data from Firestore."""
    state: dict[str, Any] = {"user:id": user_id}
    try:
        doc = _get_firestore().collection("users").document(user_id).get()
        if doc.exists:
            profile = doc.to_dict() or {}
            if profile.get("personalColor"):
                state["user:personal_color"] = profile["personalColor"]
            if profile.get("skinType"):
                state["user:skin_type"] = profile["skinType"]
            if profile.get("displayName"):
                state["user:display_name"] = profile["displayName"]
            if profile.get("beautyGoals"):
                state["user:beauty_goals"] = profile["beautyGoals"]
    except Exception as e:
        logger.warning("Failed to fetch user profile for %s: %s", user_id, e)
    return state

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
AGENT_API_KEY = os.environ.get("AGENT_API_KEY", "")
APP_NAME = "alcheme"

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# ADK Runner setup
# ---------------------------------------------------------------------------
SESSION_DB_URL = os.environ.get(
    "SESSION_DB_URL",
    "sqlite+aiosqlite:///sessions.db",
)
session_service = DatabaseSessionService(db_url=SESSION_DB_URL)
memory_service = InMemoryMemoryService()
runner = Runner(
    agent=root_agent,
    app_name=APP_NAME,
    session_service=session_service,
    memory_service=memory_service,
)

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="alche:me Agent API", version="1.0.0")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error("Validation error on %s: %s", request.url.path, exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


# ---------------------------------------------------------------------------
# Auth middleware
# ---------------------------------------------------------------------------
async def verify_api_key(request: Request):
    """Simple API key authentication."""
    if not AGENT_API_KEY:
        return  # No key configured = dev mode, allow all
    key = request.headers.get("X-API-Key", "")
    if key != AGENT_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


# ---------------------------------------------------------------------------
# Request/Response models
# ---------------------------------------------------------------------------
class ScanRequest(BaseModel):
    images: list[dict[str, Any]] | None = None  # [{"base64": "...", "mime_type": "image/jpeg"}, ...]
    user_id: str
    # Backward compat: single image
    image_base64: str | None = None
    image_mime_type: str | None = None


class ChatRequest(BaseModel):
    message: str
    user_id: str
    session_id: str | None = None
    image_base64: str | None = None
    image_mime_type: str | None = None


class ProductSearchRequest(BaseModel):
    keyword: str
    user_id: str


class EnhanceRecipeRequest(BaseModel):
    user_id: str
    steps: list[dict[str, Any]]
    context: dict[str, Any] | None = None


class GenerateImageRequest(BaseModel):
    recipe_id: str
    user_id: str
    steps: list[dict[str, Any]]
    theme: str = "cute"


# ---------------------------------------------------------------------------
# Helper: extract text from agent events
# ---------------------------------------------------------------------------
def _extract_text_from_event(event) -> str:
    """Extract text content from an ADK Event."""
    if event.content and event.content.parts:
        texts = []
        for part in event.content.parts:
            if hasattr(part, "text") and part.text:
                texts.append(part.text)
        return "".join(texts)
    return ""


# ---------------------------------------------------------------------------
# Helper: extract progress info from agent events
# ---------------------------------------------------------------------------
_TOOL_PROGRESS_MAP: dict[str, str] = {
    "get_inventory_summary": "手持ちコスメを確認中...",
    "get_inventory": "在庫データを取得中...",
    "search_inventory": "コスメを検索中...",
    "filter_inventory_by_category": "カテゴリで絞り込み中...",
    "validate_recipe_items": "レシピのアイテムを検証中...",
    "save_recipe": "メイクレシピを保存中...",
    "search_rakuten_api": "楽天で商品情報を検索中...",
    "google_search": "商品情報をWeb検索中...",
    "generate_item_id": "アイテムを登録準備中...",
    "add_items_to_inventory": "在庫に追加中...",
    "analyze_product_compatibility": "手持ちコスメとの相性を分析中...",
    "compare_products_against_inventory": "商品を比較分析中...",
    "save_beauty_log": "メイクログを保存中...",
    "get_beauty_logs": "メイク履歴を取得中...",
    "get_weather": "天気情報を取得中...",
    "get_today_schedule": "今日の予定を確認中...",
    "analyze_preference_history": "好みの傾向を分析中...",
    "get_substitution_technique": "代用テクニックを検索中...",
}

_AGENT_PROGRESS_MAP: dict[str, str] = {
    "alchemist_agent": "メイクレシピを作成中...",
    "inventory_agent": "コスメ在庫を分析中...",
    "product_search_agent": "商品情報を検索中...",
    "memory_keeper_agent": "メイクログを確認中...",
    "trend_hunter_agent": "トレンドを分析中...",
    "tpo_tactician_agent": "TPOに合わせた提案を準備中...",
    "profiler_agent": "好み傾向を分析中...",
    "instructor_agent": "メイク手順を作成中...",
}


def _extract_progress_from_event(event) -> str | None:
    """Extract a user-facing progress message from an ADK Event."""
    # Check for agent transfer
    if hasattr(event, "actions") and event.actions:
        target = getattr(event.actions, "transfer_to_agent", None)
        if target and target in _AGENT_PROGRESS_MAP:
            return _AGENT_PROGRESS_MAP[target]

    # Check for function calls (tool invocations)
    try:
        function_calls = event.get_function_calls()
        if function_calls:
            for call in function_calls:
                if call.name in _TOOL_PROGRESS_MAP:
                    return _TOOL_PROGRESS_MAP[call.name]
    except Exception:
        pass

    return None


def _extract_recipe_id_from_event(event) -> str | None:
    """Extract recipe_id from a save_recipe tool function response."""
    try:
        # ADK function responses are in event.content.parts
        if not hasattr(event, "content") or not event.content:
            return None
        parts = getattr(event.content, "parts", None)
        if not parts:
            return None
        for part in parts:
            resp = getattr(part, "function_response", None)
            if resp and getattr(resp, "name", None) == "save_recipe":
                response_data = getattr(resp, "response", None)
                if response_data is None:
                    logger.warning("save_recipe response_data is None")
                    return None
                # Plain dict (most common)
                if isinstance(response_data, dict):
                    return response_data.get("recipe_id")
                # Proto Struct / mapping-like objects (ADK may wrap responses)
                if hasattr(response_data, "get"):
                    rid = response_data.get("recipe_id")
                    if rid:
                        return str(rid)
                # Try dict() conversion for proto Struct
                try:
                    data_dict = dict(response_data)
                    rid = data_dict.get("recipe_id")
                    if rid:
                        return str(rid)
                except (TypeError, ValueError):
                    pass
                logger.warning(
                    "save_recipe response format unexpected: %r (type=%s)",
                    response_data,
                    type(response_data).__name__,
                )
    except Exception as e:
        logger.warning("Failed to extract recipe_id from event: %s", e)
    return None


def _fallback_save_recipe(recipe_block: dict, user_id: str) -> str | None:
    """Save a recipe to Firestore when the agent didn't call save_recipe.

    Returns the Firestore document ID on success, or None on failure.
    """
    try:
        recipe = recipe_block.get("recipe", recipe_block)
        if not isinstance(recipe, dict):
            return None

        # Normalize field names (same logic as recipe_tools.save_recipe)
        if "title" in recipe and "recipe_name" not in recipe:
            recipe["recipe_name"] = recipe.pop("title")
        recipe.setdefault("recipe_name", "メイクレシピ")
        recipe.setdefault("user_request", "")
        recipe.setdefault("is_favorite", False)
        recipe.setdefault("pro_tips", [])
        recipe.setdefault("thinking_process", [])

        # Preserve used_items from outer wrapper
        if "used_items" in recipe_block and "used_items" not in recipe:
            recipe["used_items"] = recipe_block["used_items"]

        recipe["created_at"] = firestore_lib.SERVER_TIMESTAMP
        recipe["updated_at"] = firestore_lib.SERVER_TIMESTAMP
        recipe.pop("createdAt", None)
        recipe.pop("updatedAt", None)

        db = _get_firestore()
        doc_ref = db.collection("users").document(user_id).collection("recipes").document()
        doc_ref.set(recipe)
        logger.info("Fallback saved recipe %s for user %s", doc_ref.id, user_id)
        return doc_ref.id
    except Exception as e:
        logger.warning("Fallback recipe save failed: %s", e)
        return None


def _extract_json_blocks(text: str) -> list[dict]:
    """Extract JSON code blocks from agent text output."""
    results = []
    # Match ```json ... ``` blocks
    pattern = r"```(?:json)?\s*\n([\s\S]*?)\n```"
    matches = re.findall(pattern, text)
    for match in matches:
        try:
            parsed = json.loads(match)
            results.append(parsed)
        except json.JSONDecodeError:
            continue
    # Also try to parse the entire text as JSON
    if not results:
        try:
            parsed = json.loads(text)
            results.append(parsed)
        except json.JSONDecodeError:
            pass
    return results


# ---------------------------------------------------------------------------
# POST /scan
# ---------------------------------------------------------------------------
@app.post("/scan", dependencies=[Depends(verify_api_key)])
async def scan(req: ScanRequest):
    """Send image(s) to the inventory agent for cosmetics identification."""
    session_id = f"scan-{uuid.uuid4().hex[:8]}"

    # Create session with user context
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=req.user_id,
        session_id=session_id,
        state=_build_user_state(req.user_id),
    )

    # Build image list (support both multi-image and single-image)
    image_entries: list[dict] = []
    if req.images:
        image_entries = req.images
    elif req.image_base64 and req.image_mime_type:
        image_entries = [{"base64": req.image_base64, "mime_type": req.image_mime_type}]

    if not image_entries:
        raise HTTPException(status_code=400, detail="No images provided")

    # Build multimodal message with image(s)
    parts: list[types.Part] = []
    num_images = len(image_entries)
    if num_images == 1:
        parts.append(types.Part(text="この画像のコスメを鑑定してください。JSON形式で結果を返してください。"))
    else:
        parts.append(types.Part(text=f"以下の{num_images}枚の画像は同じコスメを異なる角度から撮影したものです。全画像を総合的に分析して鑑定してください。JSON形式で結果を返してください。"))

    for entry in image_entries:
        img_bytes = base64.b64decode(entry["base64"])
        parts.append(
            types.Part(
                inline_data=types.Blob(
                    mime_type=entry.get("mime_type", "image/jpeg"),
                    data=img_bytes,
                )
            )
        )

    message = types.Content(role="user", parts=parts)

    # Run agent and collect all events
    full_text = ""
    try:
        async for event in runner.run_async(
            user_id=req.user_id,
            session_id=session_id,
            new_message=message,
        ):
            text = _extract_text_from_event(event)
            if text:
                full_text += text
    except Exception as e:
        logger.error(f"Scan agent error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    # Parse structured output from agent response
    json_blocks = _extract_json_blocks(full_text)

    items = []
    for block in json_blocks:
        # Handle both {items: [...]} and [{...}, ...] formats
        if isinstance(block, list):
            items.extend(block)
        elif isinstance(block, dict):
            if "items" in block:
                items.extend(block["items"])
            else:
                items.append(block)

    # --- Rakuten API fallback enrichment ---
    for item in items:
        if item.get("candidates"):
            continue  # Agent already provided candidates
        brand = item.get("brand", "")
        product_name = item.get("product_name", "")
        if brand and brand != "不明" and product_name and product_name != "不明":
            try:
                rakuten_res = search_rakuten_for_candidates(
                    brand=brand,
                    product_name=product_name,
                    color_hint=item.get("color_name") or item.get("color_code") or "",
                )
                candidates = rakuten_res.get("candidates", [])
                if candidates:
                    item["candidates"] = candidates
                    # Auto-match if single high-confidence result
                    if len(candidates) == 1:
                        best = candidates[0]
                        item["price"] = best.get("price")
                        item["product_url"] = best.get("url")
                        item["rakuten_image_url"] = best.get("image_url")
                        if best.get("color_code") and not item.get("color_code"):
                            item["color_code"] = best["color_code"]
                        if best.get("color_name") and not item.get("color_name"):
                            item["color_name"] = best["color_name"]
            except Exception as e:
                logger.warning("Rakuten fallback failed for %s %s: %s", brand, product_name, e)

    return {
        "success": True,
        "items": items,
        "count": len(items),
        "raw_text": full_text,
    }


# ---------------------------------------------------------------------------
# POST /chat
# ---------------------------------------------------------------------------
@app.post("/chat", dependencies=[Depends(verify_api_key)])
async def chat(req: ChatRequest):
    """Chat with the concierge agent, streaming SSE responses."""
    # Session ID is server-determined (deterministic per user)
    session_id = f"chat-{req.user_id}"

    # Create or reuse session; extract memories and reset if history is too large
    MAX_SESSION_EVENTS = 20
    existing = await session_service.get_session(
        app_name=APP_NAME,
        user_id=req.user_id,
        session_id=session_id,
    )
    if existing and len(existing.events) > MAX_SESSION_EVENTS:
        logger.info("Session %s has %d events, extracting memories and resetting", session_id, len(existing.events))
        # Extract memories before deleting session
        try:
            await memory_service.add_session_to_memory(existing)
            logger.info("Memories extracted from session %s", session_id)
        except Exception as mem_err:
            logger.warning("Memory extraction failed for session %s: %s (proceeding anyway)", session_id, mem_err)
        await session_service.delete_session(app_name=APP_NAME, user_id=req.user_id, session_id=session_id)
        existing = None
    if not existing:
        await session_service.create_session(
            app_name=APP_NAME,
            user_id=req.user_id,
            session_id=session_id,
            state=_build_user_state(req.user_id),
        )

    # Build message content
    parts: list[types.Part] = [types.Part(text=req.message)]
    if req.image_base64 and req.image_mime_type:
        image_bytes = base64.b64decode(req.image_base64)
        parts.append(
            types.Part(
                inline_data=types.Blob(
                    mime_type=req.image_mime_type,
                    data=image_bytes,
                )
            )
        )

    message = types.Content(role="user", parts=parts)

    async def event_generator():
        """Generate SSE events from agent response."""
        import time as _time
        AGENT_DEADLINE = 90  # Max seconds for agent processing

        encoder = json.dumps
        full_text = ""
        saved_recipe_id: str | None = None
        start_time = _time.monotonic()
        try:
            async for event in runner.run_async(
                user_id=req.user_id,
                session_id=session_id,
                new_message=message,
            ):
                # Safety: abort if processing exceeds deadline
                if _time.monotonic() - start_time > AGENT_DEADLINE:
                    logger.warning("Agent processing exceeded %ds deadline, aborting", AGENT_DEADLINE)
                    error_data = encoder(
                        {"type": "text_delta", "data": "処理に時間がかかりすぎたため中断しました。もう少し具体的にリクエストしてみてください。"},
                        ensure_ascii=False,
                    )
                    yield f"data: {error_data}\n\n"
                    break

                # Emit progress events for tool calls / agent transfers
                progress = _extract_progress_from_event(event)
                if progress:
                    progress_data = encoder({"type": "progress", "data": progress}, ensure_ascii=False)
                    yield f"data: {progress_data}\n\n"

                # Capture recipe_id from save_recipe tool result
                if not saved_recipe_id:
                    saved_recipe_id = _extract_recipe_id_from_event(event)

                text = _extract_text_from_event(event)
                if text:
                    full_text += text
                    # Send text delta
                    data = encoder({"type": "text_delta", "data": text}, ensure_ascii=False)
                    yield f"data: {data}\n\n"

            if not full_text:
                logger.warning("Agent produced no text output for user %s (session %s). Events may have been tool-only.", req.user_id, session_id)

            # After all events, check for recipe JSON in the full text
            json_blocks = _extract_json_blocks(full_text)
            recipe_steps: list[dict] | None = None
            if not json_blocks:
                logger.info("No JSON blocks found in agent output (%d chars). Recipe card will not be displayed.", len(full_text))
            for block in json_blocks:
                if isinstance(block, dict) and "recipe" in block:
                    # Fallback save: if agent didn't call save_recipe, save it now
                    if not saved_recipe_id and isinstance(block.get("recipe"), dict):
                        fallback_id = _fallback_save_recipe(block, req.user_id)
                        if fallback_id:
                            saved_recipe_id = fallback_id

                    # Inject saved recipe_id so frontend can link to /recipes/{id}
                    if saved_recipe_id and isinstance(block.get("recipe"), dict):
                        block["recipe"]["id"] = saved_recipe_id
                        recipe_steps = block["recipe"].get("steps")
                    recipe_data = encoder(
                        {"type": "recipe_card", "data": json.dumps(block, ensure_ascii=False)},
                        ensure_ascii=False,
                    )
                    yield f"data: {recipe_data}\n\n"

            # Generate preview image if recipe was saved
            if saved_recipe_id and recipe_steps:
                progress_data = encoder({"type": "progress", "data": "仕上がりプレビューを生成中..."}, ensure_ascii=False)
                yield f"data: {progress_data}\n\n"
                try:
                    logger.info("Starting preview image generation for recipe %s (%d steps)", saved_recipe_id, len(recipe_steps))
                    preview_result = await asyncio.wait_for(
                        generate_preview_image(
                            recipe_id=saved_recipe_id,
                            user_id=req.user_id,
                            steps=recipe_steps,
                        ),
                        timeout=15.0,
                    )
                    if preview_result.get("status") == "success":
                        preview_data = encoder(
                            {"type": "preview_image", "data": {"image_url": preview_result["image_url"], "recipe_id": saved_recipe_id}},
                            ensure_ascii=False,
                        )
                        yield f"data: {preview_data}\n\n"
                    else:
                        logger.warning("Preview image generation returned error: %s", preview_result.get("error", "unknown"))
                except asyncio.TimeoutError:
                    logger.warning("Preview image generation timed out for recipe %s", saved_recipe_id)
                except Exception as preview_err:
                    logger.warning("Preview image generation failed: %s", preview_err)
            elif saved_recipe_id and not recipe_steps:
                logger.info("Recipe %s saved but no steps extracted from JSON — skipping preview image", saved_recipe_id)

        except Exception as e:
            # Determine if we should retry with a fresh session
            error_str = str(e)
            should_retry = False
            if "INVALID_ARGUMENT" in error_str and "token" in error_str.lower():
                should_retry = True
                logger.warning("Token limit exceeded, resetting session %s and retrying", session_id)
            else:
                # If session has accumulated events, stale state may be the cause
                try:
                    err_session = await session_service.get_session(
                        app_name=APP_NAME, user_id=req.user_id, session_id=session_id,
                    )
                    if err_session and len(err_session.events) > 2:
                        should_retry = True
                        logger.warning(
                            "Error with existing session (%d events), resetting %s and retrying: %s",
                            len(err_session.events), session_id, error_str[:200],
                        )
                except Exception:
                    pass

            if should_retry:
                try:
                    # Extract memories before emergency reset
                    try:
                        overflow_session = await session_service.get_session(
                            app_name=APP_NAME, user_id=req.user_id, session_id=session_id,
                        )
                        if overflow_session:
                            await memory_service.add_session_to_memory(overflow_session)
                    except Exception as mem_err:
                        logger.warning("Memory extraction failed on token overflow: %s", mem_err)
                    await session_service.delete_session(app_name=APP_NAME, user_id=req.user_id, session_id=session_id)
                    await session_service.create_session(
                        app_name=APP_NAME,
                        user_id=req.user_id,
                        session_id=session_id,
                        state=_build_user_state(req.user_id),
                    )
                    retry_full_text = ""
                    retry_recipe_id: str | None = None
                    async for event in runner.run_async(
                        user_id=req.user_id,
                        session_id=session_id,
                        new_message=message,
                    ):
                        progress = _extract_progress_from_event(event)
                        if progress:
                            progress_data = encoder({"type": "progress", "data": progress}, ensure_ascii=False)
                            yield f"data: {progress_data}\n\n"
                        if not retry_recipe_id:
                            retry_recipe_id = _extract_recipe_id_from_event(event)
                        text = _extract_text_from_event(event)
                        if text:
                            retry_full_text += text
                            data = encoder({"type": "text_delta", "data": text}, ensure_ascii=False)
                            yield f"data: {data}\n\n"

                    # Check for recipe JSON in retry output
                    retry_json_blocks = _extract_json_blocks(retry_full_text)
                    retry_steps: list[dict] | None = None
                    for block in retry_json_blocks:
                        if isinstance(block, dict) and "recipe" in block:
                            # Fallback save in retry path
                            if not retry_recipe_id and isinstance(block.get("recipe"), dict):
                                fallback_id = _fallback_save_recipe(block, req.user_id)
                                if fallback_id:
                                    retry_recipe_id = fallback_id

                            if retry_recipe_id and isinstance(block.get("recipe"), dict):
                                block["recipe"]["id"] = retry_recipe_id
                                retry_steps = block["recipe"].get("steps")
                            recipe_data = encoder(
                                {"type": "recipe_card", "data": json.dumps(block, ensure_ascii=False)},
                                ensure_ascii=False,
                            )
                            yield f"data: {recipe_data}\n\n"

                    # Generate preview image in retry path
                    if retry_recipe_id and retry_steps:
                        progress_data = encoder({"type": "progress", "data": "仕上がりプレビューを生成中..."}, ensure_ascii=False)
                        yield f"data: {progress_data}\n\n"
                        try:
                            preview_result = await asyncio.wait_for(
                                generate_preview_image(
                                    recipe_id=retry_recipe_id,
                                    user_id=req.user_id,
                                    steps=retry_steps,
                                ),
                                timeout=15.0,
                            )
                            if preview_result.get("status") == "success":
                                preview_data = encoder(
                                    {"type": "preview_image", "data": {"image_url": preview_result["image_url"], "recipe_id": retry_recipe_id}},
                                    ensure_ascii=False,
                                )
                                yield f"data: {preview_data}\n\n"
                        except asyncio.TimeoutError:
                            logger.warning("Preview image generation timed out (retry) for recipe %s", retry_recipe_id)
                        except Exception as preview_err:
                            logger.warning("Preview image generation failed (retry): %s", preview_err)
                except Exception as retry_err:
                    logger.error(f"Chat retry also failed: {retry_err}", exc_info=True)
                    error_data = encoder({"type": "error", "data": str(retry_err)}, ensure_ascii=False)
                    yield f"data: {error_data}\n\n"
            else:
                logger.error(f"Chat agent error: {e}", exc_info=True)
                error_data = encoder({"type": "error", "data": str(e)}, ensure_ascii=False)
                yield f"data: {error_data}\n\n"

        # Send done event
        done_data = encoder({"type": "done", "data": ""})
        yield f"data: {done_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# DELETE /chat/session — Reset chat session for a user
# ---------------------------------------------------------------------------
class DeleteSessionRequest(BaseModel):
    user_id: str


@app.post("/chat/session/delete", dependencies=[Depends(verify_api_key)])
async def delete_chat_session(req: DeleteSessionRequest):
    """Delete a user's chat session to allow a fresh start."""
    session_id = f"chat-{req.user_id}"
    try:
        existing = await session_service.get_session(
            app_name=APP_NAME, user_id=req.user_id, session_id=session_id,
        )
        if existing:
            await session_service.delete_session(
                app_name=APP_NAME, user_id=req.user_id, session_id=session_id,
            )
            return {"success": True, "message": f"Session {session_id} deleted"}
        return {"success": True, "message": "No session found"}
    except Exception as e:
        logger.error("Failed to delete session %s: %s", session_id, e)
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# POST /search/product
# ---------------------------------------------------------------------------
@app.post("/search/product", dependencies=[Depends(verify_api_key)])
async def search_product(req: ProductSearchRequest):
    """Search for cosmetic product info using Google Search via the product_search_agent."""
    session_id = f"search-{uuid.uuid4().hex[:8]}"

    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=req.user_id,
        session_id=session_id,
        state=_build_user_state(req.user_id),
    )

    # Create a dedicated runner for the product_search_agent
    product_agent = create_product_search_agent()
    search_runner = Runner(
        agent=product_agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    message = types.Content(
        role="user",
        parts=[types.Part(text=f"以下のコスメ商品を検索して、正確な商品情報をJSON形式で返してください: {req.keyword}")],
    )

    full_text = ""
    try:
        async for event in search_runner.run_async(
            user_id=req.user_id,
            session_id=session_id,
            new_message=message,
        ):
            text = _extract_text_from_event(event)
            if text:
                full_text += text
    except Exception as e:
        logger.error("Product search agent error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    # Parse structured output
    json_blocks = _extract_json_blocks(full_text)

    results = []
    for block in json_blocks:
        if isinstance(block, dict):
            # Handle {search_result: {...}, alternatives: [...]} format
            sr = block.get("search_result")
            if sr and isinstance(sr, dict):
                results.append(sr)
            alts = block.get("alternatives", [])
            if isinstance(alts, list):
                results.extend(alts)
            # Also handle direct item format
            if "brand" in block and "product_name" in block:
                results.append(block)

    return {
        "success": True,
        "results": results,
        "count": len(results),
        "raw_text": full_text,
    }


# ---------------------------------------------------------------------------
# POST /enhance-recipe
# ---------------------------------------------------------------------------
@app.post("/enhance-recipe", dependencies=[Depends(verify_api_key)])
async def enhance_recipe(req: EnhanceRecipeRequest):
    """Generate recipe name, pro tips, and thinking process from steps."""
    session_id = f"enhance-{uuid.uuid4().hex[:8]}"

    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=req.user_id,
        session_id=session_id,
        state=_build_user_state(req.user_id),
    )

    steps_desc = "\n".join(
        f"- STEP {i+1}: {s.get('area', '')} / {s.get('brand', '')} {s.get('item_name', '')} — {s.get('instruction', '')}"
        for i, s in enumerate(req.steps)
    )
    context_desc = ""
    if req.context:
        if req.context.get("occasion"):
            context_desc += f"\nシーン: {req.context['occasion']}"
        if req.context.get("weather"):
            context_desc += f"\n天気: {req.context['weather']}"

    prompt = f"""以下のメイクレシピのステップを分析して、以下のJSON形式で回答してください:
{{
  "recipe_name": "レシピのテーマ名（短く魅力的に）",
  "pro_tips": ["プロのコツ1", "プロのコツ2", "プロのコツ3"],
  "thinking_process": ["使用コスメの色味の分析", "テクスチャバランスの評価"]
}}

ステップ:
{steps_desc}
{context_desc}

JSON形式のみで回答してください。"""

    message = types.Content(
        role="user",
        parts=[types.Part(text=prompt)],
    )

    full_text = ""
    try:
        async for event in runner.run_async(
            user_id=req.user_id,
            session_id=session_id,
            new_message=message,
        ):
            text = _extract_text_from_event(event)
            if text:
                full_text += text
    except Exception as e:
        logger.error("Enhance recipe error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    # Parse JSON from response
    json_blocks = _extract_json_blocks(full_text)
    if json_blocks and isinstance(json_blocks[0], dict):
        return json_blocks[0]

    return {
        "recipe_name": "",
        "pro_tips": [],
        "thinking_process": [],
    }


# ---------------------------------------------------------------------------
# POST /generate-image
# ---------------------------------------------------------------------------
@app.post("/generate-image", dependencies=[Depends(verify_api_key)])
async def generate_image_endpoint(req: GenerateImageRequest):
    """Generate a preview image for a recipe."""
    try:
        result = await asyncio.wait_for(
            generate_preview_image(
                recipe_id=req.recipe_id,
                user_id=req.user_id,
                steps=req.steps,
                theme=req.theme,
            ),
            timeout=180,
        )
        return result
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Image generation timed out")
    except Exception as e:
        logger.error("Generate image error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "app": APP_NAME, "agent": root_agent.name}
