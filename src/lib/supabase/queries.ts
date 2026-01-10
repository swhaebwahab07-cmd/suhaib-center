import { createServiceRoleClient } from "./server";
// Template system is now fully dynamic using template_config

// Simple UID generation - no package needed (21 chars: lowercase letters, numbers, hyphens)
function generateUid(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789-";
  let result = "";
  // First character must be a letter
  result += "abcdefghijklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 26));
  // Rest can be any char
  for (let i = 1; i < 21; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================
// TYPES
// ============================================

export interface Linktree {
  id: string;
  name: string;
  subtitle?: string;
  seo_name: string;
  uid: string;
  image?: string;
  background_color: string;
  template_config?: Record<string, unknown> | null;
  expire_date?: string;
  footer_text?: string;
  footer_phone?: string;
  footer_hidden?: boolean;
  created_at: string;
  updated_at: string;
  analytics?: {
    unique_views: number;
    unique_clicks: number;
  };
}

export interface Link {
  id: string;
  linktree_id: string;
  platform: string;
  url: string;
  display_name?: string | null;
  description?: string | null;
  default_message?: string | null;
  display_order: number;
  click_count: number;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface LinkMetadata {
  display_name?: string;
  default_message?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateLinktreeData {
  name: string;
  subtitle?: string;
  slug: string;
  image?: string | null;
  background_color: string;
  template_config?: Record<string, unknown> | null;
  expire_date?: string;
  footer_text?: string;
  footer_phone?: string;
  footer_hidden?: boolean;
  platforms: string[];
  links: Record<string, string[]>; // platform -> urls[]
  linkMetadata?: Record<string, LinkMetadata[]>; // platform -> metadata[] (optional, parallel to links)
}

export interface UpdateLinktreeData {
  name?: string;
  subtitle?: string;
  slug?: string;
  image?: string | null;
  background_color?: string;
  template_config?: Record<string, unknown> | null;
  expire_date?: string;
  footer_text?: string;
  footer_phone?: string;
  footer_hidden?: boolean;
}

// ============================================
// LINKTREE QUERIES
// ============================================

/**
 * Get all linktrees (admin only)
 * When includeAnalytics is true, fetches analytics directly from page_views and link_clicks tables
 * Fetches analytics directly from page_views and link_clicks tables (only unique counts)
 */
export async function getAllLinktrees(includeAnalytics = false): Promise<Linktree[]> {
  const supabase = createServiceRoleClient();

  // Select fields - we only track unique views and clicks from analytics tables
  // This ensures we always use accurate data from page_views and link_clicks tables
  const { data, error } = await supabase
    .from("linktrees")
    .select("id, name, subtitle, seo_name, uid, image, background_color, template_config, expire_date, footer_text, footer_phone, footer_hidden, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching linktrees:", error);
    throw new Error("Failed to fetch linktrees");
  }

  const linktrees = data || [];

  // If analytics requested, fetch directly from page_views and link_clicks tables
  // This ensures 100% accuracy - only unique counts are used
  if (includeAnalytics) {
    try {
      // Fetch analytics directly from analytics tables (page_views and link_clicks)
      const analyticsMap = await getAllLinktreesAnalytics();
      return linktrees.map(linktree => ({
        ...linktree,
        // Attach full analytics object
        analytics: analyticsMap[linktree.id] || {
          unique_views: 0,
          unique_clicks: 0,
        },
      }));
    } catch (analyticsError) {
      console.error("Error fetching analytics:", analyticsError);
      // Return linktrees with zero analytics if fetch fails
      return linktrees.map(linktree => ({
        ...linktree,
        analytics: {
          unique_views: 0,
          unique_clicks: 0,
        },
      }));
    }
  }

  // When analytics not requested, return linktrees without analytics
  return linktrees;
}

/**
 * Get linktree by ID (admin only)
 * Note: Use analytics queries for accurate unique counts
 */
export async function getLinktreeById(id: string): Promise<Linktree | null> {
  const supabase = createServiceRoleClient();

  // Select fields - exclude total_views and total_clicks since we fetch them directly from analytics tables
  const { data, error } = await supabase
    .from("linktrees")
    .select("id, name, subtitle, seo_name, uid, image, background_color, template_config, expire_date, footer_text, footer_phone, footer_hidden, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching linktree:", error);
    throw new Error("Failed to fetch linktree");
  }

  return data;
}

/**
 * Get linktree by UID (public)
 */
export async function getLinktreeByUid(uid: string): Promise<Linktree | null> {
  const supabase = createServiceRoleClient();

  // Select fields - exclude total_views and total_clicks since we fetch them directly from analytics tables
  const { data, error } = await supabase
    .from("linktrees")
    .select("id, name, subtitle, seo_name, uid, image, background_color, template_config, expire_date, footer_text, footer_phone, footer_hidden, created_at, updated_at")
    .eq("uid", uid)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching linktree:", error);
    throw new Error("Failed to fetch linktree");
  }

  // Check if expired
  if (data.expire_date && new Date(data.expire_date) < new Date()) {
    return null;
  }

  return data;
}


/**
 * Create a new linktree
 */
export async function createLinktree(data: CreateLinktreeData): Promise<Linktree> {
  const supabase = createServiceRoleClient();

  // Generate unique UID using custom alphabet (lowercase only, matches database constraint)
  // Check if UID already exists, regenerate if needed
  let uid: string | undefined;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    uid = generateUid(); // Generate 21-character lowercase ID (e.g., "alsdkhfi234509")
    const { data: existing, error: checkError } = await supabase
      .from("linktrees")
      .select("id")
      .eq("uid", uid)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking UID uniqueness:", checkError);
      // If check fails, use the generated UID anyway (better than failing completely)
      break;
    }
    
    if (!existing) {
      break; // UID is unique
    }
    
    attempts++;
    uid = undefined; // Reset for next iteration
  }
  
  if (!uid || attempts >= maxAttempts) {
    throw new Error("Failed to generate unique identifier after multiple attempts");
  }

  // Create linktree - ensure all fields are properly set
  const { data: linktree, error: linktreeError } = await supabase
    .from("linktrees")
    .insert({
      name: data.name,
      subtitle: data.subtitle || "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە",
      seo_name: data.slug,
      uid: uid,
      image: data.image || null,
      background_color: data.background_color,
      template_config: data.template_config || null,
      expire_date: data.expire_date || null,
      footer_text: data.footer_text || null,
      footer_phone: data.footer_phone || null,
      footer_hidden: data.footer_hidden ?? false,
    })
    .select("id, name, subtitle, seo_name, uid, image, background_color, template_config, expire_date, footer_text, footer_phone, created_at, updated_at")
    .single();

  if (linktreeError) {
    console.error("Error creating linktree:", linktreeError);
    throw new Error("Failed to create linktree");
  }

  // Create links
  if (data.links && Object.keys(data.links).length > 0) {
    const linksToInsert: Array<{
      linktree_id: string;
      platform: string;
      url: string;
      display_name?: string | null;
      description?: string | null;
      default_message?: string | null;
      metadata?: Record<string, unknown>;
      display_order: number;
      click_count?: number;
    }> = [];

    let displayOrder = 0;
    for (const [platform, urls] of Object.entries(data.links)) {
      // Skip if urls is not an array or is empty
      if (!Array.isArray(urls) || urls.length === 0) {
        // Skipping platform: urls is not an array or is empty
        continue;
      }
      
      const metadataArray = data.linkMetadata?.[platform] || [];
      
      urls.forEach((url, index) => {
        // Skip empty URLs - validate URL is not empty
        if (!url || typeof url !== 'string' || url.trim().length === 0) {
          // Skipping empty URL
          return;
        }
        
        const metadata = metadataArray[index] || {};
        // Get default message for messaging platforms
        const defaultMessage = metadata.default_message || null;
        
        linksToInsert.push({
          linktree_id: linktree.id,
          platform: platform,
          url: url.trim(), // Ensure URL is trimmed
          display_name: metadata.display_name || null,
          default_message: defaultMessage,
          metadata: metadata.metadata || {},
          display_order: displayOrder++,
          click_count: 0, // Explicitly set click_count
        });
      });
    }

    if (linksToInsert.length > 0) {
      const { data: insertedLinks, error: linksError } = await supabase
        .from("links")
        .insert(linksToInsert)
        .select("id, linktree_id, platform, url, display_name, description, default_message, display_order, click_count, metadata, created_at, updated_at");

      if (linksError) {
        console.error("Error creating links:", linksError);
        console.error("Links data:", JSON.stringify(linksToInsert, null, 2));
        console.error("Linktree ID:", linktree.id);
        // Rollback linktree creation
        await supabase.from("linktrees").delete().eq("id", linktree.id);
        throw new Error(`Failed to create links: ${linksError.message}`);
      }

      // Verify links were created
      if (!insertedLinks || insertedLinks.length === 0) {
        console.error("No links were inserted despite no error");
        console.error("Links data:", JSON.stringify(linksToInsert, null, 2));
        await supabase.from("linktrees").delete().eq("id", linktree.id);
        throw new Error("Failed to create links: No links were inserted");
      }

    } else {
      // No links to insert after filtering empty URLs
      // Rollback linktree creation if no links were provided
      await supabase.from("linktrees").delete().eq("id", linktree.id);
      throw new Error("No valid links provided - all links were empty");
    }
  } else {
    // No links provided - rollback linktree creation
    await supabase.from("linktrees").delete().eq("id", linktree.id);
    throw new Error("No links provided");
  }

  return linktree;
}

/**
 * Update a linktree
 */
export async function updateLinktree(
  id: string,
  data: UpdateLinktreeData
): Promise<Linktree> {
  const supabase = createServiceRoleClient();

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.subtitle !== undefined) updateData.subtitle = data.subtitle || "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە";
  if (data.slug !== undefined) updateData.seo_name = data.slug;
  if (data.image !== undefined) updateData.image = data.image;
  if (data.background_color !== undefined) updateData.background_color = data.background_color;
  if (data.template_config !== undefined) updateData.template_config = data.template_config;
  if (data.expire_date !== undefined) updateData.expire_date = data.expire_date;
  if (data.footer_text !== undefined) updateData.footer_text = data.footer_text;
  if (data.footer_phone !== undefined) updateData.footer_phone = data.footer_phone;
  if (data.footer_hidden !== undefined) updateData.footer_hidden = data.footer_hidden;
  
  const { data: linktree, error } = await supabase
    .from("linktrees")
    .update(updateData)
    .eq("id", id)
    .select("id, name, subtitle, seo_name, uid, image, background_color, template_config, expire_date, footer_text, footer_phone, footer_hidden, created_at, updated_at")
    .single();

  if (error) {
    console.error("Error updating linktree:", error);
    throw new Error("Failed to update linktree");
  }

  return linktree;
}

/**
 * Delete a linktree (cascades to links)
 */
export async function deleteLinktree(id: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("linktrees").delete().eq("id", id);

  if (error) {
    console.error("Error deleting linktree:", error);
    throw new Error("Failed to delete linktree");
  }
}

// Removed incrementLinktreeViews - views are tracked in page_views table, no separate increment needed

// ============================================
// LINK QUERIES
// ============================================

/**
 * Get all links for a linktree
 */
export async function getLinksByLinktreeId(linktreeId: string): Promise<Link[]> {
  const supabase = createServiceRoleClient();

  // Optimized: Select only needed fields explicitly (including description)
  const { data, error } = await supabase
    .from("links")
    .select("id, linktree_id, platform, url, display_name, description, default_message, display_order, click_count, metadata, created_at, updated_at")
    .eq("linktree_id", linktreeId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching links:", error);
    throw new Error("Failed to fetch links");
  }

  return data || [];
}


/**
 * Get linktree with links in a single optimized query (public)
 * This combines getLinktreeByUid + getLinksByLinktreeUid into one database call
 * Note: total_views and total_clicks are set to 0 - use analytics queries for accurate data
 */
// Simple cache for linktree data (5 minutes TTL for free tier optimization)
export async function getLinktreeWithLinksByUid(uid: string): Promise<{ linktree: Linktree | null; links: Link[] }> {
  const supabase = createServiceRoleClient();

  // Single optimized query - only fetch necessary fields (simplified for free tier)
  const { data: linktreeData, error: linktreeError } = await supabase
    .from("linktrees")
    .select(`
      id,
      name,
      subtitle,
      seo_name,
      uid,
      image,
      background_color,
      template_config,
      expire_date,
      footer_text,
      footer_phone,
      footer_hidden,
      links (
        id,
        platform,
        url,
        display_name,
        default_message,
        display_order
      )
    `)
    .eq("uid", uid)
    .single();

  if (linktreeError) {
    if (linktreeError.code === "PGRST116") {
      return { linktree: null, links: [] };
    }
    console.error("Error fetching linktree with links:", linktreeError);
    throw new Error("Failed to fetch linktree");
  }

  if (!linktreeData) {
    return { linktree: null, links: [] };
  }

  // Check if expired
  if (linktreeData.expire_date && new Date(linktreeData.expire_date) < new Date()) {
    return { linktree: null, links: [] };
  }

  // Extract and sort links
  const links = (linktreeData.links || []) as Link[];
  links.sort((a, b) => a.display_order - b.display_order);

  // Remove links from linktree data
  const { links: _, ...linktree } = linktreeData;

  return {
    linktree: {
      ...linktree,
    } as Linktree,
    links,
  };
}

/**
 * Create a new link
 */
export async function createLink(
  linktreeId: string,
  platform: string,
  url: string,
  displayOrder?: number,
  displayName?: string | null,
  description?: string | null,
  defaultMessage?: string | null,
  metadata?: Record<string, unknown> | null
): Promise<Link> {
  const supabase = createServiceRoleClient();

  // Get next display order if not provided
  let order = displayOrder;
  if (order === undefined) {
    const { data: maxOrder } = await supabase.rpc("get_next_display_order", {
      p_linktree_id: linktreeId,
    });
    order = maxOrder || 0;
  }

  // No default message - use provided message or null (empty)
  const finalDefaultMessage = defaultMessage || null;

  const { data: link, error } = await supabase
    .from("links")
    .insert({
      linktree_id: linktreeId,
      platform: platform,
      url: url,
      display_name: displayName || null,
      description: description || null,
      default_message: finalDefaultMessage,
      display_order: order,
      click_count: 0,
      metadata: metadata || {},
    })
    .select("id, linktree_id, platform, url, display_name, description, default_message, display_order, click_count, metadata, created_at, updated_at")
    .single();

  if (error) {
    console.error("Error creating link:", error);
    throw new Error("Failed to create link");
  }

  return link;
}

/**
 * Update a link
 */
export async function updateLink(
  id: string,
  data: {
    platform?: string;
    url?: string;
    display_name?: string | null;
    description?: string | null;
    default_message?: string | null;
    display_order?: number;
    metadata?: Record<string, unknown> | null;
  }
): Promise<Link> {
  const supabase = createServiceRoleClient();

  const updateData: Record<string, unknown> = {};
  if (data.platform !== undefined) updateData.platform = data.platform;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.display_name !== undefined) updateData.display_name = data.display_name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.default_message !== undefined) updateData.default_message = data.default_message;
  if (data.display_order !== undefined) updateData.display_order = data.display_order;
  if (data.metadata !== undefined) updateData.metadata = data.metadata;

  const { data: link, error } = await supabase
    .from("links")
    .update(updateData)
    .eq("id", id)
    .select("id, linktree_id, platform, url, display_name, description, default_message, display_order, click_count, metadata, created_at, updated_at")
    .single();

  if (error) {
    console.error("Error updating link:", error);
    throw new Error("Failed to update link");
  }

  return link;
}

/**
 * Delete a link
 */
export async function deleteLink(id: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("links").delete().eq("id", id);

  if (error) {
    console.error("Error deleting link:", error);
    throw new Error("Failed to delete link");
  }
}

/**
 * Batch delete links by IDs (optimized for performance)
 */
export async function batchDeleteLinks(linkIds: string[]): Promise<void> {
  if (linkIds.length === 0) return;
  
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("links")
    .delete()
    .in("id", linkIds);

  if (error) {
    console.error("Error batch deleting links:", error);
    throw new Error("Failed to delete links");
  }
}

/**
 * Delete all links for a linktree (safety function to prevent duplicates)
 */
export async function deleteAllLinksForLinktree(linktreeId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("links")
    .delete()
    .eq("linktree_id", linktreeId);

  if (error) {
    console.error("Error deleting all links for linktree:", error);
    throw new Error("Failed to delete all links for linktree");
  }
}

/**
 * Batch create links (optimized for performance)
 */
export async function batchCreateLinks(
  links: Array<{
    linktree_id: string;
    platform: string;
    url: string;
    display_order: number;
    display_name?: string | null;
    description?: string | null;
    default_message?: string | null;
    metadata?: Record<string, unknown>;
  }>
): Promise<Link[]> {
  if (links.length === 0) return [];
  
  const supabase = createServiceRoleClient();

  // Get default messages only for WhatsApp
  const linksToInsert = links.map(link => ({
    ...link,
    default_message: link.default_message || null,
    metadata: link.metadata || {},
  }));

  const { data: insertedLinks, error } = await supabase
    .from("links")
    .insert(linksToInsert)
    .select("id, linktree_id, platform, url, display_name, description, default_message, display_order, click_count, metadata, created_at, updated_at");

  if (error) {
    console.error("Error batch creating links:", error);
    throw new Error("Failed to create links");
  }

  return insertedLinks || [];
}

/**
 * Reorder links (for drag and drop)
 */
export async function reorderLinks(
  linktreeId: string,
  linkIds: string[]
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.rpc("reorder_links", {
    p_linktree_id: linktreeId,
    p_link_ids: linkIds,
  });

  if (error) {
    console.error("Error reordering links:", error);
    throw new Error("Failed to reorder links");
  }
}


// ============================================
// ANALYTICS QUERIES
// ============================================

// Simplified interfaces - browser/user_agent data removed

export interface AnalyticsSummary {
  unique_views: number;
  unique_clicks: number;
  top_clicked_links: Array<{
    link_id: string;
    platform: string;
    display_name?: string;
    click_count: number;
  }>;
}

/**
 * Get analytics data for a linktree
 */
export async function getLinktreeAnalytics(linktreeId: string): Promise<AnalyticsSummary> {
  const supabase = createServiceRoleClient();

  // Optimized analytics - use database aggregation instead of fetching all rows
  const [
    { data: analyticsStats, error: analyticsStatsError },
    { data: topClickedLinksData, error: topClickedLinksError },
    { data: links, error: linksError },
  ] = await Promise.all([
    // Get unique view and click counts using optimized database function (100% accurate, uses COUNT(DISTINCT))
    supabase.rpc("get_linktree_analytics_optimized", { p_linktree_id: linktreeId }),
    
    // Get top clicked links using database aggregation (limit to recent clicks for top 10 calculation)
    supabase
      .from("link_clicks")
      .select("link_id")
      .eq("linktree_id", linktreeId)
      .order("clicked_at", { ascending: false })
      .limit(1000), // Limit to recent 1000 clicks for top 10 calculation
    
    // Get all links with metadata (for top clicked links display)
    supabase
      .from("links")
      .select("id, platform, display_name")
      .eq("linktree_id", linktreeId),
  ]);

  // Log errors if any (non-blocking)
  if (analyticsStatsError) {
    console.error("Error fetching analytics stats:", analyticsStatsError);
  }
  if (topClickedLinksError) {
    console.error("Error fetching top clicked links:", topClickedLinksError);
  }
  if (linksError) {
    console.error("Error fetching links:", linksError);
  }

  // Extract unique counts from optimized database function (100% accurate)
  const stats = analyticsStats && analyticsStats.length > 0 ? analyticsStats[0] : null;
  const uniqueViews = stats ? Number(stats.unique_views) || 0 : 0;
  const uniqueClicks = stats ? Number(stats.unique_clicks) || 0 : 0;
  
  // Get link metadata
  const linksData = (links || []) as Array<{ id: string; platform: string; display_name?: string | null }>;
  const linkMetadata: Record<string, { platform: string; display_name?: string }> = {};
  for (const link of linksData) {
    linkMetadata[link.id] = {
      platform: link.platform,
      display_name: link.display_name || undefined,
    };
  }

  // Count clicks per link from sample (for top clicked links)
  const linkClickCounts: Record<string, number> = {};
  if (topClickedLinksData) {
    const linkClicksData = (topClickedLinksData || []) as Array<{ link_id: string }>;
    for (const click of linkClicksData) {
      if (click.link_id) {
        linkClickCounts[click.link_id] = (linkClickCounts[click.link_id] || 0) + 1;
      }
    }
  }

  // Get top clicked links - use sample data (top 10 from recent 1000 clicks)
  const topClickedLinks = Object.entries(linkClickCounts)
    .map(([link_id, count]) => {
      const metadata = linkMetadata[link_id] || { platform: 'Unknown', display_name: undefined };
      return {
        link_id,
        platform: metadata.platform,
        display_name: metadata.display_name,
        click_count: count,
      };
    })
    .sort((a, b) => b.click_count - a.click_count)
    .slice(0, 10);

  return {
    unique_views: uniqueViews,
    unique_clicks: uniqueClicks,
    top_clicked_links: topClickedLinks,
  };
}

/**
 * Get analytics summaries for all linktrees
 * ALWAYS fetches directly from page_views and link_clicks tables - NEVER uses denormalized fields
 * Uses optimized database aggregation for maximum performance and 100% accuracy
 * Uses database-level COUNT and COUNT(DISTINCT) instead of fetching all records
 * 
 * This ensures the admin table always shows accurate totals from the source tables
 */
export async function getAllLinktreesAnalytics(): Promise<Record<string, {
  unique_views: number;
  unique_clicks: number;
}>> {
  const supabase = createServiceRoleClient();

  // Try to use optimized database function first (silently fail if not available)
  try {
    const { data, error } = await supabase.rpc("get_all_linktrees_analytics_optimized");

    // Only use optimized function if we have valid data and no error
    if (!error && data && Array.isArray(data) && data.length > 0) {
      const result: Record<string, {
        unique_views: number;
        unique_clicks: number;
      }> = {};

      for (const row of data) {
        if (row && row.linktree_id) {
          result[row.linktree_id] = {
            unique_views: Number(row.unique_views) || 0,
            unique_clicks: Number(row.unique_clicks) || 0,
          };
        }
      }
      
      // Only return if we got valid results
      if (Object.keys(result).length > 0) {
        return result;
      }
    }
  } catch {
    // Silently catch and use fallback - function might not exist
  }

  // Use fallback method (always works, calculates manually)
  return await getAllLinktreesAnalyticsFallback(supabase);
}

/**
 * Fallback method to calculate analytics manually if database function is not available
 * ALWAYS fetches directly from page_views and link_clicks tables - never uses denormalized fields
 */
async function getAllLinktreesAnalyticsFallback(supabase: ReturnType<typeof createServiceRoleClient>): Promise<Record<string, {
  unique_views: number;
  unique_clicks: number;
}>> {
  try {
    // Get all linktrees first
    const { data: allLinktrees, error: linktreesError } = await supabase
      .from("linktrees")
      .select("id");

    if (linktreesError || !allLinktrees) {
      console.error("Error fetching linktrees for analytics:", linktreesError);
      return {};
    }

    const linktreeIds = allLinktrees.map(lt => lt.id);
    if (linktreeIds.length === 0) {
      return {};
    }

    // Fetch ALL records directly from analytics tables (no limits - all data)
    // This ensures 100% accuracy by querying page_views and link_clicks directly
    // Fetches analytics directly from page_views and link_clicks tables (only unique counts)
    const [
      { data: allViews },
      { data: allClicks },
    ] = await Promise.all([
      // Fetch ALL page views directly from page_views table (no limit - all records for accurate unique counts)
      supabase.from("page_views").select("linktree_id, session_id, ip_address"),
      // Fetch ALL link clicks directly from link_clicks table (no limit - all records for accurate unique counts)
      supabase.from("link_clicks").select("linktree_id, session_id, ip_address"),
    ]);

    // Initialize result map
    const result: Record<string, {
      unique_views: Set<string>;
      unique_clicks: Set<string>;
    }> = {};

    for (const linktreeId of linktreeIds) {
      result[linktreeId] = {
        unique_views: new Set<string>(),
        unique_clicks: new Set<string>(),
      };
    }

    // Count views per linktree directly from page_views table (process ALL records - no limits, all data)
    // Unique views: Count DISTINCT IP addresses (same user visiting multiple times = 1 unique) ✅
    if (allViews) {
      for (const view of allViews) {
        if (view.linktree_id && result[view.linktree_id]) {
          // Use IP address as unique identifier (same IP = same user, even if they visit multiple times)
          const uniqueKey = view.ip_address || 'unknown';
          result[view.linktree_id].unique_views.add(uniqueKey);
        }
      }
    }

    // Count clicks per linktree directly from link_clicks table (process ALL records - no limits, all data)
    // Unique clicks: Count DISTINCT IP addresses (same user clicking multiple times = 1 unique) ✅
    if (allClicks) {
      for (const click of allClicks) {
        if (click.linktree_id && result[click.linktree_id]) {
          // Use IP address as unique identifier (same IP = same user, even if they click multiple times)
          const uniqueKey = click.ip_address || 'unknown';
          result[click.linktree_id].unique_clicks.add(uniqueKey);
        }
      }
    }

    // Convert Sets to numbers
    const finalResult: Record<string, {
      unique_views: number;
      unique_clicks: number;
    }> = {};

    for (const [linktreeId, data] of Object.entries(result)) {
      finalResult[linktreeId] = {
        unique_views: data.unique_views.size,
        unique_clicks: data.unique_clicks.size,
      };
    }

    return finalResult;
  } catch (error) {
    console.error("Error in fallback analytics calculation:", error);
    return {};
  }
}


