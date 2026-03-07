# **美容AIアプリ「alche:me」におけるGenerative UI (GenUI) 戦略的実装：Vercel AI SDK, CopilotKit, Gemini 3 Proを用いた次世代UXアーキテクチャ**

## **1\. エグゼクティブサマリー：美容テックにおけるパラダイムシフト**

人工知能（AI）のコンシューマー向けアプリケーションへの統合は、単なるテキストベースのチャットインターフェース（Conversational UI）の時代を超え、ユーザーの意図や文脈に合わせてインターフェースそのものをリアルタイムに生成・構築する「Generative UI (GenUI)」の時代へと突入している。本レポートは、美容AIアプリ「alche:me」（プロジェクトコードネーム：Cosme Mixologist）において、GenUIがもたらす変革的価値とその技術的実装方法について網羅的に分析したものである。

「alche:me」の中核的な提供価値は、ユーザーが抱える「コスメティック・パラドックス（Cosmetic Paradox）」—すなわち、多数の化粧品を所有していながら、それらを効果的に組み合わせる知識が不足しているために資産を死蔵させてしまう現状—を解決することにある 1。従来の静的な検索インターフェースや、単なるテキスト応答を行うチャットボットでは、メイクアップという視覚的かつ空間的な要素が強い領域において、ユーザーの認知負荷を十分に軽減することは不可能であった。ユーザーが必要としているのは、テキストによる助言ではなく、自身の所有するアイテムがどのように組み合わさり、どのような「顔」を作り出すのかを直感的に理解できる動的な視覚体験である。

本稿では、Vercel AI SDKによるReact Server Components (RSC) のストリーミング技術、CopilotKitによるアプリ内コンテキストの高度な統合、そしてGoogleのGemini 3 Proによるマルチモーダル推論能力を融合させた、最先端のGenUIアーキテクチャを提案する。特に、16の専門エージェントから構成される「Agentic AI」システム 1 が、いかにしてユーザーの潜在的なニーズ（インサイト）を読み取り、動的にUIコンポーネントを生成して「意思決定の疲れ（Decision Fatigue）」を解消するかについて詳述する。

## **2\. 背景と課題：なぜ今、美容アプリにGenUIが必要なのか**

### **2.1 「Cosmetic Paradox」と既存UIの限界**

現代の女性、特に本プロジェクトのターゲットペルソナである「Eri（30代・働く女性）」は、平均して数十個のコスメアイテムを所有しているものの、その多くを活用できていないという課題を抱えている 1。この「死蔵在庫への罪悪感（The Dead Stock Guilt）」は、物理的なスペースの浪費だけでなく、心理的な負担ともなっている。

既存の美容アプリやサービスは、主に以下の二つのカテゴリーに分類される 1。

1. **検索・口コミ型（例：LIPS, @cosme）：** 膨大なデータベースを持つが、ユーザー自身が能動的に検索する必要があり、手持ちのアイテムの活用法を見つけるには高いリテラシーが求められる。  
2. **AR・バーチャルメイク型（例：YouCamメイク）：** 高度なシミュレーションが可能だが、基本的には「新商品を試す（販促）」ためのツールであり、手持ちの異なるブランドのアイテムを組み合わせる「Mixology」の提案には対応していない。

これらの既存ソリューションに共通する欠点は、インターフェースが「静的」であることだ。ユーザーの状況（「明日は雨の日のデート」など）に応じて、提供される情報や機能の優先順位が変化しないため、ユーザーは常に同じメニューから必要な機能を探し出す労力を強いられる。

### **2.2 Agentic AIとGenUIの融合**

「alche:me」が目指す「Agentic AI（自律型AI）」は、ユーザーからの指示を待つだけでなく、カレンダーの予定や天気、肌のコンディションといった外部環境データに基づき、能動的に提案を行う 1。この能動性を最大限に活かすためには、AIが出力する情報がテキストであってはならない。

例えば、「明日は雨だから崩れにくいメイクがいい」という提案に対し、AIは以下のような動的なUIを生成すべきである。

* **テキスト:** 「雨予報ですね。崩れにくいマット肌のレシピです。」  
* **GenUIコンポーネント:**  
  * **WeatherWidget:** 湿度と気温を表示し、メイク崩れのリスクを可視化。  
  * **InventoryGrid:** 手持ちのコスメの中から、耐水性の高いアイテム（ウォータープルーフのマスカラなど）だけをフィルタリングして表示。  
  * **StepByStepCard:** 具体的な塗布手順を、ユーザーの顔写真上のマッピングとともに表示。

このように、状況に応じて最適なUIコンポーネント（ウィジェット、カード、グラフなど）を即座に生成・配置することで、ユーザーの認知負荷を劇的に下げ、「直感的な行動」へと誘導することがGenUIの本質的価値である。

## **3\. 技術アーキテクチャ概要：GenUIスタックの選定**

「alche:me」のような高度なGenUIアプリケーションを構築するためには、フロントエンドのレンダリング能力とバックエンドの推論能力をシームレスに結合させる必要がある。以下に、本プロジェクトで採用すべき中核技術スタックを選定理由とともに詳述する。

### **3.1 Vercel AI SDK (React Server Components)**

GenUIの実装において、Vercel AI SDKは事実上の業界標準となりつつある。特にNext.jsのApp Router機能と組み合わせた「React Server Components (RSC)」のストリーミングは、「alche:me」にとって不可欠な技術である。

* **streamUI / generateUI:** これらは、LLM（大規模言語モデル）のツール呼び出し（Tool Calling）の結果として、テキストではなくReactコンポーネントをクライアントにストリーミングすることを可能にする。  
* **選定理由:**  
  * **低遅延（Latency）:** 「alche:me」のコア機能である「代用（Dupe）ロジック」は、ベクトル検索や画像解析を含む重い処理を伴う 1。RSCを用いることで、サーバー側で計算を行いながら、クライアント側にはUIの骨組み（スケルトン）を即座に表示し、計算が完了した部分から順次コンポーネントを埋めていく「サスペンス（Suspense）」体験を提供できる。これにより、ユーザーは待たされている感覚を持たずに済む。  
  * **クライアントの軽量化:** モバイルアプリとしての利用が想定されるため、バンドルサイズを小さく保つことが重要である。複雑なロジックをサーバー側に隠蔽し、レンダリング結果のみを送信することで、アプリのパフォーマンスを維持できる。

### **3.2 CopilotKit (Context-Aware AI Integration)**

Vercel AI SDKがチャットインターフェース内のUI生成を担当するのに対し、CopilotKitはアプリケーション全体の「状態（State）」とAIを接続するために使用する。

* **useCopilotReadable:** アプリケーション内のデータ（例：現在表示されている在庫リスト、カレンダーの予定、ユーザーのプロフィール設定）をAIが「読める」状態にするフック。  
* **useCopilotAction:** AIがアプリケーションの操作（例：新しいレシピをお気に入りに登録する、在庫データを更新する）を「実行できる」ようにするフック。  
* **選定理由:**  
  * 「alche:me」は単なるチャットアプリではなく、在庫管理ツールとしての側面も持つ。ユーザーが在庫一覧画面を見ているときに「このリップに合うチークは？」と尋ねた場合、AIは画面上のコンテキスト（どのリップを見ているか）を理解する必要がある。CopilotKitはこのコンテキスト共有を容易に実装できる。

### **3.3 Gemini 3 Pro (Multimodal Reasoning Engine)**

GoogleのGemini 3 Pro（資料中のGemini 1.5 Proの発展形と想定）は、本アプリの頭脳となる。特にそのマルチモーダル機能と長いコンテキストウィンドウは、競合モデルに対する決定的な優位性となる。

* **Native Multimodality:** ユーザーが撮影したポーチの中身写真や、SNSのスクリーンショットを直接入力として受け取り、解析できる 1。OCR（光学文字認識）を介さずに画像を直接理解できるため、コスメの「質感（ラメ、マット、ツヤ）」や「色味のニュアンス（透け感のある赤）」といった非言語的な情報を正確に抽出できる。  
* **Reasoning Engine:** 16のエージェントが協調して動作するための複雑な推論を行う。ユーザーの曖昧な指示（「今日はずっと外にいる」）から、「紫外線対策が必要」「メイク直しができない」といった含意を読み取り、適切なツール（UIコンポーネント）を選択する能力に長けている。

## **4\. エージェントアーキテクチャとGenUIのマッピング**

「alche:me」のシステムは、役割分担された16人のAIエージェントによって構成されている 1。GenUIの実装においては、各エージェントの出力がどのようなUIコンポーネントとしてユーザーに提示されるかを定義することが重要である。以下に主要エージェントと対応するGenUIコンポーネントのマッピングを示す。

### **表1: エージェント機能とGenUIコンポーネントのマッピング**

| エージェント名 (ID) | 役割 | 入力データ | 従来の出力 (テキスト) | GenUI コンポーネント (視覚的出力) |
| :---- | :---- | :---- | :---- | :---- |
| **在庫管理クローク (02)** | 手持ちコスメのDB化 | 写真画像 | 「KATEのリップを認識しました。」 | \<InventoryGrid items={detectedItems} editable={true} /\> 画像から認識されたアイテムをグリッド表示し、ユーザーが誤認識を修正できるインタラクティブな編集UI。 |
| **調合の錬金術師 (04)** | 最適な組み合わせ提案 | 理想の画像 \+ 在庫DB | 「AとBを混ぜて使ってください。」 | \<RecipeCard recipe={generatedRecipe} matchRate={94} /\> 理想の色と手持ちの組み合わせによる再現色を比較表示するカード。「なぜこの組み合わせなのか」の理由もツールチップで表示。 |
| **トレンド解析アナリスト (03)** | SNSトレンドの分解 | SNS画像/URL | 「今は純欲メイクが流行りです。」 | \<TrendBoard palette={extractedColors} texture={textureData} /\> トレンド画像の「色・質感・雰囲気」を成分分解し、カラーパレットとして可視化したダッシュボード。 |
| **未来の鏡 (08)** | シミュレーション | 顔写真 \+ レシピ | 「あなたの顔だとこうなります。」 | \<SimulationViewer before={userImage} after={simulatedImage} /\> スライダーでBefore/Afterを比較できるビューアー。Geminiの画像生成機能を活用。 |
| **TPO・気象予報士 (07)** | 文脈の補正 | 天気・カレンダー | 「雨なので崩れにくいものを。」 | \<WeatherContextWidget weather={rainy} impact={"High Humidity"} /\> 天気アイコンと、それがメイクに与える影響（湿度による崩れなど）を警告するウィジェット。 |
| **在庫鮮度ポリス (12)** | 使用期限管理 | 開封日データ | 「マスカラが古いです。」 | \<FreshnessAlert item={mascara} daysOpen={180} /\> 期限切れアイテムに警告バッジを表示し、買い替え（ECリンク）を提案するカード。 |

## **5\. 詳細実装戦略：Vercel AI SDKによるGenUI構築**

ここでは、具体的な実装フローを解説する。ユーザーが「明日のデート用のメイクを教えて」と入力した際の処理を例にとる。

### **5.1 サーバーアクションとTool Callingの定義**

Next.jsのServer Action内で、Gemini 3 Proに対して利用可能なツール（UIコンポーネント）を定義する。Vercel AI SDKのstreamUI関数を使用することで、LLMの推論結果に基づいて動的にコンポーネントを選択・レンダリングする。

TypeScript

// 概念的なコード構造 (Typescript)  
import { streamUI } from 'ai/rsc';  
import { google } from '@ai-sdk/google';  
import { z } from 'zod';  
import { RecipeCard } from '@/components/genui/recipe-card';  
import { WeatherWidget } from '@/components/genui/weather-widget';

export async function submitUserQuery(input: string, context: AppContext) {  
  'use server';

  const result \= await streamUI({  
    model: google('models/gemini-3-pro'),  
    messages: \[  
      { role: 'system', content: 'あなたは専属の美容エージェントです。ユーザーの在庫と文脈に合わせて最適なUIを提供してください。' },  
      { role: 'user', content: input }  
    \],  
    tools: {  
      // レシピカード生成ツール  
      generateRecipeCard: {  
        description: '特定のシチュエーションや画像に基づいたメイクレシピを提案する際に使用',  
        parameters: z.object({  
          title: z.string(),  
          items: z.array(z.object({ id: z.string(), usage: z.string() })),  
          matchRate: z.number(),  
          reasoning: z.string()  
        }),  
        generate: async ({ title, items, matchRate, reasoning }) \=\> {  
          // データベースからアイテムの詳細情報を取得  
          const itemDetails \= await fetchInventoryDetails(items.map(i \=\> i.id));  
          // UIコンポーネントを返す  
          return \<RecipeCard title\={title} items\={itemDetails} matchRate\={matchRate} reasoning\={reasoning} /\>;  
        }  
      },  
      // 天気ウィジェット生成ツール  
      showWeatherImpact: {  
        description: '天候がメイクに影響を与える場合に表示',  
        parameters: z.object({  
          location: z.string(),  
          condition: z.string(),  
          advice: z.string()  
        }),  
        generate: async (props) \=\> {  
          return \<WeatherWidget {...props} /\>;  
        }  
      }  
    }  
  });

  return result.value;  
}

### **5.2 構造化出力（JSON Schema）の重要性**

GenUIにおいて最も重要なのは、AIが生成するデータの構造が、ReactコンポーネントのProps（プロパティ）定義と完全に一致することである。Gemini 3 Proは「JSON Mode」や「Function Calling」におけるスキーマ遵守能力が高く、Zodで定義された型定義に従って正確なJSONを出力することが期待できる。これにより、必須パラメータの欠落によるUIクラッシュ（Runtime Error）を防ぐことができる。

### **5.3 並列ツール実行によるレイテンシ削減**

レポート 1 では、16人のエージェントが順次処理を行うことによる応答遅延（Latency）が懸念点として挙げられている。Vercel AI SDKは複数のツールを並列に呼び出すことが可能である。 例えば、「明日のデート」というクエリに対し、Geminiは以下の推論を行う。

1. 天気を調べる必要がある → WeatherAPI ツールをコール  
2. 在庫を確認する必要がある → InventoryDB ツールをコール  
3. トレンドを確認する必要がある → TrendSearch ツールをコール

これらをシーケンシャル（順次）ではなくパラレル（並列）に実行し、全てのデータが揃った段階で最終的な RecipeCard をレンダリングする、あるいはデータが揃ったウィジェットから順次ストリーミング表示することで、体感速度を大幅に向上させることができる。

## **6\. ユーザー心理とUXデザイン：信頼と納得の形成**

GenUIは単に便利な機能を提供するだけでなく、ユーザーの心理的な障壁を取り除くためのデザインが必要である。「alche:me」のターゲットユーザーは「自分の判断に自信がない」「失敗したくない」という不安（Insight）を持っている 1。

### **6.1 「Explainable AI (XAI)」の視覚化**

AIが「このリップとこのチークを組み合わせろ」と提案した際、ユーザーは「本当に合うの？」と疑念を抱く可能性がある。特に、一見すると色が合わなさそうなアイテム（例：茶色のリップにオレンジのグロス）を提案された場合、その根拠を視覚的に説明する必要がある。

* **Vector Logic Visualization:** 「Agent 04: 調合の錬金術師」が行っているベクトル演算を可視化するUIコンポーネントを実装する。  
  * **UIイメージ:** 色相環（Color Wheel）または3次元の色空間グラフを表示。  
  * **動作:** 「目標の色（理想）」と「手持ちの色A」の距離を表示し、そこに「手持ちの色B（重ね塗り）」を加えることで、ベクトルが目標地点に近づく様子をアニメーションで示す。  
  * **効果:** 数学的な根拠を直感的なビジュアルで見せることで、ユーザーの納得感（Trust）を醸成する。

### **6.2 「朝のタイムアタック」への対応**

1 の資料にあるように、ユーザーは朝の忙しい時間に追われている。チャットで悠長に会話している時間はない。

* **Morning Dashboard:** アプリ起動時に、CopilotKitがバックグラウンドでカレンダーと天気を読み取り、ユーザーが何も入力しなくても「今日の最適解」をウィジェットとしてトップ画面に提示する。  
  * **UI構成:**  
    1. 今日の予定：「10:00 商談 (雨)」  
    2. 推奨スタイル：「崩れにくいマット肌 × 知的ベージュリップ」  
    3. 使用アイテム：3点のみをチェックリスト表示  
    4. 「実行」ボタン：タップすると使用履歴に記録され、お気に入り度などのフィードバックをワンタップで送信。

### **6.3 失敗への恐怖を和らげるシミュレーション**

「新しい自分への恐怖」 1 を克服するために、Agent 08（未来の鏡）が生成するシミュレーション画像は極めて重要である。Gemini 3 Proの画像生成・編集機能（Inpainting）を活用し、ユーザーの自撮り写真に対して、提案されたメイク（リップの色、チークの位置）を合成する。

* **Slider UI:** 元の顔とメイク後の顔をスワイプ操作で比較できるスライダーUIを提供し、変化の度合いをユーザー自身がコントロールできる感覚を与える。

## **7\. 高度なGenUIパターン：「コスメベクトル」の活用**

「alche:me」の競争優位性の源泉は、コスメを色・質感・成分でベクトル化する「Cosme Vector DB」にある 1。GenUIはこの抽象的なデータをユーザー価値に変換する役割を担う。

### **7.1 質感のデジタル表現**

色はRGBコードで表現しやすいが、「質感（ラメ、パール、マット、シアー）」の表現は難しい。Gemini 3 Proのマルチモーダル能力を活用し、以下のようなUI表現を行う。

* **Texture Chip:** 単なる色面ではなく、光の反射をシミュレートしたテクスチャチップを生成する。ラメの粒子感やグロスの濡れ感をWebGL等でレンダリングし、スマートフォンを傾けると光り方が変わるようなリッチな表現を取り入れることで、「質感の組み合わせ」への理解を深める。

### **7.2 「ミッシングリンク」の提案と収益化**

Agent 15（サステナブル・バイヤー）は、手持ち在庫だけではどうしても再現できない場合に、買い足すべき「たった一つのアイテム」を提案する 1。

* **Network Graph UI:** ユーザーの手持ちアイテムをノード（点）として表示し、それらが孤立している状態を見せる。そこに「提案アイテム（新商品）」を一つ加えることで、既存のアイテム同士が繋がり、組み合わせのパターン数が劇的に増える様子をグラフ理論の可視化のようにアニメーションで見せる。  
* **メッセージ:** 「この800円のリップを買うだけで、あなたの死蔵しているアイシャドウ3つが復活します」という経済合理性を訴求する強力なUIとなる。

## **8\. ビジネスエコシステムとロードマップ**

「alche:me」は単なるB2Cアプリにとどまらず、化粧品メーカーやインフルエンサーを巻き込んだプラットフォーム（B2B2C）への進化を目指している 1。

### **8.1 インフルエンサー × GenUI**

インフルエンサーが自身のメイクレシピを「alche:me」形式で公開できる機能。

* **Recipe Publisher:** インフルエンサーは使用コスメを登録するだけで、AIが自動的に「代用ロジック」を生成。フォロワーがそのレシピを見ると、フォロワー自身の手持ち在庫の中で代用可能なアイテムが自動的に表示される「Personalized Recipe View」を実現する。これにより、「同じコスメを持っていないから真似できない」という諦めを解消し、エンゲージメントを高める。

### **8.2 OEM・メーカー向けダッシュボード**

メーカーに対しては、「自社商品が何で代用されているか（競合分析）」や「何と組み合わされているか（併用分析）」という貴重なデータを提供する 1。

* **Insight Dashboard:** Gemini 3 Proを用いて、蓄積された膨大なチャットログと画像データから定性的なインサイト（例：「雨の日にはKATEのリップがDiorの代用として選ばれる傾向が30%増加」）を抽出し、メーカー担当者向けのレポートUIを自動生成する。

### **8.3 今後の開発ロードマップ**

1. **Phase 1 (MVP \- Hackathon Scope):**  
   * Vercel AI SDKを用いたチャットベースの在庫登録（Agent 02）と基本的なレシピ提案（Agent 04）。  
   * GenUIはシンプルな InventoryGrid と RecipeCard に限定。  
2. **Phase 2 (Beta):**  
   * CopilotKitを導入し、カレンダー連携とアプリ内コンテキスト認識を実装。  
   * Agent 08による画像シミュレーション機能の統合。  
3. **Phase 3 (Ecosystem):**  
   * メーカー連携機能の実装。ECサイトへの送客導線（Agent 15）のGenUI化。  
   * 「Cosme Vector DB」のAPI公開。

## **9\. 結論**

「alche:me」におけるGenerative UIの実装は、単なるUIの改善ではなく、ユーザー体験の質的転換である。Vercel AI SDKによるストリーミング、CopilotKitによるコンテキスト統合、そしてGemini 3 Proによる高度な推論とマルチモーダル解析を組み合わせることで、ユーザーは「情報の検索」という受動的な行為から解放され、「パーソナライズされた提案の実行」という能動的な体験へと移行する。

特に、Agent 04「調合の錬金術師」による「代用（Dupe）ロジック」をGenUIによって視覚化・直感化することは、ユーザーの「持っているのに使えない」というペインを解消し、化粧品業界全体の課題である在庫廃棄ロスの削減にも寄与する可能性を秘めている。技術的な実装難易度は高いが、提示されたスタックとアーキテクチャに従うことで、十分に実現可能なビジョンであると言える。

# ---

**詳細レポート：美容AIアプリ「alche:me」のためのGenerative UI技術調査と実装ガイド**

## **第1章 戦略的背景とGenUIへのパラダイムシフト**

### **1.1 「Cosmetic Paradox」の深層と市場機会**

化粧品市場において、消費者は矛盾した状況（Cosmetic Paradox）に置かれている。一方で新商品を次々と購入し（平均所有数20個以上）、他方でそれらを使いこなせずに死蔵させている 1。ユーザーペルソナである「Eri」は、この状況に対して「罪悪感（Dead Stock Guilt）」と、毎朝のメイク選びにおける「決断疲れ（Decision Fatigue）」を感じている。

従来の美容アプリ（LIPS, @cosmeなど）は「新しいコスメを買わせる（Buying）」ことに主眼を置いており、膨大なデータベース検索機能を提供している。しかし、これは「情報の海」であり、ユーザー自身が高度な検索スキルとメイク知識を持っていなければ、自分の手持ちアイテムへの応用（Utilizing）には繋がらない 1。

ここに、「Search（検索）」から「Action（提案・実行）」へと体験をシフトさせる大きな市場機会が存在する。AIがユーザーの代わりに考え、整理し、最適な解を提示する「Agentic AI」のアプローチである。

### **1.2 会話型AIから生成型UI（GenUI）へ**

生成AIの登場により、チャットボット型のインターフェースが普及したが、美容領域においてテキストのみの対話は不十分である。「右上のアイシャドウをまぶた全体に」という指示は、テキストよりも画像や図解の方が圧倒的に伝わりやすい。

**Generative UI (GenUI)** は、AIが会話の流れやユーザーの状況（文脈）に合わせて、最適なGUI（Graphical User Interface）をリアルタイムに生成・提示する技術である。「alche:me」においてGenUIは以下の3つの壁を突破するために不可欠である。

1. **認知の壁:** 複雑なメイク理論（色相・明度・彩度のバランス）を、直感的な「レシピカード」として視覚化する。  
2. **行動の壁:** 「やってみよう」と思わせるために、具体的な手順をスステップバイステップのチェックリストとして提示する。  
3. **信頼の壁:** AIの提案根拠（なぜこの組み合わせなのか）を、データ可視化（グラフやマッチ度）によって説明する。

### **1.3 Gemini 3 Pro と Vercel AI SDK がもたらす革新**

本プロジェクトでは、最新のLLMである **Gemini 3 Pro** と、フロントエンド技術の **Vercel AI SDK** を中核に据える。

* **Gemini 3 Pro:** テキストだけでなく、画像、動画、音声を含むマルチモーダル情報をネイティブに理解し、推論する能力を持つ。これにより、ユーザーのポーチの中身を瞬時にデータ化し、SNSのトレンドメイクを成分分解することが可能になる。  
* **Vercel AI SDK:** サーバー側で生成されたReactコンポーネントをクライアントへストリーミングする技術（RSC）を提供する。これにより、AIの思考プロセスとUIの描画をシームレスに同期させ、アプリのようなリッチな体験をチャット内で実現する。

## **第2章 ユーザー心理に基づいたUXデザイン**

### **2.1 決定回避の法則と「朝の5分」**

ユーザーのEriは、朝の忙しい時間帯にメイクの意思決定を行わなければならない。心理学における「決定回避の法則（多くの選択肢があると選べなくなる）」が働き、結局いつもと同じ「無難なメイク」に落ち着いてしまう 1。

GenUIはこの「選択肢の絞り込み」を視覚的に行う役割を担う。

* **Morning Routine Widget:** アプリを開いた瞬間、AIは既に思考を終えている。「今日の天気（雨）」×「予定（商談）」×「肌状態（寝不足）」を考慮し、**たった一つの**「今日の正解」を提示する。  
* **デザイン原則:** 「迷わせない」。複数の候補を出す場合でも、最大3つ（松・竹・梅）に絞り、それぞれのメリット（例：「時短」「崩れない」「好印象」）をバッジとして表示する。

### **2.2 「Dupe（代用）」ロジックの可視化と納得感**

「alche:me」のキラー機能である「Dupe Stylist（代用提案）」は、ユーザーが持っていない憧れのコスメ（例：Dior）を、手持ちのコスメ（例：Canmake \+ Rom\&nd）で再現するものである 1。 しかし、ユーザーは「本当に同じ色になるの？」という疑念を持つ。これを解消するのが\*\*信頼のデザイン（Trust Design）\*\*である。

#### **表2: 信頼形成のためのGenUI要素**

| ユーザーの疑念 | 解消するGenUI要素 | 実装イメージ |
| :---- | :---- | :---- |
| 「色が違うのでは？」 | **Visual Color Match** | 目標色と再現色を左右に並べ、その色差（Delta E）が人間の目には識別困難なレベルであることを数値（再現率94%など）とバーグラフで示す。 |
| 「質感が違うのでは？」 | **Texture Simulation** | マットなリップにグロスを重ねることで、目標のツヤ感に近づく様子を、レイヤー構造の図解（Layering Diagram）で示す。 |
| 「私に似合うの？」 | **Virtual Try-On** | ユーザーの顔写真に適用したシミュレーション画像を提示。GeminiのInpainting技術を活用。 |

### **2.3 ゲーミフィケーションと「資産活用」の喜び**

「在庫を使い切る」という行為を、義務ではなく楽しみに変えるためのUI演出が必要である。

* **Inventory Stats:** 「今月の在庫稼働率 30%（先月比+5%）」といったスタッツをグラフ化し、ゲームのスコアのように表示する。  
* **Level Up Notification:** 特定のコスメを使い切った（底見え）際に、盛大な祝福エフェクト（Confetti）と共に「使い切りマイスター」の称号バッジを付与する。

## **第3章 技術アーキテクチャ詳細：GenUIスタック**

本章では、「alche:me」を実現するための具体的な技術スタックと、その連携方法について解説する。

### **3.1 フロントエンド：Next.js App Router & Vercel AI SDK**

モバイルWebアプリ（PWA）として構築することを想定し、フレームワークにはNext.jsを採用する。

* **RSC (React Server Components) の活用:**  
  GenUIのコンポーネントはサーバーサイドでレンダリングされ、クライアントにストリーミングされる。これにより、クライアント側のJavaScriptバンドルサイズを削減し、モバイル端末でのパフォーマンスを向上させる。  
* **ai/rsc ライブラリ:**  
  * createAI: AIの状態（会話履歴、在庫データなどのコンテキスト）を管理するコンテキストプロバイダーを作成。  
  * getMutableAIState / getUIState: サーバーアクション内でAIの状態を読み書きし、それに基づいてUIを更新する。  
  * streamUI: LLMの出力に基づいて、非同期にUIコンポーネントを生成・送信する核心的な関数。

### **3.2 バックエンド：Google Cloud Platform (GCP)**

1 の提案通り、バックエンドはGCP上に構築する。スケーラビリティとGeminiとの親和性が理由である。

* **Cloud Run:** Next.jsアプリケーションおよびPython製のバックエンドロジック（ベクトル検索などの重い処理）をホスティングする。  
* **Vertex AI Agent Builder:** 16のエージェントのオーケストレーション（指揮）を行う基盤。  
* **Firestore:** ユーザーデータ、在庫データ（JSON）、チャット履歴を保存するNoSQLデータベース。  
* **Vertex AI Vector Search:** 数千〜数万のコスメデータのベクトルインデックスを保持し、ミリ秒単位での類似商品検索（Dupe探索）を実現する。

### **3.3 コンテキスト連携：CopilotKit**

CopilotKitは、LLMとアプリケーションのフロントエンド状態（State）を接続するミドルウェアとして機能する。

* **useCopilotReadable:**  
  Reactコンポーネント内の状態（例：現在表示しているタブ、選択中のコスメID）をLLMにリアルタイムで共有する。これにより、ユーザーが「これ（画面上のアイテム）を使って」と言ったときに、AIが「これ」を正しく認識できるようになる。  
* **useCopilotAction:**  
  AIがアプリ内の関数を実行できるようにする。例えば、「このレシピをカレンダーに登録して」という指示に対し、AIが直接カレンダー登録APIを叩くアクションを発火させる。

### **3.4 アーキテクチャ図（概念）**

Code snippet

graph TD  
    User \<--\> |Interaction| Frontend  
    Frontend \<--\> |Context Sync| CopilotKit  
    Frontend \<--\> |Server Actions| Backend  
      
    subgraph "Google Cloud Platform"  
        Backend \--\> |Reasoning/Vision| Gemini\[Gemini 3 Pro\]  
        Backend \--\> |Vector Search| VectorDB  
        Backend \--\> |Data Persist| Firestore  
    end  
      
    subgraph "AI Agents Logic"  
        Gemini \<--\> Agent02\[在庫管理\]  
        Gemini \<--\> Agent04\[調合ロジック\]  
        Gemini \<--\> Agent03\[トレンド解析\]  
    end

## **第4章 16のエージェントシステムとGenUIの実装詳細**

16人の専門家エージェント 1 がどのように連携し、どのようなUIを出力するかを詳述する。

### **4.1 在庫管理クローク (Agent 02\)**

* **機能:** 画像認識による在庫のデジタル化。  
* **GenUIコンポーネント:** \<InventoryGrid /\>  
* **Gemini 3 Proの役割:**  
  ユーザーがアップロードした集合写真から、個々のアイテムをバウンディングボックスで検出し、ブランド名、商品名、色番（Color Code）を特定する。  
* **実装フロー:**  
  1. ユーザーが画像を送信。  
  2. streamUI が呼び出され、まずはスケルトンスクリーンを表示（Optimistic UI）。  
  3. Gemini Vision APIが解析を実行。  
  4. 解析結果のJSONに基づき、InventoryGrid コンポーネントがストリーミングされる。  
  5. **Human-in-the-Loop:** 誤認識（例：色が違う）がある場合、ユーザーがそのセルをタップすると、修正用モーダル \<EditItemModal /\> がCopilotAction経由で起動する。

### **4.2 調合の錬金術師 (Agent 04\) & 代用ロジック**

* **機能:** 理想と現実のギャップを埋めるレシピ生成。  
* **GenUIコンポーネント:** \<RecipeCard /\>  
* **ロジック詳細 (Vector Mixology):**  
  Gemini 3 Proは、目標画像（Target）から主要色のベクトル ![][image1] を抽出する。次に、ユーザー在庫のベクトル空間 ![][image2] から、以下の条件を満たす組み合わせ探索を行う。  
  ![][image3]  
  ここで ![][image4] は重ね塗りの比率や強度を表す。  
* **UI表現:**  
  この計算結果を、\<ColorMixerVisualization /\> として表示。  
  「ベース：Item A（70%）」＋「重ね：Item B（30%）」＝「目標色」  
  という数式を、実際のコスメ画像と色パッチで視覚的に表現する。

### **4.3 トレンド解析アナリスト (Agent 03\)**

* **機能:** SNS画像の非言語情報の言語化・データ化。  
* **GenUIコンポーネント:** \<TrendMoodBoard /\>  
* **実装:**  
  インスタグラムのURLやスクリーンショットを受け取り、Geminiが「メイクの構造」を解析。  
  「アイシャドウは横割りグラデーション」「リップはオーバーリップ気味」といった構造情報を抽出し、それを模したイラスト図解（Face Chart）をSVGとして生成・表示する。

### **4.4 遅延（Latency）対策とストリーミング戦略**

16のエージェントが順次動作すると、回答までに時間がかかりすぎる（30秒以上）。これを解決するために以下の戦略をとる。

1. **Parallel Tool Calling (並列実行):**  
   Vercel AI SDKの機能を使い、依存関係のないエージェント（例：天気取得と在庫検索）は並列に実行する。  
2. **Progressive Rendering (段階的描画):**  
   UIを細かく分割し、準備できたものから順次表示する。  
   * Step 1: 「画像を解析中...」（テキストストリーミング）  
   * Step 2: 「この雰囲気のメイクですね！」（解析結果のムードボード表示）  
   * Step 3: 「在庫を確認しました。3つのレシピが見つかりました」（レシピカードのスケルトン表示）  
   * Step 4: レシピの詳細データ流し込み（画像・テキストのハイドレーション）

## **第5章 高度なGenUI実装パターン**

### **5.1 モーニング・ダッシュボードの動的生成**

「alche:me」のホーム画面は静的なメニューではなく、AIが毎朝生成する動的なダッシュボードである。

* **実装:** generateUI を使い、ユーザーのアクセス時（Server Componentのレンダリング時）にAI推論を一回走らせる。  
* **コンテキスト:** 天気API、Google Calendar API、Fitbit/HealthKit API（睡眠時間など）。  
* **出力:**  
  * 睡眠不足（Health）× 重要会議（Calendar） → 「血色感アップ × 信頼感メイク」  
  * このロジックに基づき、\<RecommendedLookWidget /\> がメインビジュアルとして生成される。

### **5.2 インタラクティブなチュートリアル (Agent 05\)**

静的なテキスト手順ではなく、ユーザーの進捗に合わせて進むインタラクティブガイド。

* **コンポーネント:** \<InteractiveTutorial step={currentStep} total={5} /\>  
* **機能:**  
  * **Voice Navigation:** 「次へ」と声で言うと、ページがめくれる（Web Speech API \+ Vercel AI SDK）。  
  * **Timer Integration:** 「パックをして3分待つ」という工程では、自動的にカウントダウンタイマーUI \<CountdownTimer duration={180} /\> が出現する。

### **5.3 買わない満足（No-Buy Satisfaction）の演出**

ユーザーが「新しいコスメを買わずに済んだ」ことをポジティブにフィードバックするUI。

* **Savings Counter:** 「今回のレシピで、新商品を1つ買わずに済みました。約2,000円の節約です！」というメッセージと共に、貯金箱にお金が貯まるアニメーションを表示する。これは「罪悪感」を「達成感」に書き換える強力なUXである。

## **第6章 将来展望とビジネスエコシステム**

### **6.1 B2B/OEM展開：Sponsored GenUI**

化粧品メーカー向けのビジネスモデルとして、AI提案の中に自然な形で自社商品を組み込む「ネイティブアド」ならぬ「ネイティブGenUI」を展開する。

* **Missing Piece Suggestion:**  
  手持ちの在庫だけでは再現率が70%にしかならない場合、AIは「この新作アイシャドウ（メーカーA社）を足せば、再現率が98%になります」と提案する。  
* **UI:** レシピカードの中に、手持ちアイテムと並んで「Sponsored Item」がハイライト表示され、タップするとそのままECカートに追加できる仕組み。

### **6.2 データプラットフォームとしての進化**

ユーザーが「alche:me」を使えば使うほど、個人の在庫データと使用履歴（選好データ）が蓄積される。これは世界で最も詳細な「コスメ消費のリアルタイムデータ」となる。

* **Cosme Vector DBのAPI化:**  
  他社のECサイトやアプリに対し、このベクトル検索エンジンと推論エンジンをAPIとして提供する。例えば、ECサイトで「このリップを買うと、あなたの手持ちのこれと相性がいいですよ」というレコメンド機能を実装可能にする。

### **6.3 倫理的AIとハルシネーション対策**

物理的な商品を扱う以上、AIの「ハルシネーション（嘘の情報を出力すること）」は致命的である（存在しない商品を提案するなど）。

* **Grounding (グラウンディング):** Gemini 3 Proの「Grounding with Google Search」機能を活用し、提案された商品が現実に存在し、販売されているかを常に検証するプロセスをバックエンドに組み込む。  
* **Safety Filters:** 肌トラブルの原因となるような危険な組み合わせ（成分的な競合など）を除外するための安全フィルター（Agent 12の拡張）を実装する。

## **結論**

「alche:me」は、最新のGenUI技術を駆使することで、ユーザーのペインである「コスメの死蔵」と「意思決定疲れ」を根本から解決するポテンシャルを持つ。Vercel AI SDKによる流れるようなインターフェース、CopilotKitによる文脈理解、そしてGemini 3 Proによる圧倒的な推論能力。これらが融合した時、アプリは単なるツールを超え、ユーザーの毎朝を変える「パートナー」となる。本レポートで示したアーキテクチャとUXデザインは、その実現に向けた具体的かつ実行可能なロードマップである。

#### **Works cited**

1. 260124 Cosme Mixologist.pdf

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAZCAYAAACYY8ZHAAACqklEQVR4Xu2XS6iOURSGX7nkLpfIJbeUyGUgA1IkQiIxMDAxw9RJohCRDOSSKDFAkhhQDEQ5MRBGBiilKDFUipHb+7T2599n/05y6fhO/W899X977e/be+299lr7l1pqqaWW6qxt5nTByA49pEvmbLLByo7m/6seZr55bL6Zt2az6Z13staZp4o+582IjuZ66IBigjgztLChgeau2ahwvJbapHDitRld2BC7c1nNO1QrzTEfzVezpLAx8bairZaabN4pdmNtYVuvCKfaa5R5qXBie9Y+0TzMnmstVrpd4cSZ1EYYkU53pOduoXMKJ66m59Xmnhn+o0dokWLnulqH1VjgTrVVjQx1yhxVczrta24WbV2lV2Ze2VhqlcKJD4p6kVft/uaYeWS+mCtmTLINU6TfawrHd5sh5qR5YnYpKj62XukdxDd471b6jVi0xYrQJiI2mKnmhvmsOJ97Tc/Uv0lzzSeFI0sLWyXSLwmgEpO9rRicEHtudpo1ZqE5bl6Y6eaOGRCvaYIaY8ww79NvbgY4jn28OZja0UU1R0aT8jSbr1guKnseThTByineJxRxlDQ9VjHxKtsxMcRETqiRthco3ptk3phDioJ7QQ1HuUVQkH8pJr7czCwNSfkkZykG5ZmzhCoHq0SwQuEgzuSarQhZxJiEDTtGOOPEuGTLRVhxX+unGPuPxeSZNM6wuoMUscsArDJhgyPLUv/KKZJBLibDZRJx+SSU+Aa3hmeK76MpZp/po3AShym85Y3it8QKPTB7FGcBcSVvV9STI4oDyIGuslheOHOxS4QLu0AIT1OEGdeb6wqn9pvBqT/pnvOxJfX7K1EAyUa5mHD1YZyrLolktE6zSBJxfl+xq5X43s/qUG2uPpwXsg9/sFhxwqTKWN1K7BQr/U9W9jvpy3zhEfvnZAAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAAZCAYAAACSP2gVAAADXElEQVR4Xu2YWaiNURTHl1DmIfOUS4aMmUvJUB4M8YC6wsPNA5Eoiki6HqREhqSUjOHFVCjJww0PppQylKEopZS8eDLE/3fXtzv72+d4Md3ynX/96py199nfXmuvvb69j1lVVVVVVVVV/W9qLT6J9+Kt+Cy6iiNiQdSvkOor7ovBka2D+CI+iGGRvXBqJ66Lm2mDeSbdEu3ThiJpsfgulqYN0lVxIDUWSW3FDfMAHc83NWq+6JYaiyYyhADBfjFTtMr1KLgowO+sFKTAhbhT0dVL7LHyIFHAY20UHRNboURAZol75gGamG+2Z+ZHgqYSi8i57J9pU2rIRKAaxPjE3tR6LSanxr8lCnFdaszUwzxbwnYaJy6ZF3CE/ZBYI7aKU+K2aBm1HzZf8Wbmb8OPWRsiC8+IE+YvBk7x/cULsUgcFEfFBvPfDxVXxFdxV2wXzc0Ps3vFeXHSfIwwt0firLgo9okW5nX1oZUOvhxjJmWfyzTQfCJMINUy81M04oG7zevU+sy2UEwxdzo8gJWlD1onRpofIThK1Jg7j3CCyTMGTu4y/91acU48z/qgBsvXwdOWny+loC6yERDGnWb+dh5uPgcYYT7uKzE76//SPA4VRTZ8E7VWekBYbe5kFGRUI2aYBwCn0Rzze1q8RTloYiMzubuRhWRYENnEKuIEjnGtqRfbzIPAmI/Nnx/ECocjR2exMmpjrncs/9LA+eWij3lQ0CjzwIwxH5s+tKMGK38RNYqVm559ZltMMD9RT82+p8LxJ+YDh8EJcCjYA8wf3E/0zGxkW7iiENgl5pnyxn5++Y2vNWFB2F4EISwA23G0eX2cl/VFLEhYMDKE+aTCFp6NH/Fi/JYIBo5tMQ8G2mGl1WVCBLA+ameytBPwzebBC8U/XGtwtl4MMs+u+FpDgLubb28CRBt9yHjmQ7CCs2RTfARhbmRfqqfmpQGxK/7YJZz9SzqHFcPxeAJjxQMxN7INMS+ybC2ODkFkK4V2hXlhpU4gHI5XlM/8lhdE+L5TrLJSSaDgrhbHzAsxCnOr9Iam5l42XxSyqeL2+lWl1482yfe0HeF0pS3LFic7UsUFGKVjpg4xNlsr7cfceEYqft9J9BbXkrbCi+CQVWQ1f++Q4VUlItu6WHmm5vQDR12QuvcnBPMAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,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>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAaCAYAAACD+r1hAAAAx0lEQVR4Xu3RPw4BQRTH8SciIZFQUqolFAqVXqOSSMQBOAGJ1hEcYKNFKaFUOoMonEFCNP58n7ezJtup7S/5NL+dN5mdEUmS5KfkkY2X8aTRwxFn3LBEyVsTJYMHul6XQoAn2tih4j6OwiLnijATvDDFXGwTKeCA4XddlIHYgG5WdWUdFzRc4aUjNqA+u2t04RVlV3hxA1u/1MkZWn5J1mJH0c326KPmPurP6jWusMAJTbGrHuOOjdj/RtGH0mOp+KMVxYb/M2/yxiBIxFzgzQAAAABJRU5ErkJggg==>