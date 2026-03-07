# FEAT-001/002 Deep Research 統合レポート

| | |
|---|---|
| **Date** | 2026-02-18 |
| **Status** | Completed |
| **Scope** | UI/UX Deep Research — 成功アプリ分析 & alche:me への適用 |
| **対象アプリ** | ほぼ日手帳, Day One, Tinder, おみくじ系, LIPS, @cosme, TikTok, Instagram, Claude, ChatGPT, Gemini |

---

## エグゼクティブサマリー

11のアプリ/サービスを5カテゴリに分けて包括的に調査し、alche:me の UI/UX 改善に向けた知見を統合した。

### 3つの最重要インサイト

| # | インサイト | 根拠 | alche:me への影響 |
|---|-----------|------|-----------------|
| **1** | **ナビゲーション再構築が最優先** | TikTok/Instagram/LIPS/@cosme 全てが「マイページ」を右端タブに配置。中央に「+」ボタンを配置するパターンが業界標準 | My Cosme + Next Cosme を統合し、マイページタブを新設。中央に「+」ボタン配置 |
| **2** | **Beauty Log は「写真ファースト + 自動補完」で習慣化** | ほぼ日手帳の「書かなくてもOK」思想 + Day One の自動メタデータ + Instagram Stories の投稿ハードル低減 | Quick Log（写真+評価の15秒記録）+ 天気自動取得 + ストーリーズトレイ |
| **3** | **ドメイン特化リッチカードが最大の差別化** | Claude/ChatGPT/Gemini のチャットUIは汎用的。Gemini の Flights/Hotels カードのようなドメイン特化が差別化の鍵 | レシピカード（実装済み）+ 商品カード + 比較カード + テクニックカードの拡充 |

---

## 調査レポート一覧

| # | レポート | ファイル | 主な知見 |
|---|---------|---------|---------|
| 1 | ほぼ日手帳 / Day One 分析 | [diary_app_ux_analysis.md](diary_app_ux_analysis.md) | 記録の最小フロー設計、振り返り機能、習慣化メカニズム |
| 2 | Tinder / おみくじ UX 分析 | [swipe_omikuji_ux_research.md](swipe_omikuji_ux_research.md) | スワイプカードUI仕様、おみくじ演出設計、ガミフィケーション |
| 3 | LIPS / @cosme 競合分析 | [competitive_analysis_LIPS_cosme.md](competitive_analysis_LIPS_cosme.md) | カテゴリ階層、商品詳細設計、パーソナライゼーション |
| 4 | TikTok / Instagram ナビ分析 | [social_navigation_analysis.md](social_navigation_analysis.md) | タブ構成、Stories パターン、Explore グリッド、作成フロー |
| 5 | Claude / ChatGPT / Gemini チャットUI | [ai_chat_ui_analysis.md](ai_chat_ui_analysis.md) | チャットスターター、リッチカード、メモリ可視化、ポストアクション |

---

## 統合提案: 優先度付きアクションプラン

### Phase A: ナビゲーション再構築（FEAT-002 対応）

**推奨タブ構成（案A: 中央「+」ボタン方式）:**

| タブ | ラベル | 内容 |
|------|--------|------|
| 1 | AI美容部員 | チャット + 上部ストーリーズトレイ |
| 2 | Recipe | Explore 風モザイクグリッド + カテゴリフィルター |
| 3（中央） | **+** | アクションシート: スキャン / 日記 / 手動登録 / 楽天検索 |
| 4 | My Cosme | 在庫 + Next Cosme（セグメントタブ: 持ってる / 欲しい） |
| 5 | マイページ | プロフィール + 設定 + Beauty Log カレンダー + 統計 |

**根拠:**
- TikTok/Instagram: 中央に「+」、右端にプロフィール
- LIPS/@cosme: 右端にマイページ
- Instagram ショッピングタブ撤去の教訓 → Next Cosme を独立タブにしない

### Phase B: Beauty Log リデザイン（FEAT-001 対応）

| 施策 | 参照元 | 工数 |
|------|--------|------|
| Quick Log（写真+評価の15秒記録フロー） | Day One の最短フロー + Instagram Stories | M |
| 天気・気温の自動取得（Open-Meteo 既存実装活用） | Day One 自動メタデータ | S |
| ストーリーズトレイ（チャット画面上部に今週のルック表示） | Instagram Stories | M |
| Weekly Beauty Report 自動生成 | Day One 統計 + ほぼ日手帳の振り返り | M |
| Beauty Palette ガミフィケーション | ほぼ日手帳コレクション感 + Duolingo ストリーク | S |
| 日替わり Beauty Tip | ほぼ日手帳「日々の言葉」 | S |
| テンプレート（Quick Snap / Morning Routine / Event Look） | Day One テンプレート | M |

### Phase C: メイクテーマ & レシピ提案 UI（FEAT-005 対応）

| 施策 | 参照元 | 工数 |
|------|--------|------|
| Tinder風スワイプカードUI（3テーマ提案） | Tinder カードスタック + WEAR | L |
| おみくじ風デイリーレシピ提案 | おみくじ文化 + ポケモンスリープ + ガチャ演出 | L |
| 段階的画像ローディング（シマー→ブラー→クリア） | Tinder + Pinterest | M |
| ストリーク & デイリーチャレンジ | Duolingo + あつ森 | M |

### Phase D: チャットUI改善

| 施策 | 参照元 | 工数 |
|------|--------|------|
| チャットスターター改善（パーソナライズ挨拶 + 天気連動 + クイックアクション） | Gemini「Hello, [名前]」+ ChatGPT カテゴリカード | S |
| 停止ボタン + リトライ/再生成 | Claude/ChatGPT/Gemini 共通 | S |
| 商品カード + 比較カード + テクニックカード | Gemini Flights/Hotels カード | M |
| ポストアクション（詳しく / 別提案 / 時短で / 手持ちだけで） | Gemini Shorter/Longer | S |
| メモリ可視化（プロフィールバナー + 学習通知バッジ） | ChatGPT Memory updated | S |

### Phase E: 在庫・レシピUIの強化

| 施策 | 参照元 | 工数 |
|------|--------|------|
| カテゴリ/ブランドビュー切替 | @cosme カテゴリ階層 | M |
| Recipe タブの Explore 風モザイクグリッド化 | Instagram Explore | M |
| 長押しプレビュー（Peek） | Instagram Explore | M |
| ダブルタップでお気に入り | TikTok/Instagram 共通 | S |

---

## ロードマップへの影響

**提案: Phase 2.5 の UX-002 を FEAT-001/002 の知見に基づいて再定義**

現在のロードマップ:
- Phase 2.5: UX-002（レシピ一覧UIの統一）← **この前に Deep Research を挟む（今回完了）**
- Phase 3: FEAT-005, FEAT-004, UX-001〜007
- Phase 3.5: FEAT-001, FEAT-002 の Deep Research ← **今回で完了、Phase 2.5 に前倒し**

提案するロードマップ:
1. **Phase 2.5A（1-2週間）**: ナビゲーション再構築（タブ統合 + マイページ + 中央「+」）
2. **Phase 2.5B（1-2週間）**: Beauty Log リデザイン（Quick Log + ストーリーズトレイ + 自動天気）
3. **Phase 2.5C（1週間）**: チャットUI改善（スターター + 停止/リトライ + リッチカード）
4. **Phase 3**: FEAT-005（Tinder風スワイプ + おみくじUI）+ 残りの UX タスク

---

## 調査の制約

- 分析は Claude の学習データ（〜2025年5月）に基づく。2025年後半〜2026年のアプリ更新が反映されていない可能性がある
- 実機でのスクリーンショット補完を推奨
- Web検索が一部の調査で利用不可だったため、最新の機能変更が漏れている可能性がある

---

*Created: 2026-02-18*
*Related: FEAT-001 (Beauty Log リデザイン), FEAT-002 (ナビゲーション再設計), FEAT-005 (テーマ/レシピ提案UI)*
