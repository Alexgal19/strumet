import { describe, expect, it } from 'vitest';
import { permittedUid, safeLocalModel } from './policy';
describe('local voice authorization policy', () => {
  it('fails closed without a UID allowlist and requires exact UID', () => {
    expect(permittedUid('uid-1', undefined)).toBe(false);
    expect(permittedUid('uid-1', '')).toBe(false);
    expect(permittedUid('uid-1', 'uid-11, uid-2')).toBe(false);
    expect(permittedUid('uid-1', 'uid-2, uid-1')).toBe(true);
  });
  it('rejects cloud models even when listed by Ollama', () => {
    expect(safeLocalModel('qwen3:4b', undefined)).toBe(false);
    expect(safeLocalModel('qwen3:4b', { remote_model: 'remote' })).toBe(false);
    expect(safeLocalModel('qwen3:4b', { remote_host: 'host' })).toBe(false);
    expect(safeLocalModel('qwen3:cloud', {})).toBe(false);
    expect(safeLocalModel('qwen3:4b', {})).toBe(true);
  });
});
