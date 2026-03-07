# スワイプカード UI & おみくじ UX パターン — 包括的リサーチレポート

| | |
|---|---|
| **Version** | 2.0 |
| **Date** | 2026-02-18 |
| **Author** | UX Research (AI-assisted) |
| **Status** | Research Complete |
| **Related** | FEAT-005, alcheme_PRD_v4.md, deep_research_synthesis.md |

> **目的**: alche:me Phase 3 で実装予定の「Tinder 風スワイプカード UI」と「おみくじ風デイリーレシピ提案 UI」の設計根拠となる、UI/UX パターンの包括的なリサーチ結果をまとめる。

---

## 目次

1. [Tinder スワイプカード UI 分析](#1-tinder-スワイプカード-ui-分析)
2. [おみくじ UX パターン分析](#2-おみくじ-ux-パターン分析)
3. [alche:me への適用提案](#3-alcheme-への適用提案)
4. [実装仕様](#4-実装仕様)
5. [参考文献・先行事例](#5-参考文献先行事例)

---

## 1. Tinder スワイプカード UI 分析

### 1.1 カードレイアウト仕様

Tinder のスワイプカード UI は「目の前の一枚に没入させる」設計哲学に基づく。カードのサイズ・配置・スタッキングすべてが、ユーザーの注意を一点に集中させるためにチューニングされている。

#### サイズとレイアウトの基本仕様

| 要素 | 仕様値 | 設計意図 |
|------|--------|---------|
| **カード幅** | viewport 幅の **90%** | 左右のマージンを最小化し没入感を最大化 |
| **カード高さ** | viewport 高さの **70-75%** | ヘッダー・アクションバーを除いた領域をフルに活用 |
| **角丸 (border-radius)** | **12-16px** | 有機的で親しみやすい印象。物理カードの質感を再現 |
| **画像占有率** | カード面積の **80%以上** | テキストよりビジュアルで直感判断を促す |
| **shadow** | `0 4px 12px rgba(0,0,0,0.15)` | カードが「浮いている」物理的実在感 |
| **z-index 階層** | front=30, middle=20, back=10 | スタック順序の明確化 |

#### カードスタッキング仕様（3枚可視）

下にある次のカードが「まだ他にもある」という期待感を醸成する。

| レイヤー | scale | translateY (offset) | opacity | 役割 |
|---------|-------|--------------------:|---------|------|
| **Front** (操作対象) | `1.00` | `0px` | `1.0` | 現在のカード。スワイプ可能 |
| **Middle** | `0.95` | `+8px` | `0.7` | 次のカードのチラ見せ |
| **Back** | `0.90` | `+16px` | `0.4` | 3枚目。奥行き感の演出 |

```
 ┌─ viewport ────────────────────────────┐
 │          ┌──── Back (scale 0.90) ───┐ │
 │          │  ┌── Mid (scale 0.95) ─┐ │ │
 │          │  │ ┌ Front (scale 1.0)┐│ │ │
 │          │  │ │                  ││ │ │
 │          │  │ │  AI 生成画像     ││ │ │
 │          │  │ │   (80% area)     ││ │ │
 │          │  │ │                  ││ │ │
 │          │  │ │──────────────────││ │ │
 │          │  │ │ テーマ名          ││ │ │
 │          │  │ │ 概要 + マッチ度   ││ │ │
 │          │  │ └──────────────────┘│ │ │
 │          │  └────────────────────┘ │ │
 │          └──────────────────────── ┘ │
 │                                      │
 │       [x skip]  [★]  [♡ LIKE]      │
 └──────────────────────────────────────┘
```

### 1.2 スワイプメカニクス詳細

#### コア設定パラメータ (SWIPE_CONFIG)

```typescript
const SWIPE_CONFIG = {
  // ── スワイプ判定 ──
  threshold: 100,                // px — この距離を超えるとスワイプ確定
  velocityThreshold: 500,        // px/s — 速度がこれを超えればthreshold未満でも確定

  // ── カード回転 ──
  maxRotation: 15,               // deg — 最大回転角度
  rotationFactor: 0.1,           // px → deg の変換係数 (1px = 0.1deg)
  rotationOrigin: 'bottom',      // 回転軸は下端。カードを指でつまんで回す感覚

  // ── フライアウト (exit) ──
  exitDuration: 300,             // ms — カード退場にかかる時間
  exitDistance: '150%',          // viewport幅の150%先まで飛ばす
  exitRotation: 30,              // deg — 退場時の最終回転角度
  exitEasing: 'easeOut',         // cubic-bezier(0, 0, 0.58, 1)

  // ── スナップバック (bounce-back) ──
  bounceDuration: 400,           // ms — 元の位置に戻る時間
  bounceEasing: 'spring(1, 80, 10, 0)',  // spring physics: mass, stiffness, damping, velocity
  bounceOvershoot: 1.05,         // 微かなオーバーシュートで弾力感を演出

  // ── 次カード昇格 ──
  nextCardScale: {
    initial: 0.95,               // 待機時は95%
    active: 1.0,                 // 前カード退場時に100%へ
    duration: 300,               // ms
    easing: 'easeOut',
  },

  // ── オーバーレイ透明度 ──
  overlayOpacity: {
    start: 0,                    // 静止時は不可視
    max: 1,                      // threshold到達で完全表示
    mapping: 'linear',           // ドラッグ距離に比例
  },
} as const;
```

#### スワイプ中のリアルタイムフィードバック

| ドラッグ距離 | 回転角度 | LIKE overlay opacity | NOPE overlay opacity | ハプティクス |
|------------|---------|---------------------|---------------------|------------|
| 0px | 0deg | 0.0 | 0.0 | なし |
| 25px (右) | 2.5deg | 0.25 | 0.0 | なし |
| 50px (右) | 5.0deg | 0.50 | 0.0 | なし |
| 100px (右) | 10.0deg | 1.00 | 0.0 | **軽い振動** (threshold到達) |
| 100px (左) | -10.0deg | 0.0 | 1.00 | **軽い振動** |
| 200px (右) | 15.0deg (max) | 1.00 | 0.0 | なし |

#### ジェスチャーマッピング

| ジェスチャー | アクション | Visual feedback | alche:me での意味 |
|------------|-----------|----------------|-----------------|
| **右スワイプ** | LIKE | 緑色ハートオーバーレイ + カード右方向 exit | テーマ保存 → レシピ生成開始 |
| **左スワイプ** | NOPE / Skip | 赤色 x オーバーレイ + カード左方向 exit | スキップ → 次のテーマ表示 |
| **上スワイプ** | Super Like | 青色 ★ オーバーレイ + カード上方向 exit | 「今日はこれ！」→ 即座にレシピ詳細生成 |
| **タップ** | 詳細表示 | カード expand or モーダル | テーマの詳細説明 + 使用アイテムプレビュー |

### 1.3 ビジュアルフィードバック

#### カラーオーバーレイ仕様

| 方向 | オーバーレイ色 | ラベル | アイコン | グラデーション方向 |
|------|-------------|-------|---------|----------------|
| **右 (LIKE)** | `rgba(34, 197, 94, 0.6)` (green-500) | "LIKE" | ♡ | left → right |
| **左 (NOPE)** | `rgba(239, 68, 68, 0.6)` (red-500) | "NOPE" | x | right → left |
| **上 (SUPER)** | `rgba(59, 130, 246, 0.6)` (blue-500) | "SUPER" | ★ | bottom → top |

```css
/* オーバーレイのスタイル */
.swipe-overlay {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.swipe-overlay--like {
  background: linear-gradient(to right, transparent, rgba(34, 197, 94, 0.4));
}

.swipe-overlay--nope {
  background: linear-gradient(to left, transparent, rgba(239, 68, 68, 0.4));
}

.swipe-overlay__label {
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transform: rotate(-15deg);
  border: 4px solid currentColor;
  padding: 4px 16px;
  border-radius: 8px;
}
```

#### opacity とドラッグ距離の関係

opacity はドラッグ距離 (dx) と threshold に基づき線形補間される。

```
opacity = clamp(0, abs(dx) / threshold, 1)
```

| dx (px) | threshold (100px) | opacity | 状態 |
|---------|------------------|---------|------|
| 0 | — | 0.00 | 静止 |
| 25 | — | 0.25 | 微かに見え始める |
| 50 | — | 0.50 | はっきり確認可能 |
| 75 | — | 0.75 | ほぼ確定 |
| 100+ | — | 1.00 | 確定 (full opacity) |

### 1.4 マッチアニメーション（爆発 / 紙吹雪エフェクト）

右スワイプ確定時に表示されるセレブレーションエフェクト。

| パラメータ | 値 | 説明 |
|-----------|------|------|
| **particle count** | 40-60 | 紙吹雪の数 |
| **colors** | `['#FFD700', '#C084FC', '#60A5FA', '#F472B6', '#34D399']` | alche:me ブランドカラー系 |
| **duration** | 2000ms | エフェクト全体の持続時間 |
| **spread** | 60deg | 放射角度 |
| **gravity** | 0.8 | 自然落下感の再現 |
| **initial velocity** | 20-40 (random) | 初速のランダム化で有機的な動き |
| **fade out** | last 500ms | 徐々に消える |
| **背景 flash** | `rgba(255,255,255,0.3)` → `transparent`, 200ms | 画面全体の一瞬のフラッシュ |

### 1.5 alche:me への適用: AI 生成メイクテーマカード 3枚

Tinder のスワイプ UI を alche:me のメイクテーマ提案に転用する。AI が生成した **3枚のメイクテーマカード** をスワイプで選択する設計。

| Tinder の要素 | alche:me での転用 | 理由 |
|-------------|-----------------|------|
| プロフィール写真 | AI 生成メイクプレビュー画像 | 直感的なビジュアル判断を促す |
| 名前 + 年齢 | テーマ名 + マッチ度 % | コンテキスト情報の提示 |
| 二者択一 (Yes/No) | 保存 / スキップ | 選択のパラドックス回避 |
| 1日のスワイプ上限 | 1日3テーマ制限 | プレミアム感 + API コスト制御 |
| Super Like | 「今日はこれ！」即決 | 強い意思表示 → 即レシピ生成 |
| マッチ演出 | テーマ保存セレブレーション | ポジティブフィードバックの強化 |

---

## 2. おみくじ UX パターン分析

### 2.1 5フェーズ・フレームワーク

おみくじ体験は、以下の5つの心理的フェーズで構成される。各フェーズがそれぞれ異なる感情を喚起し、全体として「記憶に残る体験」を形成する。

```
 ┌───────────────────────────────────────────────────────┐
 │                                                       │
 │  Phase 1: 期待 (Anticipation)                        │
 │     「何が出るかな...」— ドーパミン放出の起点          │
 │     ↓                                                │
 │  Phase 2: 儀式的動作 (Ritual Action)                 │
 │     タップ / シェイク / 長押し — 「自分で引いた」感覚   │
 │     ↓                                                │
 │  Phase 3: 開封 (Reveal)                              │
 │     段階的な情報開示 — サスペンスの最大化              │
 │     ↓                                                │
 │  Phase 4: 解釈 (Interpretation)                      │
 │     結果を自分の文脈に当てはめる — 個人的意味づけ       │
 │     ↓                                                │
 │  Phase 5: 行動 (Action)                              │
 │     「このレシピを使う」— 体験を現実に接続              │
 │                                                       │
 └───────────────────────────────────────────────────────┘
```

#### 各フェーズの詳細

| Phase | 名称 | 持続時間 | 感情 | UI 演出 | alche:me での実装 |
|-------|------|---------|------|---------|-----------------|
| **1** | 期待 (Anticipation) | 3-5秒 | ワクワク、期待 | おみくじ箱 + パーティクルエフェクト + CTA | 「今日の運命メイクを引く」ボタン |
| **2** | 儀式的動作 (Ritual Action) | 1-2秒 | 集中、緊張 | シェイクアニメーション + 効果音 | タップ or デバイスシェイク |
| **3** | 開封 (Reveal) | 2-4秒 | 興奮、驚き | カードフリップ + ランク表示 + 紙吹雪 | 600ms フリップ → ランク → ビジュアル |
| **4** | 解釈 (Interpretation) | 5-15秒 | 納得、共感 | テーマ詳細 + メッセージ | テーマ名 + キャッチコピー + マッチ理由 |
| **5** | 行動 (Action) | — | 決意、前向き | CTA ボタン群 | 「このレシピを使う」「詳しく見る」 |

### 2.2 参考アプリ分析

#### ポケモンスリープ

| 要素 | 実装内容 | alche:me への学び |
|------|---------|-----------------|
| **朝のルーティン統合** | 睡眠計測後、朝に新しいポケモンと出会う | メイク前の時間帯に「今日の運命メイク」を提示 |
| **毎日異なる結果** | 睡眠スコアに応じて出現ポケモンが変わる | 天気・気温・曜日・在庫に基づくパーソナライズ |
| **コレクション** | ポケモン図鑑の完成率がモチベーション | メイクテーマの「御朱印帳」コレクション |
| **段階的開示** | シルエット → 影 → 完全表示 | シマー → ブラー → クリア画像 |

#### ガチャ系アプリ (FGO / 原神 / プロスピA)

| 要素 | 実装内容 | alche:me への学び |
|------|---------|-----------------|
| **演出の豪華さ** | 光、音、カメラワーク、スローモーション | SSR 結果時に金色パーティクル + 特別 SE |
| **レアリティによる演出差** | N は地味、SSR は派手 — 差異が「当たり」の喜びを増幅 | ランクに応じた演出レベルの段階化 |
| **「確定演出」の暗示** | 金色の光 = SSR 確定という暗黙の約束 | 大吉演出のパターンを固定し学習可能に |
| **天井システム** | 一定回数で確定 → フラストレーション防止 | 「罰しない」設計 — 凶を出さない |

#### 神社おみくじ

| 要素 | 実装内容 | alche:me への学び |
|------|---------|-----------------|
| **1回限りの特別感** | 参拝ごとに1回 | 1日1回のデイリー制限 |
| **物理的儀式** | 箱を振る → 棒を引く → 番号を見る → 対応する紙をもらう | 複数ステップの儀式がエンゲージメントを高める |
| **結ぶ文化** | 悪い結果でも「木に結ぶ」で浄化 | 末吉でも「冒険の提案」としてポジティブに転換 |
| **ラッキーアイテム** | 「今日のラッキーカラーは赤」 | 「今日のラッキーコスメ」「ラッキーカラー」 |

#### あつまれ どうぶつの森

| 要素 | 実装内容 | alche:me への学び |
|------|---------|-----------------|
| **毎日変わるコンテンツ** | 来客、商品、化石、メッセージボトル | 日替わりテーマの新鮮さ維持 |
| **リアルタイム連動** | 現実時間・季節と同期 | 天気・季節・イベントと連動したテーマ |
| **コレクション駆動** | 図鑑・家具・服の収集 | テーマコレクション + バッジ |
| **ゆるい強制力** | やらなくても罰はないが、やると良いことがある | ストリークが切れても「次の記録に挑戦！」 |

### 2.3 カードフリップアニメーション仕様

おみくじ結果の「開封」を演出するカード反転アニメーション。

```typescript
const CARD_FLIP_CONFIG = {
  // ── カード反転 ──
  flip: {
    duration: 600,                    // ms — 全体の反転時間
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',  // Material Design standard
    axis: 'Y',                        // Y軸回転 (左右反転)
    perspective: '1000px',            // 3D 奥行き
    backfaceVisibility: 'hidden',     // 裏面を隠す
  },

  // ── 反転の2段階 ──
  frontToBack: {
    rotateY: { from: '0deg', to: '90deg' },
    duration: 300,                    // 前半300ms: 表→横
  },
  backToFront: {
    rotateY: { from: '-90deg', to: '0deg' },
    duration: 300,                    // 後半300ms: 横→裏面(結果)
  },

  // ── 反転時の付随エフェクト ──
  scaleOnFlip: {
    mid: 1.05,                        // 反転中央で微かに拡大
    final: 1.0,
  },
  shadowOnFlip: {
    mid: '0 20px 60px rgba(0,0,0,0.3)',  // 反転中に影が深くなる
    final: '0 4px 12px rgba(0,0,0,0.15)',
  },
} as const;
```

#### CSS 実装例

```css
.omikuji-card {
  perspective: 1000px;
  width: 280px;
  height: 400px;
}

.omikuji-card__inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.omikuji-card--flipped .omikuji-card__inner {
  transform: rotateY(180deg);
}

.omikuji-card__face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 16px;
  overflow: hidden;
}

.omikuji-card__back {
  transform: rotateY(180deg);
}
```

### 2.4 マッチランクシステム（美容特化）

alche:me の既存レアリティシステム (`SSR` / `SR` / `R` / `N`) とおみくじのランク体系を融合する。

#### 「罰しない」設計原則

**重要**: 従来のおみくじには「凶」「大凶」が存在するが、alche:me では**使わない**。メイク提案で「凶」を出すことはユーザーのセルフイメージを傷つけ、離脱に直結する。最低ランクでも「末吉 = 冒険の提案」としてポジティブにフレーミングする。

#### ランク対応表

| マッチ度 | Rarity | おみくじランク | 演出レベル | テーマカラー | 背景エフェクト |
|---------|--------|-------------|-----------|-------------|-------------|
| **95-100%** | SSR | 大吉 | MAX — 紙吹雪 + 金色パーティクル + 特別SE + 画面フラッシュ | `#FFD700` (gold) | 金色の輝きパーティクル |
| **85-94%** | SR | 中吉 | HIGH — 桜の花びらエフェクト + SE | `#C084FC` (purple-400) | 紫色のグロウ |
| **70-84%** | R | 小吉 | MED — 微細な光エフェクト | `#60A5FA` (blue-400) | 青色のソフトグロウ |
| **50-69%** | N | 吉 | LOW — シンプルなフェードイン | `#9CA3AF` (gray-400) | なし |
| **50%未満** | — | 末吉 | LOW — 「冒険してみよう?」の特別フレーミング | `#8C8279` (muted) | 微かなスパークル |

#### ランク別パーティクルエフェクト仕様

| パラメータ | SSR (大吉) | SR (中吉) | R (小吉) | N (吉) | 末吉 |
|-----------|-----------|----------|---------|-------|------|
| particle count | 60 | 30 | 10 | 0 | 5 |
| colors | gold, pink, white | purple, pink | blue, white | — | warm gray |
| duration (ms) | 2500 | 1500 | 800 | 0 | 600 |
| spread (deg) | 90 | 60 | 30 | 0 | 20 |
| sound effect | 特別ファンファーレ | キラキラ音 | 柔らかい光の音 | 静かな確認音 | 冒険的な音 |
| haptics | strong | medium | light | none | light |

### 2.5 デイリーリミット: 1日1回の設計根拠

| 理由 | 心理学的根拠 | 実装上の考慮 |
|------|------------|------------|
| **希少性の原則** | 手に入りにくいものほど価値が高く感じる (Cialdini) | `POST /api/omikuji/draw` に日次制限。2回目は `429 Too Many Requests` |
| **次回への期待** | 「明日はどんなメイクに出会える?」の余韻 | 「明日のおみくじまで: 14:32:08」のカウントダウン表示 |
| **API コスト管理** | Gemini Image Gen のコストを予測可能に | 1ユーザー/日 x 1画像 = コスト上限が明確 |
| **習慣化のフック** | 同じ時間帯に同じ行動を繰り返すことで習慣が形成される (BJ Fogg) | 朝の通知 + ストリークで毎日同じ時間にアプリを開く動機づけ |

### 2.6 紙吹雪 / パーティクルエフェクト (SSR/SR Reveal)

```typescript
const CONFETTI_CONFIG = {
  // ── SSR (大吉) 用 ──
  ssr: {
    particleCount: 60,
    colors: ['#FFD700', '#D4778C', '#F2D5D9', '#FFF8E1', '#C9A96E'],
    spread: 90,
    startVelocity: 40,
    gravity: 0.8,
    ticks: 200,
    duration: 2500,
    shapes: ['circle', 'square', 'star'],
    scalar: 1.2,
    origin: { x: 0.5, y: 0.3 },     // カード上部から放射
  },

  // ── SR (中吉) 用 ──
  sr: {
    particleCount: 30,
    colors: ['#C084FC', '#D4778C', '#F2D5D9', '#E9D5FF'],
    spread: 60,
    startVelocity: 25,
    gravity: 0.6,
    ticks: 150,
    duration: 1500,
    shapes: ['circle', 'square'],
    scalar: 1.0,
    origin: { x: 0.5, y: 0.4 },
  },
} as const;
```

### 2.7 ストリークシステム & デイリーチャレンジ (Duolingo inspired)

#### ストリーク仕様

| 日数 | バッジ | リワード内容 |
|------|--------|------------|
| **3日** | 「メイク入門者」 | バッジ獲得 |
| **7日** | 「メイク習慣化」 | 限定カラーパレットのテーマ解放 |
| **14日** | 「メイクマエストロ」 | AI 提案のカスタマイズオプション追加 |
| **30日** | 「メイクアルケミスト」 | 限定おみくじデザイン解放 |
| **100日** | 「レジェンダリー」 | プロフィール限定バッジ + 称号 |

#### ストリーク保護 (Duolingo「フリーズ」相当)

| 機能 | 仕様 |
|------|------|
| **お休みパス** | 週1回まで使用可。ストリークを維持したまま1日休める |
| **復活チャンス** | ストリーク切れ後24時間以内なら「復活チャレンジ」で回復可能 |
| **切れた時のメッセージ** | 「新しい記録に挑戦しよう!」(罰ではなくポジティブなフレーミング) |

#### デイリーチャレンジ

```
┌────────────────────────────────────────┐
│  今日のチャレンジ                        │
│                                        │
│  [ ] おみくじを引く           +10 XP   │
│  [ ] レシピ通りにメイクする    +20 XP   │
│  [ ] Beauty Log に記録する    +15 XP   │
│  [ ] 1ヶ月未使用コスメを使う   +30 XP  │  ← ボーナス
│                                        │
│  今日の XP: 0 / 75  ░░░░░░░░░░ 0%     │
└────────────────────────────────────────┘
```

---

## 3. alche:me への適用提案

### 3.1 コンポーネント階層設計

```
src/components/
├── theme-discovery/
│   ├── ThemeDiscoveryPage.tsx        ← ページ全体のコンテナ
│   ├── ThemeCardStack.tsx            ← カードスタック管理 + AnimatePresence
│   ├── ThemeSwipeCard.tsx            ← 個別カード (drag + rotate + overlay)
│   ├── ThemeCardImage.tsx            ← AI画像 (shimmer → blur → clear)
│   ├── ThemeCardInfo.tsx             ← テーマ名 + 概要 + マッチ度
│   ├── SwipeOverlay.tsx              ← LIKE / NOPE 方向インジケーター
│   ├── SwipeActionBar.tsx            ← x / ★ / ♡ ボタン (補助操作)
│   ├── CardStackIndicator.tsx        ← 残りカード数
│   └── SwipeCounter.tsx              ← 「今日の残り: 2枚」
│
├── omikuji/
│   ├── OmikujiDrawer.tsx             ← おみくじ全体のコンテナ
│   ├── OmikujiTrigger.tsx            ← おみくじ箱 + 引くボタン
│   ├── OmikujiAnimation.tsx          ← 演出中アニメーション
│   │   ├── AlchemyCircle.tsx         ← 錬金術の円陣エフェクト
│   │   └── ParticleGather.tsx        ← 光が集まるパーティクル
│   ├── OmikujiCard.tsx               ← 結果カード (フリップ対応)
│   │   ├── CardFlip.tsx              ← Y軸反転アニメーション
│   │   ├── RankReveal.tsx            ← 大吉〜末吉のランク表示
│   │   └── ConfettiEffect.tsx        ← 紙吹雪 (SSR/SR のみ)
│   ├── OmikujiActions.tsx            ← 「使う」「詳細」「シェア」
│   └── OmikujiHistory.tsx            ← 過去のおみくじ一覧
│
├── gamification/
│   ├── StreakBadge.tsx                ← ストリーク表示 (炎 + 日数)
│   ├── StreakCalendar.tsx             ← 週間カレンダー表示
│   ├── DailyChallenge.tsx            ← デイリーチャレンジリスト
│   ├── XPProgressBar.tsx             ← XP プログレスバー
│   └── RewardModal.tsx               ← リワード獲得時のモーダル
│
└── shared/
    ├── ConfettiCanvas.tsx             ← 汎用紙吹雪コンポーネント
    └── ShimmerPlaceholder.tsx         ← 汎用シマーエフェクト
```

### 3.2 API エンドポイント設計

#### テーマ生成 API

```
POST /api/themes/generate
Request:
{
  "count": 3,
  "context": {
    "weather": "sunny",
    "temperature": 22,
    "occasion": "work",
    "mood": "energetic"
  }
}

Response (SSE — テキスト先行、画像は後続):
event: theme_text
data: {
  "themes": [
    {
      "id": "theme_001",
      "title": "春霞ニュアンスメイク",
      "description": "ふんわりピンクの透明感で今日の気分にマッチ",
      "matchScore": 92,
      "rarity": "SR",
      "themeColor": "#F2D5D9",
      "imageStatus": "generating"
    },
    ...
  ]
}

event: theme_image
data: { "themeId": "theme_001", "imageUrl": "https://..." }

event: theme_image
data: { "themeId": "theme_002", "imageUrl": "https://..." }

event: done
data: {}
```

#### おみくじ API

```
POST /api/omikuji/draw
Request: {}

Response:
{
  "omikuji": {
    "id": "omikuji_20260218",
    "rank": "SR",
    "omikujiRank": "中吉",
    "matchScore": 88,
    "theme": {
      "title": "ナチュラルグロウ",
      "description": "今日は控えめだけど肌のツヤで勝負",
      "imageUrl": "https://...",
      "themeColor": "#C084FC"
    },
    "message": "素敵な発見がありそうな一日。いつものアイテムに小さな変化を加えて",
    "luckyItem": {
      "name": "KATE リップモンスター 05",
      "reason": "今日のテーマカラーにぴったりの赤みピンク"
    },
    "drawnAt": "2026-02-18T07:30:00Z",
    "nextAvailable": "2026-02-19T00:00:00Z"
  }
}

Error (2回目以降):
HTTP 429 Too Many Requests
{
  "error": "daily_limit_reached",
  "message": "今日のおみくじは引き済みです",
  "nextAvailable": "2026-02-19T00:00:00Z"
}
```

#### ストリーク API

```
GET /api/streaks/current
Response:
{
  "currentStreak": 12,
  "longestStreak": 28,
  "calendar": [
    { "date": "2026-02-12", "completed": true },
    { "date": "2026-02-13", "completed": true },
    ...
    { "date": "2026-02-18", "completed": false }
  ],
  "nextReward": {
    "daysUntil": 2,
    "milestone": 14,
    "reward": "メイクマエストロバッジ"
  },
  "freezeAvailable": true
}

POST /api/streaks/complete
Request: { "action": "omikuji" | "recipe_used" | "beauty_log" }
Response:
{
  "newStreak": 13,
  "xpEarned": 10,
  "rewards": [],
  "message": "13日連続! あと1日でメイクマエストロ!"
}
```

### 3.3 プログレッシブ画像ローディング（3段階）

AI 画像生成には 10-15 秒かかるため、待ち時間を体感的に短くする 3 段階ローディングを実装する。

#### 3段階の仕様

| Stage | 名称 | 表示内容 | 開始タイミング | 技術仕様 |
|-------|------|---------|-------------|---------|
| **Stage 1** | Shimmer | グレーの背景にシマーアニメーション | 即座 (0ms) | `linear-gradient` アニメーション, 1.5s infinite |
| **Stage 2** | Blur | テーマカラーから生成したぼかしグラデーション | テキスト受信時 (~2s) | `filter: blur(20px)`, テーマカラーの radial-gradient |
| **Stage 3** | Clear | AI 生成画像の本番表示 | 画像生成完了時 (~10-15s) | `filter: blur(0)`, `transition: filter 0.8s ease-out` |

#### トランジション仕様

```typescript
const IMAGE_LOADING_CONFIG = {
  // ── Stage 1: Shimmer ──
  shimmer: {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '12px',
  },

  // ── Stage 2: Blur placeholder ──
  blur: {
    filter: 'blur(20px)',
    opacity: 0.7,
    transition: 'filter 0.5s ease-out, opacity 0.5s ease-out',
    // テーマカラーから radial-gradient を動的生成
    // e.g., radial-gradient(circle, #F2D5D9, #E8C4CC)
  },

  // ── Stage 3: Clear (本番画像) ──
  clear: {
    filter: 'blur(0)',
    opacity: 1.0,
    transition: 'filter 0.8s ease-out, opacity 0.5s ease-out',
  },
} as const;
```

### 3.4 実装優先度とエフォート見積もり

| # | 機能 | 優先度 | エフォート | 依存関係 | 備考 |
|---|------|--------|-----------|---------|------|
| **1** | ThemeCardStack + ThemeSwipeCard (基本スワイプ) | **P0** | **L** (5-7日) | motion/react (既存) | コア機能。これなしには他が成り立たない |
| **2** | SwipeOverlay (LIKE/NOPE フィードバック) | **P0** | **S** (1日) | #1 完了後 | スワイプの方向性を視覚化 |
| **3** | ThemeCardImage (3段階ローディング) | **P0** | **M** (2-3日) | SSE 対応 | 体感速度の改善に直結 |
| **4** | OmikujiDrawer + CardFlip (基本おみくじ) | **P1** | **L** (5-7日) | #1 と並行可 | 独立した機能モジュール |
| **5** | RankReveal + ConfettiEffect | **P1** | **M** (2-3日) | #4 完了後 | 演出レベルの差別化 |
| **6** | StreakBadge + StreakCalendar | **P2** | **M** (2-3日) | Firestore スキーマ追加 | リテンション施策 |
| **7** | DailyChallenge + XP システム | **P2** | **M** (3-4日) | #6 完了後 | ゲーミフィケーション |
| **8** | SwipeActionBar (ボタン操作) | **P2** | **S** (1日) | #1 完了後 | アクセシビリティ補助 |
| **9** | OmikujiHistory (過去のおみくじ) | **P3** | **S** (1-2日) | #4 完了後 | コレクション機能 |
| **10** | RewardModal + バッジシステム | **P3** | **M** (2-3日) | #6, #7 完了後 | 長期エンゲージメント |

**エフォート凡例**: S = 1-2日, M = 2-4日, L = 5-7日

#### 推奨実装順序 (Phase 3 ロードマップ)

```
Week 1-2:  #1 ThemeCardStack + #2 SwipeOverlay + #3 ThemeCardImage
           #4 OmikujiDrawer + CardFlip (並行作業)
Week 3:    #5 RankReveal + Confetti + #8 SwipeActionBar
Week 4:    #6 StreakBadge + #7 DailyChallenge
Week 5:    #9 OmikujiHistory + #10 RewardModal + 統合テスト
```

### 3.5 ガミフィケーション統合設計

#### エンゲージメントループ (Hooked Model)

```
            ┌──────────────────┐
            │  朝の通知          │ ← Trigger
            │ 「今日の運命メイク  │
            │  準備できました」   │
            └────────┬─────────┘
                     ↓
            ┌──────────────────┐
            │  おみくじを引く     │ ← Action
            │  or テーマスワイプ  │   (低摩擦: ワンタップ)
            └────────┬─────────┘
                     ↓
            ┌──────────────────┐
            │  結果を見る         │ ← Variable Reward
            │  (ランク演出)       │   (予測不可能性)
            └────────┬─────────┘
                     ↓
            ┌──────────────────┐
            │  レシピを使う       │ ← Investment
            │  → ストリーク更新   │   (累積的な成果)
            │  → XP 獲得         │
            │  → コレクション追加  │
            └────────┬─────────┘
                     ↓
            ┌──────────────────┐
            │  「明日はどんな      │ ← 次のループへの期待
            │   メイクに会える?」 │
            └──────────────────┘
```

#### コレクションメカニクス (メイク御朱印帳)

| 要素 | 仕様 |
|------|------|
| **テーマ図鑑** | 過去に引いたすべてのおみくじ結果を一覧表示 |
| **ランク分布** | 「SSR: 3枚, SR: 12枚, R: 28枚...」のような統計 |
| **月間コレクション** | 月ごとのテーマをカレンダー形式で表示 |
| **季節限定テーマ** | 春/夏/秋/冬の限定テーマが存在し、コンプリート欲を刺激 |
| **シェア用カード** | SNS シェア用のデザインカード自動生成 |

---

## 4. 実装仕様

### 4.1 アニメーションパラメータ一覧

すべてのアニメーションの詳細パラメータを一覧化する。

#### スワイプ系アニメーション

| アニメーション | trigger | duration | easing | from | to | 備考 |
|-------------|---------|----------|--------|------|----|----- |
| カード出現 | page load | 400ms | `spring(300, 25)` | `scale: 0.8, opacity: 0` | `scale: 1, opacity: 1` | staggerDelay: 100ms |
| ドラッグ追従 | pointer move | realtime | 1:1 tracking | — | — | 60fps 必須, `useMotionValue` |
| 回転 | drag | realtime | `transform: f(dx)` | `0deg` | `max: 15deg` | `rotationFactor: 0.1` |
| LIKE overlay | drag right | realtime | linear | `opacity: 0` | `opacity: 1` | `threshold: 100px` |
| NOPE overlay | drag left | realtime | linear | `opacity: 0` | `opacity: 1` | `threshold: 100px` |
| カード退場 | swipe confirmed | 300ms | `easeOut` | current pos | `x: +/-150%, rotate: +/-30deg` | — |
| スナップバック | swipe cancelled | 400ms | `spring(1,80,10,0)` | current pos | `x: 0, rotate: 0` | overshoot: 1.05 |
| 次カード昇格 | prev card exit | 300ms | `easeOut` | `scale: 0.95, y: 8px` | `scale: 1.0, y: 0` | — |

#### おみくじ系アニメーション

| アニメーション | trigger | duration | easing | from | to | 備考 |
|-------------|---------|----------|--------|------|----|----- |
| おみくじ箱揺れ | hover / tap | 600ms | `spring(500, 15)` | `rotate: 0` | `rotate: +/-5deg` | repeat: 3 |
| パーティクル集合 | draw start | 2000ms | `easeIn` | 画面四隅に散在 | カード中央に集合 | 20 particles |
| 錬金術サークル | draw start | 2000ms | linear | `rotate: 0, scale: 0.5` | `rotate: 360, scale: 1.0` | repeat: infinite (生成中) |
| カードフリップ | reveal | 600ms | `cubic-bezier(0.4,0,0.2,1)` | `rotateY: 0` | `rotateY: 180deg` | `perspective: 1000px` |
| ランク表示 | post-flip +300ms | 400ms | `spring(300, 20)` | `scale: 0.5, opacity: 0` | `scale: 1.0, opacity: 1` | — |
| 紙吹雪 (SSR) | rank reveal | 2500ms | physics-based | origin center-top | gravity fall | 60 particles |
| 紙吹雪 (SR) | rank reveal | 1500ms | physics-based | origin center | gravity fall | 30 particles |
| シマー | image loading | 1500ms | linear | gradient pos 0% | gradient pos 200% | infinite |
| ブラー→クリア | image loaded | 800ms | `easeOut` | `blur(20px)` | `blur(0)` | — |

### 4.2 React コンポーネント構造

#### ThemeSwipeCard (核心コンポーネント)

```typescript
// ThemeSwipeCard.tsx — スワイプ対応カードの骨格
import { motion, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { SWIPE_CONFIG } from '@/lib/swipe-config';

interface ThemeSwipeCardProps {
  theme: ThemeCard;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  isTop: boolean;         // スタックの最前面かどうか
  stackIndex: number;     // 0 = front, 1 = middle, 2 = back
}

export function ThemeSwipeCard({ theme, onSwipe, isTop, stackIndex }: ThemeSwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // ドラッグ距離に応じた回転
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  // LIKE / NOPE オーバーレイの opacity
  const likeOpacity = useTransform(x, [0, SWIPE_CONFIG.threshold], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_CONFIG.threshold, 0], [1, 0]);

  // スタック位置に応じたスケールとオフセット
  const stackScale = isTop ? 1.0 : 1.0 - (stackIndex * 0.05);
  const stackOffset = isTop ? 0 : stackIndex * 8;

  const handleDragEnd = (_: never, info: PanInfo) => {
    const { offset, velocity } = info;

    // 上スワイプ判定
    if (offset.y < -SWIPE_CONFIG.threshold && Math.abs(offset.x) < 50) {
      onSwipe('up');
      return;
    }

    // 左右スワイプ判定 (距離 or 速度)
    if (Math.abs(offset.x) > SWIPE_CONFIG.threshold ||
        Math.abs(velocity.x) > SWIPE_CONFIG.velocityThreshold) {
      onSwipe(offset.x > 0 ? 'right' : 'left');
      return;
    }

    // 閾値未満 → スナップバック (motion が自動で spring アニメーション)
  };

  return (
    <motion.div
      style={{ x, y, rotate, scale: stackScale, translateY: stackOffset }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: stackScale, opacity: isTop ? 1 : 0.7 - stackIndex * 0.3 }}
      exit={{
        x: 500,      // 方向は onSwipe 時に動的に設定
        rotate: 30,
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      }}
      className="absolute w-[90vw] h-[70vh] rounded-2xl overflow-hidden shadow-lg bg-white"
    >
      {/* LIKE オーバーレイ */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute inset-0 bg-gradient-to-r from-transparent to-green-500/40
                   flex items-center justify-center z-10 pointer-events-none"
      >
        <span className="text-4xl font-black text-green-500 border-4 border-green-500
                        px-4 py-1 rounded-lg -rotate-12">
          LIKE
        </span>
      </motion.div>

      {/* NOPE オーバーレイ */}
      <motion.div
        style={{ opacity: nopeOpacity }}
        className="absolute inset-0 bg-gradient-to-l from-transparent to-red-500/40
                   flex items-center justify-center z-10 pointer-events-none"
      >
        <span className="text-4xl font-black text-red-500 border-4 border-red-500
                        px-4 py-1 rounded-lg rotate-12">
          NOPE
        </span>
      </motion.div>

      {/* カード本体 */}
      <ThemeCardImage
        imageUrl={theme.imageUrl}
        themeColor={theme.themeColor}
        status={theme.imageStatus}
      />
      <ThemeCardInfo
        title={theme.title}
        description={theme.description}
        matchScore={theme.matchScore}
        rarity={theme.rarity}
      />
    </motion.div>
  );
}
```

#### OmikujiCard (フリップ対応)

```typescript
// OmikujiCard.tsx — おみくじカードのフリップアニメーション
import { motion, AnimatePresence } from 'motion/react';
import { CARD_FLIP_CONFIG } from '@/lib/omikuji-config';

interface OmikujiCardProps {
  result: OmikujiResult | null;
  isFlipped: boolean;
  onFlipComplete: () => void;
}

export function OmikujiCard({ result, isFlipped, onFlipComplete }: OmikujiCardProps) {
  return (
    <div className="relative w-[280px] h-[400px]" style={{ perspective: '1000px' }}>
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{
          rotateY: isFlipped ? 180 : 0,
          scale: isFlipped ? [1, 1.05, 1] : 1,
        }}
        transition={{
          rotateY: {
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1],
          },
          scale: {
            duration: 0.6,
            times: [0, 0.5, 1],
          },
        }}
        onAnimationComplete={() => {
          if (isFlipped) onFlipComplete();
        }}
      >
        {/* 表面 (おみくじ箱デザイン) */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-b from-alcheme-gold to-amber-600
                     flex items-center justify-center shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-center text-white">
            <p className="font-display text-xl font-bold">alche:me</p>
            <p className="text-sm opacity-80 mt-2">今日の運命メイク</p>
          </div>
        </div>

        {/* 裏面 (結果表示) */}
        <div
          className="absolute inset-0 rounded-2xl bg-white shadow-lg overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {result && (
            <>
              <RankReveal
                rank={result.omikujiRank}
                matchScore={result.matchScore}
                rarity={result.rank}
              />
              <div className="p-4">
                <img
                  src={result.theme.imageUrl}
                  alt={result.theme.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <h3 className="mt-3 font-display text-lg font-bold">
                  {result.theme.title}
                </h3>
                <p className="mt-1 text-sm text-alcheme-muted">
                  {result.message}
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
```

### 4.3 状態管理アプローチ

alche:me は現在 React の標準的な state + context を使用しており、大規模な状態管理ライブラリは導入していない。スワイプ・おみくじ機能も同様のアプローチで実装する。

#### 状態の分類と管理方針

| 状態カテゴリ | 管理方法 | 例 |
|------------|---------|------|
| **UI ローカル状態** | `useState` / `useReducer` | カード位置、フリップ状態、アニメーション phase |
| **モーション値** | `useMotionValue` (motion/react) | ドラッグの x/y 座標、回転角度 |
| **サーバー状態** | SWR or React Query | テーマデータ、おみくじ結果、ストリーク情報 |
| **グローバル UI 状態** | React Context | 現在の表示モード (スワイプ / おみくじ) |
| **永続化状態** | Firestore | ストリーク記録、おみくじ履歴、保存テーマ |

#### テーマスワイプの状態フロー

```typescript
// useThemeSwipe.ts — スワイプ状態を管理するカスタムフック
type SwipeState = {
  themes: ThemeCard[];           // 3枚のテーマカード
  currentIndex: number;          // 現在表示中のカードインデックス
  savedThemes: string[];         // 右スワイプで保存したテーマID
  skippedThemes: string[];       // 左スワイプでスキップしたテーマID
  isLoading: boolean;            // テーマ生成中
  imageStatuses: Record<string, 'shimmer' | 'blur' | 'clear'>;
};

type SwipeAction =
  | { type: 'SWIPE_RIGHT'; themeId: string }
  | { type: 'SWIPE_LEFT'; themeId: string }
  | { type: 'SWIPE_UP'; themeId: string }
  | { type: 'THEMES_LOADED'; themes: ThemeCard[] }
  | { type: 'IMAGE_READY'; themeId: string; imageUrl: string }
  | { type: 'ALL_DONE' };
```

#### おみくじの状態フロー

```typescript
// useOmikuji.ts — おみくじ状態を管理するカスタムフック
type OmikujiPhase =
  | 'idle'           // 待機状態 (おみくじ箱表示)
  | 'drawing'        // 引いている最中 (演出中 + AI生成待ち)
  | 'revealing'      // 結果開示 (カードフリップ)
  | 'revealed'       // 結果表示完了
  | 'already_drawn'; // 本日引き済み

type OmikujiState = {
  phase: OmikujiPhase;
  result: OmikujiResult | null;
  streak: StreakData | null;
  todayAlreadyDrawn: boolean;
  nextAvailable: string | null;    // ISO 8601 timestamp
};
```

### 4.4 バックエンド API 設計詳細

#### Firestore スキーマ追加

```
users/{userId}/
├── themes/
│   ├── saved/{themeId}           ← 保存したテーマ
│   │   ├── title: string
│   │   ├── description: string
│   │   ├── imageUrl: string
│   │   ├── matchScore: number
│   │   ├── rarity: "SSR"|"SR"|"R"|"N"
│   │   ├── savedAt: timestamp
│   │   └── recipeGenerated: boolean
│   └── skipped/{themeId}         ← スキップしたテーマ (学習データ)
│       ├── title: string
│       └── skippedAt: timestamp
│
├── omikuji/
│   └── history/{omikujiId}       ← おみくじ履歴
│       ├── rank: "SSR"|"SR"|"R"|"N"|"末吉"
│       ├── omikujiRank: "大吉"|"中吉"|"小吉"|"吉"|"末吉"
│       ├── matchScore: number
│       ├── theme: { title, description, imageUrl }
│       ├── message: string
│       ├── luckyItem: { name, reason }
│       └── drawnAt: timestamp
│
├── streaks/
│   └── current                    ← 現在のストリーク情報
│       ├── currentStreak: number
│       ├── longestStreak: number
│       ├── lastCompletedDate: string  (YYYY-MM-DD)
│       ├── freezeUsedThisWeek: boolean
│       └── calendar: map<string, boolean>
│
└── gamification/
    └── stats                      ← ゲーミフィケーション統計
        ├── totalXP: number
        ├── level: number
        ├── badges: string[]
        ├── totalOmikujiDrawn: number
        ├── ssrCount: number
        └── challengesCompleted: number
```

#### API レート制限とエラーハンドリング

| エンドポイント | レート制限 | エラー時の挙動 |
|-------------|-----------|-------------|
| `POST /api/themes/generate` | 3回/日/ユーザー | 429 + 次回利用可能時刻 |
| `POST /api/omikuji/draw` | 1回/日/ユーザー | 429 + カウントダウン表示 |
| `GET /api/streaks/current` | 60回/分 | キャッシュからフォールバック |
| `POST /api/streaks/complete` | 10回/日/ユーザー | 重複アクションは無視 (idempotent) |

### 4.5 パフォーマンス要件

| 指標 | 目標値 | 測定方法 | 対策 |
|------|--------|---------|------|
| スワイプ応答遅延 | < 16ms (60fps) | Chrome DevTools Performance | `useMotionValue` で re-render 回避, `will-change: transform` |
| テーマテキスト生成 | < 3秒 | Server-Timing header | Gemini Flash (高速モデル) 使用 |
| テーマ画像生成 | < 15秒 | PerformanceObserver | 3段階ローディングで体感時間を短縮 |
| おみくじフリップ | 60fps | rAF counter | CSS `transform: rotateY()` + GPU合成 |
| LCP (初回ロード) | < 2.5秒 | Lighthouse | テキスト先行表示 + lazy image load |
| CLS | < 0.1 | Lighthouse | カード領域を事前にサイズ確保 |
| INP (Interaction to Next Paint) | < 200ms | web-vitals | スワイプ判定ロジックを `requestAnimationFrame` 内で処理 |

### 4.6 アクセシビリティ考慮

| 要素 | 対応 |
|------|------|
| **スワイプ操作の代替** | SwipeActionBar のボタン (x/★/♡) でスワイプ操作を代替可能 |
| **スクリーンリーダー** | カード内容を `aria-label` で読み上げ。スワイプ方向は `aria-live` で通知 |
| **モーション低減** | `prefers-reduced-motion` を検知し、アニメーションを簡略化 |
| **色覚多様性** | LIKE/NOPE のオーバーレイにアイコン+テキストも併用（色だけに依存しない） |
| **キーボード操作** | 矢印キーでスワイプ操作を代替 (左=NOPE, 右=LIKE, 上=SUPER) |

---

## 5. 参考文献・先行事例

### 5.1 UI パターンの参考元

| カテゴリ | アプリ / サービス | 参考ポイント |
|---------|-------------|-------------|
| スワイプ UI | Tinder, Bumble, Hinge | カードスタック、ジェスチャー、フィードバック |
| おみくじ系 | 毎日おみくじ, LINE 占い | 演出、ランクシステム、日本文化要素 |
| Daily Discovery | Duolingo, Spotify, Pinterest | ストリーク、パーソナライズ、限定感 |
| ガミフィケーション | ポケモンスリープ, あつまれ どうぶつの森, Habitica | 習慣化、リワード、コレクション |
| 美容系 | LIPS, @cosme, WEAR | コスメ UI、ビジュアルファースト、レビュー |
| ガチャ演出 | FGO, 原神, プロスピ A | レアリティ演出、パーティクル、音声フィードバック |

### 5.2 心理学・行動経済学の参考理論

| 理論 | 提唱者 | 本レポートでの適用箇所 |
|------|--------|---------------------|
| 可変報酬スケジュール (Variable Ratio Reinforcement) | B.F. Skinner | スワイプの中毒性設計、おみくじのランダム結果 |
| 選択のパラドックス (Paradox of Choice) | Barry Schwartz | 1枚ずつ表示して二者択一に絞る設計 |
| Tiny Habits / 行動モデル B=MAP | BJ Fogg | 朝のルーティンへの組み込み、最小限のアクション |
| Hooked Model | Nir Eyal | Trigger→Action→Variable Reward→Investment ループ |
| 損失回避 (Loss Aversion) | Kahneman & Tversky | ストリーク維持、期間限定テーマの FOMO |
| 予測報酬誤差 (Reward Prediction Error) | Wolfram Schultz | カードめくり直前のドーパミン設計 |
| IKEA 効果 | Norton, Mochon, Ariely | 「あなたの在庫から」生成されたテーマの特別感 |
| ピーク・エンドの法則 (Peak-End Rule) | Kahneman | 最後のカードを特別にする + 終了時のサマリー演出 |
| フロー理論 (Flow Theory) | Csikszentmihalyi | 適度な挑戦度のメイクテーマ提案 |
| 希少性の原則 (Scarcity Principle) | Robert Cialdini | 1日1回制限によるプレミアム感の醸成 |

### 5.3 alche:me 既存実装との接続点

| 既存コンポーネント | パス | 新機能との関連 |
|-----------------|------|-------------|
| `RarityBadge` | `components/rarity-badge.tsx` | おみくじランクの表示に Rarity 型 (`SSR`/`SR`/`R`/`N`) を再利用 |
| `AppraisalEffect` | `components/appraisal-effect.tsx` | カード演出のアニメーションパターン (loading → revealing → done) を流用 |
| `stat-bar` | `components/stat-bar.tsx` | マッチ度のビジュアル表示 |
| レアリティシステム | `types/inventory.ts` | `Rarity` 型定義とおみくじランクの融合 |
| `motion` (framer-motion) | `package.json` 既存依存 | スワイプ + フリップアニメーションの基盤 |
| Gemini Image Generation | `app/api/` 内のルート | テーマプレビュー画像の生成 |
| Profiler Agent | バックエンド AGS | パーソナライズ（在庫・好み・天気）のデータソース |

---

*Created: 2026-02-18*
*Last Updated: 2026-02-18*
*Related: [FEAT-005 Task Plan](../tasks/plans/FEAT-005_swipe-omikuji-ux-research.md) | [PRD v4](../architecture/alcheme_PRD_v4.md) | [Deep Research Synthesis](deep_research_synthesis.md)*
