import { describe, expect, it } from 'vitest';
import { rotateKeys } from '../src/services/messageEnhancer';

describe('rotateKeys', () => {
  it('round-robins across keys in order', () => {
    const keys = ['a', 'b', 'c'];
    let cursor = 0;
    const order: string[] = [];
    for (let i = 0; i < 4; i++) {
      const { key, nextCursor } = rotateKeys(keys, cursor);
      order.push(key ?? '');
      cursor = nextCursor;
    }
    expect(order).toEqual(['a', 'b', 'c', 'a']);
  });

  it('resumes mid-cycle from a shifted cursor', () => {
    const { key, nextCursor } = rotateKeys(['a', 'b'], 1);
    expect(key).toBe('b');
    expect(nextCursor).toBe(0);
  });

  it('keeps a single key perpetual', () => {
    expect(rotateKeys(['only'], 0)).toEqual({ key: 'only', nextCursor: 0 });
    expect(rotateKeys(['only'], 3)).toEqual({ key: 'only', nextCursor: 0 });
  });

  it('returns null for an empty key list', () => {
    expect(rotateKeys([], 0)).toEqual({ key: null, nextCursor: 0 });
  });
});