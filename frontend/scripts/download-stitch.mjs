/**
 * Pulls Stitch screen JSON + signed asset URLs via MCP get_screen.
 * Set STITCH_API_KEY from https://stitch.withgoogle.com/settings
 *
 *   cd frontend && npm run stitch:download
 *   STITCH_ONLY=sign-in npm run stitch:download   (slug or screen id)
 *
 * Writes: public/stitch/<slug>/get-screen.json and downloads URLs (png/html).
 * After that: open /stitch-embed/<slug> to see exact Stitch HTML in an iframe.
 */
import { writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { StitchToolClient } from '@google/stitch-sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'stitch');

const PROJECT_ID = '3128222895130034439';
const SCREENS = [
  { screenId: '9091d165f0a14c6e935816e089fbddce', slug: 'sign-in' },
  { screenId: '05fd7f832fc14f1d80286fd929b80722', slug: 'main-dashboard' },
  { screenId: 'd836b08cae9449b1901c213f2bba59e6', slug: 'graph-intelligence' },
  { screenId: 'b4ce6fb1bc3a4da8a3fdf435805db1ae', slug: 'policy-engine' },
  { screenId: '68271bcffd70419d9a809b77c5aad07e', slug: 'reports-overview' },
  { screenId: '8239b13854ff4ad8beab3bd95fd7031a', slug: 'threat-analysis' },
];

function collectDownloadUrls(obj, acc = []) {
  if (!obj || typeof obj !== 'object') return acc;
  if (typeof obj.downloadUrl === 'string' && obj.downloadUrl.startsWith('http')) {
    acc.push(obj.downloadUrl);
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') collectDownloadUrls(v, acc);
  }
  return acc;
}

async function downloadUrl(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
}

async function main() {
  if (!process.env.STITCH_API_KEY) {
    console.error('Set STITCH_API_KEY (see https://stitch.withgoogle.com/settings)');
    process.exit(1);
  }

  const client = new StitchToolClient();
  await client.connect();

  const only = process.env.STITCH_ONLY?.trim();
  const list = only ? SCREENS.filter((s) => s.slug === only || s.screenId === only) : SCREENS;
  if (only && list.length === 0) {
    console.error('STITCH_ONLY no match:', only);
    process.exit(1);
  }

  for (const { screenId, slug } of list) {
    const name = `projects/${PROJECT_ID}/screens/${screenId}`;
    const raw = await client.callTool('get_screen', { name, projectId: PROJECT_ID, screenId });
    const urls = collectDownloadUrls(raw);
    const dir = join(OUT, slug);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'get-screen.json'), JSON.stringify(raw, null, 2), 'utf8');

    let i = 0;
    for (const u of urls) {
      const lower = u.toLowerCase();
      const ext = lower.includes('png') || lower.includes('image') ? 'png' : lower.includes('html') ? 'html' : `bin-${i}`;
      const fname = ext === 'png' ? 'screenshot.png' : ext === 'html' ? 'code.html' : `asset-${i}.dat`;
      try {
        await downloadUrl(u, join(dir, fname));
        console.log('saved', join('public/stitch', slug, fname));
      } catch (e) {
        console.warn('skip', u, e.message);
      }
      i += 1;
    }
    if (urls.length === 0) {
      console.warn('no downloadUrl for', slug, '- inspect get-screen.json');
    }
  }

  await client.close();
  console.log('done ->', OUT);
  console.log('Optional: open /stitch-embed/<slug> after code.html exists.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
