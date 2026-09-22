export type VerificationStatus = 'awaiting_proof' | 'submitted' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'paid';

/**
 * Validates state transitions for winners.
 */
export function canTransition(
  currentStatus: VerificationStatus, 
  nextStatus: VerificationStatus
): boolean {
  if (currentStatus === 'awaiting_proof') {
    return nextStatus === 'submitted';
  }
  
  if (currentStatus === 'submitted') {
    return nextStatus === 'approved' || nextStatus === 'rejected';
  }
  
  if (currentStatus === 'rejected') {
    return nextStatus === 'submitted';
  }

  // Once approved, no further verification transitions are allowed.
  return false;
}

/**
 * Validates a file buffer for magic bytes to ensure it's a valid image.
 * PNG: 89 50 4E 47 0D 0A 1A 0A
 * JPEG: FF D8 FF
 * WEBP: RIFF .... WEBP
 */
export function validateProofFile(buffer: Buffer): { valid: boolean; error?: string } {
  // Check size (< 1MB)
  if (buffer.length > 1024 * 1024) {
    return { valid: false, error: "File is too large. Maximum size is 1MB." };
  }

  if (buffer.length < 12) {
    return { valid: false, error: "Invalid file format." };
  }

  // PNG
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return { valid: true };
  }

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true };
  }

  // WEBP
  // Check 'RIFF'
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    // Check 'WEBP'
    if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return { valid: true };
    }
  }

  return { valid: false, error: "Invalid file type. Only PNG, JPEG, and WebP are allowed." };
}
