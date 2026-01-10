/**
 * Generate platform-specific links based on platform type and input
 */

export function generatePlatformLink(
  platform: string,
  value: string,
  countryCode?: string
): string {
  if (!value) return "";

  const inputType = getPlatformInputType(platform);

  switch (inputType) {
    case "phone": {
      // Remove any existing country code or + from value
      const cleanValue = value.replace(/^\+?\d{1,4}/, "").replace(/\D/g, "");
      const code = countryCode || "+964";
      const fullNumber = `${code}${cleanValue}`;

      if (platform === "whatsapp") {
        // WhatsApp wa.me links should NOT have + sign
        return `https://wa.me/${fullNumber.replace(/\+/g, "")}`;
      } else if (platform === "viber") {
        // Viber links should NOT have + sign
        return `viber://chat?number=${fullNumber.replace(/\+/g, "")}`;
      } else if (platform === "phone") {
        // Phone tel: links should have + sign
        return `tel:${fullNumber}`;
      }
      return value;
    }

    case "username": {
      const username = value.replace(/^@/, "").trim();

      if (platform === "telegram") {
        return username.startsWith("http") ? username : `https://t.me/${username}`;
      }
      return value;
    }

    case "url": {
      if (platform === "email") {
        return value.startsWith("mailto:") ? value : `mailto:${value}`;
      }
      if (platform === "discord") {
        // Discord: use user ID format (discord.com/users/USER_ID)
        if (value.startsWith("http")) {
          return value;
        }
        // If it's just a number (user ID), format it as discord.com/users/USER_ID
        if (/^\d+$/.test(value.trim())) {
          return `https://discord.com/users/${value.trim()}`;
        }
        // If it starts with discord.com/users/, add https://
        if (value.startsWith("discord.com/users/")) {
          return `https://${value}`;
        }
        return "";
      }
      // Instagram: Support all link types and formats
      // Accepted formats:
      // - Profile: https://www.instagram.com/username/ or https://instagram.com/username/
      // - Post: https://www.instagram.com/p/POST_ID/
      // - Reel: https://www.instagram.com/reel/REEL_ID/
      // - Story: https://www.instagram.com/stories/USERNAME/STORY_ID/
      // - IGTV: https://www.instagram.com/tv/VIDEO_ID/
      // - With query params: ?igsh=...&utm_source=...
      if (platform === "instagram") {
        if (value.startsWith("http")) {
          return value;
        }
        // If it's just a username, format as profile link
        const username = value.replace(/^@/, "").trim();
        return `https://www.instagram.com/${username}`;
      }
      // Snapchat: Support all link types and formats
      // Accepted formats:
      // - Profile: https://www.snapchat.com/add/username or https://snapchat.com/add/username
      // - Temporary: https://snapchat.com/t/CODE or https://www.snapchat.com/t/CODE
      // - Public profile: https://www.snapchat.com/p/PROFILE_ID
      // - Stories: https://www.snapchat.com/stories/USERNAME
      // - Spotlight: https://www.snapchat.com/spotlight/SPOTLIGHT_ID
      if (platform === "snapchat") {
        if (value.startsWith("http")) {
          return value;
        }
        // If it's just a username, format as add link
        const username = value.replace(/^@/, "").trim();
        return `https://snapchat.com/add/${username}`;
      }
      // TikTok: Support all link types and formats
      // Accepted formats:
      // - Profile: https://www.tiktok.com/@username or https://tiktok.com/@username
      // - Video: https://www.tiktok.com/@username/video/VIDEO_ID
      // - Shortened: https://vm.tiktok.com/CODE
      // - Shortened: https://vt.tiktok.com/CODE
      if (platform === "tiktok") {
        if (value.startsWith("http")) {
          return value;
        }
        // If it's just a username, format as profile link
        const username = value.replace(/^@/, "").trim();
        return `https://www.tiktok.com/@${username}`;
      }
      // LinkedIn: Support all link types and formats
      // Accepted formats:
      // - Profile: https://www.linkedin.com/in/username or https://linkedin.com/in/username
      // - Company: https://www.linkedin.com/company/companyname
      // - Post: https://www.linkedin.com/feed/update/urn:li:activity:ID
      // - School: https://www.linkedin.com/school/schoolname
      // - Group: https://www.linkedin.com/groups/GROUP_ID
      if (platform === "linkedin") {
        if (value.startsWith("http")) {
          return value;
        }
        // If it's just a username, format as profile link
        const username = value.replace(/^@/, "").trim();
        return `https://www.linkedin.com/in/${username}`;
      }
      // YouTube: Support all link types and formats
      // Accepted formats:
      // - Channel: https://www.youtube.com/c/channelname or https://youtube.com/c/channelname
      // - Channel: https://www.youtube.com/@handle or https://youtube.com/@handle
      // - Channel: https://www.youtube.com/channel/CHANNEL_ID
      // - Video: https://www.youtube.com/watch?v=VIDEO_ID
      // - Shortened: https://youtu.be/VIDEO_ID
      // - Playlist: https://www.youtube.com/playlist?list=PLAYLIST_ID
      // - Shorts: https://www.youtube.com/shorts/VIDEO_ID
      if (platform === "youtube") {
        if (value.startsWith("http")) {
          return value;
        }
        // If it's just a username/handle, format as channel link with @
        const username = value.replace(/^@/, "").trim();
        return `https://www.youtube.com/@${username}`;
      }
      // Facebook: Support all link types and formats
      // Accepted formats:
      // - Profile: https://www.facebook.com/username or https://facebook.com/username
      // - Page: https://www.facebook.com/pagename
      // - Event: https://www.facebook.com/events/EVENT_ID
      // - Group: https://www.facebook.com/groups/GROUP_ID
      // - Video: https://www.facebook.com/watch/?v=VIDEO_ID
      // - Shortened: https://fb.com/username
      if (platform === "facebook") {
        if (value.startsWith("http")) {
          return value;
        }
        // If it's just a username, format as profile link
        const username = value.replace(/^@/, "").trim();
        return `https://www.facebook.com/${username}`;
      }
      // X (Twitter): Support all link types and formats
      // Accepted formats:
      // - Profile: https://twitter.com/username or https://x.com/username
      // - Tweet: https://twitter.com/username/status/TWEET_ID
      // - Tweet: https://x.com/username/status/TWEET_ID
      // - Media: https://twitter.com/i/web/status/TWEET_ID
      // - Hashtag: https://twitter.com/hashtag/HASHTAG
      if (platform === "twitter" || platform === "x") {
        if (value.startsWith("http")) {
          return value;
        }
        // If it's just a username, format as profile link (prefer x.com)
        const username = value.replace(/^@/, "").trim();
        return `https://x.com/${username}`;
      }
      return value.startsWith("http") ? value : 
             value.startsWith("www.") ? `https://${value}` : 
             value.startsWith("mailto:") ? value : `https://${value}`;
    }

    default:
      return value;
  }
}

function getPlatformInputType(platform: string): "phone" | "username" | "url" {
  const phonePlatforms = ["whatsapp", "viber", "phone"];
  const usernamePlatforms = [
    "telegram",
  ];

  if (phonePlatforms.includes(platform)) {
    return "phone";
  }
  if (usernamePlatforms.includes(platform)) {
    return "username";
  }
  // Instagram, Snapchat, TikTok, LinkedIn, YouTube, Facebook, and X/Twitter now use "url" type to support all link formats
  return "url";
}

