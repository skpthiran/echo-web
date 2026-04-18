import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Draw background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  // Draw "E"
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Font size calculation: ~65% of canvas size
  const fontSize = Math.floor(size * 0.65);
  ctx.font = `bold ${fontSize}px "Inter", "serif"`;
  
  ctx.fillText('E', size / 2, size / 2);

  const out = fs.createWriteStream(path.join(__dirname, '..', 'public', 'icons', filename));
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  
  return new Promise((resolve, reject) => {
    out.on('finish', () => {
      console.log(`Generated ${filename} (${size}x${size})`);
      resolve();
    });
    out.on('error', reject);
  });
}

async function main() {
  try {
    const iconsDir = path.join(__dirname, '..', 'public', 'icons');
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }

    await Promise.all([
      generateIcon(192, 'icon-192.png'),
      generateIcon(512, 'icon-512.png')
    ]);
    
    console.log('All icons generated successfully.');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();
