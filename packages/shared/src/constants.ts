// ==================== PREFIXES ====================

export const APP_KEY_PREFIX = 'sbz_app_'
export const PLACEMENT_ID_PREFIX = 'sbz_plc_'

// ==================== BANNER SIZES ====================

export const BANNER_SIZES = {
  BANNER: { width: 320, height: 50 },
  MREC: { width: 300, height: 250 },
  LEADERBOARD: { width: 728, height: 90 },
} as const

// ==================== TIMEOUTS ====================

export const DEFAULT_BID_TIMEOUT_MS = 200
export const DEFAULT_RATE_LIMIT_PER_MINUTE = 1000

// ==================== API VERSIONS ====================

export const API_VERSION = 'v1'
