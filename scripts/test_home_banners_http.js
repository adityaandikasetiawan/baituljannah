#!/usr/bin/env node
/*
 * HTTP-based banner verification test
 * - Fetches homepage HTML
 * - Parses banner slider images using Cheerio
 * - Compares with DB expectation (3 active banners, ordered by order_index ASC, created_at DESC)
 * - Verifies that image files exist on disk
 */

const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
require('dotenv').config();

const { dbHelpers } = require('../database');

const APP_URL = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;

async function fetchHtml(url) {
  // Use global fetch (Node 18+). If unavailable, fallback to http.
  if (typeof fetch === 'function') {
    const res = await fetch(url, { headers: { 'User-Agent': 'Banner-Test/1.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} when fetching ${url}`);
    return await res.text();
  }
  // Fallback using http module
  const http = require('http');
  const https = require('https');
  const client = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    client.get(url, { headers: { 'User-Agent': 'Banner-Test/1.0' } }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode} when fetching ${url}`));
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function normalizePath(src) {
  try {
    const url = new URL(src, APP_URL);
    return url.pathname; // e.g., /uploads/banners/foo.jpg
  } catch (_) {
    // src might be relative like /uploads/... or uploads/...
    if (src.startsWith('/')) return src;
    if (src.startsWith('uploads/')) return '/' + src;
    return src; // give up, return as-is
  }
}

function fileExistsForUploadPath(uploadPath) {
  // uploadPath is like /uploads/banners/foo.jpg
  const rel = uploadPath.replace(/^\//, '');
  const abs = path.join(process.cwd(), rel);
  return fs.existsSync(abs);
}

async function getExpectedBanners() {
  const rows = await dbHelpers.all(
    `SELECT id, title, image, order_index, status, created_at
     FROM home_banners
     WHERE status = 'active'
     ORDER BY order_index ASC, created_at DESC
     LIMIT 3`
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    imgPath: normalizePath(r.image || ''),
    order_index: r.order_index,
  }));
}

function parseHomepageBanners(html) {
  const $ = cheerio.load(html);
  const images = [];

  // Prioritize <picture> > <img> inside .banner-slider
  $('.banner-slider picture img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const norm = normalizePath(src);
    if (norm.includes('/uploads/')) {
      images.push(norm);
    }
  });

  // Fallback: direct <img> inside .banner-slider
  if (images.length === 0) {
    $('.banner-slider img').each((_, el) => {
      const src = $(el).attr('src') || '';
      const norm = normalizePath(src);
      if (norm.includes('/uploads/')) {
        images.push(norm);
      }
    });
  }

  // Deduplicate preserving order
  const seen = new Set();
  const orderedUnique = images.filter((p) => {
    const key = p.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return orderedUnique.slice(0, 3);
}

async function main() {
  console.log('--- HTTP Banner Test: START ---');
  console.log(`Using APP_URL=${APP_URL}`);

  // 1) Expected banners from DB
  const expected = await getExpectedBanners();
  console.log(`Expected active banners (from DB): ${expected.length}`);
  expected.forEach((b, i) => console.log(`  [${i+1}] order=${b.order_index} title="${b.title}" img=${b.imgPath}`));

  if (expected.length === 0) {
    console.error('No active banners found in DB. Test cannot proceed.');
    process.exit(1);
  }

  // 2) Fetch homepage HTML
  const html = await fetchHtml(APP_URL);
  console.log('Fetched homepage HTML.');

  // 3) Parse homepage banner images
  const homepageImages = parseHomepageBanners(html);
  console.log(`Homepage banner images found: ${homepageImages.length}`);
  homepageImages.forEach((src, i) => console.log(`  [${i+1}] ${src}`));

  // 4) Compare counts
  if (homepageImages.length !== expected.length) {
    console.error(`Mismatch: homepage shows ${homepageImages.length} images, expected ${expected.length}.`);
    process.exit(1);
  }

  // 5) Compare order (exact match)
  const expectedPaths = expected.map((b) => b.imgPath);
  const orderMatches = expectedPaths.every((p, idx) => p === homepageImages[idx]);
  if (!orderMatches) {
    console.error('Order mismatch between DB expectation and homepage rendering.');
    console.error('Expected order:', expectedPaths);
    console.error('Homepage order:', homepageImages);
    process.exit(1);
  }
  console.log('Order matches expectation (order_index ASC, created_at DESC).');

  // 6) Verify image files exist
  const missing = expectedPaths.filter((p) => !fileExistsForUploadPath(p));
  if (missing.length > 0) {
    console.error('Missing image files on disk:', missing);
    process.exit(1);
  }
  console.log('All banner image files are present on disk.');

  console.log('--- HTTP Banner Test: PASSED ✅ ---');
}

main().catch((err) => {
  console.error('--- HTTP Banner Test: FAILED ❌ ---');
  console.error(err);
  process.exit(1);
});