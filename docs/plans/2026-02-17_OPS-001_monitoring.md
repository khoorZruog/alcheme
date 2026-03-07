# OPS-001: Open-Meteo APIコール監視 & アラート設定

| | |
|---|---|
| **Date** | 2026-02-17 |
| **Status** | Completed (code changes) / Ready to configure (GCP) |
| **Scope** | 構造化ログ追加、Agent インメモリキャッシュ、Cloud Monitoring 設定手順書 |

---

## Context

Open-Meteo の無料枠は **1日 10,000 APIコール**。現在のコール数は少ないが、ユーザー増加時に上限に達するリスクがある。

### 現状の問題点

1. **API コール数の集計メカニズムがない** — Cloud Logging にはログが出ているが、集計されていない
2. **アラートがない** — 上限に近づいても通知されない
3. **キャッシュが不統一** — Web は Next.js ISR (15分) があるが、Python Agent はキャッシュなし
4. **ログが非構造化** — Cloud Monitoring での集計が困難

---

## 実装内容

### Step 1: 構造化ログの追加

両サービスに `weather_api_call` という固定メッセージの JSON ログを追加。Cloud Logging の Log-based Metrics でフィルタ・集計が可能。

**変更ファイル:**
- `app/api/weather/route.ts` — Google Weather 成功時 / Open-Meteo 成功時に構造化ログ出力
- `agent/alcheme/tools/weather_tools.py` — 同上

### Step 2: Python Agent のインメモリキャッシュ

`_weather_cache` dict + `_CACHE_TTL = 900` (15分) で同一地点への重複リクエストを削減。座標を小数2桁で丸めてキー化。

**変更ファイル:**
- `agent/alcheme/tools/weather_tools.py` — `_get_cached()`, `_set_cache()` 追加、`get_weather()` でキャッシュチェック

### Step 3: Cloud Monitoring 設定手順書

GCP コンソール / gcloud CLI で設定する手順をガイドとして作成。

**新規ファイル:**
- `docs/guides/cloud-monitoring-setup.md`

---

## 検証

1. `npx tsc --noEmit` — 型エラーなし ✅
2. `npx vitest run` — 127テスト全パス ✅

---

## 影響範囲

| 変更 | リスク |
|------|--------|
| 構造化ログ追加 | 極低（既存動作に影響なし） |
| インメモリキャッシュ | 低（キャッシュミス時は従来通りAPI呼出） |
| Cloud Monitoring 設定 | なし（インフラ側設定のみ、未適用） |
