export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS
  if (!raw) return []
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * If `ADMIN_EMAILS` is not set, we treat *any authenticated user* as an "admin"
 * (matches current behavior in this repo).
 *
 * If `ADMIN_EMAILS` is set, only users with an email in that allowlist can
 * access /admin UI.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const allowlist = getAdminEmails()
  if (allowlist.length === 0) return true
  return allowlist.includes(email.toLowerCase())
}


