"use client";

import { memo, useState, useEffect } from "react";
import {
  X,
  Loader2,
  MousePointerClick,
  Users,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "./analytics/StatCard";


// Add custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(243, 244, 246, 0.5);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.7);
  }
`;

interface AnalyticsData {
  unique_views: number;
  unique_clicks: number;
  top_clicked_links: Array<{
    link_id: string;
    platform: string;
    display_name?: string;
    click_count: number;
  }>;
}

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  linktreeId: string;
  linktreeName: string;
}

export const AnalyticsModal = memo(function AnalyticsModal({
  isOpen,
  onClose,
  linktreeId,
  linktreeName,
}: AnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen && linktreeId) {
      // Fetch analytics (will use cache if available)
      fetchAnalytics();
      
      // Removed auto-refresh - user can manually refresh if needed
      // This reduces unnecessary API calls (30-day cache is sufficient)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, linktreeId]);

  const fetchAnalytics = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const cacheKey = `analytics_${linktreeId}`;
      
      // Clear cache if force refresh
      if (forceRefresh) {
        try {
          localStorage.removeItem(cacheKey);
        } catch {
          // Ignore storage errors
        }
      } else {
        // Check browser cache first (30-day cache)
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            const cacheTime = parsed.timestamp || 0;
            const now = Date.now();
            // Use cached data if less than 30 days old (2592000000 ms = 30 days)
            if (now - cacheTime < 2592000000) {
              setAnalytics(parsed.data);
              setLastUpdated(new Date(parsed.timestamp));
              setIsLoading(false);
              return;
            }
          } catch {
            // Invalid cache, continue to fetch
          }
        }
      }

      const response = await fetch(`/api/linktrees/${linktreeId}/analytics`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch analytics" }));
        throw new Error(errorData.error || "Failed to fetch analytics");
      }
      
      const result = await response.json();
      setAnalytics(result.data);
      setLastUpdated(new Date());
      
      // Cache in localStorage for 30 days (2592000000 ms)
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: result.data,
          timestamp: Date.now(),
        }));
      } catch {
        // Ignore storage errors (private browsing, quota exceeded, etc.)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "داتاکان بار نەکران");
      console.error("Error fetching analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAnalytics = async () => {
    setIsClearing(true);
    setError(null);
    try {
      const response = await fetch(`/api/linktrees/${linktreeId}/analytics/clear`, {
        method: 'DELETE',
        cache: 'no-store',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to clear analytics");
      }
      
      // Clear cache and refresh analytics after clearing
      try {
        localStorage.removeItem(`analytics_${linktreeId}`);
      } catch {
        // Ignore storage errors
      }
      await fetchAnalytics(true);
      setShowConfirmDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "هەڵەیەک ڕوویدا");
      console.error("Error clearing analytics:", err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={handleBackdropClick}
        dir="rtl"
      >
      <div 
        className="relative w-full max-w-5xl my-4 sm:my-8 rounded-lg sm:rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-5 sm:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200">
                  <BarChart3 className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-kurdish">داتاکانی بینین</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 font-kurdish truncate">{linktreeName}</p>
                </div>
              </div>
              {lastUpdated && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                  <span className="font-kurdish">
                    دواتر نوێکرایەوە: {new Intl.DateTimeFormat("ku", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }).format(lastUpdated)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  fetchAnalytics(true);
                }}
                disabled={isLoading || isClearing}
                className="group relative p-2.5 rounded-lg hover:bg-gray-100 transition-all text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 hover:border-gray-400"
                aria-label="Refresh"
                title="نوێکردنەوە"
              >
                <RefreshCw className={`h-5 w-5 transition-transform ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              </button>
              <button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isLoading || isClearing}
                className="group relative p-2.5 rounded-lg hover:bg-red-50 transition-all text-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 hover:border-red-300"
                aria-label="Clear Analytics"
                title="پاککردنەوەی داتاکان"
              >
                <Trash2 className="h-5 w-5 transition-transform group-hover:scale-110" />
              </button>
              <button
                onClick={onClose}
                className="group relative p-2.5 rounded-lg hover:bg-gray-100 transition-all text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400"
                aria-label="داخستن"
              >
                <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
              </button>
            </div>
          </div>
        </div>

        {/* Simplified - No tabs, only overview */}

        {/* Content */}
        <div className="p-4 sm:p-5 md:p-6 overflow-y-auto max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-240px)] md:max-h-[calc(100vh-260px)] custom-scrollbar bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-sky-500 mb-4" />
              <p className="text-sm text-gray-600 font-kurdish">داتاکان بار دەکرێن...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-sky-500 mb-4 font-kurdish">{error}</p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  fetchAnalytics(true);
                }}
                className="px-4 py-2.5 rounded-lg text-white font-kurdish shadow-md hover:shadow-lg transition-all"
                style={{
                  background: '#87CEEB',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#6BB6D6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#87CEEB';
                }}
              >
                هەوڵ بدەوە
              </button>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <StatCard
                  icon={Users}
                  label="بینەری جیاواز"
                  value={analytics.unique_views}
                  color="green"
                />
                <StatCard
                  icon={TrendingUp}
                  label="کلیکەری جیاواز"
                  value={analytics.unique_clicks}
                  color="orange"
                />
              </div>

              {/* Top Clicked Links */}
              {analytics.top_clicked_links.length > 0 && (
                <div className="rounded-lg bg-gray-50 p-4 sm:p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <MousePointerClick className="h-4 w-4 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-900 font-kurdish">زۆرترین کلیک</h3>
                  </div>
                  <div className="space-y-2">
                    {analytics.top_clicked_links.map((link, index) => (
                      <div
                        key={link.link_id}
                        className="p-3 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              index === 0 ? "bg-sky-100 text-sky-500" :
                              index === 1 ? "bg-gray-200 text-gray-600" :
                              index === 2 ? "bg-orange-100 text-orange-600" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 font-kurdish truncate">
                                {link.display_name || link.platform}
                              </div>
                              <div className="text-xs text-gray-600 font-kurdish">{link.platform}</div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-gray-900 font-kurdish flex-shrink-0 ml-3">
                            {link.click_count.toLocaleString()} کلیک
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-3 md:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div 
            className="relative w-full max-w-lg my-2 sm:my-4 md:my-8 rounded-lg sm:rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden"
            dir="rtl"
          >
            {/* Header */}
            <div className="relative p-4 sm:p-5 md:p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 rounded-lg bg-red-50 border border-red-200 flex-shrink-0">
                  <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 font-kurdish mb-0.5 sm:mb-1">
                    پاککردنەوەی داتاکان
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-kurdish">
                    دڵنیابوونەوە
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 md:p-6 lg:p-8 bg-white">
              {/* Warning Icon */}
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center shadow-md">
                    <Trash2 className="h-8 w-8 sm:h-10 sm:w-10 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Warning Message */}
              <div className="text-center mb-4 sm:mb-6">
                <p className="text-sm sm:text-base md:text-lg text-gray-900 font-kurdish mb-3 sm:mb-4 leading-relaxed px-2">
                  دڵنیایت لە پاککردنەوەی هەموو داتاکانی بینین و کلیک؟
                </p>

                {/* Warning Badge */}
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-red-50 border border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-red-500 text-xs sm:text-sm font-kurdish font-medium text-center">
                    ئەم کارە ناگەڕێتەوە و هەموو داتاکان دەسڕێتەوە
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isClearing}
                  className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium font-kurdish transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  هەڵوەشاندنەوە
                </button>
                <button
                  onClick={handleClearAnalytics}
                  disabled={isClearing}
                  className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg text-white font-semibold font-kurdish transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  style={{
                    background: '#ef4444',
                  }}
                  onMouseEnter={(e) => {
                    if (!isClearing) {
                      e.currentTarget.style.background = '#dc2626';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isClearing) {
                      e.currentTarget.style.background = '#ef4444';
                    }
                  }}
                >
                  {isClearing ? (
                    <>
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span>پاککردنەوە...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>بەڵێ، پاک بکەوە</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
});
