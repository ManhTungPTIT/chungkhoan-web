import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  setTokens,
  clearTokens,
} from './tokenStorage';

beforeEach(() => localStorage.clear());

describe('tokenStorage', () => {
  it('getAccessToken returns null when nothing stored', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('getRefreshToken returns null when nothing stored', () => {
    expect(getRefreshToken()).toBeNull();
  });

  it('setAccessToken stores accessToken', () => {
    setAccessToken('abc');
    expect(getAccessToken()).toBe('abc');
  });

  it('setRefreshToken stores refreshToken', () => {
    setRefreshToken('xyz');
    expect(getRefreshToken()).toBe('xyz');
  });

  it('getAccessToken reads stored accessToken', () => {
    localStorage.setItem('accessToken', 'abc');
    expect(getAccessToken()).toBe('abc');
  });

  it('getRefreshToken reads stored refreshToken', () => {
    localStorage.setItem('refreshToken', 'xyz');
    expect(getRefreshToken()).toBe('xyz');
  });

  it('setTokens stores both tokens', () => {
    setTokens({ accessToken: 'at', refreshToken: 'rt' });
    expect(localStorage.getItem('accessToken')).toBe('at');
    expect(localStorage.getItem('refreshToken')).toBe('rt');
  });

  it('clearTokens removes both tokens', () => {
    setTokens({ accessToken: 'at', refreshToken: 'rt' });
    clearTokens();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
