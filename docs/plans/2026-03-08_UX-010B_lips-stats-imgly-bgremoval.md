# UX-010B: LIPS準拠スペック指標 + ブラウザ側背景除去

## Context

1. **スペック指標**: 独自表現（発色力/ナチュラル等）がユーザー信頼性に欠ける → LIPS準拠のカテゴリ別タグに変更
2. **背景除去**: rembg がCloud Run 1Gi メモリで不安定 → `@imgly/background-removal` でブラウザ側処理に移行

## Part 1: LIPS準拠カテゴリ別スペックラベル

### ラベルマッピング

| DB Field | リップ | アイメイク | ベースメイク | スキンケア | その他 |
|----------|--------|-----------|------------|----------|--------|
| pigment | 発色 | 発色 | カバー力 | 保湿 | 仕上がり |
| longevity | キープ力 | キープ力 | 崩れにくさ | 肌なじみ | キープ力 |
| shelf_life | コスパ | コスパ | コスパ | コスパ | コスパ |
| natural_finish | ツヤ | 肌なじみ | 仕上がり | 使用感 | 使いやすさ |

### 変更ファイル

- `components/stat-bar.tsx` — 5カテゴリ対応の `CATEGORY_STAT_LABELS` Record
- `types/inventory.ts` — CosmeStats コメント更新
- `agent/alcheme/prompts/inventory.py` — カテゴリ別スペック算出ルール全面書き換え
- `__tests__/unit/components/stat-bar.test.tsx` — 22テスト（全5カテゴリ対応）

## Part 2: ブラウザ側背景除去

### 変更内容

- `@imgly/background-removal` (npm) をインストール
- `components/photo-edit-sheet.tsx` — `removeBackground()` をブラウザ側で呼び出し + Canvas で 512x512 白背景正規化
- `hooks/use-image-process.ts` — **削除**
- `app/api/image/process/route.ts` — **削除**
- `agent/server.py` — `/process-image-preview` エンドポイント削除、`_process_product_image()` から rembg 削除（PIL正規化のみ）
- `agent/pyproject.toml` — `rembg>=2.0` 削除
- `agent/Dockerfile` — `libgomp1` 削除（rembg/onnxruntime 不要）、`U2NET_HOME` 削除

## 検証

- 364テスト全パス (58ファイル)
- tsc --noEmit パス (既存テストファイルエラーのみ)
