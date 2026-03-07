# **2025-2026年におけるARバーチャルメイクとジェネレーティブUIの融合：Sephora Virtual Artist、YouCam Makeup、および自律型エージェント「Cosme Mixologist」のUXデザインアーキテクチャに関する包括的研究**

## **1\. 序論：ビューティーテックにおけるパラダイムシフトと「コスメのパラドックス」**

2020年代半ばを迎え、ビューティーテクノロジー（Beauty Tech）の領域は、単なる視覚的なギミックから、消費者の意思決定プロセスを根本から変革するミッションクリティカルなインフラストラクチャへと進化を遂げた。かつて「試着の代替」として機能していた拡張現実（AR）は、今や生成AI（Generative AI）と融合し、高度な自律性を持つ「エージェンティックAI（Agentic AI）」へと昇華している。本報告書は、業界を牽引するSephora Virtual ArtistとYouCam Makeupの2025-2026年におけるUI/UXデザインフローを徹底的に分析し、さらに新たな潮流として出現した「Cosme Mixologist（alche:me）」プロジェクトが提唱する「ジェネレーティブUI」の実装戦略について詳述するものである。

### **1.1 背景：受動的検索から能動的提案への移行**

これまでのデジタルビューティー体験は、ユーザーが能動的に商品を検索し、ARで試すという「検索（Search）」主導のモデルであった。しかし、2025年の消費者は「コスメのパラドックス」と呼ばれる深刻な課題に直面している1。これは、消費者が大量の化粧品（在庫）を所有しているにもかかわらず、日々のメイクアップルーチンがマンネリ化し、多くの資産が「死蔵在庫（Dead Stock）」化している現象を指す。

この課題に対し、最新のUXデザインは「検索」から「提案（Proposal/Action）」へと重心を移している。ユーザーが問いかける前に、AIが天気、スケジュール（TPO）、そして手持ちの在庫データを分析し、「今日の一顔」を自律的に決定する。このシフトは、単なるUIの改善にとどまらず、ユーザーとプロダクトの関係性を再定義するものである。

### **1.2 技術的収束：AR、LLM、ジェネレーティブUI**

本分析における技術的基盤は、以下の3つの要素の収束にある。

1. **高精度ARトラッキング（High-Fidelity AR）：** L'OréalのModiFaceやPerfect CorpのAgileFaceに代表される、肌の質感や照明環境をリアルタイムで補正する技術2。  
2. **大規模言語モデル（LLM）による推論：** Gemini 1.5 ProやGPT-4oなどのモデルを用い、画像認識（Vision）と文脈理解（Reasoning）を組み合わせた高度な判断1。  
3. **ジェネレーティブUI（Generative UI）：** AIがユーザーの意図に合わせて、スライダー、比較カード、チュートリアルなどのUIコンポーネントを動的に生成・レンダリングする技術3。

本報告書では、これらの技術がどのように具体的なユーザー体験（UX）として実装されているか、SephoraとYouCamの事例比較、および「Cosme Mixologist」の設計思想を通じて解き明かす。

## ---

**2\. Sephora Virtual Artist：小売統合型UXの完成形と2026年の進化**

Sephora Virtual Artistは、単独のアプリ機能から、小売体験全体を包括する「バーチャルビューティーコンサルタント」へと進化を遂げた。2025-2026年のデザインフローは、購買意欲の喚起から決済までのフリクション（摩擦）を極限まで低減することに主眼が置かれている。

### **2.1 コア・インタラクションループとUIアーキテクチャ**

SephoraのUXにおける最大の特徴は、AR機能がアプリ内のあらゆるタッチポイントに「遍在」している点である。ユーザーは特別なモードに入ることなく、ショッピングの自然な流れの中でバーチャルメイクを利用する。

#### **2.1.1 エントリーポイントの多様化と「Inspire Me」**

2025年のUIでは、Virtual Artistへの導線が多層化されている。

* **商品詳細ページ（PDP）:** すべての対応商品において、商品画像カルーセルの目立つ位置に「Try It On（試着する）」ボタンが配置されている5。これは、ユーザーが色味や質感を確認したいと感じた瞬間に即座にアクセスできる設計であり、コンバージョン率の向上に直結している。  
* **「Inspire Me」セクション:** トレンドメイク（例：「Glass Skin」「Latte Makeup」）のビジュアルから、そのルックを構成する複数の商品を一括で試着できる機能である5。ここでは、個別の商品ではなく「完成形」を提示することで、セット買い（クロスセル）を促進するUXが構築されている。

#### **2.1.2 ライブカメラUIと「Swipe It. Shop It.」のゲーミフィケーション**

Sephoraは、Tinderなどのデーティングアプリで普及した「スワイプ」操作をeコマースに導入し、「Swipe It. Shop It.」という直感的なインターフェースを確立した6。

* **インタラクションフロー:** ユーザーはARで自分の顔に適用されたメイクアップを見る。気に入れば右にスワイプして「購入（またはお気に入り）」、気に入らなければ左にスワイプして「次のルック」へ進む。この高速な意思決定プロセスは、認知負荷を下げると同時に、ショッピングをエンターテインメント化（ゲーミフィケーション）する効果を持つ6。  
* **ビジュアルフィードバック:** スワイプ動作に合わせて、画面上には微細なアニメーションや触覚フィードバック（Haptic feedback）が実装され、ユーザーの操作に対する確かな応答感を提供する。

#### **2.1.3 「バーチャルアーム」とスウォッチ比較**

顔への適用だけでなく、Sephoraは「バーチャルアーム（Virtual Arm）」機能を提供している9。これは、ユーザーが自分の前腕をカメラにかざすと、その上に複数のリップスティックやアイシャドウの色見本（スウォッチ）がデジタルで表示される機能である。

* **UXの意図:** 実際の店舗でテスターを手に取り、手の甲や腕で色味を確認する行動様式（メンタルモデル）をデジタル上で再現している。これにより、顔全体への印象だけでなく、肌のトーンに対する純粋な発色を確認したいというニーズに応えている。  
* **比較機能:** 数百色のスウォッチを瞬時に並べて比較できるため、物理的なテスターでは不可能な「大量比較」を、汚れや手間なしに実現している。

### **2.2 テクノロジースタック：L'Oréal ModiFaceの統合**

Sephoraのバックエンドには、L'Oréal傘下のModiFace技術が深く統合されている10。

| 機能 | ModiFace技術の概要 | UXへの貢献 |
| :---- | :---- | :---- |
| **シェードキャリブレーション** | AIが周囲の照明環境を解析し、商品の色味を自動補正する11。 | 室内灯や自然光の違いによる「色の見え方の違い」を最小限に抑え、EC購入時の「色がイメージと違う」という返品リスクを低減する。 |
| **フェイシャルトラッキング** | 63点以上の顔の特徴点をリアルタイムで追跡する12。 | ユーザーが顔を動かしてもメイクがズレない高い追従性を実現し、没入感を損なわない。 |
| **テクスチャレンダリング** | グロス、マット、シマー、グリッターなどの質感を物理ベースレンダリング（PBR）で再現。 | 単なる色だけでなく、光の反射やラメの輝きまで再現することで、商品の「質感」に対する信頼性を高める。 |

### **2.3 チュートリアルと教育的UX**

Sephora Virtual Artistのもう一つの柱は、ARを用いた教育機能である。

* **オーバーレイガイド:** 「コントゥアリング」や「アイブロウ」など、技術が必要なメイクアップ手法について、ユーザーの顔の上に直接ガイドライン（どこに、どの方向にブラシを動かすか）を表示する9。  
* **ステップバイステップの進行:** ユーザーのペースに合わせて進行し、各ステップが完了すると視覚的なチェックマークなどでフィードバックを行う。これにより、動画を見ながら真似をする従来の方法と比較して、圧倒的に高い再現性をユーザーに提供する。

## ---

**3\. YouCam Makeup：SaaS型プラットフォームと「AI Beauty Agent」の革新**

Perfect Corpが提供するYouCam Makeupは、2026年において単なる試着アプリを超え、AIエージェントを中心とした総合ビューティープラットフォームへと進化している。そのUXは、ユーザーとの対話を通じた「共創（Co-creation）」に重点を置いている。

### **3.1 「AI Beauty Agent」による対話型インターフェース**

2026年のYouCamにおける最大のUX革新は、従来の階層型メニューを代替する「AI Beauty Agent」の実装である14。

#### **3.1.1 自然言語による意図解釈と提案**

ユーザーは、「冬の結婚式に参列する。ネイビーのドレスに合う、上品だけど華やかなメイクを教えて」といった抽象的なリクエストを投げかけることができる。AIエージェントはこの意図（Intent）を解析し、具体的なアクションに分解する。

* **意図の分解:** 「冬」→保湿力の高いベース、「結婚式」→崩れにくい・写真映え、「ネイビーのドレス」→クールトーンのアイシャドウとピンクベージュのリップ、といった論理的推論を行う。  
* **マルチモーダル入力:** テキストだけでなく、ドレスの写真や憧れのセレブリティの画像をアップロードすることで、そのスタイルを解析し、類似のメイクアップレシピを生成する1。

#### **3.1.2 占星術と「Manifestation Makeup」**

若年層（Gen Z、Alpha世代）をターゲットにしたユニークな機能として、「占星術メイク分析（Astrology Makeup Analysis）」が導入されている16。

* **コンセプト:** 顔の特徴分析と2026年の占星術トレンドを組み合わせ、「運気を上げるメイク」や「なりたい自分（Manifestation）」を実現するルックを提案する。  
* **UXデザイン:** 結果は単なる商品リストではなく、占星術的なモチーフやエフェクトが施された「Manifestation Card」として生成され、InstagramやTikTokへのシェアを強く意識したビジュアルとなっている。これにより、アプリの利用が「自己表現」や「願掛け」の儀式として位置づけられる。

### **3.2 構造的編集と「AI Facelift」**

YouCamはメイクアップ（色彩）だけでなく、顔や体の構造そのものを編集する機能においても業界をリードしている。

* **AI Facelift:** 「ワンタップ」でエイジングケア効果をシミュレーションする機能。たるみの引き上げや肌のハリを再現しつつ、不自然にならない範囲で「若々しい自分」を提示する17。  
* **Body TunerとAI Abs:** 顔だけでなく、全身のバランス調整や、AIによる腹筋（Abs）の追加など、フィットネスやボディイメージに関わる編集機能も強化されている17。これらの機能は、スライダー形式のUIで直感的に操作でき、即座に変化を確認できるため、ユーザーに強い「変身願望の充足」を提供する。

### **3.3 技術的優位性：AgileFaceトラッキング**

YouCamの体験を支えるのは、独自の\*\*AgileFace®\*\*トラッキング技術である2。

* **高密度メッシュ:** 3900以上のメッシュポイントを使用することで、競合技術比で200%以上のトラッキング安定性（ジッターフリー）を実現している。これにより、リップライナーやアイライナーといった、ミリ単位のズレが違和感に直結する繊細なメイクアップの再現が可能となっている。  
* **インクルーシブAI:** 多様な人種、肌色、年齢層のデータセットで学習されており、あらゆるユーザーに対して正確なライティングと色再現を保証する。これは、グローバル展開するブランドにとって不可欠な要件である18。

## ---

**4\. ジェネレーティブUI（GenUI）：静的インターフェースから動的生成へ**

2025-2026年のビューティーテックにおける最も重要な技術的転換点は、「ジェネレーティブUI（Generative UI / GenUI）」の実装である。これは、AIがユーザーの文脈に合わせて、その場で最適なUIコンポーネントを生成・表示する技術であり、従来のチャットボットの枠組みを大きく超えるものである。

### **4.1 静的UIとジェネレーティブUIの比較**

従来のUI設計（Imperative UI）と、ジェネレーティブUI（Declarative GenUI）の違いは、ユーザー体験の柔軟性に決定的な差をもたらす。

| 特徴 | 従来のUI (Static/Imperative) | ジェネレーティブUI (Generative/Declarative) | ビューティーテックにおける具体例 |
| :---- | :---- | :---- | :---- |
| **生成タイミング** | 開発時に事前に定義・コーディングされる。 | ランタイム（実行時）にAIが動的に生成する。 | 「デートメイク」と聞かれた時だけ、天気予報ウィジェットとセットになった提案カードを生成する。 |
| **柔軟性** | 固定されたレイアウトとフロー。 | 文脈に応じてレイアウトや要素が変化。 | ユーザーが「急いでいる」と言えば、詳細説明を省略し、3つのアイテムだけのチェックリストを表示する。 |
| **対話性** | テキストベースのチャット＋固定リンク。 | インタラクティブなコンポーネント（スライダー、ボタン）の埋め込み。 | チャット内で直接ファンデーションの色味を調整できるスライダーや、Before/After比較ツールが出現する。 |
| **技術基盤** | Reactコンポーネントの条件付きレンダリング。 | **A2UI**, **Vercel AI SDK (streamUI)**, **CopilotKit**。 | AIがJSON形式でUIの構造を記述し、フロントエンドがそれをレンダリングする19。 |

### **4.2 技術実装：A2UIプロトコルとVercel AI SDK**

このUXを実現するために、Googleの**A2UI (Agent-to-User Interface)** プロトコルやVercelのAI SDKが標準的に採用されつつある。

#### **4.2.1 A2UIプロトコルの仕組み**

A2UIは、AIエージェントがクライアントアプリに対して「何を表示すべきか」を宣言的に指示するためのJSONベースのプロトコルである19。

* **セキュリティ:** AIが任意のJavaScriptコードを実行するのではなく、あらかじめアプリ側で定義された安全なコンポーネント（カード、ボタン、カルーセルなど）の組み合わせのみを指定するため、UIインジェクション攻撃などのリスクを排除できる21。  
* **ストリーミング:** AIの推論プロセス（Thinking）と並行して、UIの骨組み（Skeleton）を表示し、データが生成され次第、中身を埋めていく「ストリーミングレンダリング」が可能である。これにより、ユーザーの体感待ち時間を大幅に短縮する21。

#### **4.2.2 Vercel AI SDKとstreamUI**

Webベースのアプリケーション（Next.jsなど）では、VercelのstreamUI機能が活用される。これにより、サーバーサイドのLLMが生成したReactコンポーネントを、クライアント側に直接ストリーム配信することが可能となる20。

* **ユースケース:** ユーザーが「乾燥肌向けのファンデーションを教えて」と尋ねると、テキストの回答が流れるだけでなく、推奨商品の購入ボタン付きカードや、色味比較のためのインタラクティブなチャートが、チャットのタイムライン上に動的に生成される。

### **4.3 「Cosme Mixologist」におけるジェネレーティブUIの応用**

後述する「Cosme Mixologist」の構想においても、この技術は中核をなす。ユーザーの「明日は雨だけどデート」という入力に対し、静的なリストではなく、以下のような動的ダッシュボードが生成されることが想定される。

1. **気象ウィジェット:** 降水確率と湿度を表示し、「湿気対策」が必要であることを視覚化。  
2. **レシピカード:** 「崩れないマット肌」を作るための具体的なアイテム（手持ち在庫から選定）と手順。  
3. **シミュレーションプレビュー:** 生成されたルックを適用したユーザーの顔画像（Gemini Imagenにより生成）。  
4. **不足アイテムの提案:** 「このルックを完成させるために、あと一つこれがあれば完璧」というOEM連携の商品カード。

## ---

**5\. ケーススタディ：「Cosme Mixologist (alche:me)」による自律型エージェントの実装**

提供された資料1に基づく「Cosme Mixologist（別名：Mirror Mirror / alche:me）」は、2026年のビューティーテックの到達点を示す具体的な青写真である。ここでは、その設計思想、エージェントアーキテクチャ、および実装ロードマップを詳細に分析する。

### **5.1 プロダクトビジョンと解決する課題**

このプロダクトは、「検索（Search）」から「行動（Action/Proposal）」へのパラダイムシフトを意図している。

* **課題（Pain）：** 「コスメのパラドックス（Cosmetic Paradox）」。平均的な女性は多数のコスメを所有しているが、組み合わせ方がわからず、毎日同じマンネリメイクに陥っている。また、毎朝の天気やTPOに合わせてメイクを考える「決断疲れ（Decision Fatigue）」が発生している1。  
* **解決策（Solution）：** 「錬金術（Alchemy）」をテーマにしたAIエージェント。手持ちの「死蔵在庫」を組み合わせ（Mix）、SNS上の「理想の顔」を再現するレシピを自律的に考案する。

### **5.2 16人のAIエージェントによる協調アーキテクチャ**

システムは単一のAIではなく、役割分担された16人の専門エージェント群（Squad）によって構成される1。

#### **5.2.1 コアエージェント（The Core Squad）**

1. **在庫管理クローク (Inventory Manager):**  
   * **機能:** ユーザーが撮影したポーチの中身やコスメの集合写真を、Gemini 1.5 Pro (Vision)を用いて解析。ブランド名、色番、残量、テクスチャ（マット/ツヤ）を識別し、即座にJSON形式の「資産台帳」を作成する1。  
   * **UX:** 面倒な手入力は不要。「写真を撮るだけ」でデータベース化が完了する体験。  
2. **調合の錬金術師 (The Cosmetic Alchemist):**  
   * **機能:** 本システムの頭脳。ユーザーが希望するルック（SNS画像など）と、手持ち在庫のベクトル（色相HSV、彩度、質感）を比較。「不足しているDiorの赤リップの代わりに、手持ちのちふれのブラウンにキャンメイクのオレンジグロスを重ねれば、90%近い色味が再現できる」といった「代用（Dupe）」と「重ね塗り（Layering）」のロジックを生成する1。  
   * **技術:** Vertex AI Vector Searchを用い、多次元ベクトル空間での類似性検索を行う1。  
3. **トレンド解析アナリスト (Trend Hunter):**  
   * **機能:** SNS上のトレンド画像を解析し、その魅力を構成する要素（「透け感のあるテラコッタ」「濡れツヤまぶた」など）を言語化・数値化して抽出する1。

#### **5.2.2 拡張エージェントとUX機能**

* **TPO・気象予報士:** Google CalendarとWeather APIから文脈を取得。「雨だから崩れにくいマット肌」「女性役員との商談だからトレンド感のあるテラコッタ」といった推論を行い、レシピを補正する1。  
* **未来の鏡 (The Simulator):** 提案されたレシピを適用した場合の顔を、Gemini 2.0 Flash Imageを用いて生成・プレビューする。これにより、ユーザーはメイクする前に仕上がりを確認し、失敗の恐怖（Terror Wall）を乗り越えることができる1。  
* **在庫鮮度ポリス:** コスメの開封日を記録し、使用期限切れを警告するSDGs・衛生管理機能1。

### **5.3 テクニカルスタックと実装ロードマップ**

資料1に基づく技術構成は、コスト効率とパフォーマンスのバランスを考慮したモダンな設計となっている。

* **フロントエンド:** **Next.js 16 (React 19\)** を採用したモバイルファーストPWA。毎朝の鏡の前での利用を想定し、ネイティブアプリに近い操作性とカメラアクセスを実現する。将来的にはReact NativeやFlutterへの移行も視野に入れている1。  
* **バックエンド:** **Google Cloud Run**上でFastAPIと**Google ADK Runner**を稼働させ、マルチエージェントのオーケストレーションを行う。  
* **AIモデル:**  
  * **推論・画像解析:** Gemini 1.5 Pro / Gemini 2.5 Flash。  
  * **画像生成（シミュレーション）:** **Gemini 2.0 Flash Image**。1枚あたり約$0.039という低コストで、高頻度のプレビュー生成を可能にする1。  
* **データ基盤:** **Cloud Storage**（画像保存）、**Firestore**（ユーザーデータ）、**BigQuery**（B2B分析用データウェアハウス）。将来的に**Vertex AI Vector Search**を導入し、感性検索（質感やニュアンスのマッチング）の精度を向上させる。

### **5.4 成功指標（KPI）**

* **在庫稼働率（Inventory Utilization Rate）:** 死蔵アイテムの30%を復活させること1。  
* **代用満足度（Substitution Satisfaction）:** 「買わなくて済んだ」「手持ちで再現できた」という体験の創出（目標80%）1。  
* **意思決定時間の短縮:** 朝のメイク時間を5分から1分未満へ短縮1。

## ---

**6\. 2026年のUXデザインパターンとベストプラクティス**

Sephora、YouCam、そしてCosme Mixologistの分析から導き出される、2026年におけるビューティーテックのUXデザイン標準は以下の通りである。

### **6.1 信頼のアーキテクチャ：照明と色の忠実性**

AR試着における最大の離脱要因は「実際の色と違う」ことである。

* **ダイナミック照明補正:** アプリは環境光の色温度（暖色/寒色）を検知し、レンダリングする商品の色味に逆補正をかける必要がある。暗すぎる場合は「照明を明るくしてください」というガイダンスUIを出すことが必須要件となる23。  
* **テクスチャの検証:** ユーザーはラメやツヤの質感を確認するために顔を動かす。UIは「顔を左右に振ってツヤを確認してください」といったマイクロコピーでこの動作を促し、PBR（物理ベースレンダリング）によるスペキュラ（反射光）の変化を見せるべきである24。

### **6.2 比較と検証のUXパターン**

* **Before/Afterスライダー:** ドラッグ可能なスライダーにより、適用前後の変化を直感的に比較できるUIは、効果の実感に不可欠である25。  
* **グリッドビュー:** 4分割画面などで、同系色の微妙な違い（ピンクベージュとコーラルベージュなど）を並べて比較できる機能は、意思決定を加速させる9。

### **6.3 ゲーミフィケーションと継続率（リテンション）**

Duolingoの成功事例26にならい、ビューティーアプリも「習慣化」のためのメカニクスを取り入れている。

* **ストリーク（連続記録）:** 「スキンケア連続記録」や「メイクログ記録」を可視化し、途切れさせたくない心理（損失回避）を刺激する26。  
* **バッジと実績:** 「リップマニア」「早起きメイク」などのバッジを付与し、探索行動を報酬化する27。  
* **ソーシャルリーグ:** レビュー投稿数や試着数などでユーザーをランク付けし、コミュニティ内の健全な競争を促す28。

### **6.4 ローディングと待機時間のデザイン**

ジェネレーティブAIによる生成には数秒のレイテンシが発生する場合がある。

* **スケルトンスクリーン:** 空白の画面ではなく、UIの骨組み（スケルトン）を先に表示し、体感速度を向上させる29。  
* **Thinking Indicator:** 「AIが天気を確認中…」「在庫からベストなリップを選定中…」といったプロセスをテキストで表示することで、待ち時間を「価値ある処理時間」として演出する（労働の幻想効果）1。

## ---

**7\. 結論と将来展望：自律型ビューティーアドバイザーの時代へ**

2025年から2026年にかけてのビューティーテックは、**AgileFaceによる高精度トラッキング**、**ジェネレーティブUIによる動的体験**、そして**エージェンティックAIによる文脈理解**が融合し、かつてない高度な体験を提供し始めている。

「Cosme Mixologist」の事例が示すように、これからの勝者は「最も多くの商品を並べるアプリ」ではなく、「ユーザーの文脈（コンテキスト）を最も深く理解し、手持ちの資産（在庫）を最適化できるエージェント」である。ビジネスモデルは、単なる商品の販売から、ユーザーのライフスタイル全体の最適化（Service-Dominant Logic）へと移行している。

### **戦略的提言**

1. **ジェネレーティブUIの採用:** 固定的なUIから脱却し、A2UIなどのプロトコルを用いて、ユーザーの対話に応じて変化する流動的なインターフェースを構築すること。  
2. **ベクトル検索への投資:** 商品を単なるキーワードではなく、色・質感・成分の多次元ベクトルとして管理し、AIによる高度なマッチング（Alchemy）を実現すること。  
3. **ゲーミフィケーションの統合:** 毎日のメイクアップをタスクではなく「楽しみ」に変えるため、ストリークやバッジなどのリテンション施策を組み込むこと。  
4. **コンテキストファースト:** 天気、予定、気分などの外部データを能動的に取り込み、ユーザーが言語化する前にニーズを先回りする提案を行うこと。

この「自律型ビューティーアドバイザー」の確立こそが、2026年以降のデジタルビューティー市場における覇権を握る鍵となるだろう。

#### **Works cited**

1. 260124 Cosme Mixologist.pdf  
2. BrandXR Research Report: How Beauty Brands Are Using AR Mirrors to Increase Sales, accessed February 18, 2026, [https://www.brandxr.io/research-report-how-beauty-brands-are-using-ar-mirrors-to-increase-sales](https://www.brandxr.io/research-report-how-beauty-brands-are-using-ar-mirrors-to-increase-sales)  
3. 15 examples of what Gemini 3 can do \- Google Blog, accessed February 18, 2026, [https://blog.google/products-and-platforms/products/gemini/gemini-3-examples-demos/](https://blog.google/products-and-platforms/products/gemini/gemini-3-examples-demos/)  
4. Introducing A2UI: An open project for agent-driven interfaces \- Google for Developers Blog, accessed February 18, 2026, [https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/](https://developers.googleblog.com/introducing-a2ui-an-open-project-for-agent-driven-interfaces/)  
5. Sephora's Virtual Artist brings augmented reality to large beauty audience | Retail Dive, accessed February 18, 2026, [https://www.retaildive.com/ex/mobilecommercedaily/sephoras-virtual-artist-brings-augmented-reality-to-larger-beauty-audience](https://www.retaildive.com/ex/mobilecommercedaily/sephoras-virtual-artist-brings-augmented-reality-to-larger-beauty-audience)  
6. Sephora borrows from Tinder's playbook with swipeable mobile shopping tools | Retail Dive, accessed February 18, 2026, [https://www.retaildive.com/ex/mobilecommercedaily/sephora-borrows-from-tinders-playbook-with-swipeable-mobile-shopping-tools](https://www.retaildive.com/ex/mobilecommercedaily/sephora-borrows-from-tinders-playbook-with-swipeable-mobile-shopping-tools)  
7. Sephora Improves Mobile Shopping With Tinder-Inspired Feature | by IPG Media Lab, accessed February 18, 2026, [https://medium.com/ipg-media-lab/sephora-improves-mobile-shopping-with-tinder-inspired-feature-bff646604c5a](https://medium.com/ipg-media-lab/sephora-improves-mobile-shopping-with-tinder-inspired-feature-bff646604c5a)  
8. 7 Ways to Use Gamification in Retail Industry \[With Examples\] \- 99minds, accessed February 18, 2026, [https://www.99minds.io/blog/gamification-in-retail-industry](https://www.99minds.io/blog/gamification-in-retail-industry)  
9. Sephora Virtual Artist: Try On Makeup Instantly, accessed February 18, 2026, [https://www.sephora.my/pages/virtual-artist](https://www.sephora.my/pages/virtual-artist)  
10. 10 Ways Sephora is Using AI \[Case Study\] \[2026\] \- DigitalDefynd Education, accessed February 18, 2026, [https://digitaldefynd.com/IQ/sephora-using-ai-case-study/](https://digitaldefynd.com/IQ/sephora-using-ai-case-study/)  
11. L'Oréal's Modiface Brings AI-powered Virtual Makeup Try-on To Amazon, accessed February 18, 2026, [https://www.loreal.com/en/articles/science-and-technology/l-oreal-modiface-brings-ai-powered-virtual-makeup-try-ons-to-amazon/](https://www.loreal.com/en/articles/science-and-technology/l-oreal-modiface-brings-ai-powered-virtual-makeup-try-ons-to-amazon/)  
12. Try Makeup Online \- Virtual Try-On Tool \- L'Oréal Paris, accessed February 18, 2026, [https://www.lorealparisusa.com/virtual-try-on-makeup](https://www.lorealparisusa.com/virtual-try-on-makeup)  
13. Sephora adds features, tutorials to Virtual Artist app | Retail Dive, accessed February 18, 2026, [https://www.retaildive.com/news/sephora-adds-features-tutorials-to-virtual-artist-app/422173/](https://www.retaildive.com/news/sephora-adds-features-tutorials-to-virtual-artist-app/422173/)  
14. YouCam Makeup: Face Editor \- App Store \- Apple, accessed February 18, 2026, [https://apps.apple.com/us/app/youcam-makeup-face-editor/id863844475](https://apps.apple.com/us/app/youcam-makeup-face-editor/id863844475)  
15. Perfect Corp. Launches YouCam AI Beauty Agent in YouCam Makeup App to Lead the Next Generation of Conversational AI in Beauty, Skincare and Fashion \- Business Wire, accessed February 18, 2026, [https://www.businesswire.com/news/home/20251110601035/en/Perfect-Corp.-Launches-YouCam-AI-Beauty-Agent-in-YouCam-Makeup-App-to-Lead-the-Next-Generation-of-Conversational-AI-in-Beauty-Skincare-and-Fashion](https://www.businesswire.com/news/home/20251110601035/en/Perfect-Corp.-Launches-YouCam-AI-Beauty-Agent-in-YouCam-Makeup-App-to-Lead-the-Next-Generation-of-Conversational-AI-in-Beauty-Skincare-and-Fashion)  
16. YouCam Apps Rings in 2026: AI-Powered "New Year, New You" Features to Upgrade Your Holiday Social Feed \- Perfect Corp., accessed February 18, 2026, [https://www.perfectcorp.com/business/news/youcam-apps-new-year-2026](https://www.perfectcorp.com/business/news/youcam-apps-new-year-2026)  
17. YouCam Makeup: Face Editor \- App Store \- Apple, accessed February 18, 2026, [https://apps.apple.com/bw/app/youcam-makeup-face-editor/id863844475](https://apps.apple.com/bw/app/youcam-makeup-face-editor/id863844475)  
18. CASE STUDY How virtual try-on tools boosted customer engagement at M·A·C Cosmetics, accessed February 18, 2026, [https://internetretailing.net/case-study-how-virtual-try-on-tools-boosted-customer-engagement-at-mac-cosmetics-23642/](https://internetretailing.net/case-study-how-virtual-try-on-tools-boosted-customer-engagement-at-mac-cosmetics-23642/)  
19. A2UI: The Protocol for Agent-Driven Interfaces That Works with Your Design System | by Chris McKenzie | Jan, 2026, accessed February 18, 2026, [https://medium.com/@kenzic/a2ui-the-protocol-for-agent-driven-interfaces-that-works-with-your-design-system-bc7c05276513](https://medium.com/@kenzic/a2ui-the-protocol-for-agent-driven-interfaces-that-works-with-your-design-system-bc7c05276513)  
20. Creating an AI Summary App with Next.js | Vercel Academy, accessed February 18, 2026, [https://vercel.com/academy/ai-summary-app-with-nextjs](https://vercel.com/academy/ai-summary-app-with-nextjs)  
21. A2UI, accessed February 18, 2026, [https://a2ui.org/](https://a2ui.org/)  
22. A Practical Guide to Using Vercel AI SDK in Next.js Applications \- Telerik.com, accessed February 18, 2026, [https://www.telerik.com/blogs/practical-guide-using-vercel-ai-sdk-next-js-applications](https://www.telerik.com/blogs/practical-guide-using-vercel-ai-sdk-next-js-applications)  
23. Best 11 AR beauty try-on software in 2026 \- GlamAr, accessed February 18, 2026, [https://www.glamar.io/blog/best-ar-beauty-try-on](https://www.glamar.io/blog/best-ar-beauty-try-on)  
24. UX in Augmented Reality Retail: The Ultimate Try-Before-You-Buy Experience \- Medium, accessed February 18, 2026, [https://medium.com/@blessingokpala/ux-in-augmented-reality-retail-the-ultimate-try-before-you-buy-experience-67dea9ac247b](https://medium.com/@blessingokpala/ux-in-augmented-reality-retail-the-ultimate-try-before-you-buy-experience-67dea9ac247b)  
25. How to setup a Before After Compare Slider \- YouTube, accessed February 18, 2026, [https://www.youtube.com/watch?v=J0eU66LRuro](https://www.youtube.com/watch?v=J0eU66LRuro)  
26. How Duolingo uses gamification to improve user retention (+ 5 winning tactics) \- StriveCloud, accessed February 18, 2026, [https://strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo](https://strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)  
27. Challenges | Duolingo Wiki \- Fandom, accessed February 18, 2026, [https://duolingo.fandom.com/wiki/Challenges](https://duolingo.fandom.com/wiki/Challenges)  
28. League \- Duolingo Wiki \- Fandom, accessed February 18, 2026, [https://duolingo.fandom.com/wiki/League](https://duolingo.fandom.com/wiki/League)  
29. Everything you need to know about skeleton screens | by Bill Chung \- UX Collective, accessed February 18, 2026, [https://uxdesign.cc/what-you-should-know-about-skeleton-screens-a820c45a571a](https://uxdesign.cc/what-you-should-know-about-skeleton-screens-a820c45a571a)  
30. Skeleton loading screen design — How to improve perceived performance, accessed February 18, 2026, [https://blog.logrocket.com/ux-design/skeleton-loading-screen-design/](https://blog.logrocket.com/ux-design/skeleton-loading-screen-design/)