"use client";

import { FaSignOutAlt, FaUser } from "react-icons/fa";

interface ProfileDropdownProps {
  isOpen: boolean;
  isLoading: boolean;
  onLogout: () => void;
  onProfileClick: () => void;
}

export function ProfileDropdown({
  isOpen,
  isLoading,
  onLogout,
  onProfileClick,
}: ProfileDropdownProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full right-0 mt-1.5 w-48 rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 bg-white border border-gray-200 shadow-lg"
    >
      <div className="py-1">
        <button
          onClick={onProfileClick}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 group"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f9fafb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <FaUser className="text-base transition-colors duration-200 group-hover:text-sky-500 text-gray-600" />
          <span className="font-medium">پڕۆفایل</span>
        </button>
        <button
          onClick={onLogout}
          disabled={isLoading}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-sky-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = "#f0f9ff";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <FaSignOutAlt className="text-base transition-colors duration-200 group-hover:text-sky-500 text-sky-500" />
          <span className="font-medium">
            {isLoading ? "دەرچوون..." : "دەرچوون"}
          </span>
        </button>
      </div>
    </div>
  );
}
