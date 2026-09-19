export type IconName =
  | 'dashboard'
  | 'package'
  | 'calendar'
  | 'user'
  | 'shopping-bag'
  | 'clipboard-list'
  | 'sparkles'
  | 'message-square'
  | 'trending-up'
  | 'sun'
  | 'stethoscope'
  | 'gift'
  | 'inbox'
  | 'compass'
  | 'map-pin'
  | 'heart'
  | 'bell'
  | 'boxes'
  | 'users'
  | 'store'
  | 'settings'
  | 'star'
  | 'bar-chart'
  | 'history'

export interface NavItem {
  label: string
  href: string
  /**
   * Icon identifier — a string key, NOT a component reference.
   * The client-side DashboardShell maps these to actual Lucide components.
   * Using a string keeps the prop serializable across the RSC boundary
   * (server-component layouts → client DashboardShell).
   */
  icon: IconName
}

export interface PortalChrome {
  /** e.g. "Member Portal", "Command Center", "Partner Hub" */
  label: string
  /** Single-word page-title fallback */
  shortName: string
}
