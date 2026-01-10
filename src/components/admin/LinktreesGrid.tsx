"use client";

import { memo, useCallback, useState, useMemo } from "react";
import Image from "next/image";
import { Trash2, Eye, Copy, Check, Edit, ExternalLink, Link as LinkIcon } from "lucide-react";

// Native Date formatting - no package needed
function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

interface Linktree {
  id: string;
  image?: string;
  name: string;
  subtitle?: string;
  seo_name?: string;
  uid: string;
  template_config?: Record<string, unknown> | null;
  expire_date?: string;
  created_at: string;
  updated_at: string;
  analytics?: {
    unique_views: number;
    unique_clicks: number;
  };
}

interface LinktreesGridProps {
  data?: Linktree[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, uid: string, name: string) => void;
  onViewAnalytics?: (id: string, name: string) => void;
}

// Memoized card component for better performance
const LinktreeCard = memo(function LinktreeCard({
  item,
  onEdit,
  onDelete,
  onViewAnalytics,
  copiedUid,
  onCopy,
  getLinktreeUrl,
}: {
  item: Linktree;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, uid: string, name: string) => void;
  onViewAnalytics?: (id: string, name: string) => void;
  copiedUid: string | null;
  onCopy: (uid: string, e: React.MouseEvent) => void;
  getLinktreeUrl: (uid: string) => string;
}) {
  const url = useMemo(() => getLinktreeUrl(item.uid), [item.uid, getLinktreeUrl]);

  const handleView = useCallback(() => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [url]);

  return (
    <div className="group relative bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-all duration-200">
      {/* Header Section */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
          <Image
            src={item.image || "/images/DefaultAvatar.png"}
            alt={item.name}
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 640px) 64px, 80px"
            quality={75}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-0.5 truncate">
            {item.name}
          </h3>
          {item.subtitle && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">
              {item.subtitle}
            </p>
          )}
          {item.expire_date && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                Expire: {formatDateTime(item.expire_date).split(' ')[0]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* URL Section */}
      <div className="mb-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-1.5 mb-1.5">
          <LinkIcon className="h-3.5 w-3.5 text-sky-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">URL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              handleView();
            }}
            className="flex-1 text-xs text-blue-600 hover:text-blue-700 font-mono truncate underline decoration-blue-400 hover:decoration-blue-600 transition-colors"
          >
            {url}
          </a>
          <button
            onClick={(e) => onCopy(item.uid, e)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Copy URL"
            title="Copy URL"
          >
            {copiedUid === item.uid ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 text-gray-500 hover:text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-1.5 pt-3 border-t border-gray-200">
        {onViewAnalytics && (
          <button
            onClick={() => onViewAnalytics(item.id, item.name)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 hover:text-purple-800 transition-all text-xs font-medium"
            aria-label="View Analytics"
            title="بینینی ئامار"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">ئامار</span>
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(item.id)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-700 hover:text-yellow-800 transition-all text-xs font-medium"
            aria-label="Edit"
            title="دەستکاری"
          >
            <Edit className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">دەستکاری</span>
          </button>
        )}
        {onDelete && item.uid !== "suhaibcenter" && (
          <button
            onClick={() => onDelete(item.id, item.uid, item.name)}
            className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 transition-all text-xs font-medium"
            aria-label="Delete"
            title="سڕینەوە"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">سڕینەوە</span>
          </button>
        )}
        <button
          onClick={handleView}
          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-800 transition-all"
          aria-label="View"
          title="بینین"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
});

export const LinktreesGrid = memo(function LinktreesGrid({
  data = [],
  isLoading = false,
  onEdit,
  onDelete,
  onViewAnalytics,
}: LinktreesGridProps) {
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const getLinktreeUrl = useCallback((uid: string) => {
    const baseUrl = typeof window !== "undefined" && window.location?.origin
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    
    if (uid === "suhaibcenter") {
      return baseUrl;
    }
    return `${baseUrl}/${uid}`;
  }, []);

  const handleCopyUrl = useCallback(async (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getLinktreeUrl(uid);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUid(uid);
      setTimeout(() => {
        setCopiedUid(null);
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedUid(uid);
        setTimeout(() => {
          setCopiedUid(null);
        }, 2000);
      } catch {
        // Copy failed
      }
      document.body.removeChild(textArea);
    }
  }, [getLinktreeUrl]);

  const handleDelete = useCallback((id: string, uid: string, name: string) => {
    if (uid === "suhaibcenter") {
      return;
    }
    if (onDelete) {
      onDelete(id, uid, name);
    }
  }, [onDelete]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-white/30 border-t-yellow-400 rounded-full animate-spin" />
          <p className="text-white/60 text-sm">چاوەڕوان بە...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
          <LinkIcon className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">هیچ پەیجەک نەدۆزرایەوە</h3>
        <p className="text-gray-500 text-sm">دەست پێ بکە بە دروستکردنی پەیج یەکەم</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4" dir="ltr">
      {data.map((item) => (
        <LinktreeCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={handleDelete}
          onViewAnalytics={onViewAnalytics}
          copiedUid={copiedUid}
          onCopy={handleCopyUrl}
          getLinktreeUrl={getLinktreeUrl}
        />
      ))}
    </div>
  );
});
