"use client";

import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8" style={{ backgroundColor: '#fafafa' }}>
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 sm:gap-8 md:gap-10 text-center">
        {/* Error Code */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-gray-900">
          404
        </h1>

        {/* Error Message */}
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            پەڕە نەدۆزرایەوە
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-md mx-auto leading-relaxed px-4">
            هیچ پەڕەیەک نەدۆزرایەوە. تکایە دواتر هەوڵبدەوە یان بگەڕێوە بۆ پەڕەی سەرەکی.
          </p>
        </div>

        {/* Action Button */}
        <Link
          href="/"
          className="group relative mt-4 sm:mt-6 inline-flex items-center justify-center gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto"
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
    </main>
  );
}

