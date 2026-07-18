/**
 * Authoritative layout tokens live in globals.css (`--site-header-*`, `--hero-min-height`).
 * Import these references in TS/JS — never duplicate raw rem values here.
 */
export const HEADER_SCROLL_THRESHOLD = 30
/** Re-expand announcement only near top (prevents threshold flicker). */
export const HEADER_SCROLL_EXPAND_THRESHOLD = 5

export const siteLayoutVars = {
  /** Sticky header height tokens — nav + optional announcement slot. */
  headerOffset: 'var(--site-header-offset)',
  headerNavHeight: 'var(--site-header-nav-height)',
  headerAnnouncementHeight: 'var(--site-header-announcement-height)',
  announcementDisplayHeight: 'var(--site-header-announcement-display-height)',
  bottomNavHeight: 'var(--site-bottom-nav-height)',
  bottomNavOffset: 'var(--site-bottom-nav-offset)',
  heroMinHeight: 'var(--hero-min-height)',
} as const

/** Initial SSR value for `--site-header-announcement-display-height`. */
export function resolveAnnouncementDisplayHeight(
  showAnnouncement: boolean,
  isScrolled: boolean,
): string {
  return showAnnouncement && !isScrolled ? siteLayoutVars.headerAnnouncementHeight : '0px'
}
