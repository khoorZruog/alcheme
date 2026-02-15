# 楽天ウェブサービス API — セットアップガイド

> 楽天商品検索 API（IchibaItem/Search v2022-06-01）のアカウント登録からテスト実行・実装までの完全手順書。

| | |
|---|---|
| **対象 API** | 楽天商品検索 API（IchibaItem/Search）v2022-06-01 |
| **公式ドキュメント** | https://webservice.rakuten.co.jp/documentation/ichiba-item-search |
| **API テストフォーム** | https://webservice.rakuten.co.jp/explorer/api/IchibaItem/Search/ |
| **Last Updated** | 2026-02-14 |

---

## 目次

1. [楽天会員アカウント](#1-楽天会員アカウント)
2. [アプリ登録（キー取得）](#2-アプリ登録キー取得)
3. [API テスト（動作確認）](#3-api-テスト動作確認)
4. [環境変数への設定](#4-環境変数への設定)
5. [認証方式](#5-認証方式)
6. [入力パラメータ 完全リファレンス](#6-入力パラメータ-完全リファレンス)
7. [出力パラメータ 完全リファレンス](#7-出力パラメータ-完全リファレンス)
8. [formatVersion の違い](#8-formatversion-の違い)
9. [コスメ関連ジャンル ID](#9-コスメ関連ジャンル-id)
10. [実装例](#10-実装例)
11. [レート制限と注意事項](#11-レート制限と注意事項)
12. [エラーコード一覧](#12-エラーコード一覧)
13. [利用規約上の注意点](#13-利用規約上の注意点)
14. [トラブルシューティング](#14-トラブルシューティング)

---

## 1. 楽天会員アカウント

楽天ウェブサービスの利用には楽天会員登録が必須です。

既に楽天会員の場合は次のステップへ。未登録の場合は https://www.rakuten.co.jp/ から新規会員登録を行ってください。

---

## 2. アプリ登録（キー取得）

### 2.1 登録ページにアクセス

https://webservice.rakuten.co.jp/app/create にアクセスし、楽天アカウントでログインします。

### 2.2 フォーム入力

| 項目 | 入力内容（alche:me の場合） | 備考 |
|------|------------------------|------|
| **アプリケーション名** ※必須 | `Alcheme` | 任意の名前。用途がわかるもの |
| **アプリケーション URL** ※必須 | `http://localhost:3000` | 開発中は localhost でも可。本番後に変更 |
| **アプリケーションタイプ** ※必須 | `ウェブアプリケーション` | 選択肢から選ぶ |
| **許可された Web サイト** ※必須 | `webservice.rakuten.co.jp` | 1行1ドメイン。ワイルドカード(`*`)対応。API リクエスト元ドメインを全て指定 |
| **アプリケーションの説明** | `コスメ商品情報の検索・補完に使用` | 任意 |
| **データ利用目的** ※必須 | `ユーザーが登録したコスメ商品の正式名称・価格・画像を楽天商品データから補完する目的で使用` | 具体的に書く |
| **予想 QPS** ※必須 | `1` | 無料枠は 1 QPS。開発段階では十分 |
| **API アクセススコープ** | ✅ **楽天市場 API** | 商品検索を使うためこのスコープにチェック |

### 2.3 利用規約に同意して作成

「作成」ボタンをクリックすると、以下の **3つのキー** が発行されます。

| キー | 形式 | 用途 |
|------|------|------|
| **アプリ ID**（`applicationId`） | UUID 形式（例: `ec65ace1-9e87-...`） | API リクエストのパラメータとして指定 |
| **アクセスキー**（`accessKey`） | `pk_` で始まる文字列 | パラメータまたは Authorization ヘッダーで指定 |
| **アフィリエイト ID** | 1アカウントに1つ（全アプリ共通） | アフィリエイト URL 生成に使用（任意） |

### 2.4 キーの確認方法

登録後はいつでも以下のページで確認・編集できます:

https://webservice.rakuten.co.jp/app/list

**1アカウントにつき最大5アプリまで** 登録可能です。

---

## 3. API テスト（動作確認）

### 3.1 テストフォームで確認（最も簡単）

https://webservice.rakuten.co.jp/explorer/api/IchibaItem/Search/

フォームに `applicationId`、`accessKey`、`keyword` を入力して「送信」をクリック。JSON レスポンスが返れば成功です。

### 3.2 ブラウザで直接確認

以下の URL の `YOUR_APP_ID` と `YOUR_ACCESS_KEY` を自分のキーに置き換えてアクセス:

```
https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?applicationId=YOUR_APP_ID&accessKey=YOUR_ACCESS_KEY&keyword=%E3%83%AA%E3%83%83%E3%83%97%E3%83%A2%E3%83%B3%E3%82%B9%E3%82%BF%E3%83%BC&genreId=555086&hits=3&formatVersion=2
```

パラメータの意味:
- `keyword`: `リップモンスター`（UTF-8 URL エンコード済み）
- `genreId`: `555086`（美容・コスメ・香水ジャンル）
- `hits`: `3`（3件だけ返す）
- `formatVersion`: `2`（簡潔な JSON。**常に 2 を推奨**）

### 3.3 curl で確認（Bearer ヘッダー方式）

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_KEY" \
  "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?applicationId=YOUR_APP_ID&keyword=%E3%83%AA%E3%83%83%E3%83%97%E3%83%A2%E3%83%B3%E3%82%B9%E3%82%BF%E3%83%BC&genreId=555086&hits=3&formatVersion=2"
```

---

## 4. 環境変数への設定

### 4.1 .env に設定

```env
# 楽天 Web Service
RAKUTEN_APP_ID=your_application_id_here
RAKUTEN_ACCESS_KEY=your_access_key_here
# RAKUTEN_AFFILIATE_ID=your_affiliate_id_here  # アフィリエイト使用時のみ
```

### 4.2 .env.example（Git 管理対象のテンプレート）

```env
# 楽天 Web Service — https://webservice.rakuten.co.jp/app/list で確認
RAKUTEN_APP_ID=your_application_id_here
RAKUTEN_ACCESS_KEY=your_access_key_here
```

### 4.3 .gitignore 確認

```gitignore
.env
.env.local
```

---

## 5. 認証方式

v2022-06-01 では **アプリ ID** と **アクセスキー** の両方が必須です。アクセスキーの指定方法は2通りあります。

### 方式 A: パラメータで指定（シンプル）

```
?applicationId=YOUR_APP_ID&accessKey=YOUR_ACCESS_KEY&keyword=...
```

### 方式 B: Authorization ヘッダーで指定（推奨）

```
Authorization: Bearer YOUR_ACCESS_KEY
```

ヘッダーで指定する場合も `applicationId` はクエリパラメータとして必須です。

```
GET /services/api/IchibaItem/Search/20220601?applicationId=YOUR_APP_ID&keyword=...
Authorization: Bearer YOUR_ACCESS_KEY
```

**どちらの方式でも動作しますが、セキュリティの観点からヘッダー方式を推奨します。**

---

## 6. 入力パラメータ 完全リファレンス

### リクエスト URL

```
https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?[parameter]=[value]…
```

`keyword` と `sort` の値は **UTF-8 で URL エンコード** が必要です（URL 全体ではなく value 部分のみ）。

### 共通パラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|----------|---|------|----------|------|
| `applicationId` | String | ✅ | — | アプリ ID |
| `accessKey` | String | ✅ | — | アクセスキー（ヘッダーでも指定可） |
| `affiliateId` | String | — | なし | アフィリエイト ID |
| `format` | String | — | `json` | `json` または `xml`。`callback` 指定で JSONP |
| `callback` | String | — | なし | JSONP コールバック関数名 |
| `elements` | String | — | ALL | カンマ区切りで出力パラメータを限定（例: `elements=reviewCount,reviewAverage`） |
| `formatVersion` | int | — | 1 | **2 を強く推奨。** JSON の配列構造が簡潔になる（§8 参照） |

### サービス固有パラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|----------|---|------|----------|------|
| `keyword` | String | ✅* | — | 検索キーワード（UTF-8 URL エンコード、半角128文字以内）。半角スペースで AND 検索（`orFlag=1` で OR）。各キーワードは半角2文字/全角1文字以上（ひらがな・カタカナ・記号は2文字以上） |
| `shopCode` | String | ✅* | — | ショップコード |
| `itemCode` | String | ✅* | — | 商品コード（`shop:1234` 形式） |
| `genreId` | long | ✅* | 0 | ジャンル ID（コスメ: `555086`） |
| `tagId` | long | — | — | タグ ID（最大10個、カンマ区切り） |
| `hits` | int | — | 30 | 取得件数（1〜30） |
| `page` | int | — | 1 | ページ番号（1〜100） |
| `sort` | String | — | `standard` | ソート順（下表参照） |
| `minPrice` | long | — | — | 最小価格（1〜999,999,999） |
| `maxPrice` | long | — | — | 最大価格（minPrice より大きい値） |
| `availability` | int | — | 1 | 0=全商品、**1=販売中のみ** |
| `field` | int | — | 1 | 0=検索対象広い、1=検索対象限定 |
| `carrier` | int | — | 0 | 0=PC、1=モバイル、2=スマートフォン |
| `imageFlag` | int | — | 0 | 0=全商品、**1=画像ありのみ** |
| `orFlag` | int | — | 0 | 0=AND 検索、1=OR 検索 |
| `NGKeyword` | String | — | — | 除外キーワード |
| `purchaseType` | int | — | 0 | 0=通常購入、1=定期購入、2=頒布会 |
| `postageFlag` | int | — | 0 | 1=送料込みのみ |
| `creditCardFlag` | int | — | 0 | 1=カード利用可のみ |
| `giftFlag` | int | — | 0 | 1=ギフト対応のみ |
| `hasReviewFlag` | int | — | 0 | 1=レビューあり商品のみ |
| `hasMovieFlag` | int | — | 0 | 1=動画あり商品のみ |
| `pointRateFlag` | int | — | 0 | 1=ポイント倍付け商品のみ |
| `pointRate` | int | — | — | ポイント倍率で絞り込み（2〜10）。pointRateFlag=1 のときのみ有効 |
| `shipOverseasFlag` | int | — | 0 | 1=海外配送可能のみ |
| `pamphletFlag` | int | — | 0 | 1=資料請求対応のみ |
| `appointDeliveryDateFlag` | int | — | 0 | 1=配送日指定可のみ |
| `genreInformationFlag` | int | — | 0 | 1=ジャンルごとの商品数を取得 |
| `tagInformationFlag` | int | — | 0 | 1=タグごとの商品数を取得（genreId 指定時のみ） |
| `maxAffiliateRate` | float | — | — | アフィリエイト料率の上限（1.0〜99.9） |
| `minAffiliateRate` | float | — | — | アフィリエイト料率の下限（1.0〜99.9） |

*`keyword`, `genreId`, `itemCode`, `shopCode` のいずれか1つは必須。

### ソート順一覧

| 値 | 意味 |
|---|------|
| `standard` | 楽天標準ソート（デフォルト） |
| `+itemPrice` | 価格昇順（安い順） |
| `-itemPrice` | 価格降順（高い順） |
| `+reviewCount` | レビュー件数昇順 |
| `-reviewCount` | レビュー件数降順 |
| `+reviewAverage` | レビュー平均昇順 |
| `-reviewAverage` | レビュー平均降順 |
| `+updateTimestamp` | 商品更新日時昇順 |
| `-updateTimestamp` | 商品更新日時降順（新しい順） |
| `+affiliateRate` | アフィリエイト料率昇順 |
| `-affiliateRate` | アフィリエイト料率降順 |

---

## 7. 出力パラメータ 完全リファレンス

### 全体情報

| パラメータ | 説明 |
|----------|------|
| `count` | 検索結果の総商品数 |
| `page` | 現在のページ番号 |
| `first` | 検索結果の何件目からか |
| `last` | 検索結果の何件目までか |
| `hits` | 1度に返却する商品数 |
| `carrier` | PC=0 / mobile=1 / smartphone=2 |
| `pageCount` | 総ページ数（最大100） |

### 商品情報（`Items` 配列）

| パラメータ | 説明 | 備考 |
|----------|------|------|
| `itemName` | 商品名 | `catchcopy + itemName` で従来の商品名 |
| `catchcopy` | キャッチコピー | |
| `itemCode` | 商品コード | `shop:itemId` 形式 |
| `itemPrice` | 商品価格 | |
| `itemCaption` | 商品説明文 | |
| `itemUrl` | 商品 URL（HTTPS） | affiliateId 指定時は affiliateUrl と同値 |
| `affiliateUrl` | アフィリエイト URL | affiliateId 指定時のみ |
| `imageFlag` | 商品画像有無 | 0=なし、1=あり |
| `smallImageUrls` | 商品画像 64×64 URL（配列） | 最大3枚 |
| `mediumImageUrls` | 商品画像 128×128 URL（配列） | 最大3枚 |
| `availability` | 販売可能フラグ | 0=不可、1=可 |
| `taxFlag` | 消費税フラグ | 0=税込、1=税別 |
| `postageFlag` | 送料フラグ | 0=送料込、1=送料別 |
| `creditCardFlag` | カード利用可 | 0=不可、1=可 |
| `reviewCount` | レビュー件数 | |
| `reviewAverage` | レビュー平均 | |
| `affiliateRate` | アフィリエイト利率 | |
| `startTime` | 販売開始時刻 | タイムセール時のみ（YYYY-MM-DD HH:MM） |
| `endTime` | 販売終了時刻 | タイムセール時のみ |
| `pointRate` | ポイント倍付け | 終了日時がリクエストから24h後以降のみ |
| `pointRateStartTime` | ポイント倍付け開始日時 | |
| `pointRateEndTime` | ポイント倍付け終了日時 | |
| `giftFlag` | ギフト包装可 | 0=不可、1=可 |
| `shopOfTheYearFlag` | ショップオブザイヤー受賞 | 0=未受賞、1=受賞 |
| `shipOverseasFlag` | 海外配送可 | 0=不可、1=可 |
| `shipOverseasArea` | 海外配送対象地域 | `/` 区切り |
| `asurakuFlag` | あす楽対応 | ※2024/07以降は常に0 |

### 店舗情報

| パラメータ | 説明 |
|----------|------|
| `shopName` | 店舗名 |
| `shopCode` | 店舗コード |
| `shopUrl` | 店舗 URL（HTTPS） |
| `shopAffiliateUrl` | 店舗アフィリエイト URL |

### ジャンル・タグ情報

| パラメータ | 説明 |
|----------|------|
| `genreId` | ジャンル ID |
| `tagIds` | タグ ID（配列） |

### 価格帯情報

| パラメータ | 説明 |
|----------|------|
| `itemPriceBaseField` | 基準価格フィールド名 |
| `itemPriceMin1` / `Max1` | 全商品中の最低/最高価格 |
| `itemPriceMin2` / `Max2` | 検索可能商品中の最低/最高価格 |
| `itemPriceMin3` / `Max3` | 購入可能商品中の最低/最高価格 |

### ジャンルごとの商品数（`genreInformationFlag=1` 時）

| パラメータ | 説明 |
|----------|------|
| `parent.genreId` / `genreName` / `genreLevel` | 親ジャンル |
| `current.genreId` / `genreName` / `itemCount` / `genreLevel` | 自ジャンル |
| `children[].genreId` / `genreName` / `itemCount` / `genreLevel` | 子ジャンル（複数） |

### タグごとの商品数（`tagInformationFlag=1` 時）

| パラメータ | 説明 |
|----------|------|
| `tagGroup.tagGroupName` / `tagGroupId` | タググループ情報 |
| `tags[].tagId` / `tagName` / `parentTagId` / `itemCount` | タグ情報（複数） |

---

## 8. formatVersion の違い

**常に `formatVersion=2` を推奨。**

### formatVersion=1（デフォルト）

```json
{"items": [
    {"item": {
        "itemName": "a",
        "itemPrice": 10
    }},
    {"item": {
        "itemName": "b",
        "itemPrice": 20
    }}
]}
```

アクセス: `items[0].item.itemName`（冗長）

### formatVersion=2（推奨）

```json
{"items": [
    {
        "itemName": "a",
        "itemPrice": 10
    },
    {
        "itemName": "b",
        "itemPrice": 20
    }
]}
```

アクセス: `items[0].itemName`（シンプル）

---

## 9. コスメ関連ジャンル ID

| ジャンル ID | ジャンル名 |
|-----------|----------|
| `555086` | **美容・コスメ・香水**（大分類）← alche:me で使用 |
| `100804` | スキンケア |
| `100806` | ベースメイク・メイクアップ |
| `100807` | ネイル |
| `503190` | ヘアケア・スタイリング |

`genreId=555086` でコスメ全般から検索。サブジャンルで絞り込む場合は楽天ジャンル検索 API で確認:

```
https://app.rakuten.co.jp/services/api/IchibaGenre/Search/20120723?applicationId=YOUR_APP_ID&genreId=555086
```

---

## 10. 実装例

### 10.1 Python（httpx + Bearer ヘッダー認証）

```python
import os
import asyncio
import httpx

RAKUTEN_ENDPOINT = (
    "https://app.rakuten.co.jp/services/api/"
    "IchibaItem/Search/20220601"
)

async def search_rakuten_product(
    keyword: str,
    hits: int = 5,
    genre_id: int = 555086,
) -> dict:
    """楽天商品検索 API でコスメ商品を検索する。

    Args:
        keyword: 検索キーワード（日本語そのまま OK、httpx が自動エンコード）
        hits: 取得件数（1〜30）
        genre_id: ジャンル ID（デフォルト: 美容・コスメ）

    Returns:
        API レスポンス（JSON → dict）
    """
    app_id = os.getenv("RAKUTEN_APP_ID")
    access_key = os.getenv("RAKUTEN_ACCESS_KEY")

    if not app_id or not access_key:
        raise EnvironmentError(
            "RAKUTEN_APP_ID and RAKUTEN_ACCESS_KEY must be set. "
            "See rakuten_api_setup_guide.md §2 for details."
        )

    params = {
        "applicationId": app_id,
        "keyword": keyword,
        "genreId": genre_id,
        "hits": min(hits, 30),
        "availability": 1,       # 販売中のみ
        "imageFlag": 1,          # 画像ありのみ
        "formatVersion": 2,      # 簡潔な JSON
    }

    headers = {
        "Authorization": f"Bearer {access_key}",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            RAKUTEN_ENDPOINT,
            params=params,
            headers=headers,
        )
        response.raise_for_status()
        return response.json()


def extract_product_info(api_response: dict) -> list[dict]:
    """API レスポンスから必要なフィールドを抽出する。

    formatVersion=2 前提（items[0].itemName でアクセス可能）。
    """
    items = api_response.get("Items", [])
    results = []
    for item in items:
        images = item.get("mediumImageUrls", [])
        results.append({
            "name": item.get("itemName", ""),
            "catchcopy": item.get("catchcopy", ""),
            "price": item.get("itemPrice", 0),
            "shop": item.get("shopName", ""),
            "url": item.get("itemUrl", ""),
            "image_url": images[0] if images else None,
            "review_avg": item.get("reviewAverage", 0),
            "review_count": item.get("reviewCount", 0),
            "item_code": item.get("itemCode", ""),
        })
    return results


# テスト実行
async def main():
    result = await search_rakuten_product("リップモンスター", hits=3)
    products = extract_product_info(result)
    for p in products:
        print(f"{p['name']} - ¥{p['price']} ({p['shop']})")

if __name__ == "__main__":
    asyncio.run(main())
```

### 10.2 TypeScript（fetch + Bearer ヘッダー認証）

```typescript
const RAKUTEN_ENDPOINT =
  "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

interface RakutenProduct {
  name: string;
  catchcopy: string;
  price: number;
  shop: string;
  url: string;
  imageUrl: string | null;
  reviewAvg: number;
  reviewCount: number;
  itemCode: string;
}

async function searchRakutenProduct(
  keyword: string,
  hits = 5,
  genreId = 555086
): Promise<RakutenProduct[]> {
  const appId = process.env.RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;

  if (!appId || !accessKey) {
    throw new Error("RAKUTEN_APP_ID and RAKUTEN_ACCESS_KEY must be set");
  }

  const params = new URLSearchParams({
    applicationId: appId,
    keyword,
    genreId: String(genreId),
    hits: String(Math.min(hits, 30)),
    availability: "1",
    imageFlag: "1",
    formatVersion: "2",
  });

  const res = await fetch(`${RAKUTEN_ENDPOINT}?${params}`, {
    headers: {
      Authorization: `Bearer ${accessKey}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `Rakuten API error ${res.status}: ${error.error_description || "Unknown"}`
    );
  }

  const data = await res.json();
  const items = data.Items || [];

  return items.map((item: any) => ({
    name: item.itemName || "",
    catchcopy: item.catchcopy || "",
    price: item.itemPrice || 0,
    shop: item.shopName || "",
    url: item.itemUrl || "",
    imageUrl: item.mediumImageUrls?.[0] ?? null,
    reviewAvg: item.reviewAverage || 0,
    reviewCount: item.reviewCount || 0,
    itemCode: item.itemCode || "",
  }));
}
```

### 10.3 レート制限を考慮した実装（Python）

```python
import asyncio
import time

_last_request_time = 0.0

async def search_with_rate_limit(keyword: str, **kwargs) -> dict:
    """1秒1リクエスト制限を守る楽天 API ラッパー。"""
    global _last_request_time

    # 前回リクエストから1秒未満の場合は待機
    elapsed = time.time() - _last_request_time
    if elapsed < 1.0:
        await asyncio.sleep(1.0 - elapsed)

    _last_request_time = time.time()
    return await search_rakuten_product(keyword, **kwargs)
```

---

## 11. レート制限と注意事項

| 項目 | 制限値 |
|------|--------|
| **リクエスト頻度** | 1秒1リクエスト（無料枠） |
| **同一 URL 連続アクセス** | 短時間に大量アクセスすると一時ブロック |
| **1アカウントのアプリ数** | 最大5個 |
| **keyword の長さ** | 半角128文字以内 |
| **keyword の最小長** | 半角2文字 / 全角1文字（ひらがな・カタカナ・記号は2文字以上） |
| **取得件数** | 1リクエストあたり最大30件 |
| **総ページ数** | 最大100ページ（= 最大3,000件） |

### 実装時の重要ポイント

- **1秒間隔:** リクエスト間に最低1秒の間隔を空ける
- **リトライ:** HTTP 429 を受けたら指数バックオフ（2秒→4秒→8秒）
- **キャッシュ:** 同一キーワードの結果は数時間〜1日キャッシュして呼び出しを削減
- **クレジット表示:** 楽天 API で取得したデータを表示する画面には `Supported by Rakuten Developers` のクレジット表示が **必須**（§13 参照）

---

## 12. エラーコード一覧

| HTTP | error | error_description 例 | 対処 |
|------|-------|---------------------|------|
| **400** | `wrong_parameter` | `specify valid applicationId` | applicationId が空または不正 |
| **400** | `wrong_parameter` | `keyword parameter is not valid` | keyword が短すぎ/空白のみ |
| **404** | `not_found` | `not found` | 該当データなし。検索条件を広げる |
| **429** | `too_many_requests` | `number of allowed requests has been exceeded...` | レート制限超過。数秒〜数分待ってリトライ |
| **500** | `system_error` | `api logic error` | 楽天側エラー。時間を置いてリトライ |
| **503** | `service_unavailable` | `XXX/XXX is under maintenance` | メンテナンス中 |

### エラーレスポンスの形式

```json
{
    "error": "wrong_parameter",
    "error_description": "specify valid applicationId"
}
```

---

## 13. 利用規約上の注意点

### 必須事項

- **クレジット表示:** 楽天データを表示するすべての画面に「Supported by Rakuten Developers」を表示（規約 §13）
- **楽天サイトへのリンク:** API で取得した商品情報から楽天サイトへのリンクを設置（規約 §8-4）
- **アフィリエイト利用:** 収益を得る場合は楽天アフィリエイトを使用（規約 §10-4, §10-5）

### 禁止事項（主要なもの）

- API データを規約で定める目的以外に使用・複製・改変（規約 §10-7）
- 不特定多数がアクセスできる場所に API データを保管（規約 §10-9）
- 楽天の商号・商標を含む URL の使用（規約 §10-8）
- 楽天と提携関係があるかのような表示（規約 §10-1）
- 楽天と競合するサービスへの使用（規約 §10-6）

### alche:me での対応

alche:me では楽天 API を **商品情報の補完**（商品名・価格・画像の参照データ）に使用:
- 楽天商品データ表示画面に「Supported by Rakuten Developers」クレジットを表示
- 商品情報から楽天商品ページへのリンクを設置
- 将来アフィリエイト収益を得る場合は楽天アフィリエイト ID を使用

---

## 14. トラブルシューティング

### 「specify valid applicationId」エラー

→ `applicationId` が空、またはフォーマットが違う。UUID 形式であることを確認。

### 「keyword parameter is not valid」エラー

→ keyword が半角1文字のみ、URL エンコードされていない、または空白のみ。半角2文字/全角1文字以上で指定し、UTF-8 URL エンコードする。

### 結果が0件

→ `genreId` を外して keyword のみで試す。`availability=0`（全商品）にする。廃盤品はヒットしない場合あり。

### 429 エラーが頻発

→ リクエスト間隔を2秒以上に。レスポンスをキャッシュ。同一 URL の連続アクセスを避ける。

### 画像 URL が返らない

→ `imageFlag=1` を指定していても `mediumImageUrls` が空配列の場合がある。null チェックを必ず入れる。

### formatVersion=1 のレスポンスが返ってくる

→ `formatVersion=2` をパラメータで明示的に指定しているか確認。デフォルトは 1。

### アクセスキーが認識されない

→ Authorization ヘッダー方式の場合は `Bearer ` プレフィックスを忘れていないか確認。パラメータ方式の場合は `accessKey=` で指定しているか確認。

---

## Appendix A: API エンドポイント一覧

| API 名 | エンドポイント |
|--------|------------|
| **商品検索** | `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601` |
| **ジャンル検索** | `https://app.rakuten.co.jp/services/api/IchibaGenre/Search/20120723` |
| **商品ランキング** | `https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20220601` |
| **タグ検索** | `https://app.rakuten.co.jp/services/api/IchibaTag/Search/20140222` |

## Appendix B: alche:me 推奨パラメータ設定

```python
# alche:me Product Search Agent 推奨パラメータ
ALCHEME_RAKUTEN_DEFAULTS = {
    "genreId": 555086,       # 美容・コスメ・香水
    "hits": 5,               # 上位5件で十分
    "availability": 1,       # 販売中のみ
    "imageFlag": 1,          # 画像ありのみ（カード表示に必須）
    "formatVersion": 2,      # 簡潔な JSON
    "sort": "-reviewCount",  # レビュー件数が多い順（信頼性重視）
}
```

---

*— End of Document —*
