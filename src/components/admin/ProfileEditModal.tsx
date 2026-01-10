"use client";

import { useState, useCallback } from "react";
import { X, Eye, EyeOff, Loader2, User, Lock } from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  onUpdate: (newUsername?: string) => void;
}

export function ProfileEditModal({
  isOpen,
  onClose,
  currentUsername,
  onUpdate,
}: ProfileEditModalProps) {
  const [activeTab, setActiveTab] = useState<"username" | "password">("username");
  const [isLoading, setIsLoading] = useState(false);
  
  // Username form
  const [username, setUsername] = useState(currentUsername);
  const [usernamePassword, setUsernamePassword] = useState("");
  const [showUsernamePassword, setShowUsernamePassword] = useState(false);
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setActiveTab("username");
      setUsername(currentUsername);
      setUsernamePassword("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    }
  }, [isLoading, currentUsername, onClose]);

  const handleUpdateUsername = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!username.trim()) {
      // Validation error
      return;
    }

    if (username.trim() === currentUsername) {
      // Same username
      return;
    }

    if (!usernamePassword) {
      // Error:"تێپەڕەوشەی ئێستا پێویستە");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        cache: 'no-store', // Always fetch fresh data
        credentials: 'include', // Include cookies for authentication
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          currentPassword: usernamePassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data.error || "هەڵە لە نوێکردنەوەی ناوی بەکارهێنەر");
        return;
      }

      // Username updated successfully
      onUpdate(username.trim());
      handleClose();
    } catch (error) {
      console.error("Error updating username:", error);
      // Error:"هەڵەیەکی نادیار ڕوویدا");
    } finally {
      setIsLoading(false);
    }
  }, [username, currentUsername, usernamePassword, isLoading, onUpdate, handleClose]);

  const handleUpdatePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!currentPassword) {
      // Error:"تێپەڕەوشەی ئێستا پێویستە");
      return;
    }

    if (!newPassword) {
      // Error:"تێپەڕەوشەی نوێ پێویستە");
      return;
    }

    if (newPassword.length < 8) {
      // Error:"تێپەڕەوشە پێویستە لانیکەم ٨ پیت بێت");
      return;
    }

    if (newPassword !== confirmPassword) {
      // Error:"تێپەڕەوشەکان یەکسان نین");
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialChar = /[@$!%*?&]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      // Error:"تێپەڕەوشە پێویستە پیتی گەورە، بچووک، ژمارە و پیتی تایبەت تێدابێت");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        cache: 'no-store', // Always fetch fresh data
        credentials: 'include', // Include cookies for authentication
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Error:data.error || "هەڵە لە نوێکردنەوەی تێپەڕەوشە");
        if (data.details) {
          data.details.forEach(() => {
            // Error details logged
          });
        }
        return;
      }

      // Success:"تێپەڕەوشە بە سەرکەوتوویی نوێکرایەوە");
      handleClose();
    } catch (error) {
      console.error("Error updating password:", error);
      // Error:"هەڵەیەکی نادیار ڕوویدا");
    } finally {
      setIsLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword, isLoading, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleClose}
      dir="rtl"
    >
      <div
        className="relative w-full max-w-lg my-4 sm:my-8 rounded-lg sm:rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-4 sm:p-5 md:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-sky-50 border border-sky-200 flex-shrink-0">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-sky-500" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 font-kurdish mb-0.5 sm:mb-1">
                  گۆڕانکاری پڕۆفایل
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 font-kurdish">
                  نوێکردنەوەی ناو و تێپەڕەوشە
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="group relative flex items-center justify-center p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 transition-all text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-gray-300 flex-shrink-0"
              aria-label="داخستن"
              title="داخستن"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-90" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-3 sm:p-4 md:p-5 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab("username")}
            disabled={isLoading}
            className={`group relative flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium font-kurdish transition-all duration-200 disabled:opacity-50 ${
              activeTab === "username"
                ? "bg-sky-500 text-white border border-sky-500 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200"
            }`}
          >
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline">ناوی بەکارهێنەر</span>
            <span className="xs:hidden">ناو</span>
          </button>
          <button
            onClick={() => setActiveTab("password")}
            disabled={isLoading}
            className={`group relative flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium font-kurdish transition-all duration-200 disabled:opacity-50 ${
              activeTab === "password"
                ? "bg-sky-500 text-white border border-sky-500 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200"
            }`}
          >
            <Lock className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline">تێپەڕەوشە</span>
            <span className="xs:hidden">تێپەڕەوشە</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 md:p-6 lg:p-8">
          {activeTab === "username" ? (
            <form onSubmit={handleUpdateUsername} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-kurdish">
                  ناوی بەکارهێنەری نوێ
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 disabled:opacity-50 disabled:cursor-not-allowed font-kurdish transition-all duration-200"
                  placeholder="ناوی بەکارهێنەر"
                  minLength={3}
                  maxLength={50}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-kurdish">
                  تێپەڕەوشەی ئێستا
                </label>
                <div className="relative">
                  <input
                    type={showUsernamePassword ? "text" : "password"}
                    value={usernamePassword}
                    onChange={(e) => setUsernamePassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-11 sm:pr-12 rounded-lg sm:rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    placeholder="تێپەڕەوشە"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowUsernamePassword(!showUsernamePassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                  >
                    {showUsernamePassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-white font-semibold font-kurdish transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base shadow-md hover:shadow-lg"
                style={{
                  background: '#87CEEB',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#6BB6D6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#87CEEB';
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span>نوێکردنەوە...</span>
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    نوێکردنەوەی ناوی بەکارهێنەر
                  </span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-kurdish">
                  تێپەڕەوشەی ئێستا
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-11 sm:pr-12 rounded-lg sm:rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    placeholder="تێپەڕەوشەی ئێستا"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-kurdish">
                  تێپەڕەوشەی نوێ
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-11 sm:pr-12 rounded-lg sm:rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    placeholder="تێپەڕەوشەی نوێ (کەمتر ٨ پیت)"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 font-kurdish">
                  پێویستە پیتی گەورە، بچووک، ژمارە و پیتی تایبەت تێدابێت
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-kurdish">
                  پشتڕاستکردنەوەی تێپەڕەوشە
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-11 sm:pr-12 rounded-lg sm:rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    placeholder="تێپەڕەوشەی نوێ دووبارە"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-white font-semibold font-kurdish transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base shadow-md hover:shadow-lg"
                style={{
                  background: '#87CEEB',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#6BB6D6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#87CEEB';
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span>نوێکردنەوە...</span>
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                    نوێکردنەوەی تێپەڕەوشە
                  </span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

