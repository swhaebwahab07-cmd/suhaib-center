"use client";

import { memo } from "react";
import { X, AlertTriangle, Loader2, Trash2 } from "lucide-react";

interface DeleteLinktreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  linktreeName: string;
  linktreeUid: string;
  isDeleting?: boolean;
}

export const DeleteLinktreeModal = memo(function DeleteLinktreeModal({
  isOpen,
  onClose,
  onConfirm,
  linktreeName,
  linktreeUid,
  isDeleting = false,
}: DeleteLinktreeModalProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleBackdropClick}
      dir="rtl"
    >
      <div 
        className="relative w-full max-w-lg my-2 sm:my-4 md:my-8 rounded-lg sm:rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-4 sm:p-5 md:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-2.5 sm:p-3 rounded-lg bg-red-50 border border-red-200 flex-shrink-0">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 font-kurdish mb-0.5 sm:mb-1">
                  سڕینەوەی پەیج
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 font-kurdish truncate">
                  دڵنیابوونەوە
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="group relative p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 transition-all text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-gray-300 flex-shrink-0"
              aria-label="Close"
              title="داخستن"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-90" />
            </button>
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
              دڵنیایت لە سڕینەوەی ئەم پەیجیە؟
            </p>
            
            {/* Linktree Info Card */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 md:p-5 border border-gray-200 mb-3 sm:mb-4 mx-2 sm:mx-0">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-gray-900 font-semibold text-sm sm:text-base md:text-lg font-kurdish truncate max-w-full">
                  {linktreeName}
                </p>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm font-mono break-all px-2">
                {linktreeUid}
              </p>
            </div>

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
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium font-kurdish transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              هەڵوەشاندنەوە
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg text-white font-semibold font-kurdish transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              style={{
                  background: '#ef4444',
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.background = '#dc2626';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.background = '#ef4444';
                }
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span>دەسڕێتەوە...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>سڕینەوە</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

