/**
 * Analytics utility functions
 * Simplified - no external parser needed
 */

export interface AnalyticsData {
  ip_address: string;
  session_id?: string;
}

/**
 * Extract IP address from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  
  if (cfConnectingIP) {
    return cfConnectingIP.split(",")[0].trim();
  }
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIP) {
    return realIP.split(",")[0].trim();
  }
  
  return "0.0.0.0"; // Fallback
}

// Simplified analytics - only track IP for unique views/clicks

/**
 * Generate or get session ID from request
 * Simplified - uses IP-based session for deduplication
 */
export function getSessionId(request: Request): string {
  // Generate a simple session ID based on IP (for 1-hour deduplication window)
  const ip = getClientIP(request);
  const hour = Math.floor(Date.now() / (60 * 60 * 1000)); // Current hour timestamp
  return `${ip}-${hour}`;
}

/**
 * Extract analytics data from request - simplified to only track IP for unique views/clicks
 */
export async function extractAnalyticsData(request: Request): Promise<AnalyticsData> {
  const ip = getClientIP(request);
  const sessionId = getSessionId(request);

  return {
    ip_address: ip,
    session_id: sessionId,
  };
}

