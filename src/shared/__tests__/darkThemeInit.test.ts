import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initDarkTheme } from '../theme/initDarkTheme';

describe('Dark-Only Theme Initialization', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
    document.documentElement.className = '';
    localStorage.clear();
  });

  it('sets data-theme="dark" and colorScheme="dark" on document.documentElement', () => {
    initDarkTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('cleans up any conflicting light theme attributes or stored values', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.add('light', 'theme-light');
    localStorage.setItem('theme', 'light');

    initDarkTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('is completely idempotent when called multiple times consecutively', () => {
    initDarkTheme();
    initDarkTheme();
    initDarkTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('safely handles localStorage throwing a security error', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('SecurityError: The operation is insecure.');
    });

    expect(() => initDarkTheme()).not.toThrow();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    setItemSpy.mockRestore();
  });
});
