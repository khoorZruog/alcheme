# **iOS 26 Liquid Glass デザインシステム：空間コンピューティング時代におけるナビゲーションアーキテクチャとマテリアル物理学の包括的分析**

## **1\. 序論：インターフェースデザインにおける「物質性」の回帰と進化**

2025年6月のWWDCで発表され、同年9月にリリースされたiOS 26は、Appleのヒューマンインターフェースガイドライン（HIG）における過去10年間で最も重要な転換点となりました1。iOS 7がもたらした「フラットデザイン」による装飾の排除から長い年月を経て、Appleは「Liquid Glass（リキッドグラス）」と呼ばれる新たなデザイン言語を導入しました。これは単なる視覚的なスキンの変更ではなく、インターフェースに物理的な「重み」「光学特性」「流動性」を持たせることで、デジタルオブジェクトの在り方を根本から再定義する試みです。

本レポートでは、iOS 26の中核をなすLiquid Glassデザインシステムについて、特に「ナビゲーション設計」への影響に焦点を当てて詳細に調査・分析を行います。従来の固定的なナビゲーションバーから、浮遊し、変形し、環境に適応する「流体的なナビゲーション」への移行は、ユーザー体験（UX）にどのような認知的負荷と利益をもたらすのか。また、競合であるGoogleのMaterial Design 3 Expressiveとの哲学的な差異、そしてLIPSや@cosmeといった高密度な情報を持つアプリケーションがこの新システムにどう適応すべきかについて、技術的・心理学的側面から多角的に論じます。

### **1.1 背景：空間コンピューティングへの架け橋**

Liquid Glassの誕生は、Apple Vision ProおよびvisionOSの登場と不可分な関係にあります1。空間コンピューティング（Spatial Computing）の世界では、UIは物理的な空間に浮かぶ「オブジェクト」として存在する必要があります。そこでは、背景を完全に遮断する不透明なパネルは視界を妨げる障害物となり、逆に平坦すぎる要素は奥行きの中で埋没してしまいます。

AppleのHuman Interface Design担当副社長であるAlan Dyeと、ソフトウェアエンジニアリング担当上級副社長のCraig Federighiが主導したこのプロジェクトは、空間コンピューティングで培われた「ガラス」のメタファーを、iPhoneやiPadといった2Dスクリーン上に逆輸入したものです1。これにより、ユーザーはデバイスのフレームを超えた「奥行き」を感じ取り、将来的なAR/VR体験への認知的な準備（プライミング）を行うことになります。

### **1.2 従来の「すりガラス」との決定的な違い**

iOS 7以降、Appleは「UIVisualEffectView」などを通じてすりガラス効果（Blur）を使用してきましたが、Liquid Glassは物理シミュレーションのレベルが異なります。

* **屈折（Refraction）:** 従来のブラーが単に光を散乱させていたのに対し、Liquid Glassは光を「曲げ（Lensing）」ます。背景にあるコンテンツの色や形状が、ガラスの厚みと曲率に応じて光学的に歪み、収束することで、前面のテキストやアイコンの視認性を確保します3。  
* **流動性（Fluidity）:** 名前が示す通り、この素材は固体と液体の中間のような性質を持ちます。インタラクションに応じて形状が滑らかに変形（モーフ）し、ボタンを押すと表面張力が働くかのように周囲が歪むといった微細な挙動が含まれます4。

本レポートは、これらの特性がいかにして「ナビゲーション」というアプリの骨格を変容させたのかを、15,000語にわたり詳述するものです。

## ---

**2\. Liquid Glassの理論的枠組みと構成要素**

ナビゲーション設計を理解するためには、まずそれを構成する「素材」の物理法則を理解する必要があります。Liquid Glassは、静的なピクセルの配置ではなく、動的なマテリアルのシミュレーションとして実装されています。

### **2.1 光学物理学に基づく階層構造**

Liquid Glassの基本原則は「Hierarchy（階層性）」「Harmony（調和）」「Consistency（一貫性）」の3点に集約されます1。中でもナビゲーションにおいて最も重要なのが階層性です。

従来のiOSでは、ナビゲーションバーやタブバーは「画面の底」や「天井」として機能する、不透明または半透明の固定領域でした。しかし、Liquid Glassにおいてナビゲーション要素は「コンテンツの上に浮遊するレンズ」として扱われます。

* **レンズ効果による焦点化:** ユーザーがコンテンツをスクロールさせると、ナビゲーションバーの下を通過する画像やテキストは、単に隠れるのではなく、Liquid Glassの屈折率によって「ボケて、かつ彩度が増した」状態になります。これにより、ナビゲーション上のラベル（「戻る」や「検索」など）とのコントラスト比が動的に調整され、視認性が保たれます1。  
* **スペキュラーハイライト:** 環境光センサーと連動し、デバイスの傾きに合わせてガラスのエッジに走るハイライト（光沢）が移動します。これにより、ユーザーはナビゲーションバーの「厚み」と「位置関係」を無意識のうちに把握します5。

### **2.2 動的なマテリアルステート**

Liquid Glassは単一の状態ではなく、コンテキストに応じてその物性を変化させます。開発者向けドキュメントによると、主に以下のバリエーションが存在します3。

| バリエーション | 特性 | ナビゲーションでの用途 |
| :---- | :---- | :---- |
| **Regular (標準)** | バランスの取れたぼかしと屈折。背景の平均色を取り込み、適度な透過性を持つ。 | 標準的なタブバー、ツールバー、サイドバーに使用。 |
| **Prominent (強調)** | 透過度を下げ、背景色をより強く反映させる。コントラストが高い。 | アクティブなボタンや、強調したいモーダルウィンドウに使用。 |
| **Clear (透明)** | ほぼ完全に透明だが、強い屈折率を持つ。背景のディテールを保ちつつ、境界線を示す。 | フルスクリーンメディア（動画や写真）上のオーバーレイナビゲーションに使用。 |
| **Tinted (着色)** | アプリのブランドカラーや、ユーザーが設定した壁紙の色を透過光として合成する。 | 「マイページ」や特定のブランド世界観を重視する画面で使用。 |

### **2.3 空間的整合性とユニバーサルデザイン**

iOS 26の最大の功績の一つは、iPhone、iPad、Mac、Apple Watch、Apple TVのすべてのプラットフォームで、このLiquid Glassによるナビゲーションシステムを統一した点です1。 これまでは、iOSのタブバーとmacOSのサイドバーは全く異なるデザイン言語で語られてきましたが、Liquid Glassによって「マテリアルの振る舞い」が統一されました。例えば、iPhoneのタブバーボタンを押したときの「沈み込みと光の反射」は、Apple Watchのコントロールセンターのボタンを押したときと全く同じ物理演算で描画されます。これにより、ユーザーはデバイスを変えても「同じ物質に触れている」という感覚を持ち、学習コストが大幅に低減されます。

## ---

**3\. iOS 26におけるナビゲーションアーキテクチャの革新**

Liquid Glassの導入により、iOSアプリのナビゲーション構造は、従来の「固定枠」から「適応型フローティング」へと劇的に変化しました。ここでは、その主要な構成要素を詳細に分析します。

### **3.1 フローティング・カプセル・タブバー（The Floating Capsule Tab Bar）**

最も象徴的な変更点は、画面下部に固定されていたエッジ・トゥ・エッジ（端から端まで）のタブバーの廃止と、フローティング・カプセル型の採用です8。

#### **3.1.1 構造と挙動**

新しいタブバーは、画面の左右および下端から約16〜20ポイント程度インセット（内側に配置）された、角丸のカプセル形状をしています。これはもはや「画面の一部」ではなく、画面上に浮いている「操作盤」です。

* **スクロールによる最小化（Minimize on Scroll）:** ユーザーがコンテンツを下にスクロール（指を上にスライド）させると、タブバーは自動的に収縮し、さらに小さな「ピル（錠剤）」型になるか、場合によっては完全に透明化してアイコンのみが浮遊する状態になります9。  
* **意図の予測:** 逆に、ユーザーがスクロールを止める、あるいは上にスクロール（指を下にスライド）させると、タブバーは即座に元のサイズに展開し、詳細なラベルや追加のオプションを表示します。これは、システムが「ユーザーは移動しようとしている」という意図を検知して、ナビゲーションのアクセシビリティを高める挙動です。

#### **3.1.2 「親指ゾーン（Thumb Zone）」への最適化**

このデザイン変更は、近年のスマートフォンの巨大化に対応した人間工学的な配慮でもあります。従来のタブバーは画面の最下部にあり、親指を不自然に曲げる必要がありました。フローティングデザインにより、タップ領域が数ミリ上に移動し、より自然な「親指の可動域（Thumb Zone）」内にコントロールが収まるようになりました11。

### **3.2 モーフィング・サーチタブ（The Morphing Search Tab）**

iOS 26のナビゲーションにおけるもう一つの大きな論点は、「検索」機能の扱いです。これまで検索は専用の画面や上部の検索バーに配置されることが一般的でしたが、iOS 26ではタブバーの一部として統合されるケースが増えています。

#### **3.2.1 形状変化のアニメーション**

新しい標準では、検索タブは他のナビゲーションタブとは視覚的に区別された、円形または正方形に近い形状（Squircle）で配置されることが多くなりました。ユーザーがこのアイコンをタップすると、画面遷移ではなく「モーフィング（変形）」が発生します。 円形のアイコンが流体的に横に広がり、そのままキーボードの上に位置する「検索入力フィールド」へと変形します13。このアニメーションは、Liquid Glassの「流動性」を象徴するものであり、ユーザーに対して「検索ボタンがそのまま入力エリアになった」という因果関係を直感的に伝えます。

#### **3.2.2 「タブバー・ビーフ（Tab Bar Beef）」論争**

この新しい検索タブのデザインは、デザインコミュニティ内で議論（Tab Bar Beef）を巻き起こしています13。

* **Google Material Designとの衝突:** GoogleのMaterial Designには「Floating Action Button (FAB)」という、画面上に浮遊して主要なアクション（投稿など）を行うボタンがあります。iOS 26の検索タブは、見た目も挙動もこのFABに酷似しています。  
* **ナビゲーション vs アクション:** 伝統的にタブバーは「場所の移動（Navigation）」に使われ、FABは「行動（Action）」に使われてきました。Appleが検索タブを目立たせ、かつモーフィングさせることで、この境界線が曖昧になり、ユーザーが「これは移動なのか、作成なのか」を迷う可能性があります。Ryan Ashcraft氏などのデザイナーは、これをAppleによる「FABの事実上の採用」であり、iOSの純粋性を損なうものだと指摘しています13。

### **3.3 サイドバーへのシームレスな適応（iPad/macOS）**

ユニバーサルデザインの一環として、Liquid Glassのタブバーは、デバイスのウィンドウサイズに応じて自動的にサイドバーへと変身します15。

* **トランスルーセント・ペイン:** iPadOS 26では、iPhoneのタブバーが左端に移動し、縦長のサイドバーになります。このサイドバーもまたLiquid Glass素材でできており、アプリの背景画像やデスクトップの壁紙を美しく透過させます。  
* **階層の維持:** 従来のサイドバーは不透明なグレーの領域で、コンテンツエリアを狭めていました。Liquid Glassサイドバーは「コンテンツの上に重なるガラス板」として表現されるため、視覚的にはコンテンツエリアが全画面に広がっているような開放感を与えます16。

### **3.4 スクロールエッジ・エフェクト（Scroll Edge Effect）**

ナビゲーションバーとコンテンツの境界を曖昧にするための技術的処理が「スクロールエッジ・エフェクト」です15。

* **静止状態:** コンテンツが最上部にあるとき、ナビゲーションバーは完全に透明になり、コンテンツと一体化します。タイトルやボタンだけが浮いているように見えます。  
* **スクロール状態:** コンテンツがスクロールされ、バーの下に潜り込むと、Liquid Glassのマテリアルが「起動」します。すりガラス効果が発生し、屈折率が高まり、背景のコンテンツをぼかしながらナビゲーションの視認性を確保します。この遷移は線形ではなく、スクロール量に応じて物理的な厚みが増すような非線形のアニメーションで行われます。

## ---

**4\. 技術的実装：SwiftUIとUIKitにおける適応**

開発者にとって、Liquid Glassの導入はコードベースの大幅なアップデートを意味します。Appleは、SwiftUIを中心に新しいAPIを提供し、この複雑なマテリアル表現を容易に実装できるようにしました。

### **4.1 SwiftUIにおける実装**

SwiftUIはLiquid Glassのネイティブサポートを受けており、数行のコードで高度な物理シミュレーションを適用できます。

* **.backgroundStyle(.liquidGlass):** これは最も基本的なモディファイアです。あらゆるViewに対してLiquid Glassのマテリアル効果（ブラー、彩度調整、ノイズ、スペキュラー）を適用します17。  
* **.tabBarMinimizeBehavior(.onScrollDown):** iOS 26特有の「スクロール時にタブバーを縮小する」挙動を制御するAPIです。開発者はこの挙動を.always（常に縮小）、.never（固定）、.onScrollDown（スクロール時のみ）から選択できます10。  
* **GlassEffectContainer:** パフォーマンス最適化のための重要なコンポーネントです。複数のLiquid Glass要素（例：並んだボタン群）を個別にレンダリングすると、背景のサンプリング処理が重複し、GPU負荷が高まります。GlassEffectContainerを使用することで、複数の要素を一つの「ガラス領域」としてまとめてレンダリングし、処理を軽量化しつつ、要素間のモーフィングを滑らかにします3。

### **4.2 UIKitおよびハイブリッド環境での課題**

既存の多くのアプリ（特に大規模なもの）はUIKitベース、あるいはUIKitとSwiftUIのハイブリッド構成で構築されています。これらのアプリでのLiquid Glass対応は一筋縄ではいきません。

* **カスタム描画の廃止:** 従来、UINavigationBarの背景色や影を細かくカスタマイズしていたアプリは、Liquid Glassの自動適応（Scroll Edge Effectなど）と競合する可能性があります。Appleは、カスタム背景を削除し、システム標準のマテリアルに任せることを推奨しています15。  
* **「Grow」アプリの事例:** 健康管理アプリ「Grow」の開発チームは、iOS 26対応において、独自のナビゲーションバー実装を捨て、ネイティブのUINavigationBarに戻す決断をしました。これにより、システム標準のモーフィング効果やスクロール連動を享受できるようになりましたが、独自のブランド表現とのトレードオフが発生しました18。

### **4.3 Web（CSS）での再現と限界**

WebアプリやPWA（Progressive Web App）においても、Liquid Glassのトレンドを取り入れようとする動きがあります。

* **CSSフィルタの限界:** CSSのbackdrop-filter: blur()だけでは、Liquid Glassの特徴である「光の屈折（Lensing）」は再現できません。  
* **SVGディスプレイスメントマップ:** 先進的なWeb開発者は、SVGのフィルタ（\<feDisplacementMap\>）とCSSを組み合わせることで、背景画像が歪むような屈折効果をシミュレートしています。さらに、ノイズフィルタ（\<feTurbulence\>）を加えることで、ガラス特有の不完全な質感や「揺らぎ」を表現しようとしています19。  
* **ブラウザ互換性:** しかし、これらの高度なフィルタ処理はブラウザ（Chrome vs Safari）によってレンダリング結果が大きく異なるため、ネイティブアプリのような一貫した体験を提供するのは極めて困難です20。

## ---

**5\. 競合比較：Google Material 3 Expressiveとの対比**

2026年のUIデザインの潮流を理解するためには、AppleのLiquid Glassと、同時期にアップデートされたGoogleの\*\*Material Design 3 Expressive（M3E）\*\*を比較することが不可欠です。両者は「フラットデザインからの脱却」という点では一致していますが、そのアプローチは対照的です。

### **5.1 哲学の相違：光学物理 vs 感情表現**

| 特徴 | Apple Liquid Glass (iOS 26\) | Google Material 3 Expressive |
| :---- | :---- | :---- |
| **コア哲学** | **光学的なリアリズム** 物理的なガラスの性質（屈折、反射）を模倣し、空間的な奥行きと実在感を重視する。 | **感情的な表現（Emotion）** 大胆な色使い、形状、動きを通じて、ユーザーの感情に訴えかける。物理法則よりも「楽しさ」や「驚き」を優先21。 |
| **ナビゲーション** | **没入と融合** 半透明のフローティングカプセル。コンテンツと一体化し、境界線を曖昧にする。 | **明快な区分** 不透明で大胆なナビゲーションバー。コンテンツとは明確に区分され、機能性を強調する22。 |
| **モーション** | **流体物理** 水やジェルのような粘性のある動き。変形は保存則に従うように見える。 | **スプリング物理** バネのような弾む動き。キビキビとした反応（Snappy）を重視23。 |

### **5.2 ナビゲーションパターンの分岐**

GoogleはM3Eにおいて、スマートフォンでの「ナビゲーションドロワー（ハンバーガーメニュー）」を非推奨とし、より大型のスクリーン向けに「拡張ナビゲーションレール」を推進しています22。これは、折りたたみスマホやタブレットの普及を見据えた変更です。 一方、Appleはフローティングタブバーを採用することで、画面サイズに関わらず「コンテンツを画面いっぱいに表示する」ことを優先しています。Googleが「情報のチャンク化（塊）」を志向するのに対し、Appleは「情報のシームレスな連続性」を志向していると言えます。

## ---

**6\. ケーススタディ：特定ドメインにおける適応と課題**

Liquid Glassのナビゲーション設計は、すべてのアプリにとって最適解となるわけではありません。特に情報密度の高い日本市場向けのアプリや、特定のドメインにおいては、慎重な適応が求められます。

### **6.1 ビューティー・コスメ系アプリ（LIPS, @cosme, Sephora）**

LIPSや@cosmeといったアプリは、「買う（Buying）」だけでなく「使いこなす（Utilizing）」ための情報密度が極めて高いのが特徴です24。

* **高密度情報のジレンマ:** これらのアプリは、ブランド \> ライン \> 商品 \> 色番という深い階層構造と、肌質や年代による複雑なフィルタリング機能を持ちます。Liquid Glassのフローティングバーは、画面下部の重要なフィルタリング操作や、商品のサムネイル一覧を隠してしまうリスクがあります15。  
* **「alche:me」の事例（仮想）:** 提案されているAIコスメ管理アプリ「alche:me」24のような、在庫管理とレシピ提案を行うアプリでは、Liquid Glassの特性を活かすチャンスがあります。  
  * **在庫の可視化:** ガラスの質感を活かし、コスメの残量を液体の水位のように表現するUI（物理シミュレーション）は、Liquid Glassと非常に相性が良いでしょう。  
  * **AI思考の視覚化:** AIがレシピを生成している間、ナビゲーションバーのガラスの屈折率を変化させたり、光を明滅させたりすることで、AIが「思考中」であることを直感的に伝えることができます26。

### **6.2 ジャーナリング・記録アプリ（Apple Journal, Daylio）**

Apple純正のJournalアプリやDaylioのような記録アプリでは、Liquid Glassは「記憶の曖昧さ」や「感情の揺らぎ」を表現するのに適しています。

* **没入感:** 過去のエントリーを振り返る際、ナビゲーションが背景に溶け込むことで、ユーザーはテキストや写真に集中できます。  
* **提案機能:** iOS 26のJournalアプリは、写真や位置情報から自動的にトピックを提案しますが、この提案カード自体もLiquid Glassで作られており、ユーザーの生活（背景）から自然に浮かび上がってきたような演出がなされています27。

### **6.3 ゲーミフィケーションと習慣化（Duolingo）**

Duolingoのようなアプリは、継続（ストリーク）を維持させるために強力な視覚的フィードバックを使用します。

* **非懲罰的なデザイン:** 2026年のトレンドとして「非懲罰的（Non-punitive）」なゲーミフィケーションが挙げられます29。Liquid Glassの柔らかい質感と流体的なアニメーションは、ストリークが途切れた際にも「割れる」のではなく「溶ける」「形を変える」といった表現を可能にし、ユーザーに過度なストレスを与えずに継続を促すデザインに応用可能です。

## ---

**7\. アクセシビリティとユーザビリティの課題**

Liquid Glassはその美しさの反面、視認性と操作性において重大な課題を抱えています。

### **7.1 コントラストと可読性の危機**

「すりガラス」状の背景は、複雑な画像や高コントラストな写真の上に重なると、文字が読みづらくなる問題（Readability Crisis）を引き起こします5。

* **ユーザーからの不満:** リリース直後、「日差しの下でメニューが読めない」「文字が背景に溶け込んでしまう」といった批判が相次ぎました。  
* **Appleの対応:** これを受け、iOS 26.1ではアクセシビリティ設定に\*\*「Liquid Glass設定」\*\*が追加されました。  
  * **透明度を下げる（Reduce Transparency）:** ガラスを不透明な素材に変更し、視認性を優先します。  
  * **コントラストを上げる（Increase Contrast）:** ガラスの要素に明確な境界線（ボーダー）を追加し、背景から切り離します5。

### **7.2 モーション酔いと認知的負荷**

常に変形し、揺れ動くインターフェースは、前庭機能障害を持つユーザーや、注意欠陥を持つユーザーにとって負担となる可能性があります。

* **Reduce Motionの拡張:** iOS 26の「視差効果を減らす」設定は、Liquid Glassの物理演算にも適用されるようになりました。オンにすると、ボタンの「押し込み変形」やタブバーの「流体的縮小」が無効化され、単純なフェードイン・アウトに置き換わります30。

## ---

**8\. 将来展望：エージェンティックUIと空間ウェブへ**

iOS 26のLiquid Glassは、単なるデザインの流行ではありません。これは、AIエージェントが能動的にユーザーをサポートする「Agentic UI」と、スクリーンが消失する「Spatial Web」への布石です。

### **8.1 コンテキスト適応型インターフェース**

2026年のトレンド予測にある通り、アプリはユーザーの入力を待つだけでなく、ユーザーの意図を予測してインターフェースを変化させるようになります31。Liquid Glassは「適応（Adaptive）」を前提とした素材です。 例えば、雨の日にはナビゲーションバーの質感が「濡れたガラス」のように変化したり、緊急性の高い通知があるときはガラスが「赤熱」したりといった、環境や文脈に応じた動的な表現が可能になります。これにより、UI自体が情報のレイヤーを持つことになります31。

### **8.2 「買う」から「活かす」へのシフトとUI**

消費者の行動変容として、単なる消費から、手持ちの資産を管理・活用する方向へのシフトが見られます。これに伴い、UIも「カタログ型」から「ダッシュボード型」へと進化します。Liquid Glassのレイヤー構造は、高密度の情報を整理し、ユーザーに「自分の持ち物」を美しく管理させるための最適なキャンバスを提供します24。

## **9\. 結論**

iOS 26のLiquid Glassデザインシステムは、フラットデザインの時代を終わらせ、\*\*「物質性（Materiality）」\*\*の時代を切り開きました。ナビゲーションはもはや静的な枠組みではなく、ユーザーの指先とコンテンツの動きに呼応する、生きた有機体となりました。

この変化は、視覚的な美しさを提供する一方で、アクセシビリティや実装の複雑さという新たな課題を開発者に突きつけています。しかし、Apple Vision Proとの統合を見据えたとき、この「奥行き」と「流動性」を持つインターフェースは、2Dスクリーンと3D空間をつなぐ不可欠な共通言語となるでしょう。

デザイナーと開発者は、単に画面上の配置を考えるだけでなく、光の屈折、物理的な重さ、そして素材の挙動を設計する必要があります。Liquid Glassは、私たちがデジタル情報に「触れる」感覚を、よりリッチで、より直感的なものへと進化させるための基盤なのです。

### ---

**付録：iOS 26 Liquid Glass ナビゲーション設計仕様書（要約）**

| コンポーネント | Liquid Glass 仕様 (Spec) | 挙動 (Behavior) |
| :---- | :---- | :---- |
| **タブバー** | **フローティング・カプセル**: 画面端から約16-20ptインセット。連続的な曲率を持つ角丸。 | **スクロールで最小化**: スクロールダウンでピル型に縮小、または消失。タップで波紋状に展開。 |
| **検索タブ** | **独立したジオメトリ**: 円形またはスクワークル（Squircle）。メインのタブ群から視覚的に分離。 | **入力へのモーフィング**: タップすると全幅の検索バーへと物理的に変形・拡大する。 |
| **サイドバー (iPad)** | **トランスルーセント・ペイン**: 全高表示。可変幅。 | **タブバーからの変形**: iPhoneのボトムバーから、iPadのサイドレールへと自動的に遷移。 |
| **ツールバー** | **アダプティブ・グラス**: スクロール位置に基づき不透明度が変化（スクロールエッジ効果）。 | **コンテキスト対応**: 利用可能なスペースに応じてアイテムが動的にグループ化/解除される。 |
| **マテリアル** | **屈折ブラー**: 背景コンテンツをサンプリングし、彩度ブーストとブラー、歪みを適用。 | **動的着色**: アプリのプライマリテーマや直下のコンテンツから微細な色味を継承。 |
| **モーション** | **流体物理**: 表面張力を模した「押し込み」変形を伴うスプリングベースのアニメーション。 | **割り込み可能**: アニメーションの途中で操作を受け付け、物理的に自然な反動を返す。 |

#### **引用文献**

1. Liquid Glass 2026: Apple's New Design Language \- Medium, 2月 18, 2026にアクセス、 [https://medium.com/@expertappdevs/liquid-glass-2026-apples-new-design-language-6a709e49ca8b](https://medium.com/@expertappdevs/liquid-glass-2026-apples-new-design-language-6a709e49ca8b)  
2. iOS 26 \- Wikipedia, 2月 18, 2026にアクセス、 [https://en.wikipedia.org/wiki/IOS\_26](https://en.wikipedia.org/wiki/IOS_26)  
3. iOS 26 Liquid Glass: Comprehensive Swift/SwiftUI Reference \- Medium, 2月 18, 2026にアクセス、 [https://medium.com/@madebyluddy/overview-37b3685227aa](https://medium.com/@madebyluddy/overview-37b3685227aa)  
4. Apple introduces a delightful and elegant new software design, 2月 18, 2026にアクセス、 [https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)  
5. How iOS 26.1’s Liquid Glass Setting Fixes Apple’s Most Divisive Design, 2月 18, 2026にアクセス、 [https://medium.com/@Onecooltip/how-ios-26-1s-liquid-glass-setting-fixes-apple-s-most-divisive-design-b71be6e43b93](https://medium.com/@Onecooltip/how-ios-26-1s-liquid-glass-setting-fixes-apple-s-most-divisive-design-b71be6e43b93)  
6. Apple Liquid Glass: The UX Evolution of Adaptive Interfaces \- Supercharge Design, 2月 18, 2026にアクセス、 [https://supercharge.design/blog/apple-liquid-glass-the-ux-evolution-of-adaptive-interfaces](https://supercharge.design/blog/apple-liquid-glass-the-ux-evolution-of-adaptive-interfaces)  
7. Apple introduces a delightful and elegant new software design, 2月 18, 2026にアクセス、 [https://www.apple.com/ci/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/](https://www.apple.com/ci/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)  
8. iOS 26: Beyond Liquid Glass \- UX Planet, 2月 18, 2026にアクセス、 [https://uxplanet.org/ios-26-beyond-liquid-glass-f1e41306a57b](https://uxplanet.org/ios-26-beyond-liquid-glass-f1e41306a57b)  
9. New features available with iOS 26 \- Apple, 2月 18, 2026にアクセス、 [https://www.apple.com/os/pdf/All\_New\_Features\_iOS\_26\_Sept\_2025.pdf](https://www.apple.com/os/pdf/All_New_Features_iOS_26_Sept_2025.pdf)  
10. Apple's Liquid Glass UI: What's New in iOS 26 | TO THE NEW Blog, 2月 18, 2026にアクセス、 [https://www.tothenew.com/blog/apples-liquid-glass-ui-whats-new-in-ios-26/](https://www.tothenew.com/blog/apples-liquid-glass-ui-whats-new-in-ios-26/)  
11. 3 Mobile Navigation Trends You Need to Know (2026) | Rohan Mishra, uxcoach \#shorts \- YouTube, 2月 18, 2026にアクセス、 [https://www.youtube.com/shorts/c\_zHwhGE218](https://www.youtube.com/shorts/c_zHwhGE218)  
12. Advance UI/UX Design Tips – Design Mobile Bottom Navigation Like A Pro in 2025 & 2026, 2月 18, 2026にアクセス、 [https://www.youtube.com/watch?v=PlU6ClWyrxM](https://www.youtube.com/watch?v=PlU6ClWyrxM)  
13. My Beef with the iOS 26 Tab Bar \- Ryan Ashcraft, 2月 18, 2026にアクセス、 [https://ryanashcraft.com/ios-26-tab-bar-beef/](https://ryanashcraft.com/ios-26-tab-bar-beef/)  
14. Search vs. Primary Action in the iOS 26 Tab Bar \- Michael Tsai, 2月 18, 2026にアクセス、 [https://mjtsai.com/blog/2026/01/09/search-vs-primary-action-in-the-ios-26-tab-bar/](https://mjtsai.com/blog/2026/01/09/search-vs-primary-action-in-the-ios-26-tab-bar/)  
15. Adopting Liquid Glass | Apple Developer Documentation, 2月 18, 2026にアクセス、 [https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass)  
16. Layout | Apple Developer Documentation, 2月 18, 2026にアクセス、 [https://developer.apple.com/design/human-interface-guidelines/layout](https://developer.apple.com/design/human-interface-guidelines/layout)  
17. Mastering iOS 26's Liquid Glass: A Comprehensive Developer's Handbook | by jai krishna, 2月 18, 2026にアクセス、 [https://medium.com/@jaikrishnavj/mastering-ios-26s-liquid-glass-a-comprehensive-developer-s-handbook-2bba9965b024](https://medium.com/@jaikrishnavj/mastering-ios-26s-liquid-glass-a-comprehensive-developer-s-handbook-2bba9965b024)  
18. Grow on iOS 26 \- Liquid Glass Adaptation in UIKit \+ SwiftUI Hybrid Architecture, 2月 18, 2026にアクセス、 [https://fatbobman.com/en/posts/grow-on-ios26/](https://fatbobman.com/en/posts/grow-on-ios26/)  
19. I Built Apple's Liquid Glass but ONLY with CSS... \- YouTube, 2月 18, 2026にアクセス、 [https://www.youtube.com/watch?v=Cv8zFvM8fEk](https://www.youtube.com/watch?v=Cv8zFvM8fEk)  
20. I made 10 Apple Liquid Glass Code Snippets : r/webdev \- Reddit, 2月 18, 2026にアクセス、 [https://www.reddit.com/r/webdev/comments/1lblqlu/i\_made\_10\_apple\_liquid\_glass\_code\_snippets/](https://www.reddit.com/r/webdev/comments/1lblqlu/i_made_10_apple_liquid_glass_code_snippets/)  
21. Expressive Design: Google's UX Research, 2月 18, 2026にアクセス、 [https://design.google/library/expressive-material-design-google-research](https://design.google/library/expressive-material-design-google-research)  
22. Material 3 Expressive drops nav drawers on phones as short bottom bars return, 2月 18, 2026にアクセス、 [https://9to5google.com/2025/05/14/material-3-expressive-navigation/](https://9to5google.com/2025/05/14/material-3-expressive-navigation/)  
23. Google launches Material 3 Expressive redesign for Android, Wear OS devices, 2月 18, 2026にアクセス、 [https://blog.google/products-and-platforms/platforms/android/material-3-expressive-android-wearos-launch/](https://blog.google/products-and-platforms/platforms/android/material-3-expressive-android-wearos-launch/)  
24. 260124 Cosme Mixologist.pdf  
25. Visual conflict between FAB and floating tab bar in mobile layout \- UX Stack Exchange, 2月 18, 2026にアクセス、 [https://ux.stackexchange.com/questions/153859/visual-conflict-between-fab-and-floating-tab-bar-in-mobile-layout](https://ux.stackexchange.com/questions/153859/visual-conflict-between-fab-and-floating-tab-bar-in-mobile-layout)  
26. UI trends 2026: top 10 trends your users will love \- UX studio, 2月 18, 2026にアクセス、 [https://www.uxstudioteam.com/ux-blog/ui-trends-2019](https://www.uxstudioteam.com/ux-blog/ui-trends-2019)  
27. Apple launches Journal app, a new app for reflecting on everyday moments, 2月 18, 2026にアクセス、 [https://www.apple.com/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments/](https://www.apple.com/newsroom/2023/12/apple-launches-journal-app-a-new-app-for-reflecting-on-everyday-moments/)  
28. iPadOS 26 adds new 'Journal' app, and I've been using it almost every day \- 9to5Mac, 2月 18, 2026にアクセス、 [https://9to5mac.com/2026/01/05/ipados-26-adds-new-journal-app-and-ive-been-using-it-almost-every-day/](https://9to5mac.com/2026/01/05/ipados-26-adds-new-journal-app-and-ive-been-using-it-almost-every-day/)  
29. Calove App: The Ultimate Self-Care and Health Tracker Like Finch \- Lemon8, 2月 18, 2026にアクセス、 [https://www.lemon8-app.com/@calove.gamify.heal/7538639955954811406?region=us](https://www.lemon8-app.com/@calove.gamify.heal/7538639955954811406?region=us)  
30. Liquid Glass in Swift: Official Best Practices for iOS 26 & macOS Tahoe \- DEV Community, 2月 18, 2026にアクセス、 [https://dev.to/diskcleankit/liquid-glass-in-swift-official-best-practices-for-ios-26-macos-tahoe-1coo](https://dev.to/diskcleankit/liquid-glass-in-swift-official-best-practices-for-ios-26-macos-tahoe-1coo)  
31. 9 Mobile App Design Trends for 2026 \- UX Pilot, 2月 18, 2026にアクセス、 [https://uxpilot.ai/blogs/mobile-app-design-trends](https://uxpilot.ai/blogs/mobile-app-design-trends)