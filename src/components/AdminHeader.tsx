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
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore errors, still redirect
    }
    
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
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:w-12 rounded-lg shadow-md"
              style={{
                background: `linear-gradient(135deg, #87CEEB 0%, #6BB6D6 100%)`,
              }}
            >
              <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                Suhaib Center
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                بەڕێوەبردنی بەستەرەکان
              </p>
            </div>
          </div>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Create New Button */}
            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-white font-medium text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-200"
                style={{
                  background: `linear-gradient(135deg, #87CEEB 0%, #6BB6D6 100%)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, #6BB6D6 0%, #5BA3C6 100%)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `linear-gradient(135deg, #87CEEB 0%, #6BB6D6 100%)`;
                }}
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden md:inline">بەستەری نوێ</span>
              </button>
            )}

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 transition-all text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 hover:border-gray-400"
                aria-label="نوێکردنەوە"
                title="نوێکردنەوە"
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Profile Section */}
            {onProfileClick && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-all"
                  aria-label="Profile menu"
                >
                  <ProfileAvatar />
                </button>
                {isDropdownOpen && (
              <ProfileDropdown
                isOpen={isDropdownOpen}
                isLoading={isLoading}
                onLogout={handleLogout}
                onProfileClick={() => {
                  setIsDropdownOpen(false);
                  onProfileClick?.();
                }}
              />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
