"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, AlertCircle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Error reporting would go here in production
  }, [error]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8" style={{ backgroundColor: '#fafafa' }}>
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 sm:gap-8 md:gap-10 text-center">
        {/* Error Icon */}
        <div className="relative">
          <div className="relative rounded-full bg-sky-50 border-2 border-sky-200 p-4 sm:p-5 md:p-6 flex items-center justify-center">
            <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-sky-500" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900">
          500
        </h1>

        {/* Error Message */}
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            هەڵەیەک ڕوویدا
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-md mx-auto leading-relaxed px-4">
            هەڵەیەکی نادیار لە سیستەمەکەدا ڕوویدا. تکایە دواتر هەوڵ بدەوە.
          </p>
          {error.digest && (
            <p className="text-xs sm:text-sm text-gray-500 font-mono bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 inline-block">
              کۆدی هەڵە: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-6 w-full sm:w-auto">
          <button
            onClick={reset}
            className="group relative inline-flex items-center justify-center gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto"
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
            <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-180" />
            <span>هەوڵ بدەوە</span>
          </button>

          <Link
            href="/"
            className="group relative inline-flex items-center justify-center gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto"
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
            <Home className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:scale-110" />
            <span>پەڕەی سەرەکی</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

