/**
 * Image optimization script
 * - Converts JPG/PNG images to WebP next to originals
 * - Generates responsive multi-width WebP variants (320, 640, 1024, 1600) when source size allows
 * - Optionally resizes very large images to a reasonable max dimension for the base WebP
 *
 * Usage: node scripts/optimize-images.js [--dir <path>] [--maxDim <number>] [--quality <0-100>]
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(name);
  if (i !== -1 && args[i + 1]) return args[i + 1];
  return def;
}

const projectRoot = path.resolve(__dirname, '..');
const defaultDirs = [
  path.join(projectRoot, 'public', 'assets', 'img'),
  path.join(projectRoot, 'uploads'),
];
const targetDirArg = getArg('--dir');
const targetDirs = targetDirArg ? [path.resolve(targetDirArg)] : defaultDirs;
const maxDim = parseInt(getArg('--maxDim', '1920'), 10); // resize down if larger than this
const quality = parseInt(getArg('--quality', '75'), 10);
const sizes = [320, 640, 1024, 1600];

// Support SVG too, so vector logos can be converted to WebP
const VALID_EXT = new Set(['.jpg', '.jpeg', '.png', '.svg']);

function isImageFile(filePath) {
  return VALID_EXT.has(path.extname(filePath).toLowerCase());
}

async function ensureWebP(filePath) {
  const ext = path.extname(filePath);
  const base = filePath.slice(0, -ext.length);
  const webpPath = base + '.webp';
  try {
    const image = sharp(filePath, { failOnError: false });
    const meta = await image.metadata();
    const needsResize = Math.max(meta.width || 0, meta.height || 0) > maxDim;
    if (!fs.existsSync(webpPath)) {
      const pipeline = needsResize
        ? image.resize({ width: Math.min(meta.width || maxDim, maxDim), height: Math.min(meta.height || maxDim, maxDim), fit: 'inside' })
        : image;
      await pipeline.webp({ quality }).toFile(webpPath);
    }

    // Generate responsive variants
    const maxWidth = meta.width || 0;
    let createdCount = fs.existsSync(webpPath) ? 0 : 1;
    await Promise.all(sizes
      .filter(w => w <= maxWidth)
      .map(async (w) => {
        const sizedPath = `${base}-${w}.webp`;
        if (fs.existsSync(sizedPath)) return;
        await sharp(filePath, { failOnError: false })
          .resize({ width: w, fit: 'inside' })
          .webp({ quality })
          .toFile(sizedPath);
        createdCount++;
      }));

    return { created: createdCount > 0, webpPath };
  } catch (err) {
    console.error('Failed to create webp for', filePath, err.message);
    return { created: false, error: err };
  }
}

function walkDir(dir, cb) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(full, cb);
    else cb(full);
  }
}

(async function main() {
  console.log('Image optimization started...');
  console.log('Target directories:', targetDirs.join(', '));
  let converted = 0, skipped = 0;
  for (const dir of targetDirs) {
    walkDir(dir, async (file) => {
      if (!isImageFile(file)) return;
      const res = await ensureWebP(file);
      if (res.created) converted++; else skipped++;
    });
  }
  // Allow async operations to flush
  setTimeout(() => {
    console.log(`Image optimization completed. WebP created: ${converted}, skipped/existing: ${skipped}`);
  }, 1000);
})();