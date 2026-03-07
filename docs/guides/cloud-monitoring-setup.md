# Cloud Monitoring — Open-Meteo APIコール監視セットアップ

| | |
|---|---|
| **Date** | 2026-02-17 |
| **Related** | OPS-001, BUG-001 (Open-Meteo フォールバック実装) |
| **Status** | Ready to configure |

---

## 概要

Open-Meteo の無料枠は **1日 10,000 APIコール**。本ガイドでは Cloud Monitoring を使って API コール数を監視し、上限接近時にアラートを発報する設定手順を記載する。

### 前提条件

- `cloudbuild.yaml` で `logging: CLOUD_LOGGING_ONLY` が設定済み（両サービスのログが Cloud Logging に送信される）
- コードに構造化ログ（`weather_api_call`）が実装済み

---

## 1. 構造化ログの仕様

コード側で以下の JSON 形式のログを出力する:

```json
{
  "severity": "INFO",
  "message": "weather_api_call",
  "source": "open-meteo",
  "endpoint": "/api/weather"
}
```

| フィールド | 値 | 説明 |
|-----------|---|------|
| `message` | `weather_api_call` | 固定値。Log-based Metric のフィルタに使用 |
| `source` | `open-meteo` / `google-weather` | API ソースの識別 |
| `endpoint` | `/api/weather` / `agent/weather` | 呼び出し元（Web / Agent） |

---

## 2. Log-based Metric の作成

### gcloud CLI

```bash
# Open-Meteo コール数（Web + Agent 合算）
gcloud logging metrics create open_meteo_api_calls \
  --project=PROJECT_ID \
  --description="Count of Open-Meteo API calls (Web + Agent)" \
  --log-filter='jsonPayload.message="weather_api_call" AND jsonPayload.source="open-meteo"'
```

### GCP コンソール

1. **Logging** > **Log-based Metrics** > **Create Metric**
2. Metric Type: **Counter**
3. Log filter:
   ```
   jsonPayload.message="weather_api_call"
   jsonPayload.source="open-meteo"
   ```
4. Name: `open_meteo_api_calls`
5. Save

---

## 3. Alert Policy の作成

### gcloud CLI

```bash
# アラート通知チャネルを先に作成（Email）
gcloud beta monitoring channels create \
  --display-name="OPS Alert Email" \
  --type=email \
  --channel-labels=email_address=YOUR_EMAIL@example.com \
  --project=PROJECT_ID

# チャネルID取得
CHANNEL_ID=$(gcloud beta monitoring channels list \
  --filter='displayName="OPS Alert Email"' \
  --format='value(name)' \
  --project=PROJECT_ID)

# アラートポリシー作成
gcloud beta monitoring policies create \
  --display-name="Open-Meteo Daily Limit Alert (8000)" \
  --condition-display-name="Open-Meteo calls > 8000/day" \
  --condition-filter='metric.type="logging.googleapis.com/user/open_meteo_api_calls" AND resource.type="cloud_run_revision"' \
  --condition-threshold-value=8000 \
  --condition-threshold-duration=0s \
  --condition-threshold-comparison=COMPARISON_GT \
  --aggregation-alignment-period=86400s \
  --aggregation-per-series-aligner=ALIGN_SUM \
  --notification-channels=$CHANNEL_ID \
  --project=PROJECT_ID
```

### GCP コンソール

1. **Monitoring** > **Alerting** > **Create Policy**
2. Condition:
   - Metric: `logging/user/open_meteo_api_calls`
   - Alignment Period: 24 hours
   - Aligner: Sum
   - Threshold: 8,000
3. Notification Channel: Email (設定画面から追加)
4. Name: `Open-Meteo Daily Limit Alert (8000)`

---

## 4. Dashboard の作成（オプション）

### GCP コンソール

1. **Monitoring** > **Dashboards** > **Create Dashboard**
2. Name: `Weather API Monitoring`
3. Add Widget: **Line Chart**
   - Metric: `logging/user/open_meteo_api_calls`
   - Alignment: 1 hour, Sum
4. Add Widget: **Scorecard**
   - Metric: `logging/user/open_meteo_api_calls`
   - Alignment: 24 hours, Sum
   - Threshold: 8,000 (yellow), 9,500 (red)

---

## 5. キャッシュ戦略

現在のキャッシュ構成:

| レイヤー | 対象 | TTL | 備考 |
|---------|------|-----|------|
| Next.js ISR | Web (`/api/weather`) | 15分 | `{ next: { revalidate: 900 } }` |
| インメモリ | Agent (`weather_tools.py`) | 15分 | `_weather_cache` dict、座標を小数2桁で丸めてキー化 |

### 将来の拡張オプション

- **Cloud Memorystore (Redis)**: 複数インスタンス間でキャッシュ共有が必要な場合
- **Cloud CDN**: エンドユーザーに近い場所でキャッシュ（天気データは地域性が高いため効果大）

---

## 6. 上限到達時の対応

1. **アラート受信** — 日次 8,000 コールでメール通知
2. **原因調査** — Cloud Logging で呼び出しパターンを確認:
   ```
   jsonPayload.message="weather_api_call"
   jsonPayload.source="open-meteo"
   ```
3. **緩和策**:
   - キャッシュ TTL を延長（15分 → 30分）
   - Agent 側で不要な重複呼び出しを削減
   - Google Weather API が日本対応した場合、そちらに切替
4. **上限到達時**: Open-Meteo がレートリミットを返す場合、既存のフォールバック処理で `null` レスポンスが返される（ユーザーに天気なしでメイク提案が行われる）

---

*Created: 2026-02-17*
