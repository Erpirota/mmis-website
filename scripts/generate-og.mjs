import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

async function generateOgImage() {
  const width = 1200;
  const height = 630;

  // Read real screenshot
  const screenshotPath = path.resolve('src/assets/screenshots/dashboard-populated.png');
  const screenshotBuffer = await sharp(screenshotPath)
    .resize(900, 562, { fit: 'cover' })
    .toBuffer();

  const svgOverlay = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad" cx="50%" cy="20%" r="80%">
          <stop offset="0%" stop-color="#161A20" />
          <stop offset="100%" stop-color="#0F1115" />
        </radialGradient>
        <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3FB950" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#2D333B" stop-opacity="0.2"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)" />
      
      <!-- Top Title area -->
      <rect x="60" y="44" width="94" height="28" rx="6" fill="#132D1B" stroke="#3FB950" stroke-width="1"/>
      <text x="107" y="63" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#3FB950" text-anchor="middle">WINDOWS</text>
      
      <text x="170" y="65" font-family="system-ui, sans-serif" font-size="32" font-weight="800" fill="#E6EDF3">MMIS</text>
      <text x="275" y="65" font-family="system-ui, sans-serif" font-size="20" font-weight="500" fill="#9DA7B3">Minecraft Mod Intelligence Studio</text>
      
      <!-- Frame for screenshot -->
      <rect x="150" y="110" width="900" height="520" rx="12" fill="#161A20" stroke="url(#strokeGrad)" stroke-width="2"/>
    </svg>
  `;

  // Composite background + screenshot
  await sharp(Buffer.from(svgOverlay))
    .composite([
      {
        input: await sharp(screenshotBuffer).extract({ left: 0, top: 0, width: 896, height: 500 }).toBuffer(),
        top: 125,
        left: 152
      }
    ])
    .png({ quality: 85, compressionLevel: 9 })
    .toFile(path.resolve('public/og-image.png'));

  console.log('OG image created at public/og-image.png');
}

generateOgImage().catch(err => {
  console.error(err);
  process.exit(1);
});
