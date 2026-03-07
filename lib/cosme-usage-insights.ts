/**
 * Cosme usage insights — pure analysis functions.
 *
 * Computes actionable insights from inventory + beauty-log data
 * (new_unused, dormant, expiring, duplicate, low_remaining).
 */

import type { InventoryItem } from "@/types/inventory";
import type { BeautyLogEntry } from "@/types/beauty-log";
import { getPaoMonths } from "@/lib/cosme-constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InsightType =
  | "new_unused"
  | "dormant"
  | "expiring"
  | "duplicate"
  | "low_remaining";

export interface CosmeInsight {
  type: InsightType;
  item: InventoryItem;
  label: string;
  description: string;
  priority: number; // 1 (highest) – 5 (lowest)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000;

function daysBetween(a: string, b: string): number {
  return Math.floor(
    (new Date(b).getTime() - new Date(a).getTime()) / DAY_MS
  );
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseRemaining(v: string): number {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? 100 : n;
}

// ---------------------------------------------------------------------------
// Per-item analysis
// ---------------------------------------------------------------------------

/** Get the most recent date an item was used (from beauty logs). */
export function getLastUsedDate(
  itemId: string,
  logs: BeautyLogEntry[]
): string | null {
  let latest: string | null = null;
  for (const log of logs) {
    if (log.used_items?.includes(itemId)) {
      if (!latest || log.date > latest) latest = log.date;
    }
  }
  return latest;
}

/** Count how many times the item was used within a date range. */
function usageCount(
  itemId: string,
  logs: BeautyLogEntry[],
  sinceDate: string
): number {
  let count = 0;
  for (const log of logs) {
    if (log.date >= sinceDate && log.used_items?.includes(itemId)) count++;
  }
  return count;
}

/** Check if the item is expiring within `thresholdDays`. */
export function isExpiringSoon(
  item: InventoryItem,
  thresholdDays = 30
): boolean {
  if (!item.open_date) return false;
  const pao = item.pao_months ?? getPaoMonths(item.item_type);
  if (!pao) return false;
  const openDate = new Date(item.open_date);
  const expiryDate = new Date(openDate);
  expiryDate.setMonth(expiryDate.getMonth() + pao);
  const remaining = daysBetween(todayStr(), expiryDate.toISOString().slice(0, 10));
  return remaining >= 0 && remaining <= thresholdDays;
}

/** Days until expiry (negative = already expired). null if unknown. */
export function daysUntilExpiry(item: InventoryItem): number | null {
  if (!item.open_date) return null;
  const pao = item.pao_months ?? getPaoMonths(item.item_type);
  if (!pao) return null;
  const openDate = new Date(item.open_date);
  const expiryDate = new Date(openDate);
  expiryDate.setMonth(expiryDate.getMonth() + pao);
  return daysBetween(todayStr(), expiryDate.toISOString().slice(0, 10));
}

// ---------------------------------------------------------------------------
// Insight detectors
// ---------------------------------------------------------------------------

function detectNewUnused(
  items: InventoryItem[],
  logs: BeautyLogEntry[],
  today: string
): CosmeInsight[] {
  const results: CosmeInsight[] = [];
  for (const item of items) {
    const ageDays = daysBetween(item.created_at.slice(0, 10), today);
    if (ageDays > 14 || ageDays < 0) continue;
    const lastUsed = getLastUsedDate(item.id, logs);
    if (lastUsed) continue;
    results.push({
      type: "new_unused",
      item,
      label: "新しく入手",
      description: ageDays <= 1
        ? "登録したばかり、まだ使っていません"
        : `${ageDays}日前に登録、まだ使っていません`,
      priority: 1,
    });
  }
  return results;
}

function detectExpiring(items: InventoryItem[]): CosmeInsight[] {
  const results: CosmeInsight[] = [];
  for (const item of items) {
    const remaining = daysUntilExpiry(item);
    if (remaining === null || remaining > 30 || remaining < 0) continue;
    results.push({
      type: "expiring",
      item,
      label: "期限まもなく",
      description:
        remaining <= 0
          ? "使用期限を過ぎています"
          : `あと${remaining}日で使用期限です`,
      priority: 1,
    });
  }
  return results;
}

function detectLowRemaining(
  items: InventoryItem[],
  logs: BeautyLogEntry[],
  today: string
): CosmeInsight[] {
  const results: CosmeInsight[] = [];
  const since = new Date(today);
  since.setDate(since.getDate() - 14);
  const sinceStr = since.toISOString().slice(0, 10);

  for (const item of items) {
    const pct = parseRemaining(item.estimated_remaining);
    if (pct > 20) continue;
    const count = usageCount(item.id, logs, sinceStr);
    if (count < 3) continue;
    results.push({
      type: "low_remaining",
      item,
      label: "残りわずか",
      description: `残量${pct}%、直近2週間で${count}回使用`,
      priority: 2,
    });
  }
  return results;
}

function detectDormant(
  items: InventoryItem[],
  logs: BeautyLogEntry[],
  today: string
): CosmeInsight[] {
  const results: CosmeInsight[] = [];
  for (const item of items) {
    const lastUsed = getLastUsedDate(item.id, logs);
    if (!lastUsed) continue; // new_unused handles never-used items
    const dormantDays = daysBetween(lastUsed, today);
    if (dormantDays < 30) continue;
    results.push({
      type: "dormant",
      item,
      label: "しばらく未使用",
      description: `最後に使ったのは${dormantDays}日前です`,
      priority: 3,
    });
  }
  return results;
}

function detectDuplicate(items: InventoryItem[]): CosmeInsight[] {
  const results: CosmeInsight[] = [];

  // Group by product_id or brand+product_name
  const groups = new Map<string, InventoryItem[]>();
  for (const item of items) {
    const key = item.product_id || `${item.brand}::${item.product_name}`;
    const arr = groups.get(key) || [];
    arr.push(item);
    groups.set(key, arr);
  }

  for (const [, group] of groups) {
    if (group.length < 2) continue;
    for (const item of group) {
      results.push({
        type: "duplicate",
        item,
        label: "ダブり",
        description: `同じ商品を${group.length}個持っています`,
        priority: 4,
      });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

const MAX_INSIGHTS = 10;

export function computeCosmeInsights(
  items: InventoryItem[],
  logs: BeautyLogEntry[]
): CosmeInsight[] {
  const today = todayStr();

  const all: CosmeInsight[] = [
    ...detectNewUnused(items, logs, today),
    ...detectExpiring(items),
    ...detectLowRemaining(items, logs, today),
    ...detectDormant(items, logs, today),
    ...detectDuplicate(items),
  ];

  // Deduplicate: keep highest-priority insight per item
  const bestPerItem = new Map<string, CosmeInsight>();
  for (const insight of all) {
    const existing = bestPerItem.get(insight.item.id);
    if (!existing || insight.priority < existing.priority) {
      bestPerItem.set(insight.item.id, insight);
    }
  }

  return [...bestPerItem.values()]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, MAX_INSIGHTS);
}
