import { describe, it, expect } from 'vitest';
import { canTransition, validateProofFile } from './winners';

describe('Winners State Machine', () => {
  it('allows awaiting_proof -> submitted', () => {
    expect(canTransition('awaiting_proof', 'submitted')).toBe(true);
  });
  
  it('denies awaiting_proof -> approved or rejected', () => {
    expect(canTransition('awaiting_proof', 'approved')).toBe(false);
    expect(canTransition('awaiting_proof', 'rejected')).toBe(false);
  });

  it('allows submitted -> approved or rejected', () => {
    expect(canTransition('submitted', 'approved')).toBe(true);
    expect(canTransition('submitted', 'rejected')).toBe(true);
  });
  
  it('denies submitted -> awaiting_proof', () => {
    expect(canTransition('submitted', 'awaiting_proof')).toBe(false);
  });

  it('allows rejected -> submitted', () => {
    expect(canTransition('rejected', 'submitted')).toBe(true);
  });

  it('denies rejected -> approved', () => {
    expect(canTransition('rejected', 'approved')).toBe(false);
  });

  it('denies any transition from approved', () => {
    expect(canTransition('approved', 'submitted')).toBe(false);
    expect(canTransition('approved', 'rejected')).toBe(false);
    expect(canTransition('approved', 'awaiting_proof')).toBe(false);
  });
});

describe('Proof File Validation', () => {
  it('rejects files larger than 1MB', () => {
    const buffer = Buffer.alloc(1024 * 1024 + 1); // 1MB + 1 byte
    const res = validateProofFile(buffer);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/too large/);
  });

  it('rejects files smaller than magic byte requirements', () => {
    const buffer = Buffer.alloc(10); 
    const res = validateProofFile(buffer);
    expect(res.valid).toBe(false);
  });

  it('accepts valid PNG magic bytes', () => {
    const buffer = Buffer.alloc(20);
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    buffer[0] = 0x89; buffer[1] = 0x50; buffer[2] = 0x4e; buffer[3] = 0x47;
    buffer[4] = 0x0d; buffer[5] = 0x0a; buffer[6] = 0x1a; buffer[7] = 0x0a;
    
    const res = validateProofFile(buffer);
    expect(res.valid).toBe(true);
  });

  it('accepts valid JPEG magic bytes', () => {
    const buffer = Buffer.alloc(20);
    // JPEG: FF D8 FF
    buffer[0] = 0xff; buffer[1] = 0xd8; buffer[2] = 0xff;
    
    const res = validateProofFile(buffer);
    expect(res.valid).toBe(true);
  });

  it('accepts valid WebP magic bytes', () => {
    const buffer = Buffer.alloc(20);
    // WEBP: RIFF .... WEBP
    buffer[0] = 0x52; buffer[1] = 0x49; buffer[2] = 0x46; buffer[3] = 0x46; // RIFF
    buffer[8] = 0x57; buffer[9] = 0x45; buffer[10] = 0x42; buffer[11] = 0x50; // WEBP
    
    const res = validateProofFile(buffer);
    expect(res.valid).toBe(true);
  });

  it('rejects invalid magic bytes', () => {
    const buffer = Buffer.alloc(20);
    // Fake GIF
    buffer[0] = 0x47; buffer[1] = 0x49; buffer[2] = 0x46; 
    
    const res = validateProofFile(buffer);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/Invalid file type/);
  });
});
