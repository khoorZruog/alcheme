# **戦略的ゲーミフィケーション分析：Duolingo (2024-2026) の進化と美容AI「alche:me」への応用フレームワーク**

## **エグゼクティブ・サマリー**

本レポートは、世界的な言語学習プラットフォームDuolingoが2024年から2026年にかけて実施したゲーミフィケーション戦略の大規模な転換を詳細に調査し、その知見を美容AIアプリケーション「alche:me」の習慣化設計に応用するための包括的な提案書である。

調査の結果、Duolingoの戦略は「個人の競争（リーグ戦）」への依存から、「社会的説明責任（フレンドストリーク）」および「非懲罰的な継続支援（エネルギー制）」へと大きくシフトしていることが判明した。特に2025年に導入された「エネルギー（Energy）」システムは、従来の「ハート（Hearts）」システムが抱えていた学習者への懲罰的側面を排除し、行動そのものを報酬化する画期的な転換点であった。また、AIキャラクター（LilyやFalstaff）を用いたパラソーシャルな関係性の構築が、リテンション（継続率）の向上に不可欠な要素となっている。

本レポートでは、これらの成功事例を「alche:me」が掲げる「化粧品在庫の錬金術（Cosmetic Alchemy）」というビジョンに適合させ、「コスメのパラドックス（資産はあるが活用できない状態）」を解消するための具体的な機能実装案を提示する。具体的には、在庫活用を可視化する「ビューティー・ストリーク」、意思決定コストを低減する「錬金エネルギー（Glow）」、そして16人のAIエージェントによる人格的介入を含む、包括的な行動変容システムを設計する。

## ---

**第1章 Duolingoのゲーミフィケーション戦略の進化 (2024-2026)**

Duolingoが2024年から2026年にかけて展開したプロダクトアップデートは、単なる機能追加ではなく、ユーザーの心理的安全性と社会的接続性を強化するための意図的な構造改革であった。本章では、主要なメカニクスごとにその変遷と心理的効果を分析する。

### **1.1 リテンション・エンジンの進化：ストリークの多層化**

「ストリーク（連続記録）」はDuolingoの根幹をなす機能であるが、2024年以降、単なる「継続日数」の表示から、ユーザーのアイデンティティを形成する多層的なロイヤルティ・プログラムへと進化した。

#### **1.1.1 ストリーク・ソサエティ（Streak Society）の特権化と階層構造**

2025年時点において、ストリーク・ソサエティは、かつての365日達成者限定のクラブから、より早期にユーザーをフックするための段階的な報酬システムへと再設計された 1。

| 達成日数 | 報酬内容 | 心理的効果・狙い | 参照元 |
| :---- | :---- | :---- | :---- |
| **7日** | Super Duolingo（有料版）3日間無料体験 | **初期の参入障壁除去**。 有料機能の価値を早期に体験させ、フリーミアムモデルへの移行を促す。 | 1 |
| **30日** | 専用アプリアイコン（炎のデザイン） | **外的シグナリング**。 スマホのホーム画面上で「自分は継続している」という自己効力感を視覚化する。 | 1 |
| **100日** | ストリークフリーズ所持上限の拡大（2→5個） | **損失回避の強化**。 長期ユーザーほど「失う痛み」が大きいため、安全網を厚くし、不慮の事故による離脱を防ぐ。 | 1 |
| **365日** | VIPステータスの付与（リーダーボードでの表示） | **社会的地位の確立**。 他者に対して優位性を示し、エリート意識を醸成する。 | 1 |

**分析：**

この階層構造は、ユーザーが直面する「中だるみ」を防ぐために極めて有効である。特に100日目における「フリーズ上限の拡大」は、長期継続者が最も恐れる「1日のミスで全てを失うリスク」をシステム側が能動的に軽減する施策であり、ユーザーの心理的負担を巧みにコントロールしている。

#### **1.1.2 フレンドストリーク（Friend Streaks）：説明責任の分散**

2024年後半から2025年にかけて導入された「フレンドストリーク」は、個人の孤独な戦いを「共有されたコミットメント」へと変革した 6。

* **メカニズム:** ユーザーは最大5人の友人と個別にストリークを共有できる。双方がその日のレッスンを完了しない限り、共同ストリークは加算されない。  
* **ナッジ（Nudge）機能:** 未実施の友人に対して、アプリ内から「つつく（Nudge）」通知を送ることができる。これは、システムからの無機質な通知よりも、友人からの社会的圧力の方が行動変容を促す力が強いという行動経済学の知見に基づいている。  
* **データ:** 共有ストリークを持つユーザーは、日々のレッスン完了率が22%高いという結果が出ている 7。

### **1.2 経済圏のパラダイムシフト：「ハート」から「エネルギー」へ**

2025年、Duolingoは長年維持してきた「ハート（Hearts）」システムから、新たな「エネルギー（Energy）」システムへの移行テストを開始した 8。これは「懲罰（Punishment）」から「機会（Opportunity）」への哲学的な転換を意味する。

#### **1.2.1 懲罰的設計の限界**

従来のハート制では、無料ユーザーはミスをするたびにハートを失い、5回ミスをすると学習が強制終了された。

* **初心者の排除:** データによると、初心者は中級者の2倍の確率でレッスン中にハートを使い果たしていた 8。これは「学習意欲はあるがスキルが追いつかない」層をシステム的に排除する結果となっていた。  
* **学習の委縮:** ハートを失うことを恐れ、ユーザーは難しいレッスンを避け、簡単な復習に逃げる傾向があった。

#### **1.2.2 エネルギー制（バッテリー）のロジック**

エネルギー制では、ミスではなく「行動量」がコストとなる 8。

* **消費ルール:** レッスンを開始する際、正解・不正解にかかわらず一定のエネルギーを消費する。  
* **回復メカニズム:** レッスン中に「連続正解（Streak）」を出すことで、その場でエネルギーが回復する。  
* **非懲罰的復習:** レッスン終了後のミス復習はエネルギーを消費しない 8。

**戦略的示唆:** この変更により、Duolingoは「失敗に対するペナルティ」を撤廃し、「フロー状態（連続正解）」に対する報酬を強化した。これはユーザーに対し、「間違えても良いが、集中して取り組めばもっと長く遊べる」というメッセージを送るものであり、学習の質とアプリ滞在時間の双方を向上させる設計である。一部の長期ユーザーからは「無限に学習できなくなった」との不満も出たが 9、大衆層のリテンションにはプラスに作用している。

### **1.3 社会的競争の最適化：リーグとトーナメント**

個人の継続を支えるのがストリークなら、短期的な熱狂を生み出すのがリーグ機能である。2024-2026年にかけて、このシステムはより「過酷」かつ「中毒性」の高いものへと調整された。

#### **1.3.1 リーグサイズの縮小と降格圏の拡大**

最上位のダイヤモンドリーグを含む主要リーグにおいて、参加人数が30人から20人へと縮小されたケースが確認されている 10。同時に「降格ゾーン（Demotion Zone）」が拡大し、中間層（維持ゾーン）が極端に狭まった 10。

* **意図:** 安全地帯をなくすことで、ユーザーに「昇格を目指す」か「降格を避ける」かの二者択一を迫る。これにより、漫然とアプリを利用する層（Accessory Users）を排除し、競争に参加する層（Core Users）のエンゲージメント密度を高めている。

#### **1.3.2 ダイヤモンド・トーナメントの常設化**

ダイヤモンドリーグの上位入賞者（トップ10）のみが参加できる「ダイヤモンド・トーナメント」が、準々決勝・準決勝・決勝の3週間にわたるイベントとして定着した 12。これは、通常リーグでは物足りなくなったヘビーユーザーに対する「エンドコンテンツ」として機能している。

#### **1.3.3 フレンズクエストのユニバーサル・マッチング**

2025年のアップデートで、友人がいないユーザーでも「フレンズクエスト」に参加できるユニバーサル・マッチングシステムが導入された 13。

* **包括性:** これにより、リアルの友人がいないユーザーも「協力プレイ」の報酬（XPブースト等）を得られるようになり、機会損失による離脱を防いでいる。

### **1.4 AIとキャラクターによる没入感の強化**

Duolingoの最大の特徴は、無機質な学習アプリではなく、個性豊かなキャラクターたちとの「関係性」を構築している点にある。

#### **1.4.1 ビデオ通話機能（Video Call with Lily/Falstaff）**

2024年のDuoconで発表され、2025年にAndroidにも拡大された「リリーとのビデオ通話」は、AIとの自由会話機能である 13。

* **人格の活用:** 無気力で皮肉屋の**Lily**や、尊大な熊の**Falstaff**といったキャラクター設定をAIのプロンプトに厳密に反映させている。ユーザーは「英語を練習する」のではなく、「Lilyと話す」という体験をする。  
* **ゲーミフィケーション:** 通話の長さや返答の質に応じてXPが付与される設計となっており、会話すらもスコア化されている 13。

#### **1.4.2 通知のパーソナライゼーション（Bandit Algorithm）**

Duolingoは「バンディットアルゴリズム」を使用し、どのキャラクターの、どのトーンのメッセージが最もユーザーを呼び戻すかを学習している 15。

* **Lily:** 「あんたが練習しなくても私は気にしないけど…（嘘だけど）」といったツンデレ的アプローチ。  
* **Duo:** 直球の「寂しいよ！」という感情的訴求。  
* **Falstaff:** 「規律を守れ」という威圧的メッセージ。  
  これにより、通知は単なるリマインダーではなく、キャラクターからの「個人的な手紙」としての性質を帯びる。

### **1.5 社会的証明：LinkedIn連携とDuolingo Score**

2025年、Duolingoは**Duolingo Score**をLinkedInのプロフィールに直接表示できる機能を実装した 17。

* **実利的な動機付け:** これまで「ゲーム」として見られがちだったDuolingoの活動を、「キャリアアップのための資産」として再定義した。CEFR（ヨーロッパ言語共通参照枠）に準拠したスコアを表示することで、ユーザーは就職や転職のためにアプリを継続する動機を得る。これは「内発的動機（学びたい）」と「外発的動機（評価されたい）」のハイブリッド戦略である。

## ---

**第2章 「alche:me」の現状分析と課題**

**alche:me**は、物流の在庫最適化ロジックを美容に応用し、手持ちのコスメ（資産）から最大限の価値（美）を引き出すことをビジョンとするAIプロダクトである。提供されたPRDおよび設計書に基づき、現状のゲーミフィケーション要素と課題を整理する。

### **2.1 コア・ビジョンと「コスメのパラドックス」**

* **ビジョン:** 「Alchemy（錬金術）＋ Me（私）」。手持ちのコスメを組み合わせることで、新しい自分に出会う 19。  
* **課題（Pain）:** 「コスメのパラドックス」。資産（コスメ）は大量にあるが、稼働率が低く、毎朝の意思決定に疲弊している状態。また、使っていないコスメに対する罪悪感（Dead Stock Guilt）が存在する 19。  
* **解決策:** 「検索」から「提案」へのシフト。16人のAIエージェントチームが、ユーザーに代わって最適な組み合わせを思考し、提案する。

### **2.2 現状のゲーミフィケーション要素（Phase 1時点）**

設計書およびUI仕様書から確認できる既存の要素は以下の通りである 19。

* **レアリティ演出:** スキャン時にアイテムをSSR（金）、SR（紫）、R（青）、N（灰）にランク付けし、ガチャのような演出で表示する。  
* **コスメスペック（Stats）:** 「発色力」「持続力」「ナチュラルさ」をレーダーチャートやステータスバーで可視化。  
* **プロフィール完了率:** LIPS風の完了バッジ。  
* **エージェントテーマ:** 「標準」「ギャル」「お姉さん」など、AIの人格を切り替える機能。

### **2.3 構造的な欠落点（The Action Gap）**

Duolingoと比較した際、alche:meには以下の「習慣化ループ」が不足している。

1. **毎日のトリガーの欠如:** 「新しいレシピを作る」以外にアプリを開く理由が弱い。メイクは毎朝行うルーチンだが、アプリを開かなくてもメイクはできるため、アプリへの依存度が低い。  
2. **社会的説明責任の不在:** 現状のSNS機能は「見せる」ことが中心であり、「互いに継続を支え合う」メカニズム（フレンドストリーク等）が弱い。  
3. **罪悪感の転換:** 「死蔵在庫」に対する罪悪感を、ポジティブなアクション（錬金）に転換する即時的な報酬フィードバックが不足している。

## ---

**第3章 戦略的提案：「美の錬金サイクル」の構築**

Duolingoの成功事例（ストリーク、エネルギー、社会的連携、キャラクター）を美容文脈に翻訳し、alche:meの「在庫活用」というコア価値を最大化するための応用案を提案する。

### **3.1 提案①：習慣の可視化「ビューティー・ストリーク」と「資産カレンダー」**

Duolingoのストリークを「学習の継続」から「美の資産運用」へと再定義する。単にアプリを開くだけでなく、\*\*「自分の顔（資産）に投資したこと」\*\*を記録する。

#### **3.1.1 「Look Log（本日の錬金記録）」**

* **メカニズム:** ユーザーは毎朝、その日使ったコスメ（またはAIが提案したレシピ）をワンタップで記録する。写真投稿は必須とせず、「このリップとアイシャドウを使った」というログだけでOKとする（ハードルを下げる）。  
* **ビューティー・カレンダー:** 19にある「Beauty Log」を拡張し、カレンダー上を埋めていく快感を提供する。メイクをしなかった日は「Skin Fasting（肌断食）」として記録可能にし、ストリークを途切れさせない（Duolingoのフリーズと同様の概念だが、美容文脈ではポジティブな休養として定義する）。

#### **3.1.2 「アルケミスト・サークル（Alchemist's Circle）」**

Duolingoの「Streak Society」を模した、継続ユーザー向けの会員制度 1。

* **加入条件:** 7日間連続で「Look Log」を記録する。  
* **ティア報酬:**  
  * **Day 7 (見習い錬金術師):** アプリアイコン変更権（ゴールドカラーのalche:meアイコン）。  
  * **Day 30 (熟練工):** エージェントテーマ「専属メイクアップアーティスト」の解放。  
  * **Day 100 (賢者の石):** 「ストリーク・フリーズ」の所持上限アップ（肌トラブル時などに使用）。  
* **心理効果:** 「私は毎日自分のケアを怠らない人間である」というアイデンティティを確立させる。

### **3.2 提案②：非懲罰的在庫活性化「GLOW（輝き）システム」**

Duolingoの「エネルギー制」を応用し、**「意思決定コスト」を通貨として管理する**システムを導入する。Duolingoが「学習量」を制限したのとは逆に、alche:meは「高度な思考（AIの推論）」にコストを持たせることで、ユーザーのデータ入力を促す。

#### **3.2.1 コンセプト：「輝き（GLOW）」の循環**

* **GLOW（エネルギー）:** ユーザーが保持するリソース。高度なAIレシピ生成（例：「今日の天気と服装に合わせた完璧なデートメイク」）を行う際に消費する。  
* **回復アクション（Input）:** 時間経過での回復に加え、\*\*「在庫のメンテナンス」\*\*を行うことでGLOWが即時回復する。  
  * 新しいコスメをスキャン登録する：+10 GLOW  
  * 30日以上使っていない「死蔵コスメ」を使ってログを記録する：+20 GLOW（ボーナス）  
  * アイテムの「残量」データを更新する：+5 GLOW  
* **狙い:** 「良い提案（Output）」を得るためには、「データのメンテナンス（Input）」が必要であるというループを作る。これにより、面倒な在庫管理が「次の錬金のための燃料補給」という意味を持つゲームに変わる。これはDuolingoの「練習してハートを回復する（あるいは正解してエネルギーを回復する）」メカニズムの応用である。

### **3.3 提案③：社会的錬金術「レシピ交換」と「Bestie Streak」**

Duolingoの「Universal Matching」と「Friend Streaks」を取り入れ、孤独な鏡の前の時間をコミュニティ体験に変える。

#### **3.3.1 ユニバーサル・レシピ・クエスト**

* **仕組み:** 週に一度、**Profiler Agent** 19 がユーザーの「肌質・パーソナルカラー・好みの傾向」が似ている他ユーザー（ドッペルゲンガー）を自動的にマッチングする。  
* **クエスト内容:** 「今週は、お互いのポーチにある『オレンジ系のチーク』を使ったメイクを1回ずつ実践しよう！」  
* **報酬:** クエストを達成すると、相手が持っているが自分が持っていないアイテムの「使用感レビュー」や、限定の「トレンド解析レポート」が閲覧できる。  
* **狙い:** 友人がいなくても参加でき、「自分と似た属性の人がどう使いこなしているか」という強い興味（知る欲求）を刺激する。

#### **3.3.2 Bestie Streak（ベスティ・ストリーク）**

* **仕組み:** リアルな友人と1対1で結ぶ契約。「お互いに毎朝（または夜のスキンケアで）、何かしらのケアを行ったことを報告し合う」。  
* **通知（Nudge）:** 「Eriさんがまだ今朝のメイクを完了していません。背中を押してあげましょう（Nudge）！」  
* **効果:** メイクやスキンケアはサボりがちだが、友人の連続記録を止めてしまうというプレッシャー（社会的責任）が継続を強制する。

### **3.4 提案④：16人のエージェントによる人格的介入（Persona Notification）**

DuolingoのLilyやFalstaffの成功 15 に倣い、alche:meの16人のエージェント 19 に明確な役割と「声」を与え、通知（Push）をエンターテインメント化する。

| エージェント | 役割 | Duolingo対応 | 通知メッセージ例（トーン＆マナー） |
| :---- | :---- | :---- | :---- |
| **Concierge** (コンシェルジュ) | 総合窓口 | **Duo** (Owl) | **【親切・励まし】** 「おはようございます、Eriさん！今日は雨ですね。崩れにくいベースメイクのレシピ、準備できてますよ✨」 |
| **Inventory Manager** (在庫管理クローク) | 在庫管理 | **Falstaff** (Bear) | **【実務的・警告】** 「おい、ポーチの奥のDiorのリップ、開封から1年経つぞ。今週使わないなら、もう捨てることになるが…いいのか？」 *(損失回避を刺激)* |
| **Cosmetic Alchemist** (調合の錬金術師) | レシピ生成 | **Lily** (Girl) | **【皮肉・挑戦】** 「またそのブラウンのアイシャドウ？飽きないの？ 私ならもっと面白い組み合わせ知ってるけど。知りたくないならいいけど…」 |
| **Trend Hunter** (トレンド解析) | 流行把握 | **Zari** (Girl) | **【ハイテンション・FOMO】** 「見て見て！Eriさんが持ってるそのチーク、今TikTokで超バズってるよ！今すぐ使わなきゃ損！」 |

**バンディットアルゴリズムの適用:**

ユーザーがどのエージェントの通知に反応するかを学習し、Eriさんが「優しい提案（Concierge）」を無視し、「皮肉な挑発（Alchemist）」に反応するタイプであれば、Alchemistからの通知頻度を上げる。

### **3.5 提案⑤：プロフェッショナルな価値証明「Beauty Asset Score」**

Duolingo ScoreのLinkedIn連携 17 を参考に、ユーザーのコスメ活用能力を可視化・権威化する。

#### **3.5.1 Beauty Asset Score (BAS)**

* **定義:** ユーザーがどれだけ賢くコスメ資産を運用しているかを示す0〜100のスコア。  
* **算出要素:**  
  * **資産回転率:** 登録アイテムのうち、直近1ヶ月で使用された割合。  
  * **多様性:** 使用した色相やテクスチャの幅。  
  * **錬金術レベル:** AI提案レシピの採用数とアレンジ数。  
* **社会的証明:** このスコアはLinkedInではなく、**Instagram**や**LIPS**のプロフィールに貼れる形式（画像生成）で出力する。「私はコスメをただ買っているだけでなく、使いこなしている上級者（Master Alchemist）である」というブランディングを可能にする。  
* **月次レポート:** 月末に「今月は眠っていた3本のリップを蘇らせ、実質15,000円分の価値を創出しました！」というレポートを発行し、\*\*「節約」ではなく「価値創出」\*\*として満足感を与える。

## ---

**第4章 実装ロードマップとKPI**

既存の開発計画（Phase 1〜3） 19 に、上記のゲーミフィケーション要素を統合する。

### **4.1 Phase 1 (MVP Enhancement): データ基盤と初期習慣**

* **優先機能:**  
  * **「ビューティー・ストリーク」の実装:** ログインボーナスではなく、Look Log（使用記録）によるストリーク判定。  
  * **Inventory Managerの通知:** 開封日（PAO）に基づく「もったいない通知」の実装。  
* **KPI:** 7日間継続率（Day-7 Retention）、1ユーザーあたりの平均登録アイテム数。

### **4.2 Phase 2 (Beta): 錬金ループの起動**

* **優先機能:**  
  * **「GLOW（エネルギー）」経済圏の導入:** レシピ生成を有償（GLOW消費）化し、在庫利用（GLOW回復）を促す循環を作る。  
  * **「アルケミスト・サークル」:** 継続日数に応じたアプリアイコンやテーマの解放。  
  * **エージェント人格の実装:** 通知文言の多様化とバンディットアルゴリズムの初期導入。  
* **KPI:** 在庫稼働率（Inventory Utilization Rate \- 目標30%）、デイリーアクティブユーザー（DAU）。

### **4.3 Phase 3 (Growth): 社会的拡張と権威化**

* **優先機能:**  
  * **ユニバーサル・マッチング（Recipe Swap）:** 似た属性のユーザー同士のクエストマッチング。  
  * **Bestie Streak:** 友人招待機能の強化。  
  * **Beauty Asset Score:** 外部SNSシェア機能の強化。  
* **KPI:** K-Factor（口コミ拡散率）、DAU/MAU比率（40%以上を目指す）。

## ---

**結論**

Duolingoの2024-2026年の進化は、ユーザーのリテンションが「機能」ではなく「感情」によって維持されることを証明している。彼らは、個人の孤独な努力を、社会的つながりとキャラクターとの関係性の中に埋め込むことで、学習を「やらなければならないこと（Chore）」から「やりたいこと（Habit）」へと昇華させた。

alche:meにおいても、単なる「コスメ管理ツール」に留まらず、ユーザーを「賢明な錬金術師」として定義し、AIエージェントチームとの共犯関係を築くことが成功の鍵となる。死蔵コスメへの「罪悪感」を、GLOWシステムによる「新たな発見へのエネルギー」へと転換し、毎朝の鏡の前での時間をエンターテインメントに変えることで、alche:meは美容アプリの枠を超えたライフスタイルOSとなり得るだろう。

### **参考文献・データソース**

* **Duolingo Streaks & Society:** 1  
* **Duolingo Energy System:** 8  
* **Duolingo Social & Leagues:** 10  
* **Duolingo Character AI & Content:** 13  
* **alche:me Documentation:** 19

#### **Works cited**

1. Streak Society \- Duolingo Wiki \- Fandom, accessed February 18, 2026, [https://duolingo.fandom.com/wiki/Streak\_Society](https://duolingo.fandom.com/wiki/Streak_Society)  
2. Duolingo Streak Society \- EVERYTHING You Need To Know \- duoplanet, accessed February 18, 2026, [https://duoplanet.com/duolingo-streak-society/](https://duoplanet.com/duolingo-streak-society/)  
3. Behind the product: Duolingo streaks | Jackson Shuttleworth (Group PM, Retention Team), accessed February 18, 2026, [https://www.youtube.com/watch?v=\_CCwoQZH5hI](https://www.youtube.com/watch?v=_CCwoQZH5hI)  
4. Can't find Streak Society icon \- duolingo \- Reddit, accessed February 18, 2026, [https://www.reddit.com/r/duolingo/comments/1jaz817/cant\_find\_streak\_society\_icon/](https://www.reddit.com/r/duolingo/comments/1jaz817/cant_find_streak_society_icon/)  
5. Duolingo VIP Status \- What Is It, How Do You Get It, Does It Matter? \- duoplanet, accessed February 18, 2026, [https://duoplanet.com/duolingo-vip-status/](https://duoplanet.com/duolingo-vip-status/)  
6. 5 product lessons we learned from building Friend Streak \- Duolingo Blog, accessed February 18, 2026, [https://blog.duolingo.com/product-lessons-friend-streak/](https://blog.duolingo.com/product-lessons-friend-streak/)  
7. Friend Streak: a new way to stay motivated together \- Duolingo Blog, accessed February 18, 2026, [https://blog.duolingo.com/friend-streak/](https://blog.duolingo.com/friend-streak/)  
8. Why Duolingo switched to Energy and how it helps you learn, accessed February 18, 2026, [https://blog.duolingo.com/duolingo-energy/](https://blog.duolingo.com/duolingo-energy/)  
9. Duolingo is replacing hearts with energy \- Page 2, accessed February 18, 2026, [https://forum.duome.eu/viewtopic.php?t=38495\&start=30](https://forum.duome.eu/viewtopic.php?t=38495&start=30)  
10. Why you have to increase demotion zone from 26 to 17? : r/duolingo \- Reddit, accessed February 18, 2026, [https://www.reddit.com/r/duolingo/comments/1j2ha0n/why\_you\_have\_to\_increase\_demotion\_zone\_from\_26\_to/](https://www.reddit.com/r/duolingo/comments/1j2ha0n/why_you_have_to_increase_demotion_zone_from_26_to/)  
11. Demoted too many \- Duolingo Forum \- Duome.eu, accessed February 18, 2026, [https://forum.duome.eu/viewtopic.php?t=37157](https://forum.duome.eu/viewtopic.php?t=37157)  
12. League | Duolingo Wiki | Fandom, accessed February 18, 2026, [https://duolingo.fandom.com/wiki/League](https://duolingo.fandom.com/wiki/League)  
13. 2025 Duolingo Highlights: our biggest leaps in learning, play, and connection, accessed February 18, 2026, [https://blog.duolingo.com/product-highlights/](https://blog.duolingo.com/product-highlights/)  
14. Our new Video Call with Falstaff is here to help you speak with confidence \- Duolingo Blog, accessed February 18, 2026, [https://blog.duolingo.com/beginner-video-call-with-falstaff/](https://blog.duolingo.com/beginner-video-call-with-falstaff/)  
15. Bandit Algorithm of Duolingo's Notifications \- LikeMinds Community, accessed February 18, 2026, [https://www.likeminds.community/blog/bandit-algorithm-of-duolingos-notifications](https://www.likeminds.community/blog/bandit-algorithm-of-duolingos-notifications)  
16. Duolingo & Its Cheeky Notification Marketing | by Adithya H Nair \- Medium, accessed February 18, 2026, [https://medium.com/@adithyahnair123/duolingo-its-cheeky-notification-marketing-9589a162515d](https://medium.com/@adithyahnair123/duolingo-its-cheeky-notification-marketing-9589a162515d)  
17. LinkedIn Adds Duolingo Scores on Profiles, AI Job Interview Simulations, accessed February 18, 2026, [https://www.socialmediatoday.com/news/linkedin-duolingo-score-profiles-ai-job-interview-simulation/760445/](https://www.socialmediatoday.com/news/linkedin-duolingo-score-profiles-ai-job-interview-simulation/760445/)  
18. LinkedIn to display Duolingo scores after partnership \- Action News Jax, accessed February 18, 2026, [https://www.actionnewsjax.com/news/trending/linkedin-display-duolingo-scores-after-partnership/TQLCF7XGHBG2TIXFY67BKKCMP4/](https://www.actionnewsjax.com/news/trending/linkedin-display-duolingo-scores-after-partnership/TQLCF7XGHBG2TIXFY67BKKCMP4/)  
19. alcheme\_prompts-catalog\_v3.md  
20. Characters sending push notifications? : r/duolingo \- Reddit, accessed February 18, 2026, [https://www.reddit.com/r/duolingo/comments/172fck5/characters\_sending\_push\_notifications/](https://www.reddit.com/r/duolingo/comments/172fck5/characters_sending_push_notifications/)  
21. LinkedIn Adds Duolingo Language Scores To Help Candidates Impress Recruiters, accessed February 18, 2026, [https://allwork.space/2025/09/linkedin-adds-duolingo-language-scores-to-help-candidates-impress-recruiters/](https://allwork.space/2025/09/linkedin-adds-duolingo-language-scores-to-help-candidates-impress-recruiters/)  
22. Duolingo Energy System \- The Complete Guide \- duoplanet, accessed February 18, 2026, [https://duoplanet.com/duolingo-energy-system/](https://duoplanet.com/duolingo-energy-system/)  
23. Beyond the Hearts: How Duolingo's 'Energy' Fuels Your Language Journey \- Oreate AI Blog, accessed February 18, 2026, [http://oreateai.com/blog/beyond-the-hearts-how-duolingos-energy-fuels-your-language-journey/acfaffcf9fe850c7cf0897bdfedff690](http://oreateai.com/blog/beyond-the-hearts-how-duolingos-energy-fuels-your-language-journey/acfaffcf9fe850c7cf0897bdfedff690)  
24. How Duolingo uses gamification to improve user retention (+ 5 winning tactics) \- StriveCloud, accessed February 18, 2026, [https://strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo](https://strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)  
25. Duolingo Leagues 2025: Win Faster & Rank Up Easily \- GamsGo, accessed February 18, 2026, [https://www.gamsgo.com/blog/duolingo-leagues](https://www.gamsgo.com/blog/duolingo-leagues)  
26. Duolingo Unveils Major Product Updates that Turn Learning into Real-World Power at Duocon 2025, accessed February 18, 2026, [https://investors.duolingo.com/news-releases/news-release-details/duolingo-unveils-major-product-updates-turn-learning-real-world](https://investors.duolingo.com/news-releases/news-release-details/duolingo-unveils-major-product-updates-turn-learning-real-world)  
27. Duolingo Introduces AI-Powered Innovations at Duocon 2024, accessed February 18, 2026, [https://investors.duolingo.com/news-releases/news-release-details/duolingo-introduces-ai-powered-innovations-duocon-2024](https://investors.duolingo.com/news-releases/news-release-details/duolingo-introduces-ai-powered-innovations-duocon-2024)