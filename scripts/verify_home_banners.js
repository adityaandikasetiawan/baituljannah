/*
 * Simple verification script for Home Banners
 * - Ensures active banners are ordered by order_index ASC
 * - Prints the list of active banners used by homepage (LIMIT 3)
 * - Optionally checks that image files exist on disk
 */

const path = require('path');
const fs = require('fs');
const { dbHelpers } = require('../database');

async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  try {
    const activeBanners = await dbHelpers.all(
      `SELECT id, title, subtitle, image, link, order_index, status
       FROM home_banners WHERE status = 'active'
       ORDER BY order_index ASC, created_at DESC LIMIT 3`
    );

    const allActiveCount = await dbHelpers.get(
      `SELECT COUNT(*) AS count FROM home_banners WHERE status = 'active'`
    );

    console.log('Active banners (limited to 3, ordered by order_index ASC):');
    activeBanners.forEach((b, idx) => {
      console.log(
        `  ${idx + 1}. id=${b.id} title="${b.title}" order_index=${b.order_index} image=${b.image}`
      );
    });

    // Check ascending order_index
    let isAscending = true;
    for (let i = 1; i < activeBanners.length; i++) {
      if (Number(activeBanners[i].order_index) < Number(activeBanners[i - 1].order_index)) {
        isAscending = false;
        break;
      }
    }

    // Check images exist on disk for the selected (limited) banners
    const cwd = process.cwd();
    const imageChecks = [];
    for (const b of activeBanners) {
      // image is typically like "/uploads/banners/banner-xxxx.jpg"
      const localPath = path.join(cwd, b.image.replace(/^\//, ''));
      // Also try webp variant if jpg not present
      const webpPath = localPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      const existsOriginal = await fileExists(localPath);
      const existsWebp = await fileExists(webpPath);
      imageChecks.push({ id: b.id, image: b.image, existsOriginal, existsWebp });
    }

    console.log('\nVerification summary:');
    console.log(`  Total active banners in DB: ${allActiveCount.count}`);
    console.log(`  Returned for homepage (limit 3): ${activeBanners.length}`);
    console.log(`  Order ascending by order_index: ${isAscending ? 'YES' : 'NO'}`);
    imageChecks.forEach(ic => {
      console.log(
        `  Image check id=${ic.id}: original=${ic.existsOriginal ? 'OK' : 'missing'} ` +
        `(webp alt=${ic.existsWebp ? 'OK' : 'missing'})`
      );
    });

    // Exit code policy:
    // - If order is not ascending => exit 2
    // - If no active banners => exit 3
    // - Otherwise exit 0, even if some image variants are missing
    if (!isAscending) {
      console.error('\nERROR: Active banners are not in ascending order by order_index.');
      process.exit(2);
    }

    if (allActiveCount.count === 0) {
      console.error('\nERROR: No active banners found.');
      process.exit(3);
    }

    console.log('\nOK: Home banners verification passed.');
    process.exit(0);
  } catch (err) {
    console.error('Verification script failed:', err);
    process.exit(1);
  }
}

main();