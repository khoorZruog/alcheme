"""Rakuten Ichiba API tool for cosmetic product search.

Docstrings are used as tool descriptions by ADK.
"""

import os
import re

from urllib.parse import urlparse

import requests

RAKUTEN_API_URL = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601"
_DEFAULT_REFERER = "https://alcheme-web-x3hwwomrxa-an.a.run.app/"

# Regex patterns to extract color code and name from Rakuten product titles
# e.g. "リップモンスター 03 陽炎" → code="03", name="陽炎"
# e.g. "アイシャドウ #N20 ナチュラルベージュ" → code="N20", name="ナチュラルベージュ"
_COLOR_PATTERN = re.compile(
    r"(?:#|No\.?|番?)\s*([A-Za-z]?\d{1,3}[A-Za-z]?)\s+([\u3000-\u9FFFぁ-ヶー]+)",
)
_COLOR_CODE_ONLY = re.compile(
    r"(?:^|\s)#?([A-Za-z]?\d{1,3}[A-Za-z]?)(?:\s|$)",
)


def _extract_color_info(product_name: str) -> dict:
    """Extract color_code and color_name from a product name string."""
    m = _COLOR_PATTERN.search(product_name)
    if m:
        return {"color_code": m.group(1), "color_name": m.group(2)}
    m2 = _COLOR_CODE_ONLY.search(product_name)
    if m2:
        return {"color_code": m2.group(1)}
    return {}


def search_rakuten_api(keyword: str) -> dict:
    """Search for cosmetic products on Rakuten Ichiba by keyword.

    Args:
        keyword: Search keyword such as brand name, product name, or color name.

    Returns:
        A dict with product search results including name, price, and URL.
    """
    app_id = os.environ.get("RAKUTEN_APP_ID")
    access_key = os.environ.get("RAKUTEN_ACCESS_KEY")
    if not app_id or not access_key:
        return {"status": "error", "message": "RAKUTEN_APP_ID and RAKUTEN_ACCESS_KEY must be configured"}

    try:
        params = {
            "applicationId": app_id,
            "accessKey": access_key,
            "keyword": keyword,
            "hits": 5,
            "sort": "standard",
            "format": "json",
            "formatVersion": "2",
            "imageFlag": 1,
        }
        referer = os.environ.get("RAKUTEN_REFERER_URL", _DEFAULT_REFERER)
        parsed = urlparse(referer)
        headers = {
            "Referer": referer,
            "Origin": f"{parsed.scheme}://{parsed.netloc}",
        }
        resp = requests.get(RAKUTEN_API_URL, params=params, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("Items", []):
            name = item.get("itemName", "")
            images = item.get("mediumImageUrls", [])
            color_info = _extract_color_info(name)
            results.append({
                "name": name,
                "price": item.get("itemPrice", 0),
                "url": item.get("itemUrl", ""),
                "shop": item.get("shopName", ""),
                "image_url": images[0] if images else "",
                "review_count": item.get("reviewCount", 0),
                "review_average": item.get("reviewAverage", 0),
                **color_info,
            })

        return {"status": "success", "results": results, "count": len(results)}
    except requests.RequestException as e:
        return {"status": "error", "message": str(e)}


def search_rakuten_for_candidates(
    brand: str,
    product_name: str,
    color_hint: str = "",
) -> dict:
    """Search Rakuten for product candidates matching brand + product name.

    Used as a server-side fallback when the agent doesn't call search_rakuten_api.

    Args:
        brand: Brand name (e.g. "KATE")
        product_name: Product name (e.g. "リップモンスター")
        color_hint: Optional color name or code to narrow results

    Returns:
        dict with "candidates" list of matching products.
    """
    app_id = os.environ.get("RAKUTEN_APP_ID")
    access_key = os.environ.get("RAKUTEN_ACCESS_KEY")
    if not app_id or not access_key:
        return {"candidates": []}

    # Build keyword — brand + product_name, optionally color
    keyword = f"{brand} {product_name}"
    if color_hint:
        keyword += f" {color_hint}"

    try:
        params = {
            "applicationId": app_id,
            "accessKey": access_key,
            "keyword": keyword,
            "hits": 5,
            "sort": "standard",
            "format": "json",
            "formatVersion": "2",
            "imageFlag": 1,
        }
        referer = os.environ.get("RAKUTEN_REFERER_URL", _DEFAULT_REFERER)
        parsed = urlparse(referer)
        headers = {
            "Referer": referer,
            "Origin": f"{parsed.scheme}://{parsed.netloc}",
        }
        resp = requests.get(RAKUTEN_API_URL, params=params, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        candidates = []
        for item in data.get("Items", []):
            name = item.get("itemName", "")
            images = item.get("mediumImageUrls", [])
            color_info = _extract_color_info(name)
            candidates.append({
                "name": name,
                "price": item.get("itemPrice", 0),
                "url": item.get("itemUrl", ""),
                "shop": item.get("shopName", ""),
                "image_url": images[0] if images else "",
                "review_count": item.get("reviewCount", 0),
                "review_average": item.get("reviewAverage", 0),
                **color_info,
            })

        return {"candidates": candidates, "count": len(candidates)}
    except requests.RequestException:
        return {"candidates": []}
