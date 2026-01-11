"use client";

import { memo, useState, useEffect, useCallback, useRef } from "react";
import { AdminHeader } from "@/components/AdminHeader";
import { DeleteLinktreeModal } from "@/components/admin/DeleteLinktreeModal";
import { LayoutGrid, Table2 } from "lucide-react";
import dynamic from "next/dynamic";
import { normalizeTemplateConfig, type TemplateKey } from "@/lib/templates/config";

// Dynamically import heavy components with preloading only when needed
// Create modal: large multi-step form
const CreateLinktreeModal = dynamic(() => import("@/components/admin/CreateLinktreeModal").then(mod => ({ default: mod.CreateLinktreeModal })), {
  ssr: false,
  loading: () => null, // Don't show loading spinner, modal will handle its own loading state
  // Preload on hover/focus for better UX
});

// Analytics modal: large data visualisation surface, defer initial bundle cost
const AnalyticsModal = dynamic(() => import("@/components/admin/AnalyticsModal").then(mod => ({ default: mod.AnalyticsModal })), {
  ssr: false,
  loading: () => null,
});

// Profile modal: password form + validation, safe to lazy-load
const ProfileEditModal = dynamic(() => import("@/components/admin/ProfileEditModal").then(mod => ({ default: mod.ProfileEditModal })), {
  ssr: false,
  loading: () => null,
});

// Grid/Table views: only render the active layout; defer unused bundle
const LinktreesGrid = dynamic(() => import("@/components/admin/LinktreesGrid").then(mod => ({ default: mod.LinktreesGrid })), {
  ssr: false,
  loading: () => null,
});

const LinktreesTable = dynamic(() => import("@/components/admin/LinktreesTable").then(mod => ({ default: mod.LinktreesTable })), {
  ssr: false,
  loading: () => null,
});

interface Linktree {
  id: string;
  image?: string;
  name: string;
  seo_name?: string;
  uid: string;
  background_color: string;
  template_config?: Record<string, unknown> | null;
  expire_date?: string;
  created_at: string;
  updated_at: string;
  analytics?: {
    unique_views: number;
    unique_clicks: number;
  };
}

interface AdminDashboardProps {
  initialLinktrees?: Linktree[];
  currentUsername?: string;
}

export const AdminDashboard = memo(function AdminDashboard({ 
  initialLinktrees = [],
  currentUsername = "",
}: AdminDashboardProps) {
  // All hooks must be called before any conditional returns
  const [linktreesData, setLinktreesData] = useState<Linktree[]>(initialLinktrees);
  const [isLoading, setIsLoading] = useState(initialLinktrees.length === 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingEditData, setIsLoadingEditData] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [linktreeToDelete, setLinktreeToDelete] = useState<{ id: string; uid: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [analyticsLinktree, setAnalyticsLinktree] = useState<{ id: string; name: string } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid"); // Default to grid view
  const isSubmittingRef = useRef(false); // Prevent duplicate submissions
  const [editData, setEditData] = useState<{
    linktree: Linktree;
    links: Array<{
      id: string;
      platform: string;
      url: string;
      display_name?: string | null;
      description?: string | null;
      default_message?: string | null;
      display_order: number;
      metadata?: Record<string, unknown> | null;
    }>;
  } | null>(null);

  const fetchLinktrees = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      // Check browser cache first (24 hour cache) unless force refresh
      if (!forceRefresh) {
        const cacheKey = 'linktrees_list';
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            const cacheTime = parsed.timestamp || 0;
            const now = Date.now();
            // Use cached data if less than 30 days old (2592000000 ms)
            if (now - cacheTime < 2592000000) {
              setLinktreesData(parsed.data);
              setIsLoading(false);
              return;
            }
          } catch {
            // Invalid cache, continue to fetch
          }
        }
      }

      const response = await fetch(`/api/linktrees`, {
        credentials: 'include',
      });
      if (response.ok) {
        const result = await response.json();
        const linktrees = result.data || [];
        
        // Performance: Optimized sorting - memoize date parsing
        const sortedLinktrees = [...linktrees].sort((a, b) => {
          if (a.uid === "suhaibcenter") return -1;
          if (b.uid === "suhaibcenter") return 1;
          // Performance: Direct timestamp comparison (faster than Date objects)
          const dateA = Date.parse(a.created_at) || 0;
          const dateB = Date.parse(b.created_at) || 0;
          return dateB - dateA;
        });
        
        setLinktreesData(sortedLinktrees);
        
        // Cache in localStorage for 24 hours
        try {
          localStorage.setItem('linktrees_list', JSON.stringify({
            data: sortedLinktrees,
            timestamp: Date.now(),
          }));
        } catch {
          // Ignore storage errors (private browsing, quota exceeded, etc.)
        }
      }
    } catch (error) {
      console.error("Error fetching linktrees:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle refresh button click - refresh LinktreesTable
  const handleRefresh = useCallback(async () => {
      // Clear all caches
      try {
        localStorage.removeItem('linktrees_list');
        // Clear all edit caches
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('edit_')) {
            localStorage.removeItem(key);
          }
        });
      } catch {
        // Ignore storage errors
      }
    // Force refresh with no cache
    await fetchLinktrees(true);
  }, [fetchLinktrees]);

  // Client-side authentication check - redirect if no username provided
  // This is a safety net in case server-side redirect fails
  useEffect(() => {
    if (!currentUsername || currentUsername.trim() === "") {
      // No username means not authenticated - redirect to login
      window.location.href = "/login";
      return;
    }
  }, [currentUsername]);

  useEffect(() => {
    // Only fetch if no initial data AND no cache exists
    // This prevents unnecessary API calls on every page load
    if (initialLinktrees.length === 0) {
      // Check cache first before making any API call
      const cacheKey = 'linktrees_list';
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          const cacheTime = parsed.timestamp || 0;
          const now = Date.now();
          // Use cached data if less than 30 days old (2592000000 ms)
          if (now - cacheTime < 2592000000) {
            setLinktreesData(parsed.data);
            setIsLoading(false);
            return; // Don't fetch, use cache
          }
        } catch {
          // Invalid cache, fetch fresh data
          fetchLinktrees(false);
        }
      } else {
        // No cache, fetch fresh data
        fetchLinktrees(false);
      }
    }
    
    // Preload modal component in background for faster subsequent opens
    import("@/components/admin/CreateLinktreeModal").catch(() => {
      // Silently fail preload - not critical
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdit = useCallback(async (id: string) => {
    // Open modal immediately for better UX
    setIsModalOpen(true);
    setIsLoadingEditData(true);
    setEditData(null); // Clear previous data
    
    // Check cache first (24 hour cache)
    const cacheKey = `edit_${id}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const cacheTime = parsed.timestamp || 0;
        const now = Date.now();
        // Use cached data if less than 30 days old (2592000000 ms)
        if (now - cacheTime < 2592000000) {
          setEditData(parsed.data);
          setIsLoadingEditData(false);
          return;
        }
      } catch {
        // Invalid cache, continue to fetch
      }
    }
    
    try {
      const response = await fetch(`/api/linktrees/${id}/edit`, {
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to fetch edit data (${response.status})`;
        console.error("API error:", errorMessage, errorData);
        
        // If unauthorized, suggest re-login
        if (response.status === 401) {
          const shouldReload = window.confirm("دەستپێکردنەوەت بەسەرهاتووە. دەتەوێت دووبارە لۆگین بکەیت؟");
          if (shouldReload) {
            window.location.href = '/login';
            return;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Validate response structure
      if (!result || !result.data) {
        throw new Error("Invalid response format: missing data");
      }
      
      // Cache edit data for 24 hours
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: result.data,
          timestamp: Date.now(),
        }));
      } catch {
        // Ignore storage errors
      }
      
      const { linktree, links } = result.data;
      
      // Validate required fields
      if (!linktree || !linktree.id) {
        throw new Error("Invalid response format: missing linktree data");
      }
      
      if (!Array.isArray(links)) {
        throw new Error("Invalid response format: links must be an array");
      }
      
      setEditData({ linktree, links });
    } catch (error) {
      console.error("Error fetching edit data:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load linktree data";
      console.error(`Failed to load linktree data: ${errorMessage}`);
      
      // Only close modal if it's not an auth error (auth error already handled above)
      if (!(error instanceof Error && error.message.includes("Unauthorized"))) {
        setIsModalOpen(false); // Close modal on error
      }
    } finally {
      setIsLoadingEditData(false);
    }
  }, []);

  const handleViewAnalytics = useCallback((id: string, name: string) => {
    setAnalyticsLinktree({ id, name });
    setIsAnalyticsModalOpen(true);
  }, []);

  const handleDelete = useCallback((id: string, uid: string, name: string) => {
    // Prevent deletion of default "suhaibcenter" linktree
    if (uid === "suhaibcenter") {
      console.error("ناتوانیت پەیج پێشگریمان بسڕیتەوە");
      return;
    }
    
    setLinktreeToDelete({ id, uid, name });
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!linktreeToDelete || isDeleting) return;
    
    setIsDeleting(true);
    
    // Optimistic update - remove from UI immediately
    const deletedId = linktreeToDelete.id;
    setLinktreesData(prev => prev.filter(lt => lt.id !== deletedId));
    
    // Close modal immediately for better UX
    setIsDeleteModalOpen(false);
    setLinktreeToDelete(null);
    
    try {
      const response = await fetch(`/api/linktrees/${deletedId}`, {
        method: "DELETE",
        credentials: 'include', // Include cookies for authentication
        cache: 'no-store'
      });

      if (!response.ok) {
        // Revert optimistic update on error
        try {
          localStorage.removeItem('linktrees_list');
        } catch {
          // Ignore storage errors
        }
        fetchLinktrees(true);
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to delete linktree";
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Refresh data after successful deletion
      fetchLinktrees(false);
    } catch (error) {
      console.error("Error deleting linktree:", error);
      // Error toast already shown above
    } finally {
      setIsDeleting(false);
    }
  }, [linktreeToDelete, isDeleting, fetchLinktrees]);

  const handleDeleteModalClose = useCallback(() => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
      setLinktreeToDelete(null);
    }
  }, [isDeleting]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditData(null);
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditData(null);
    setIsModalOpen(true);
  }, []);

  const handleSubmit = useCallback(async (data: {
    name: string;
    subtitle?: string;
    slug: string;
    image: string | null;
    background_color: string;
    templateKey: TemplateKey;
    templateConfig: Record<string, unknown>;
    expire_date?: string;
    footer_text?: string;
    footer_phone?: string;
    footer_hidden?: boolean;
    platforms: string[];
    links: Record<string, string[]>;
    linkMetadata?: Record<string, Array<{display_name?: string; description?: string; default_message?: string; metadata?: Record<string, unknown>}>>;
  }, editId?: string) => {
    // Prevent duplicate submissions
    if (isSubmittingRef.current) {
      // Submission already in progress, ignoring duplicate call
      return;
    }
    
    // Mark as submitting immediately to prevent duplicates
    isSubmittingRef.current = true;
    let errorShown = false; // Track if error was shown
    
    try {
      const normalizedTemplateConfig = normalizeTemplateConfig(data.templateKey, data.templateConfig);

      if (editId) {
        // ============================================
        // UPDATE EXISTING LINKTREE
        // ============================================
        
        // Validate required fields
        if (!data.name?.trim() || !data.slug?.trim() || !data.background_color) {
          console.error("Name, slug, and background color are required");
          throw new Error("Missing required fields");
        }

        if (!data.templateKey) {
          console.error("Template key is required");
          throw new Error("Missing template key");
        }

        // Validate links exist
        if (!data.links || Object.keys(data.links).length === 0) {
          console.error("At least one link is required");
          throw new Error("No links provided");
        }

        // Validate editId is a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(editId)) {
          console.error("Invalid linktree ID");
          throw new Error("Invalid linktree ID format");
        }

        // Clear cache before updating
        try {
          localStorage.removeItem('linktrees_list');
        } catch {
          // Ignore storage errors
        }
        
        // Step 1: Update linktree metadata
        const updateResponse = await fetch(`/api/linktrees/${editId}`, {
          method: "PATCH",
          credentials: 'include', // Include cookies for authentication
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name.trim(),
            subtitle: data.subtitle?.trim() || null,
            slug: data.slug.trim(),
            image: data.image || null,
            background_color: data.background_color,
            template_config: normalizedTemplateConfig,
            expire_date: data.expire_date || null,
            footer_text: data.footer_text?.trim() || null,
            footer_phone: data.footer_phone?.trim() || null,
            footer_hidden: data.footer_hidden ?? false,
          }),
        });

        if (!updateResponse.ok) {
          type ErrorDetail = { field?: string; message?: string };
          let errorData: { error?: string; details?: ErrorDetail[] | string } | null = null;

          try {
            const text = await updateResponse.text();
            if (text) {
              const parsed = JSON.parse(text) as unknown;
              if (parsed && typeof parsed === "object") {
                const maybeError = parsed as { error?: unknown; details?: unknown };
                const parsedDetails = Array.isArray(maybeError.details)
                  ? maybeError.details
                      .filter((detail): detail is ErrorDetail => typeof detail === "object" && detail !== null)
                      .map((detail) => ({
                        field: typeof detail.field === "string" ? detail.field : undefined,
                        message: typeof detail.message === "string" ? detail.message : undefined,
                      }))
                  : undefined;

                errorData = {
                  error: typeof maybeError.error === "string" ? maybeError.error : undefined,
                  details: parsedDetails ?? (typeof maybeError.details === "string" ? maybeError.details : undefined),
                };
              }
            }
          } catch (parseError) {
            console.error("Failed to parse error response:", parseError);
            errorData = {
              error: `HTTP ${updateResponse.status}: ${updateResponse.statusText}`,
            };
          }

          const detailMessage = Array.isArray(errorData?.details)
            ? errorData.details
                .filter((detail) => detail && (detail.field || detail.message))
                .map((detail) => {
                  const fieldPrefix = detail.field ? `${detail.field}: ` : "";
                  return `${fieldPrefix}${detail.message ?? ""}`.trim();
                })
                .filter((entry) => entry.length > 0)
                .join(", ")
            : typeof errorData?.details === "string"
              ? errorData.details
              : "";

          const baseMessage = errorData?.error || `Failed to update linktree (HTTP ${updateResponse.status})`;
          const errorMessage = detailMessage ? `${baseMessage}: ${detailMessage}` : baseMessage;
          console.error("Update error:", errorMessage, errorData ?? undefined);
          throw new Error(errorMessage);
        }

        // Step 2: Fetch existing links (must delete ALL before creating new ones)
        // Clear edit cache before fetching
        try {
          localStorage.removeItem(`edit_${editId}`);
          localStorage.removeItem('linktrees_list');
        } catch {
          // Ignore storage errors
        }
        
        const linksResponse = await fetch(`/api/linktrees/${editId}/links`, {
          credentials: 'include',
        });
        const existingLinkIds: string[] = [];
        if (linksResponse.ok) {
          const linksResult = await linksResponse.json();
          const existingLinks = linksResult.data || [];
          existingLinkIds.push(...existingLinks.map((link: { id: string }) => link.id));
        } else {
          console.error("Failed to fetch existing links:", linksResponse.status, linksResponse.statusText);
          // If we can't fetch existing links, we should still try to delete all links for this linktree
          // This is a safety measure to prevent duplicates
        }

        // Step 3: Prepare links to create
        const linksToCreate: Array<{
          platform: string;
          url: string;
          display_order: number;
          display_name?: string | null;
          description?: string | null;
          default_message?: string | null;
          metadata?: Record<string, unknown>;
        }> = [];
        
        // Track linkId to index mapping for error display
        const linkIdToIndexMap: Record<number, string> = {};
        let linkCreateIndex = 0;

        if (data.links && Object.keys(data.links).length > 0) {
          let displayOrder = 0;
          for (const [platform, urls] of Object.entries(data.links)) {
            // Validate platform
            if (!platform || typeof platform !== "string" || platform.trim().length === 0) {
              continue; // Skip invalid platforms
            }
            
            // Validate urls array
            if (!Array.isArray(urls) || urls.length === 0) {
              continue; // Skip empty arrays
            }
            
            const metadataArray = data.linkMetadata?.[platform] || [];
            urls.forEach((url, index) => {
              // Validate URL
              if (!url || typeof url !== "string" || url.trim().length === 0) {
                return; // Skip invalid URLs
              }
              
              const trimmedPlatform = platform.trim();
              const trimmedUrl = url.trim();
              
              // Additional validation: ensure platform and URL are not just whitespace
              if (trimmedPlatform.length === 0 || trimmedUrl.length === 0) {
                return; // Skip empty strings
              }
              
              const metadata = metadataArray[index] || {};
              linksToCreate.push({
                platform: trimmedPlatform,
                url: trimmedUrl,
                display_order: displayOrder++,
                display_name: metadata.display_name?.trim() || null,
                description: metadata.description?.trim() || null,
                default_message: metadata.default_message?.trim() || null,
                metadata: metadata.metadata && typeof metadata.metadata === "object" && !Array.isArray(metadata.metadata) ? metadata.metadata : {},
              });
              
              // Store mapping: index in linksToCreate -> platform_index (for error mapping)
              linkIdToIndexMap[linkCreateIndex] = `${trimmedPlatform}_${index}`;
              linkCreateIndex++;
            });
          }
        }

        // Step 4: Batch update links (delete ALL old links first, then create new ones)
        // Always delete existing links first to prevent duplicates, even if linksToCreate is empty
        if (existingLinkIds.length > 0 || linksToCreate.length > 0) {
          const batchResponse = await fetch(`/api/linktrees/${editId}/links/batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({
              deleteIds: existingLinkIds, // Delete all existing links
              createLinks: linksToCreate, // Create new links
            }),
          });

          if (!batchResponse.ok) {
            const errorData = await batchResponse.json().catch(() => ({}));
            let errorMessage = "Failed to update links";
            
            // Check if there are per-link validation errors
            if (Array.isArray(errorData.details) && errorData.details.length > 0) {
              // Map errors to link positions for display in modal
              // The API returns errors with index corresponding to linksToCreate array
              const linkErrors: Record<string, string> = {};
              
              errorData.details.forEach((d: { index?: number; platform?: string; url?: string; reason?: string }) => {
                if (d.index !== undefined && d.platform && d.reason) {
                  // Map API index to platform_index format using our mapping
                  const mappedKey = linkIdToIndexMap[d.index];
                  if (mappedKey) {
                    linkErrors[mappedKey] = d.reason;
                  } else {
                    // Fallback: use platform_index directly
                    linkErrors[`${d.platform}_${d.index}`] = d.reason;
                  }
                }
              });
              
              // Store link errors to pass to modal
              errorMessage = errorData.message || errorData.error || "Some links have validation errors";
              console.error(errorMessage);
              
              // Throw error with link errors attached
              const error = new Error(errorMessage) as Error & { linkErrors?: Record<string, string> };
              error.linkErrors = linkErrors;
              throw error;
            } else {
              if (errorData.message) {
                errorMessage = errorData.message;
              } else if (errorData.error) {
                errorMessage = errorData.error;
              }
              console.error(errorMessage);
              throw new Error(errorMessage);
            }
          }
        }

        // Optimistic update - update in UI immediately
        const updateResponseData = await updateResponse.json();
        if (updateResponseData.data) {
          setLinktreesData(prev => prev.map(lt => 
            lt.id === editId ? { ...lt, ...updateResponseData.data } : lt
          ));
        }
        
        // Close modal immediately for better UX
        setIsModalOpen(false);
        setEditData(null);
        
        // Refresh data after successful update
        fetchLinktrees(false);
      } else {
        // ============================================
        // CREATE NEW LINKTREE
        // ============================================
        
        // Validate required fields
        if (!data.name?.trim() || !data.slug?.trim() || !data.background_color) {
          console.error("Name, slug, and background color are required");
          throw new Error("Missing required fields");
        }

        if (!data.templateKey) {
          console.error("Template key is required");
          throw new Error("Missing template key");
        }

        if (!data.links || Object.keys(data.links).length === 0) {
          console.error("Please add at least one link");
          throw new Error("No links provided");
        }

        if (!data.platforms || data.platforms.length === 0) {
          console.error("At least one platform is required");
          throw new Error("No platforms provided");
        }

          // Clear cache before creating
          try {
            localStorage.removeItem('linktrees_list');
          } catch {
            // Ignore storage errors
          }
        
        const createResponse = await fetch("/api/linktrees", {
          method: "POST",
          credentials: "include", // Include cookies for authentication
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name.trim(),
            subtitle: data.subtitle?.trim() || null,
            slug: data.slug.trim(),
            image: data.image || null,
            background_color: data.background_color,
            template_config: normalizedTemplateConfig,
            expire_date: data.expire_date || null,
            footer_text: data.footer_text?.trim() || null,
            footer_phone: data.footer_phone?.trim() || null,
            platforms: data.platforms,
            links: data.links,
            linkMetadata: data.linkMetadata,
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.details
            ? `${errorData.error || "Validation failed"}: ${Array.isArray(errorData.details) ? errorData.details.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join(", ") : ""}`
            : "Failed to create linktree";
          console.error(errorMessage);
          throw new Error(errorMessage);
        }

        const result = await createResponse.json();
        if (result.data) {
          // Optimistic update - add to UI immediately
          const newLinktree = result.data;
          setLinktreesData(prev => {
            const sorted = [newLinktree, ...prev].sort((a, b) => {
              if (a.uid === "suhaibcenter") return -1;
              if (b.uid === "suhaibcenter") return 1;
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateB - dateA;
            });
            return sorted;
          });
          
          handleModalClose();
          
          // Refresh data after successful creation
          fetchLinktrees(false);
        } else {
          console.error("Failed to create linktree: No data returned");
          throw new Error("No data returned from server");
        }
      }
    } catch (error) {
      console.error("Error saving linktree:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(editId ? `Failed to update linktree: ${errorMessage}` : `Failed to create linktree: ${errorMessage}`);
      // Re-throw error so modal can handle it and display per-link errors
      throw error;
    } finally {
      // ALWAYS reset submission flag, even on error
      isSubmittingRef.current = false;
    }
  }, [fetchLinktrees, handleModalClose]);

  // Don't render anything if not authenticated (after all hooks)
  // This check happens after all hooks are declared to follow React rules
  if (!currentUsername || currentUsername.trim() === "") {
    return null; // Return null while redirecting
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#fafafa' }}>
      <AdminHeader 
        onCreateNew={handleCreateNew} 
        onRefresh={handleRefresh}
        onProfileClick={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-6 sm:py-8 md:py-10 overflow-y-auto" dir="rtl" style={{ backgroundColor: '#fafafa' }}>
        {/* Linktrees View */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-5 mb-5 sm:mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">پەیجەکان</h2>
              <span className="text-sm sm:text-base text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 font-medium">
                {linktreesData.length} پەیج
              </span>
            </div>
            {/* View Mode Toggle */}
            <div className="flex items-center justify-start sm:justify-end gap-2 p-1 rounded-xl bg-gray-50 border-2 border-gray-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-white text-sky-600 shadow-md border-2 border-sky-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                aria-label="Grid view"
                title="بینینی گرید"
              >
                <LayoutGrid className="h-4 w-4 flex-shrink-0" />
                <span className="hidden xs:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === "table"
                    ? "bg-white text-sky-600 shadow-md border-2 border-sky-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                aria-label="Table view"
                title="بینینی خشتە"
              >
                <Table2 className="h-4 w-4 flex-shrink-0" />
                <span className="hidden xs:inline">Table</span>
              </button>
            </div>
          </div>
          {viewMode === "grid" ? (
            <LinktreesGrid 
              data={linktreesData} 
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewAnalytics={handleViewAnalytics}
            />
          ) : (
            <LinktreesTable 
              data={linktreesData} 
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewAnalytics={handleViewAnalytics}
            />
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && linktreeToDelete && (
        <DeleteLinktreeModal
          isOpen={isDeleteModalOpen}
          onClose={handleDeleteModalClose}
          onConfirm={handleDeleteConfirm}
          linktreeName={linktreeToDelete.name}
          linktreeUid={linktreeToDelete.uid}
          isDeleting={isDeleting}
        />
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <CreateLinktreeModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleSubmit}
          editData={editData}
          isLoadingEditData={isLoadingEditData}
        />
      )}

      {/* Analytics Modal */}
      {isAnalyticsModalOpen && analyticsLinktree && (
        <AnalyticsModal
          isOpen={isAnalyticsModalOpen}
          onClose={() => {
            setIsAnalyticsModalOpen(false);
            setAnalyticsLinktree(null);
          }}
          linktreeId={analyticsLinktree.id}
          linktreeName={analyticsLinktree.name}
        />
      )}

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUsername={currentUsername}
        onUpdate={(newUsername) => {
          if (newUsername) {
            // Reload page to update username in header
            window.location.reload();
          }
        }}
      />
    </div>
  );
});
