"use client";

import { memo, useCallback, useState } from "react";
import Image from "next/image";
import { Trash2, Eye, Copy, Check, Edit } from "lucide-react";

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

interface LinktreesTableProps {
  data?: Linktree[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, uid: string, name: string) => void;
  onViewAnalytics?: (id: string, name: string) => void;
}

// Memoized table row component for better performance
const TableRow = memo(function TableRow({ 
  item, 
  onEdit, 
  onDelete, 
  onViewAnalytics, 
  copiedUid, 
  onCopy,
}: {
  item: Linktree;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, uid: string, name: string) => void;
  onViewAnalytics?: (id: string, name: string) => void;
  copiedUid: string | null;
  onCopy: (uid: string, e: React.MouseEvent) => void;
}) {
  const getLinktreeUrl = useCallback((uid: string) => {
    // Use relative URL for href to avoid hydration mismatch
    // Root page shows suhaibcenter, so suhaibcenter should link to root
    if (uid === "suhaibcenter") {
      return "/";
    }
    return `/${uid}`;
  }, []);

  const getAbsoluteUrl = useCallback((uid: string) => {
    // Only use absolute URL when needed (e.g., for copying)
    if (typeof window === "undefined") {
      return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    }
    const baseUrl = window.location.origin;
    if (uid === "suhaibcenter") {
      return baseUrl;
    }
    return `${baseUrl}/${uid}`;
  }, []);

  const handleView = useCallback((uid: string) => {
    const url = getAbsoluteUrl(uid);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [getAbsoluteUrl]);

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200">
      <td className="px-2 sm:px-3 py-3">
        <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-gray-200 mx-auto">
          <Image
            src={item.image || "/images/DefaultAvatar.png"}
            alt={item.name}
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 640px) 32px, 40px"
            quality={75}
          />
        </div>
      </td>
      <td className="px-2 sm:px-3 py-3">
        <div className="text-xs sm:text-sm font-medium text-gray-900 break-words">
          {item.name}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-3 hidden md:table-cell">
        <div className="text-xs text-gray-600 break-words line-clamp-2">
          {item.subtitle || "—"}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-3 hidden lg:table-cell">
        <div className="text-xs text-gray-700 break-words">
          {item.expire_date ? formatDateTime(item.expire_date).split(' ')[0] : "—"}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <a
            href={getLinktreeUrl(item.uid)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 font-mono underline decoration-blue-400 hover:decoration-blue-600 transition-colors duration-200 break-all"
            onClick={(e) => {
              e.preventDefault();
              handleView(item.uid);
            }}
          >
            {item.uid === "suhaibcenter" ? "/" : `/${item.uid}`}
          </a>
          <button
            onClick={(e) => onCopy(item.uid, e)}
            className="p-0.5 sm:p-1 rounded hover:bg-gray-100 transition-colors duration-200 flex-shrink-0"
            aria-label="Copy URL"
            title="Copy URL"
          >
            {copiedUid === item.uid ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3 text-gray-500 hover:text-gray-700" />
            )}
          </button>
        </div>
      </td>
      <td className="px-2 sm:px-3 py-3 hidden xl:table-cell">
        <div className="text-xs text-gray-600 break-words">
          {formatDateTime(item.created_at)}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-3 hidden xl:table-cell">
        <div className="text-xs text-gray-600 break-words">
          {formatDateTime(item.updated_at)}
        </div>
      </td>
      <td className="px-2 sm:px-3 py-3">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-start">
          {onViewAnalytics && (
            <button
              onClick={() => onViewAnalytics(item.id, item.name)}
              className="p-1 sm:p-1.5 rounded hover:bg-purple-50 transition-colors duration-200 flex-shrink-0"
              aria-label="View Analytics"
              title="بینینی ئامار"
            >
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 hover:text-purple-700" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(item.id)}
              className="p-1 sm:p-1.5 rounded hover:bg-yellow-50 transition-colors duration-200 flex-shrink-0"
              aria-label="Edit"
              title="دەستکاری"
            >
              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600 hover:text-yellow-700" />
            </button>
          )}
          {onDelete && item.uid !== "suhaibcenter" && (
            <button
              onClick={() => onDelete(item.id, item.uid, item.name)}
              className="p-1 sm:p-1.5 rounded hover:bg-red-50 transition-colors duration-200 flex-shrink-0"
              aria-label="Delete"
              title="سڕینەوە"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 hover:text-red-600" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

export const LinktreesTable = memo(function LinktreesTable({ data = [], isLoading = false, onEdit, onDelete, onViewAnalytics }: LinktreesTableProps) {
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const getAbsoluteUrl = useCallback((uid: string) => {
    // Only use absolute URL when needed (e.g., for copying)
    if (typeof window === "undefined") {
      return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    }
    const baseUrl = window.location.origin;
    if (uid === "suhaibcenter") {
      return baseUrl;
    }
    return `${baseUrl}/${uid}`;
  }, []);

  const handleCopyUrl = useCallback(async (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getAbsoluteUrl(uid);
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
  }, [getAbsoluteUrl]);

  const handleView = useCallback((uid: string) => {
    const url = getAbsoluteUrl(uid);
    window.open(url, "_blank", "noopener,noreferrer");
  }, [getAbsoluteUrl]);


  const handleDelete = useCallback((id: string, uid: string, name: string) => {
    // Prevent deletion of default "suhaibcenter" linktree
    if (uid === "suhaibcenter") {
      // Cannot delete default linktree
      return;
    }
    
    // Call parent delete handler
    if (onDelete) {
      onDelete(id, uid, name);
    }
  }, [onDelete]);

  // Mobile-friendly card view for narrow screens
  const MobileCard = memo(function MobileCard({ item }: { item: Linktree }) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 flex gap-4 hover:shadow-md transition-shadow" onClick={() => handleView(item.uid)}>
        <div className="relative h-16 w-16 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
          <Image
            src={item.image || "/images/DefaultAvatar.png"}
            alt={item.name}
            fill
            className="object-cover"
            sizes="64px"
            quality={80}
          />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-base font-semibold text-gray-900 leading-tight break-words">{item.name}</div>
              <div className="text-xs text-gray-600 break-words line-clamp-2">{item.subtitle || "—"}</div>
            </div>
            <div className="flex items-center gap-1">
              {onViewAnalytics && (
                <button
                  onClick={(e) => { e.stopPropagation(); onViewAnalytics(item.id, item.name); }}
                  className="p-2 rounded-lg hover:bg-purple-50 transition-colors"
                  aria-label="View Analytics"
                >
                  <Eye className="h-4 w-4 text-purple-600" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
                  className="p-2 rounded-lg hover:bg-yellow-50 transition-colors"
                  aria-label="Edit"
                >
                  <Edit className="h-4 w-4 text-yellow-600" />
                </button>
              )}
              {onDelete && item.uid !== "suhaibcenter" && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id, item.uid, item.name); }}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
            <button
              onClick={(e) => handleCopyUrl(item.uid, e)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              {copiedUid === item.uid ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-gray-500" />}
              <span className="font-mono">{item.uid === "suhaibcenter" ? "/" : `/${item.uid}`}</span>
            </button>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 text-gray-600 bg-gray-50">
              دروستکراوە {formatDateTime(item.created_at)}
            </span>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="mt-6 sm:mt-8" dir="ltr">
      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {isLoading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600">بارکردنەوە...</div>
        ) : data.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600">هیچ داتایەک نەدۆزرایەوە</div>
        ) : (
          data.map((item) => <MobileCard key={item.id} item={item} />)
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse table-fixed min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide w-16 sm:w-20">
                  وێنە
                </th>
                <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide w-24 sm:w-32">
                  ناو
                </th>
                <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide hidden md:table-cell w-32 lg:w-40">
                  ناونیشانی کورت
                </th>
                <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide hidden lg:table-cell w-24">
                  Expire Date
                </th>
                <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide w-32 sm:w-40 lg:w-48">
                  UID
                </th>
                <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide hidden xl:table-cell w-28">
                  دروستکراوە
                </th>
                <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide hidden xl:table-cell w-28">
                  نوێکراوە
                </th>
                <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide w-28 sm:w-32">
                  کارەکان
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-xs sm:text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-sky-500 rounded-full animate-spin" />
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-xs sm:text-sm">
                    هیچ داتایەک نەدۆزرایەوە
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <TableRow
                    key={item.id}
                    item={item}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                    onViewAnalytics={onViewAnalytics}
                    copiedUid={copiedUid}
                    onCopy={handleCopyUrl}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

