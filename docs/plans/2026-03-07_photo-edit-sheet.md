# 商品画像加工フロー（PhotoEditSheet）

| | |
|---|---|
| **Date** | 2026-03-07 |
| **Status** | ✅ 完了 |
| **Related** | ARCH-003 共有商品カタログ, 画像加工パイプライン |

## 概要

Instagram / Snapseed / 出品キレイ 等のモバイル画像編集UIを参考に、商品写真のインタラクティブ編集画面を実装。従来の不可視バックグラウンドAI加工を、ユーザーが操作可能な編集フローに置換。

## 設計方針

- **AI背景除去**: Agent の `_process_product_image()` 再利用、base64返却（プレビューモード: GCS保存なし）
- **フィルター / 明るさ / 回転**: クライアント Canvas + CSS filter で即時プレビュー（API不要）
- **確定画像**: data URL で返し、登録時に既存フローで GCS アップロード

## UIレイアウト

Instagram/Snapseed共通パターンに準拠:
1. 画像がヒーロー（画面の~60%）
2. 下部にアイコン型ミニマルツールバー（4タブ）
3. 1ツール選択 = そのツール専用のコントロールのみ表示
4. フィルターは横スクロールサムネイル

### 4ツール

| ツール | パネル内容 |
|--------|-----------|
| 🪄 背景除去 | AIワンボタン → 処理中アニメ → 除去済み/オリジナル切替 |
| 🎨 フィルター | 横スクロールサムネイル6種（ナチュラル/ウォーム/クール/ビビッド/ソフト/モノクロ） |
| ☀️ 調整 | 明るさ/コントラスト/彩度スライダー |
| ↻ 回転 | 左90°/右90°/左右反転ボタン |

## 変更ファイル一覧

| ファイル | 種別 | 内容 |
|---------|------|------|
| `agent/server.py` | 変更 | `/process-image-preview` endpoint 追加 |
| `app/api/image/process/route.ts` | 新規 | BFF proxy（認証付き） |
| `hooks/use-image-process.ts` | 新規 | 背景除去 hook（`processImage()` + `isProcessing` + `error`） |
| `components/photo-edit-sheet.tsx` | 新規 | Instagram風画像編集Sheet（4ツール + Canvas最終レンダリング） |
| `components/item-edit-sheet.tsx` | 変更 | PhotoEditSheet 統合（画像選択→編集→確定フロー） |
| `components/appraisal-card.tsx` | 変更 | 画像タップで編集可能に（`onEditImage` prop追加） |
| `app/(main)/scan/confirm/page.tsx` | 変更 | PhotoEditSheet 統合（鑑定結果の画像も編集可能） |

## 検証

- TypeScript: 335テスト全パス
- tsc: クリーン（既存テストファイルのみ警告あり）
