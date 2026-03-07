# alche:me — Documentation Map

> docs/ ディレクトリの構成ガイド。各ドキュメントへのリンク集。

---

## architecture/ — 設計・仕様

プロダクトの根幹となる設計ドキュメント群。

| ファイル | 内容 |
|---------|------|
| [alcheme_PRD_v4.md](architecture/alcheme_PRD_v4.md) | Product Requirements Document（v4.1） |
| [alcheme_design-doc_v1.md](architecture/alcheme_design-doc_v1.md) | 技術設計書（v1.4） |
| [alcheme_ui-specs_phase1_v2.md](architecture/alcheme_ui-specs_phase1_v2.md) | UI/UX Specification（Phase 1, v2） |
| [alcheme_prompts-catalog_v3.md](architecture/alcheme_prompts-catalog_v3.md) | Agent Prompts Catalog（v3） |

## guides/ — セットアップ・運用ガイド

開発者・テスター向けの手順書。

| ファイル | 内容 |
|---------|------|
| [alcheme_env-setup.md](guides/alcheme_env-setup.md) | 環境構築手順・設定リファレンス |
| [rakuten_api_setup_guide.md](guides/rakuten_api_setup_guide.md) | 楽天ウェブサービス API セットアップ |
| [cloud-run-deploy-guide.md](guides/cloud-run-deploy-guide.md) | Cloud Run デプロイガイド |
| [beta-guide.md](guides/beta-guide.md) | β テストガイド |
| [manual_e2e_test_guide.md](guides/manual_e2e_test_guide.md) | 手動 E2E テストガイド |
| [cloud-monitoring-setup.md](guides/cloud-monitoring-setup.md) | Cloud Monitoring（Open-Meteo 監視）セットアップ |
| [google-calendar-setup.md](guides/google-calendar-setup.md) | Google Calendar API OAuth 2.0 セットアップ |
| [manual_e2e_calendar.md](guides/manual_e2e_calendar.md) | FEAT-004 Google Calendar 連携 手動E2Eテスト手順書 |
| [manual_e2e_phase2.5A.md](guides/manual_e2e_phase2.5A.md) | Phase 2.5A ナビゲーション再構築 手動E2Eテスト手順書 |
| [brand-asset-prompts.md](guides/brand-asset-prompts.md) | BRAND-002 デザインアセット生成プロンプト集（Gemini / Leonardo.ai） |

## plans/ — 計画・タスク管理

バックログ、ロールアウト計画、実装計画、監査レポート。

| ファイル | 内容 |
|---------|------|
| [backlog_and_remaining_tasks.md](plans/backlog_and_remaining_tasks.md) | 残存タスク・バックログ・改善提案 |
| [alcheme_rollout-plan_phase-0.md](plans/alcheme_rollout-plan_phase-0.md) | Phase 0 完了報告 & Phase 1 開発ガイド |
| [phase1_completion_audit.md](plans/phase1_completion_audit.md) | Phase 1 完了状況監査レポート |
| [phase2_3_implementation_plan.md](plans/phase2_3_implementation_plan.md) | Phase 2+3 統合実装計画 |
| [week3_implementation_plan.md](plans/week3_implementation_plan.md) | Week 3 フロントエンド画面実装計画 |
| [week4_implementation_plan.md](plans/week4_implementation_plan.md) | Week 4 統合テスト + デプロイ計画 |
| [2026-02-17_BUG-002_UI-rename.md](plans/2026-02-17_BUG-002_UI-rename.md) | BUG-002 修正 + UI用語リネーム (My Cosme / Next Cosme) |
| [2026-02-17_OPS-001_monitoring.md](plans/2026-02-17_OPS-001_monitoring.md) | OPS-001 Open-Meteo APIコール監視 & アラート |
| [2026-02-17_ARCH-002_profiler-persistence.md](plans/2026-02-17_ARCH-002_profiler-persistence.md) | ARCH-002（短期）Profiler結果のFirestore永続化 |
| [2026-02-18_Phase2.5A_navigation-restructure.md](plans/2026-02-18_Phase2.5A_navigation-restructure.md) | Phase 2.5A ナビゲーション再構築（Batch 1-4 全完了） |
| [2026-02-19_FEAT-002_category-brand-view.md](plans/2026-02-19_FEAT-002_category-brand-view.md) | FEAT-002 カテゴリ/ブランドビュー切替（LIPS パターン応用） |
| [2026-02-19_Phase2.5B_beauty-log-redesign.md](plans/2026-02-19_Phase2.5B_beauty-log-redesign.md) | Phase 2.5B Beauty Log ホリスティック・リデザイン（メイク×AI×コスメデータ） |
| [2026-02-19_Phase2.5C_chat-ui-improvement.md](plans/2026-02-19_Phase2.5C_chat-ui-improvement.md) | Phase 2.5C Chat UI 改善（パーソナライズ×操作性×リッチカード） |
| [2026-02-19_Phase2.5D_bugfix-ux-improvement.md](plans/2026-02-19_Phase2.5D_bugfix-ux-improvement.md) | Phase 2.5D バグ修正 + UX改善 7件（ラベル統一・レシピ詳細リデザイン・レスポンシブ） |
| [2026-02-21_ARCH-003_shared-catalog.md](plans/2026-02-21_ARCH-003_shared-catalog.md) | ARCH-003 共有商品カタログ実装（グローバル catalog/ + マッチバナー + AI画像加工） |
| [2026-02-21_FEAT-002_sns-navigation.md](plans/2026-02-21_FEAT-002_sns-navigation.md) | FEAT-002(残存) SNS 導線改善（ボトムナビ Feed 昇格 + フォローリスト + フィードフォローボタン） |
| [2026-02-22_FEAT-cosme-specification.md](plans/2026-02-22_FEAT-cosme-specification.md) | コスメ指定レシピ提案 + AI プロアクティブ提案（コスメピッカー UI + 使用分析 + Agent 連携） |
| [2026-02-22_FEAT-005A_theme-card-ui.md](plans/2026-02-22_FEAT-005A_theme-card-ui.md) | FEAT-005A メイクテーマ提案カードUI（Tinder風スワイプ + AI画像生成 + Firestore永続化） |
| [2026-02-22_FEAT-005BC_omikuji-greeting.md](plans/2026-02-22_FEAT-005BC_omikuji-greeting.md) | FEAT-005B/C メイクおみくじUI + チャット開始メッセージ改善 |
| [2026-02-22_UX-011_chat-page-declutter.md](plans/2026-02-22_UX-011_chat-page-declutter.md) | UX-011 チャットページ整理 — コンテンツ再配置 & フォーカスUI |
| [2026-02-22_UX-009-010_recipe-experience.md](plans/2026-02-22_UX-009-010_recipe-experience.md) | UX-009+010 レシピ体験総合強化 — 再現度リネーム・代用テク構造化・フィルター・レシピカスタマイズUI統合（スライダー+ブランド指定） |
| [2026-02-22_UX-001_content-done-sse.md](plans/2026-02-22_UX-001_content-done-sse.md) | UX-001 レシピ・プレビュー画像の同時生成 — content_done SSEイベントでUI即時アンロック |
| [2026-02-22_UX-012_theme-swipe-continue.md](plans/2026-02-22_UX-012_theme-swipe-continue.md) | UX-012 テーマスワイプ継続 & 複数LIKE対応 — 全テーマ閲覧後に選択UI |
| [2026-02-22_ARCH-004_recipe-theme-unification.md](plans/2026-02-22_ARCH-004_recipe-theme-unification.md) | ARCH-004 レシピ×テーマ統合 — recipes コレクション一本化 + 統合グリッドUI + バックフィルマイグレーション |
| [2026-02-22_ARCH-005_theme-recipe-pipeline.md](plans/2026-02-22_ARCH-005_theme-recipe-pipeline.md) | ARCH-005 テーマ×レシピ統合パイプライン完成 — UI統一・プレビュー画像堅牢化・テーマフィールド自動付与・doc統合・theme_suggestions廃止 |
| [2026-02-22_BUG-003_agent-flow-fixes.md](plans/2026-02-22_BUG-003_agent-flow-fixes.md) | BUG-003 エージェントフロー修正 — 天気メイク自動チェーン・地域Firestore保存・Profiler createdAtバグ修正 |
| [2026-02-22_UX-013_profiler-insight-card.md](plans/2026-02-22_UX-013_profiler-insight-card.md) | UX-013 プロファイラー結果のインタラクティブカードUI — 色傾向・テクスチャ・眠っているコスメをカード表示 |
| [2026-02-23_FEAT-006_catalog-ranking-browse.md](plans/2026-02-23_FEAT-006_catalog-ranking-browse.md) | FEAT-006 リアルランキング付きカタログブラウズ — 所有×活用×満足度の実データランキング + ビジュアルブラウズUI |
| [2026-02-23_UX-014_group-expand-view.md](plans/2026-02-23_UX-014_group-expand-view.md) | UX-014 型番まとめ/展開ビュー切替 — ZOZOTOWN風の品番グルーピング切替 + 個別バリアント表示モード |
| [2026-02-23_FEAT-006_avatar-hairstyle.md](plans/2026-02-23_FEAT-006_avatar-hairstyle.md) | FEAT-006 アバター髪型カスタマイズ — 設定で髪型6種+髪色8種選択 → AI生成プレビュー画像に反映 |
| [2026-03-07_FEAT-004_google-calendar.md](plans/2026-03-07_FEAT-004_google-calendar.md) | FEAT-004 Google Calendar API 連携 — OAuth 2.0 + カレンダー選択 + 手動入力 + Agent TPO Tactician 統合 |
| [2026-03-07_UX-003_brand-suggest-dedupe.md](plans/2026-03-07_UX-003_brand-suggest-dedupe.md) | UX-003 ブランド名・商品名サジェスト + 重複検知 — AutocompleteInput + DuplicateWarning 3画面統合 |
| [2026-03-07_UX-002_recipe-list-unification.md](plans/2026-03-07_UX-002_recipe-list-unification.md) | UX-002 レシピ一覧UIの在庫一覧UIとの統一 — glass-card + aspect-square + BulkActionBar共有 |
| [2026-03-07_UX-004_community-page-ux.md](plans/2026-03-07_UX-004_community-page-ux.md) | UX-008 みんなのコスメ UX改善 — 詳細ビュー + ボタン改善 + 全カテゴリ + have_countバグ修正 |
| [2026-03-07_image-processing-pipeline.md](plans/2026-03-07_image-processing-pipeline.md) | 画像加工パイプライン — スキャン自動加工 + バッチ API + 楽天リンク規約対応 |
| [2026-03-07_secret-manager-migration.md](plans/2026-03-07_secret-manager-migration.md) | Secret Manager 移行 + Cloud Build トリガー自動デプロイ設定 |
| [2026-03-07_scan-image-fix.md](plans/2026-03-07_scan-image-fix.md) | スキャン画像問題修正 — 楽天画像優先防止 + 鑑定保留中の重複警告スキップ |
| [2026-03-07_photo-edit-sheet.md](plans/2026-03-07_photo-edit-sheet.md) | 商品画像加工フロー（PhotoEditSheet）— Instagram風4ツール編集UI + AI背景除去 |
| [2026-03-08_NAV-001_navigation-restructure.md](plans/2026-03-08_NAV-001_navigation-restructure.md) | NAV-001 ナビゲーション再構築 — ツール→プラットフォーム転換（ボトムナビ5タブ + FAB + サイドメニュー整理） |
| [2026-03-08_NAV-001-D_home-shortcut-grid.md](plans/2026-03-08_NAV-001-D_home-shortcut-grid.md) | NAV-001-D ホーム画面LIPS風アイコングリッド — 6ショートカット + タイトル/タブ名変更 |
| [2026-03-07_UX-009_mypage-redesign.md](plans/2026-03-07_UX-009_mypage-redesign.md) | UX-009 マイページ全体リデザイン — カレンダー統合 + 戻るボタン修正 + レイアウト再構成 |

## reference/ — 外部リファレンス・テスト

ADK ドキュメント、Claude Code 指示書、テストシナリオ、UI モック画像。

| ファイル | 内容 |
|---------|------|
| [adk_docs_build-agents.md](reference/adk_docs_build-agents.md) | ADK — Build Agents リファレンス |
| [adk_docs_components.md](reference/adk_docs_components.md) | ADK — Components リファレンス |
| [adk_docs_run-agents.md](reference/adk_docs_run-agents.md) | ADK — Run Agents（実行・デプロイ・評価） |
| [alcheme_test-scenarios_phase1.md](reference/alcheme_test-scenarios_phase1.md) | テストシナリオ / 受入条件（Phase 1） |
| [CLAUDE_CODE_INSTRUCTIONS_v1_3.md](reference/CLAUDE_CODE_INSTRUCTIONS_v1_3.md) | Claude Code 開発指示書（v1.3） |
| [ui-image/](reference/ui-image/) | UI モック画像（HTML）3ファイル |

## research/ — UI/UX リサーチ

FEAT-001/002 Deep Research で作成した調査レポート群。Claude（2026-02-18）+ Gemini Deep Research（2026-02-18〜）。

### Claude 調査レポート

| ファイル | 内容 |
|---------|------|
| [deep_research_synthesis.md](research/deep_research_synthesis.md) | 統合レポート — 全調査の要約・優先度付きアクションプラン |
| [diary_app_ux_analysis.md](research/diary_app_ux_analysis.md) | ほぼ日手帳 / Day One — 記録習慣化・振り返り UX 分析 |
| [swipe_omikuji_ux_research.md](research/swipe_omikuji_ux_research.md) | Tinder / おみくじ — スワイプカード UI・ガミフィケーション分析 |
| [competitive_analysis_LIPS_cosme.md](research/competitive_analysis_LIPS_cosme.md) | LIPS / @cosme — 美容アプリ競合分析 |
| [social_navigation_analysis.md](research/social_navigation_analysis.md) | TikTok / Instagram — モバイルナビゲーション・Stories 分析 |
| [ai_chat_ui_analysis.md](research/ai_chat_ui_analysis.md) | Claude / ChatGPT / Gemini — AI チャット UI 分析 |

### Gemini Deep Research レポート

| ファイル | 内容 |
|---------|------|
| [ui-ux_trend_research.md](research/ui-ux_trend_research.md) | Gemini 統合レポート — iOS 26 Liquid Glass・GenUI・ガミフィケーション・トレンド総括 |
| [gemini_deep-research_lips-app-ui.md](research/gemini_deep-research_lips-app-ui.md) | LIPS アプリ最新 UI/UX 詳細分析（#1） |
| [gemini_deep-research_@cosme-app-ui.md](research/gemini_deep-research_@cosme-app-ui.md) | @cosme アプリ最新 UI/UX 詳細分析（#2） |
| [gemini_deep-research_ios-liquid-glass-ui.md](research/gemini_deep-research_ios-liquid-glass-ui.md) | iOS 26 Liquid Glass デザインシステム分析（#3） |
| [gemini_deep-research_journal-for-beautylog.md](research/gemini_deep-research_journal-for-beautylog.md) | Apple Journal → Beauty Log 設計への応用（#4） |

### リサーチプロンプト

| ファイル | 内容 |
|---------|------|
| [gemini_deep_research_prompt.md](research/gemini_deep_research_prompt.md) | Gemini Deep Research 統合プロンプト（初回投入用） |
| [gemini_individual_prompts.md](research/gemini_individual_prompts.md) | Gemini 個別テーマプロンプト集（#1-11 全完了） |
| [2026-03-08_navigation-platform-strategy.md](research/2026-03-08_navigation-platform-strategy.md) | ナビゲーション & プラットフォーム戦略リサーチ（LIPS実機分析・Agentic Commerce・バイラルループ） |

## handoff/ — 引き継ぎ資料

| ファイル | 内容 |
|---------|------|
| [gemini-handoff.md](handoff/gemini-handoff.md) | Gemini UI モック作成用 引き継ぎ資料 |

## presentation/ — デモ・発表資料

| ファイル | 内容 |
|---------|------|
| [demo_storyboard.md](presentation/demo_storyboard.md) | デモ動画 絵コンテ（3分） |
| [zenn_article.md](presentation/zenn_article.md) | Zenn 投稿記事（コスメティック・パラドックス） |
| [image-chat-use-cases.md](presentation/image-chat-use-cases.md) | AI画像チャット ユースケース & マーケティング素材 |
