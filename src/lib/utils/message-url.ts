/**
 * Append default message to messaging platform URLs
 */

/**
 * Check if platform supports default messages
 * Only WhatsApp supports messages now
 */
export function supportsDefaultMessage(platform: string): boolean {
  return platform === "whatsapp";
}

/**
 * Append default message to URL for messaging platforms
 * @param url - Original URL
 * @param platform - Platform name
 * @param message - Default message to append
 * @returns URL with message appended
 */
export function appendMessageToUrl(
  url: string,
  platform: string,
  message?: string | null
): string {
  if (!message || !supportsDefaultMessage(platform)) {
    return url;
  }

  try {
    const urlObj = new URL(url);

    // URL.searchParams.set() automatically encodes the value, so pass raw message
    if (platform === "whatsapp") {
      // WhatsApp: https://wa.me/9647502471667?text=message
      // searchParams.set() will automatically encode the message
      urlObj.searchParams.set("text", message);
      return urlObj.toString();
    }

    return url;
  } catch {
    // If URL parsing fails, try manual string manipulation with proper encoding
    const encodedMessage = encodeURIComponent(message);
    
    if (platform === "whatsapp") {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}text=${encodedMessage}`;
    }

    return url;
  }
}

