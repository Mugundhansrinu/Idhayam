const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

// Android launcher icon sizes per density
const densities = [
  { name: 'mipmap-mdpi',    size: 48  },
  { name: 'mipmap-hdpi',    size: 72  },
  { name: 'mipmap-xhdpi',   size: 96  },
  { name: 'mipmap-xxhdpi',  size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 },
];

const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
const sourceFile = path.join(resDir, 'mipmap-xxxhdpi', 'ic_launcher.png'); // JPEG disguised as PNG

async function convert() {
  console.log('Reading source icon:', sourceFile);
  
  let img;
  try {
    img = await Jimp.read(sourceFile);
    console.log('Source image size:', img.bitmap.width, 'x', img.bitmap.height);
  } catch (e) {
    console.error('Failed to read source:', e.message);
    process.exit(1);
  }

  for (const density of densities) {
    const folder = path.join(resDir, density.name);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
      const outPath = path.join(folder, name);
      const resized = img.clone().resize({ w: density.size, h: density.size });
      await resized.write(outPath);
      console.log(`✅ Written: ${density.name}/${name} [${density.size}x${density.size}]`);
    }
  }

  console.log('\nAll icons converted and properly resized!');
}

convert().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
