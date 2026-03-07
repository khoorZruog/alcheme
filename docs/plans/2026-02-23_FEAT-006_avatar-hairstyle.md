# FEAT-006 アバター髪型カスタマイズ

| | |
|---|---|
| **Date** | 2026-02-23 |
| **Status** | **Completed** |
| **Related** | backlog_and_remaining_tasks.md (Phase 3 FEAT-006) |

## Context

メイクレシピやテーマのプレビュー画像（AI生成イラスト）において、キャラクターの髪型が固定されていた。
`CHARACTER_THEMES`（cute/cool/elegant）は顔の特徴・表情・ライティングを定義するが、髪型・髪色の記述がなかった。
ユーザーが設定で自分の髪型・髪色を選べるようにし、生成画像に反映させることで、パーソナライズされた体験を提供する。

**既存の型定義に `hairType: string | null` が存在**していたが、UIも Agent側も未使用だった。

---

## 変更ファイル一覧

| Batch | ファイル | 変更 |
|-------|---------|------|
| 1 | `types/user.ts` | `hairColor: string \| null` フィールド追加（JSDoc付き） |
| 1 | `app/(main)/settings/constants.ts` | `HAIR_STYLES`（6種）, `HAIR_COLORS`（8種）定数追加 |
| 2 | `app/(main)/settings/use-settings-form.ts` | `hairStyle`, `hairColor` をフォームステート・初期値・ロード・保存に追加 |
| 2 | `app/(main)/settings/_components/beauty-profile-section.tsx` | 髪型・髪色セレクターUI追加（ピルボタン） |
| 3 | `agent/alcheme/prompts/simulator.py` | `HAIR_STYLE_EN`, `HAIR_COLOR_EN` マッピング + `build_hair_description()` + `build_image_prompt()` に髪型パラメータ追加 |
| 3 | `agent/alcheme/prompts/theme_generator.py` | `build_theme_image_prompt()` に `hair_style`, `hair_color` パラメータ追加 |
| 4 | `agent/alcheme/tools/simulator_tools.py` | `generate_preview_image()` でユーザープロフィールから髪型を読み取り、プロンプトに渡す |
| 4 | `agent/alcheme/tools/theme_tools.py` | `generate_theme_image()` でユーザープロフィールから髪型を読み取り、プロンプトに渡す |

## 設計ポイント

### 髪型マッピング（Japanese value → English prompt）

```python
HAIR_STYLE_EN = {
    "very-short": "very short pixie",
    "short": "short",
    "bob": "bob-length",
    "medium": "medium-length",
    "semi-long": "shoulder-length",
    "long": "long",
}

HAIR_COLOR_EN = {
    "black": "black",
    "dark-brown": "dark brown",
    "brown": "brown",
    "light-brown": "light brown",
    "ash": "ash grey",
    "blonde": "blonde",
    "pink": "pink",
    "red": "red",
}
```

### プロンプト注入パターン

`build_hair_description()` が `", with dark brown long hair"` のような文字列を返し、
`face_style` の末尾に付与:

```
Generate a single portrait illustration of a cute anime-inspired young woman..., with dark brown long hair.
```

髪型・髪色が未設定の場合は空文字を返し、従来通りの動作を維持。

### データフロー

`simulator_tools.py` / `theme_tools.py` が Firestore `users/{userId}` から `hairType`, `hairColor` を直接読み取り。
画像生成時間（10-15秒）に比べて Firestore 読み取り（~50ms）は無視できるオーバーヘッド。

## 検証

- `npx tsc --noEmit`: クリーン（テストファイルの既存エラーのみ）
- `npx vitest run`: 285テスト全パス
- `python -m pytest tests/ -v`: 134パス、7失敗（全て既存の非関連テスト）
