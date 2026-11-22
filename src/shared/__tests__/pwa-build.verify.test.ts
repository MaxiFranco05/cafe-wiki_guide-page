import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');
const DIST = path.join(ROOT, 'dist');

interface VercelHeaderRule {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

interface VercelConfig {
  headers?: VercelHeaderRule[];
  rewrites?: Array<{ source: string; destination: string }>;
}

interface WebAppManifest {
  name: string;
  short_name: string;
  start_url: string;
  display: string;
  orientation: string;
  theme_color: string;
  background_color: string;
  icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
}

describe('Production PWA & Security Configuration (C-12)', () => {
  it('declares SPA fallback, strict CSP, security headers, and SW cache policy in vercel.json', () => {
    const raw = readFileSync(path.join(ROOT, 'vercel.json'), 'utf-8');
    const config = JSON.parse(raw) as VercelConfig;

    expect(config.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
    expect(config.headers).toBeDefined();

    const globalHeaders = config.headers?.find((h) => h.source === '/(.*)')?.headers ?? [];
    const csp = globalHeaders.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");

    expect(globalHeaders).toEqual(
      expect.arrayContaining([
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ])
    );

    const swHeaders = config.headers?.find((h) => h.source === '/sw.js')?.headers ?? [];
    expect(swHeaders.find((h) => h.key === 'Cache-Control')?.value).toContain('no-cache');

    const manifestHeaders =
      config.headers?.find((h) => h.source === '/manifest.webmanifest')?.headers ?? [];
    expect(manifestHeaders.find((h) => h.key === 'Cache-Control')?.value).toContain('no-cache');

    const assetsHeaders = config.headers?.find((h) => h.source === '/assets/(.*)')?.headers ?? [];
    expect(assetsHeaders.find((h) => h.key === 'Cache-Control')?.value).toContain('immutable');
  });

  it('configures index.html with Rev 4/5 theme-color, description, apple-touch-icon, and zero inline scripts', () => {
    const html = readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
    expect(html).toContain('name="theme-color" content="#160D08"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('name="description"');
    // Ensure every <script> tag has a src attribute (no inline script blocks violating script-src 'self')
    const scriptTags = [...html.matchAll(/<script\b([^>]*)>/gi)];
    expect(scriptTags.length).toBeGreaterThan(0);
    for (const match of scriptTags) {
      expect(match[1]).toMatch(/\bsrc=/i);
    }
  });

  it('ships required PNG PWA icons and robots.txt in public/', () => {
    for (const rel of [
      'public/robots.txt',
      'public/icons/icon-192.png',
      'public/icons/icon-512.png',
      'public/icons/icon-512-maskable.png',
      'public/icons/apple-touch-icon.png',
    ]) {
      const fullPath = path.join(ROOT, rel);
      expect(existsSync(fullPath), `Missing ${rel}`).toBe(true);
      expect(statSync(fullPath).size).toBeGreaterThan(0);
    }
  });

  it('keeps optimized public/images/coffee/*.jpg total size under 2 MB', () => {
    const coffeeDir = path.join(ROOT, 'public/images/coffee');
    const files = readdirSync(coffeeDir).filter((f) => f.endsWith('.jpg'));
    expect(files).toHaveLength(12);
    const totalBytes = files.reduce((acc, f) => acc + statSync(path.join(coffeeDir, f)).size, 0);
    expect(totalBytes).toBeLessThan(2 * 1024 * 1024);
  });

  it('verifies generated dist/sw.js, dist/manifest.webmanifest, icons, and < 500 kB JS chunks when dist/ exists', () => {
    if (!existsSync(DIST)) {
      return;
    }

    expect(existsSync(path.join(DIST, 'sw.js'))).toBe(true);
    expect(existsSync(path.join(DIST, 'manifest.webmanifest'))).toBe(true);

    const manifest = JSON.parse(
      readFileSync(path.join(DIST, 'manifest.webmanifest'), 'utf-8')
    ) as WebAppManifest;

    expect(manifest.display).toBe('standalone');
    expect(manifest.orientation).toBe('portrait');
    expect(manifest.start_url).toBe('/');
    expect(manifest.theme_color).toBe('#160D08');
    expect(manifest.background_color).toBe('#160D08');
    expect(manifest.icons.some((i) => i.sizes === '192x192')).toBe(true);
    expect(manifest.icons.some((i) => i.sizes === '512x512' && i.purpose === 'any')).toBe(true);
    expect(manifest.icons.some((i) => i.sizes === '512x512' && i.purpose === 'maskable')).toBe(true);

    const distHtml = readFileSync(path.join(DIST, 'index.html'), 'utf-8');
    expect(distHtml).toContain('manifest.webmanifest');

    const assetsDir = path.join(DIST, 'assets');
    const jsChunks = readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
    expect(jsChunks.length).toBeGreaterThan(4);
    for (const chunk of jsChunks) {
      const sizeBytes = statSync(path.join(assetsDir, chunk)).size;
      expect(sizeBytes, `Chunk ${chunk} exceeded 500 kB`).toBeLessThan(500 * 1024);
    }
  });
});
