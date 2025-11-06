/**
 * Field-Level Encryption for HIPAA Compliance
 *
 * This utility provides AES-256-GCM encryption for sensitive PHI fields
 * that require additional protection beyond database encryption at rest.
 *
 * Use cases:
 * - Date of birth
 * - Social security numbers (if collected)
 * - Sensitive notes or therapeutic content
 * - Any PII that requires extra security layer
 *
 * HIPAA Requirements:
 * - AES-256 encryption (industry standard)
 * - Authenticated encryption (GCM mode prevents tampering)
 * - Unique IV (initialization vector) for each encryption
 * - Secure key management (never commit keys to git)
 */

import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * Must be 64 hex characters (32 bytes)
 *
 * Generate with: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. Generate with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"',
    );
  }

  if (keyHex.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Current length: ${keyHex.length}`,
    );
  }

  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypt a string value using AES-256-GCM
 *
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (all hex-encoded)
 *
 * @example
 * ```typescript
 * const encrypted = encrypt('1980-05-15'); // Encrypt DOB
 * // Store encrypted value in database
 * await db.insert(users).values({
 *   dateOfBirthEncrypted: encrypted,
 * });
 * ```
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }

  try {
    const key = getEncryptionKey();

    // Generate random IV for this encryption
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag (prevents tampering)
    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:ciphertext (all hex-encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt a string value that was encrypted with encrypt()
 *
 * @param encryptedData - Encrypted string in format: iv:authTag:ciphertext
 * @returns Decrypted plaintext string
 *
 * @example
 * ```typescript
 * const patient = await db.query.users.findFirst({
 *   where: eq(users.id, patientId),
 * });
 *
 * const dob = decrypt(patient.dateOfBirthEncrypted);
 * console.log('Date of Birth:', dob); // '1980-05-15'
 * ```
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty string');
  }

  try {
    const key = getEncryptionKey();

    // Parse the encrypted data format: iv:authTag:ciphertext
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error(
        'Invalid encrypted data format. Expected: iv:authTag:ciphertext',
      );
    }

    const [ivHex, authTagHex, ciphertext] = parts;

    if (!ivHex || !authTagHex || !ciphertext) {
      throw new Error('Invalid encrypted data format');
    }

    // Convert from hex
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Set authentication tag (will throw if data was tampered with)
    decipher.setAuthTag(authTag);

    // Decrypt the data
    const decrypted = decipher.update(ciphertext, 'hex', 'utf8') + decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed - data may be corrupted or tampered with');
  }
}

/**
 * Check if encryption is properly configured
 *
 * @returns True if encryption key is set and valid
 *
 * @example
 * ```typescript
 * if (!isEncryptionConfigured()) {
 *   console.warn('Encryption is not configured. Set ENCRYPTION_KEY environment variable.');
 * }
 * ```
 */
export function isEncryptionConfigured(): boolean {
  try {
    const keyHex = process.env.ENCRYPTION_KEY;
    return Boolean(keyHex && keyHex.length === 64);
  } catch {
    return false;
  }
}

/**
 * Hash a value for comparison purposes (one-way)
 * Use this when you need to compare values but don't need to decrypt
 *
 * @param value - Value to hash
 * @returns SHA-256 hash (hex string)
 *
 * @example
 * ```typescript
 * // Store hashed SSN for lookup without storing plaintext
 * const hashedSSN = hash('123-45-6789');
 * await db.insert(users).values({
 *   ssnHash: hashedSSN, // Can't be decrypted
 * });
 *
 * // Later, to check if SSN matches:
 * const inputHash = hash(userInput);
 * if (inputHash === storedHash) {
 *   // Match found
 * }
 * ```
 */
export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Generate a random encryption key (for setup/rotation)
 * DO NOT call this in production code - only for key generation
 *
 * @returns 64-character hex string (32 bytes)
 *
 * @example
 * ```bash
 * # Run once to generate key:
 * node -e "const {generateKey} = require('./utils/Encryption'); console.log('ENCRYPTION_KEY=' + generateKey())"
 * # Add output to .env.local
 * ```
 */
export function generateKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Encrypt multiple fields in an object
 * Useful for encrypting patient data before storing
 *
 * @param obj - Object with fields to encrypt
 * @param fields - Array of field names to encrypt
 * @returns New object with encrypted fields (original unchanged)
 *
 * @example
 * ```typescript
 * const patientData = {
 *   name: 'John Doe',
 *   dob: '1980-05-15',
 *   ssn: '123-45-6789',
 * };
 *
 * const encrypted = encryptFields(patientData, ['dob', 'ssn']);
 * // encrypted.name = 'John Doe' (not encrypted)
 * // encrypted.dob = 'abc123...' (encrypted)
 * // encrypted.ssn = 'def456...' (encrypted)
 * ```
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: Array<keyof T>,
): T {
  const result = { ...obj };

  for (const field of fields) {
    const value = obj[field];
    if (value !== null && value !== undefined) {
      result[field] = encrypt(String(value)) as any;
    }
  }

  return result;
}

/**
 * Decrypt multiple fields in an object
 *
 * @param obj - Object with encrypted fields
 * @param fields - Array of field names to decrypt
 * @returns New object with decrypted fields (original unchanged)
 *
 * @example
 * ```typescript
 * const encryptedPatient = await db.query.users.findFirst(...);
 * const decrypted = decryptFields(encryptedPatient, ['dob', 'ssn']);
 * console.log(decrypted.dob); // '1980-05-15'
 * ```
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fields: Array<keyof T>,
): T {
  const result = { ...obj };

  for (const field of fields) {
    const value = obj[field];
    if (value !== null && value !== undefined) {
      try {
        result[field] = decrypt(String(value)) as any;
      } catch (error) {
        console.error(`Failed to decrypt field ${String(field)}:`, error);
        result[field] = null as any;
      }
    }
  }

  return result;
}

/**
 * Redact sensitive data for logging
 * Replaces sensitive values with asterisks
 *
 * @param value - String to redact
 * @param visibleChars - Number of characters to show at start/end (default: 2)
 * @returns Redacted string
 *
 * @example
 * ```typescript
 * console.log(redact('123-45-6789')); // '12*******89'
 * console.log(redact('patient@email.com')); // 'pa***********om'
 * ```
 */
export function redact(value: string, visibleChars = 2): string {
  if (!value || value.length <= visibleChars * 2) {
    return '*'.repeat(value?.length || 8);
  }

  const start = value.slice(0, visibleChars);
  const end = value.slice(-visibleChars);
  const middle = '*'.repeat(value.length - visibleChars * 2);

  return `${start}${middle}${end}`;
}
