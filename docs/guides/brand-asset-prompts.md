# BRAND-002: デザインアセット生成プロンプト集

| | |
|---|---|
| **Date** | 2026-02-19 |
| **Purpose** | Gemini / Leonardo.ai でアプリのデザインアセットを生成するためのプロンプト |
| **Related** | `docs/plans/backlog_and_remaining_tasks.md` BRAND-002 |

---

## アプリのブランド情報（共通コンテキスト）

| 項目 | 値 |
|------|-----|
| **アプリ名** | alche:me |
| **タグライン** | 手持ちコスメで、まだ見ぬ私に出会う |
| **コンセプト** | AI美容部員がパーソナルなメイクレシピを提案する美容アプリ。錬金術（alchemy）× 自分（me）のネーミング |
| **ターゲット** | 20-35歳の日本人女性 |
| **デザイン言語** | Glassmorphism + Aurora（すりガラス + 幻想的な光のぼかし背景） |
| **カラーパレット** | Alchemy Gold `#C8A359`, Neon Purple `#7C3AED`, Magic Pink `#FFB7C5`, Magic Purple `#E0BBE4`, Gold Light `#FCEEB5`, Base `#FAFAFA` |
| **グラデーション** | Purple→Pink (`#7C3AED` → `#FFB7C5`)、Gold (`#C8A359` → `#dab76e`) |
| **フォント** | Cormorant Garamond（ロゴ・ディスプレイ、italic）、Zen Maru Gothic（本文・日本語） |
| **キーワード** | 錬金術、変身、発見、パーソナライズ、透明感、上品、幻想的 |
| **既存ロゴ要素** | 円形（Purple→Pink グラデーション）に白い "A" のイニシャル |

---

## 1. アプリアイコン（PWA / Favicon）

> 出力サイズ: 512×512px（後で 192×192, 180×180, 32×32 にリサイズ）
> 形式: PNG（角丸は OS が自動適用するため、正方形で出力）

### Gemini 用プロンプト

```
Design a modern, minimal mobile app icon for "alche:me", an AI-powered beauty and cosmetics advisor app.

Visual concept:
- A stylized letter "A" in an elegant serif italic font (similar to Cormorant Garamond), representing both "alchemy" and personal beauty transformation
- The "A" should feel like an alchemical symbol — refined, almost magical
- Subtle alchemical motifs: a small sparkle, a droplet, or a gentle transmutation circle element integrated into the letter design

Color scheme:
- Background: smooth gradient from deep purple (#7C3AED) to soft pink (#FFB7C5)
- Letter/symbol: white (#FFFFFF) with a subtle gold shimmer or highlight (#C8A359)
- Optional: very subtle glassmorphism effect — a faint translucent overlay or light refraction

Style guidelines:
- Clean, modern, and premium feel — NOT cartoonish or overly decorative
- Must be recognizable at 32×32px (favicon size) — avoid fine details
- Rounded square format (512×512px), no background transparency
- Inspired by: Sephora app icon (clean, bold), Glossier (minimal), Apple's design language
- The icon should feel luxurious yet approachable, suitable for a Japanese female audience (20-35 years old)

Do NOT include:
- Text or words (no "alche:me" text — just the symbol)
- Realistic faces or human figures
- Complex gradients with more than 3 colors
```

### Leonardo.ai 用プロンプト

```
Minimal mobile app icon, stylized serif italic letter A with alchemical sparkle motif, gradient background from deep purple #7C3AED to soft pink #FFB7C5, white letter with subtle gold #C8A359 shimmer highlight, glassmorphism light refraction effect, clean premium modern design, rounded square format, 512x512 pixels, flat design with subtle depth, beauty cosmetics app aesthetic, luxury minimalist style
```

**ネガティブプロンプト:**
```
text, words, letters except A, realistic face, human figure, cartoon, childish, busy, cluttered, 3D render, photorealistic, dark background, neon, cyberpunk
```

---

## 2. OG画像（SNS共有用）

> 出力サイズ: 1200×630px
> 用途: Twitter Card, LINE, Facebook 共有時のプレビュー
> 配置: `app/opengraph-image.png`

### Gemini 用プロンプト

```
Design an Open Graph social sharing image (1200×630px) for "alche:me", an AI beauty advisor app.

Layout:
- Left side (60%): App logo (stylized "A" in circle with purple-to-pink gradient) + app name "alche:me" in elegant serif italic font + tagline in Japanese "手持ちコスメで、まだ見ぬ私に出会う" in a clean sans-serif font
- Right side (40%): Abstract beauty/cosmetics visual — soft aurora blobs of purple (#E0BBE4), pink (#FFB7C5), and gold (#FCEEB5), representing the app's glassmorphism aesthetic

Background:
- Very light warm white (#FAFAFA) with subtle aurora gradient blobs (blurred circles of purple, pink, and gold light)
- Glassmorphism card element behind the text for readability

Typography:
- "alche:me" — large, elegant serif italic (Cormorant Garamond style), dark text (#1A1A1D)
- Tagline — smaller, rounded Japanese sans-serif (Zen Maru Gothic style), muted gray (#8E8E93)

Color palette: Purple #7C3AED, Pink #FFB7C5, Gold #C8A359, Light purple #E0BBE4, Base #FAFAFA, Dark text #1A1A1D

Style: Clean, minimal, premium. Light and airy. Not cluttered. Suitable for a sophisticated Japanese beauty app targeting women 20-35.
```

### Leonardo.ai 用プロンプト

```
Social media preview card 1200x630 pixels, elegant beauty app branding, left side features stylized A logo in purple-to-pink gradient circle and text "alche:me" in serif italic font, right side has abstract aurora light blobs in purple #E0BBE4 pink #FFB7C5 and gold #FCEEB5, very light #FAFAFA background, glassmorphism card effect, minimal premium clean layout, Japanese beauty app aesthetic, soft dreamy lighting
```

**ネガティブプロンプト:**
```
dark background, neon, busy, cluttered, realistic photo, human face, product photo, 3D render, cartoon, loud colors
```

---

## 3. ログイン画面ロゴ（大サイズ）

> 用途: ログイン/サインアップ画面の中央に表示
> 現状: テキストのみ（`<h1>alche:me</h1>` + 円形 "A" アイコン）
> 目標: ロゴマーク + ロゴタイプの組み合わせ

### Gemini 用プロンプト

```
Design a logo lockup for "alche:me", an AI beauty advisor mobile app. This will be displayed on the app's login screen against a light aurora background.

Structure (vertical lockup):
1. Logo mark (top): A stylized letter "A" inside a circle. The circle has a gradient from purple (#7C3AED) to pink (#FFB7C5). The "A" is white, in an elegant serif italic style. Subtle alchemical sparkle or transmutation motif.
2. Logo type (below): The text "alche:me" — the colon is part of the name. Typography: elegant serif italic, similar to Cormorant Garamond. Color: dark charcoal (#1A1A1D).
3. Tagline (below logo type): "手持ちコスメで、まだ見ぬ私に出会う" in a softer, smaller Japanese rounded gothic font. Color: muted gray (#8E8E93).

Design requirements:
- The logo mark should be the same design as the app icon (consistent branding)
- Clean, generous whitespace
- Premium, luxury beauty feel — like a high-end cosmetics brand
- Works on a light (#FAFAFA) background with subtle colored aurora blobs behind it
- Transparent background (PNG)
- Total height: approximately 200-300px at 3x resolution

Mood: Elegant, magical, transformative, personal discovery. Think: the moment of "alchemy" when everyday cosmetics become something special.
```

### Leonardo.ai 用プロンプト

```
Logo lockup design, vertical layout, top circle icon with purple #7C3AED to pink #FFB7C5 gradient containing white serif italic letter A with alchemical sparkle, below text "alche:me" in elegant serif italic dark charcoal #1A1A1D, below tagline in small Japanese rounded gothic gray text, transparent background, premium luxury beauty brand aesthetic, clean minimal whitespace, high-end cosmetics branding style
```

**ネガティブプロンプト:**
```
3D, glossy, cartoon, childish, busy, cluttered, drop shadow, outline, stroke, dark background, neon glow
```

---

## 4. スプラッシュスクリーン

> 用途: PWA 起動時の読み込み画面
> サイズ: 複数サイズ（主に 1170×2532px / iPhone 15 相当）

### Gemini 用プロンプト

```
Design a splash screen for "alche:me" mobile beauty app, displayed when the PWA launches.

Layout (centered, vertical):
- Center: Logo mark (the "A" circle icon in purple-to-pink gradient, white letter) — large, prominent
- Below logo: "alche:me" in elegant serif italic
- Background: The app's signature aurora effect — very soft, blurred, translucent circles of light:
  - Top-left area: soft purple blob (#E0BBE4, very blurred)
  - Right area: soft pink blob (#FFB7C5, very blurred)
  - Bottom area: soft gold blob (#FCEEB5, very blurred)
  - Base background color: warm white (#FAFAFA)

Design requirements:
- Mobile portrait orientation (9:19.5 aspect ratio, e.g. 1170×2532px)
- Minimal — only the logo, app name, and aurora background
- No tagline, no other text
- The aurora blobs should be very soft and ethereal (opacity ~50%, blur radius ~80px)
- Premium, calming, anticipation-building feel
- Similar aesthetic to the Glossier or Chanel app splash screens

Color palette: Base #FAFAFA, Purple blob #E0BBE4, Pink blob #FFB7C5, Gold blob #FCEEB5, Logo gradient #7C3AED → #FFB7C5, Text #1A1A1D
```

### Leonardo.ai 用プロンプト

```
Mobile app splash screen, portrait 1170x2532 pixels, centered logo circle with purple-to-pink gradient and white serif italic A, below text "alche:me" in dark elegant serif italic, very soft ethereal aurora background with blurred light blobs purple #E0BBE4 pink #FFB7C5 and gold #FCEEB5 on warm white #FAFAFA base, glassmorphism aesthetic, minimal premium beauty app, dreamy soft lighting, high-end cosmetics brand feel
```

**ネガティブプロンプト:**
```
text other than alche:me, dark background, busy, cluttered, realistic photo, 3D render, sharp edges, loud colors, neon
```

---

## 5. Favicon（ブラウザタブ用）

> 出力: アプリアイコンと同じデザインを 32×32 / 16×16 にリサイズ
> 注意: 非常に小さいので、ディテールが潰れないデザインが必要

### 補足

Favicon はアプリアイコン（#1）を生成した後、以下でリサイズ:
- 512×512 → 32×32 (favicon)
- 512×512 → 180×180 (Apple Touch Icon)
- 512×512 → 192×192 (PWA small)

リサイズ後に視認性を確認。もし "A" のディテールが潰れる場合は、以下のシンプル版プロンプトで別途生成:

```
Extremely simple app icon for tiny display (16×16 to 32×32 pixels). A single bold serif italic letter "A" in white, centered on a solid purple-to-pink gradient circle (#7C3AED to #FFB7C5). No decorative elements, no sparkles, no fine details. Must be perfectly legible at 16px. 512×512px output for downscaling.
```

---

## 生成後の実装手順

### ファイル配置

| アセット | ファイルパス | 形式 | サイズ |
|---------|------------|------|--------|
| Favicon | `app/icon.png` | PNG | 32×32 |
| Apple Touch Icon | `public/apple-touch-icon.png` | PNG | 180×180 |
| PWA Icon (small) | `public/icons/icon-192.png` | PNG | 192×192 |
| PWA Icon (large) | `public/icons/icon-512.png` | PNG | 512×512 |
| OG Image | `app/opengraph-image.png` | PNG | 1200×630 |
| Login Logo | `public/images/logo-lockup.png` | PNG (透過) | 適宜 |
| Splash Screen | `public/icons/splash-*.png` | PNG | 複数サイズ |

### コード変更

1. **`public/manifest.json`** — アイコンを SVG → PNG に更新:
   ```json
   {
     "icons": [
       { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
     ]
   }
   ```

2. **`app/layout.tsx`** — metadata に Apple Touch Icon と OG Image を追加:
   ```tsx
   icons: {
     icon: '/icon.png',
     apple: '/apple-touch-icon.png',
   }
   ```
   ※ OG画像は `app/opengraph-image.png` に配置すれば Next.js が自動検出

3. **`components/auth/login-form.tsx`** — テキストロゴを画像に置換:
   ```tsx
   <Image src="/images/logo-lockup.png" alt="alche:me" width={200} height={120} />
   ```

4. **`public/icons/icon-192.svg`** / **`icon-512.svg`** — PNG 版で置換後に削除

---

## デザインの一貫性チェックリスト

- [ ] アプリアイコンの "A" デザインが全サイズで視認可能
- [ ] カラーパレットが既存アプリ UI と一致（特に `#7C3AED`, `#FFB7C5`, `#C8A359`）
- [ ] OG画像で "alche:me" テキストが正しくコロン付きで表示
- [ ] ログインロゴの雰囲気が現在の aurora + glassmorphism テーマと調和
- [ ] スプラッシュスクリーンの aurora blob が `globals.css` の `.blob-*` 色と一致
- [ ] Favicon が 16×16 でも識別可能
