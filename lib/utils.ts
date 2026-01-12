import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Add lightweight Supabase image transformations to shrink payloads before Next.js optimization.
 * Returns the original URL for non-Supabase or already-transformed URLs.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: {
    width?: number
    quality?: number
    format?: "webp" | "avif"
    resize?: "cover" | "contain"
  } = {}
) {
  if (!url) return undefined
  if (url.startsWith("/")) return url
  const isSupabasePublic =
    url.includes(".supabase.co/storage/v1/object/public/") ||
    url.includes(".supabase.in/storage/v1/object/public/")

  // Only transform Supabase public bucket URLs; avoid double-applying params.
  if (!isSupabasePublic || /[?&](width|transform|quality|format)=/i.test(url)) {
    return url
  }

  const width = options.width ?? 1200
  const quality = options.quality ?? 80
  const format = options.format ?? "webp"
  const resize = options.resize ?? "cover"

  const params = new URLSearchParams({
    width: String(width),
    quality: String(quality),
    format,
    resize,
  })

  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}${params.toString()}`
}
