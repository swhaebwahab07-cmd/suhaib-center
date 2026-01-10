"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { LayoutDashboard, Plus, RefreshCw } from "lucide-react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ProfileDropdown } from "@/components/ProfileDropdown";

interface AdminHeaderProps {
  onCreateNew?: () => void;
  onRefresh?: () => void;
  onProfileClick?: () => void;
}

export function AdminHeader({ onCreateNew, onRefresh, onProfileClick }: AdminHeaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const handleLogout = useCallback(async () => {
    setIsDropdownOpen(false);
    setIsLoading(true);
    
    try {
      // Call logout API to invalidate session in database
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore errors, still redirect
    }
    
    // Clear any local state and redirect to login
    // Using window.location.href ensures full page reload and cookie deletion
    window.location.href = "/login";
  }, []);

  return (
    <header 
      className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200/80 shadow-sm transition-all duration-300" 
      dir="ltr"
    >
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 relative">
        <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
          {/* Left Section - Logo & Title */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200/50 shadow-sm flex-shrink-0"
            >
              <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 leading-tight tracking-tight truncate">
                داشبۆرد
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                بەڕێوەبردنی سیستەم
              </p>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="group relative flex items-center justify-center p-2.5 sm:p-3 rounded-xl bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                aria-label="Refresh"
                title="نوێکردنەوە"
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              </button>
            )}
            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="group relative flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #87CEEB 0%, #6BB6D6 100%)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #6BB6D6 0%, #5BA3C6 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #87CEEB 0%, #6BB6D6 100%)';
                }}
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="font-kurdish hidden xs:inline">بەستەری نوێ</span>
              </button>
            )}
            <div className="flex items-center gap-2 relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="group flex items-center transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:ring-offset-2 focus:ring-offset-white rounded-full p-0.5"
                aria-label="Profile menu"
              >
                <div className="ring-2 ring-gray-200 group-hover:ring-sky-400 rounded-full transition-all duration-200">
                  <ProfileAvatar size="md" />
                </div>
              </button>

              <ProfileDropdown
                isOpen={isDropdownOpen}
                isLoading={isLoading}
                onLogout={handleLogout}
                onProfileClick={() => {
                  setIsDropdownOpen(false);
                  onProfileClick?.();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
