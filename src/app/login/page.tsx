"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import "./login-compat.css";

// Simplified validation (no zod for faster load)
const validateUsername = (username: string): string | null => {
  if (!username || username.trim().length < 3) {
    return "ناوی بەکارهێنەر پێویستە لانیکەم ٣ پیت بێت";
  }
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password || password.length < 6) {
    return "تێپەڕەوشە پێویستە لانیکەم ٦ پیت بێت";
  }
  return null;
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setUsernameError(null);
    setPasswordError(null);
    
    // Validate
    const usernameErr = validateUsername(username);
    const passwordErr = validatePassword(password);
    
    if (usernameErr || passwordErr) {
      setUsernameError(usernameErr);
      setPasswordError(passwordErr);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        cache: 'no-store', // Always fetch fresh data
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
          rememberMe: true,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "ناوی بەکارهێنەر یان تێپەڕەوشە هەڵەیە");
        setIsLoading(false);
        return;
      }

      // Login successful - redirect immediately
      window.location.href = "/admin";
    } catch (err) {
      console.error("Login error:", err);
      setError("هەڵەیەکی نادیار ڕوویدا");
      setIsLoading(false);
    }
  }, [username, password]);

  const handleGoHome = useCallback(() => {
    router.push("/");
  }, [router]);

  // Cross-platform viewport height fix
  useEffect(() => {
    // Fix viewport height for all browsers and devices
    const setViewportHeight = () => {
      // Get actual viewport height
      const vh = window.innerHeight * 0.01;
      // Set CSS custom property for viewport height
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial viewport height
    setViewportHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
    
    // iOS Safari specific: Update after a short delay
    setTimeout(setViewportHeight, 100);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, []);

  // Prevent form submission on Enter key if inputs are invalid (cross-browser)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (usernameError || passwordError)) {
      e.preventDefault();
    }
  }, [usernameError, passwordError]);

  return (
    <>
      {/* Back to home button - Minimal design */}
      <button
        onClick={handleGoHome}
        className="group fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all duration-200 touch-manipulation bg-white/80 backdrop-blur-sm shadow-sm"
        style={{ minWidth: '44px', minHeight: '44px' }}
        aria-label="Go to home page"
        title="گەڕانەوە بۆ پەڕەی سەرەکی"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        <span className="hidden sm:inline text-sm font-medium">گەڕانەوە</span>
      </button>

      {/* Two-Column Login Layout */}
      <div className="flex min-h-screen">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 bg-gray-50">
          <div className="w-full max-w-md">
            {/* Logo with Header Text - Visible only on mobile/tablet */}
            <div className="flex flex-col items-center gap-4 mb-6 sm:mb-8 lg:hidden">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                <div className="relative h-full w-full overflow-hidden rounded-full bg-white shadow-lg border-2 border-gray-200">
                  <Image
                    src="/images/Logo.jpg"
                    alt="Suhaib Logo"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    priority
                    sizes="(max-width: 640px) 80px, 96px"
                    quality={85}
                  />
                </div>
              </div>
              {/* Header Text below logo on mobile */}
              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  چوونەژوورەوە
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  بەخێربێیت بۆ Suhaib Center
                </p>
              </div>
            </div>

            {/* Form Header - Visible only on desktop */}
            <div className="hidden lg:block mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 text-right">
                چوونەژوورەوە
              </h1>
              <p className="text-sm sm:text-base text-gray-600 text-right">
                بەخێربێیت بۆ Suhaib Center
              </p>
            </div>

            {/* Login Form */}
            <form 
              onSubmit={handleSubmit} 
              onKeyDown={handleKeyDown}
              className="w-full flex flex-col gap-5"
              noValidate
              autoComplete="on"
            >
              {/* Error Message */}
              {(error || usernameError || passwordError) && (
                <div 
                  className="w-full rounded-xl px-4 py-3 text-sm border animate-in fade-in slide-in-from-top-2"
                  style={{
                    borderColor: `rgba(239, 68, 68, 0.3)`,
                    backgroundColor: `rgba(239, 68, 68, 0.08)`,
                    color: `#dc2626`
                  }}
                >
                  {error || usernameError || passwordError}
                </div>
              )}

              {/* Username Field */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 text-right">
                  ناوی بەکارهێنەر
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  autoFocus={true}
                  placeholder="ناوی بەکارهێنەرەکەت بنووسە"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameError) setUsernameError(null);
                  }}
                  disabled={isLoading}
                  className="w-full rounded-xl px-4 py-3.5 text-base text-right border-2 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-gray-900 placeholder:text-gray-400 shadow-sm"
                  style={{
                    borderColor: usernameError ? `#87CEEB` : `rgba(135, 206, 235, 0.2)`,
                    minHeight: '52px',
                    fontSize: '16px',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                    appearance: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onFocus={(e) => {
                    if (!usernameError) {
                      e.currentTarget.style.borderColor = `#87CEEB`;
                    }
                  }}
                  onBlur={(e) => {
                    if (!usernameError) {
                      e.currentTarget.style.borderColor = `rgba(135, 206, 235, 0.2)`;
                    }
                  }}
                />
              </div>
              
              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 text-right">
                  تێپەڕەوشە
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="تێپەڕەوشە بنووسە"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    disabled={isLoading}
                    className="w-full rounded-xl pr-4 pl-12 py-3.5 text-base text-right border-2 bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-gray-900 placeholder:text-gray-400 shadow-sm"
                    style={{
                      borderColor: passwordError ? `#87CEEB` : `rgba(135, 206, 235, 0.2)`,
                      minHeight: '52px',
                      fontSize: '16px',
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield',
                      appearance: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onFocus={(e) => {
                      if (!passwordError) {
                        e.currentTarget.style.borderColor = `#87CEEB`;
                      }
                    }}
                    onBlur={(e) => {
                      if (!passwordError) {
                        e.currentTarget.style.borderColor = `rgba(135, 206, 235, 0.2)`;
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation p-1.5 transition-colors rounded-lg"
                    style={{ minWidth: '36px', minHeight: '36px' }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl px-4 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation shadow-md"
                style={{
                  background: `linear-gradient(135deg, #87CEEB 0%, #6BB6D6 100%)`,
                  minHeight: '52px',
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  userSelect: 'none',
                  WebkitTouchCallout: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = `linear-gradient(135deg, #6BB6D6 0%, #5BA3C6 100%)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = `linear-gradient(135deg, #87CEEB 0%, #6BB6D6 100%)`;
                  }
                }}
              >
                {isLoading ? "چاوەڕوان بە..." : "چوونەژوورەوە"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side - Blue Background with Centered Text */}
        <div 
          className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-8 xl:px-16 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, #87CEEB 0%, #5BA3C6 50%, #4A8DB8 100%)`,
          }}
        >
          {/* Decorative Circles */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

          {/* Centered Content */}
          <div className="relative z-10 text-center max-w-md">
            <div className="relative mb-8 flex justify-center">
              <div className="relative h-32 w-32">
                <div className="relative h-full w-full overflow-hidden rounded-full bg-white/20 backdrop-blur-sm shadow-2xl border-4 border-white/30">
                  <Image
                    src="/images/Logo.jpg"
                    alt="Suhaib Logo"
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                    priority
                    sizes="128px"
                    quality={85}
                  />
                </div>
              </div>
            </div>
            <h2 className="text-5xl xl:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Suhaib Center
            </h2>
            <p className="text-xl text-white/90 font-medium drop-shadow-md">
              بەخێربێیت بۆ سیستەمی بەڕێوەبردنی پەیچ
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

