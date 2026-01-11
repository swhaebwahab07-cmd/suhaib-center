/**
 * Unified batched analytics tracking utility
 * Stores views and clicks locally and sends them in batches every 2.5 hours
 * Reduces API calls to maximum ~9.6 requests per day (under 10/day limit)
 * Even with 10k+ views/clicks, maintains <10 edge requests per day
 */

const ANALYTICS_QUEUE_KEY = "suhaib_analytics_queue";
// Batch every 2.5 hours = ~9.6 requests per day (under 10 requests/day limit)
const BATCH_INTERVAL = 2.5 * 60 * 60 * 1000; // 9,000,000 ms = 2.5 hours
const MAX_QUEUE_SIZE = 1000; // Send immediately if queue reaches this size (safety limit for high traffic)
const MIN_BATCH_SIZE = 1; // Minimum items before sending (always send if there's data)

interface QueuedView {
  type: "view";
  linktreeUid: string;
  timestamp: number;
}

interface QueuedClick {
  type: "click";
  linkId: string;
  timestamp: number;
}

type QueuedAnalytics = QueuedView | QueuedClick;

let batchTimer: ReturnType<typeof setTimeout> | null = null;
let isSending = false;

/**
 * Add page view to queue
 */
export function queueView(linktreeUid: string): void {
  if (typeof window === "undefined") return;

  try {
    const queue = getQueue();
    queue.push({
      type: "view",
      linktreeUid,
      timestamp: Date.now(),
    });
    saveQueue(queue);

    // Send immediately if queue is full (safety limit)
    if (queue.length >= MAX_QUEUE_SIZE) {
      sendBatch();
    } else {
      // Schedule batch send if not already scheduled
      scheduleBatch();
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Add click to queue
 */
export function queueClick(linkId: string): void {
  if (typeof window === "undefined") return;

  try {
    const queue = getQueue();
    queue.push({
      type: "click",
      linkId,
      timestamp: Date.now(),
    });
    saveQueue(queue);

    // Send immediately if queue is full (safety limit)
    if (queue.length >= MAX_QUEUE_SIZE) {
      sendBatch();
    } else {
      // Schedule batch send if not already scheduled
      scheduleBatch();
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get current queue from storage
 */
function getQueue(): QueuedAnalytics[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(ANALYTICS_QUEUE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as QueuedAnalytics[];
  } catch {
    return [];
  }
}

/**
 * Save queue to storage
 */
function saveQueue(queue: QueuedAnalytics[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Schedule batch send (every 2.5 hours = ~9.6 requests/day)
 * This ensures maximum 10 edge requests per day even with high traffic
 */
function scheduleBatch(): void {
  if (typeof window === "undefined") return;
  if (batchTimer) return; // Already scheduled

  batchTimer = setTimeout(() => {
    batchTimer = null;
    const queue = getQueue();
    // Only send if there's data (respects minimum batch size)
    if (queue.length >= MIN_BATCH_SIZE) {
      sendBatch();
    }
    // Schedule next batch after sending (or even if empty, to check periodically)
    scheduleBatch();
  }, BATCH_INTERVAL);
}

/**
 * Send batched analytics to API
 */
async function sendBatch(): Promise<void> {
  if (typeof window === "undefined") return;
  if (isSending) return; // Already sending

  const queue = getQueue();
  if (queue.length === 0) return; // Nothing to send

  isSending = true;

  try {
    // Separate views and clicks
    const views: QueuedView[] = [];
    const clicks: QueuedClick[] = [];

    for (const item of queue) {
      if (item.type === "view") {
        views.push(item);
      } else if (item.type === "click") {
        clicks.push(item);
      }
    }

    // Group views by linktreeUid and count them
    const viewCounts = new Map<string, number>();
    for (const view of views) {
      const count = viewCounts.get(view.linktreeUid) || 0;
      viewCounts.set(view.linktreeUid, count + 1);
    }

    // Group clicks by linkId and count them
    const clickCounts = new Map<string, number>();
    for (const click of clicks) {
      const count = clickCounts.get(click.linkId) || 0;
      clickCounts.set(click.linkId, count + 1);
    }

    // Prepare batch payload
    const batch = {
      views: Array.from(viewCounts.entries()).map(([linktreeUid, count]) => ({
        linktreeUid,
        count,
      })),
      clicks: Array.from(clickCounts.entries()).map(([linkId, count]) => ({
        linkId,
        count,
      })),
    };

    // Only send if there's data (respects minimum batch size)
    const totalItems = batch.views.length + batch.clicks.length;
    if (totalItems < MIN_BATCH_SIZE) {
      // Not enough data yet, keep in queue for next batch
      return;
    }

    // Send batch using sendBeacon (non-blocking, works even on page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(batch)], {
        type: "application/json",
      });
      const sent = navigator.sendBeacon("/api/public/analytics/batch", blob);
      if (sent) {
        // Clear queue only if successfully sent
        saveQueue([]);
      }
    } else if (typeof fetch !== "undefined") {
      // Fallback to fetch
      try {
        const response = await fetch("/api/public/analytics/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
          keepalive: true,
        });
        if (response.ok) {
          saveQueue([]);
        }
      } catch {
        // Keep queue for retry
      }
    }
  } catch {
    // Keep queue for retry
  } finally {
    isSending = false;
  }
}

/**
 * Flush queue immediately (call on page unload)
 */
export function flushAnalyticsQueue(): void {
  if (typeof window === "undefined") return;
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  sendBatch();
}

// Initialize batch timer on load
if (typeof window !== "undefined") {
  // Schedule first batch (will run every 2.5 hours)
  scheduleBatch();

  // Flush queue on page unload (only if there's significant data)
  // This prevents data loss while still minimizing requests
  window.addEventListener("beforeunload", () => {
    const queue = getQueue();
    // Only flush if there's meaningful data (at least 5 items)
    if (queue.length >= 5) {
      flushAnalyticsQueue();
    }
  });
  window.addEventListener("pagehide", () => {
    const queue = getQueue();
    // Only flush if there's meaningful data (at least 5 items)
    if (queue.length >= 5) {
      flushAnalyticsQueue();
    }
  });
}
