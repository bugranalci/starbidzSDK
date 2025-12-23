import { createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Get encryption key from environment
 * Key must be 32 bytes (64 hex characters)
 */
function getSecretKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }

  return Buffer.from(key, 'hex')
}

/**
 * Decrypt data encrypted with dashboard's encrypt()
 * Expects format: iv:authTag:encryptedData (all hex encoded)
 */
export function decrypt(encryptedText: string): string {
  const secretKey = getSecretKey()

  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format')
  }

  const [ivHex, authTagHex, encryptedHex] = parts

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')

  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length')
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid auth tag length')
  }

  const decipher = createDecipheriv(ALGORITHM, secretKey, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ])

  return decrypted.toString('utf8')
}

/**
 * Decrypt and parse JSON object (e.g., GAM service account credentials)
 */
export function decryptJson<T = unknown>(encryptedText: string): T {
  const decrypted = decrypt(encryptedText)
  return JSON.parse(decrypted) as T
}

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  try {
    getSecretKey()
    return true
  } catch {
    return false
  }
}

/**
 * Safely decrypt a field - returns null if decryption fails or field is not encrypted
 */
export function safeDecrypt(value: string | null | undefined): string | null {
  if (!value) return null

  // Check if it looks like encrypted data (iv:authTag:data format)
  if (!value.includes(':') || value.split(':').length !== 3) {
    // Not encrypted, return as-is
    return value
  }

  try {
    return decrypt(value)
  } catch {
    // Decryption failed, might be plain text or invalid
    return value
  }
}

/**
 * Safely decrypt JSON - returns null if decryption fails
 */
export function safeDecryptJson<T = unknown>(value: string | null | undefined): T | null {
  if (!value) return null

  try {
    return decryptJson<T>(value)
  } catch {
    // Try parsing as plain JSON
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
}
