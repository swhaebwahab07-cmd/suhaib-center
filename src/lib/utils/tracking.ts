/**
 * Simple client-side tracking utility to prevent duplicate API calls
 * Uses localStorage to track views/clicks per session
 */

const STORAGE_KEY_PREFIX = "suhaib_tracking_";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if already tracked in this session
 */
function isTracked(key: string): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    if (!stored) return false;
    
    const data = JSON.parse(stored) as { timestamp: number };
    const { timestamp } = data;
    const now = Date.now();
    
    // If older than session duration, consider it new
    if (now - timestamp > SESSION_DURATION) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Mark as tracked
 */
function markTracked(key: string): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${key}`,
      JSON.stringify({ timestamp: Date.now() })
    );
  } catch {
    // Ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

/**
 * Track page view (only once per session)
 */
export function trackPageView(uid: string): boolean {
  const key = `view_${uid}`;
  
  if (isTracked(key)) {
    return false; // Already tracked
  }
  
  markTracked(key);
  return true; // Should track
}

/**
 * Track link click (only once per session per link)
 */
export function trackLinkClick(linkId: string): boolean {
  const key = `click_${linkId}`;
  
  if (isTracked(key)) {
    return false; // Already tracked
  }
  
  markTracked(key);
  return true; // Should track
}

/**
 * Clean up old tracking data (runs periodically)
 */
export function cleanupTracking(): void {
  if (typeof window === "undefined") return;
  
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let cleaned = 0;
    
    for (const key of keys) {
      if (!key.startsWith(STORAGE_KEY_PREFIX)) continue;
      
      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;
        
        const data = JSON.parse(stored) as { timestamp: number };
        const { timestamp } = data;
        if (now - timestamp > SESSION_DURATION) {
          localStorage.removeItem(key);
          cleaned++;
        }
      } catch {
        // Remove invalid entries
        localStorage.removeItem(key);
        cleaned++;
      }
    }
    
    // Clean up if we have too many entries (prevent storage bloat)
    if (cleaned > 0 || keys.filter(k => k.startsWith(STORAGE_KEY_PREFIX)).length > 100) {
      // Keep only recent entries
      const trackingKeys = keys.filter(k => k.startsWith(STORAGE_KEY_PREFIX));
      trackingKeys.sort((a, b) => {
        const aData = localStorage.getItem(a);
        const bData = localStorage.getItem(b);
        const aTime = aData ? (JSON.parse(aData) as { timestamp: number }).timestamp : 0;
        const bTime = bData ? (JSON.parse(bData) as { timestamp: number }).timestamp : 0;
        return bTime - aTime; // Newest first
      });
      
      // Remove oldest entries if more than 50
      if (trackingKeys.length > 50) {
        for (let i = 50; i < trackingKeys.length; i++) {
          localStorage.removeItem(trackingKeys[i]);
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

// Run cleanup on load (once per page load)
if (typeof window !== "undefined") {
  // Run cleanup after a short delay to not block page load
  setTimeout(cleanupTracking, 1000);
}
