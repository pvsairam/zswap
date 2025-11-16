import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes encrypted FHEVM handles to a consistent zero-padded 32-byte hex format.
 * 
 * Accepts both decimal and hexadecimal input formats, validates the value,
 * and always returns a zero-padded 0x-prefixed 32-byte (64 hex chars) string.
 * 
 * @param handle - The encrypted handle string (decimal or hex format, optionally with :cipher suffix)
 * @returns Zero-padded hex string (66 chars total including "0x") or null for invalid/zero values
 * 
 * @example
 * normalizeHandle("12345") // "0x0000000000000000000000000000000000000000000000000000000000003039"
 * normalizeHandle("0x1234") // "0x0000000000000000000000000000000000000000000000000000000000001234"
 * normalizeHandle("0") // null
 * normalizeHandle("0x0") // null
 * normalizeHandle("invalid") // null
 * normalizeHandle("0x1234:cipher") // "0x0000000000000000000000000000000000000000000000000000000000001234"
 */
export function normalizeHandle(handle: string | null): string | null {
  if (!handle) return null;
  
  try {
    // Strip any suffix (e.g., ":cipher") and trim whitespace
    const cleanHandle = handle.trim().split(':')[0];
    
    // Validate format: either hex (0x[0-9a-f]+) or decimal ([0-9]+)
    const isHex = /^0x[0-9a-f]+$/i.test(cleanHandle);
    const isDecimal = /^[0-9]+$/.test(cleanHandle);
    
    if (!isHex && !isDecimal) return null;
    
    // Convert to BigInt to check for zero and normalize
    const bigIntValue = BigInt(cleanHandle);
    if (bigIntValue === BigInt(0)) return null;
    
    // Convert to hex string and pad to 64 characters (32 bytes)
    const hexValue = bigIntValue.toString(16).toLowerCase();
    const paddedHex = hexValue.padStart(64, '0');
    
    return '0x' + paddedHex;
  } catch {
    // Return null for any parsing errors
    return null;
  }
}