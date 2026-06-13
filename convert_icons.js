const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const sourceFile = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\2777394c-6b17-46c3-b2dd-e1f5fa0efb36\\media__1781350074710.jpg';

const androidDensities = [
  { name: 'mipmap-mdpi',    size: 48  },
  { name: 'mipmap-hdpi',    size: 72  },
  { name: 'mipmap-xhdpi',   size: 96  },
  { name: 'mipmap-xxhdpi',  size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 },
];

const iosIcons = [
  { size: 20, scale: 2, name: 'icon-20@2x.png' },
  { size: 20, scale: 3, name: 'icon-20@3x.png' },
  { size: 29, scale: 2, name: 'icon-29@2x.png' },
  { size: 29, scale: 3, name: 'icon-29@3x.png' },
  { size: 40, scale: 2, name: 'icon-40@2x.png' },
  { size: 40, scale: 3, name: 'icon-40@3x.png' },
  { size: 60, scale: 2, name: 'icon-60@2x.png' },
  { size: 60, scale: 3, name: 'icon-60@3x.png' },
  { size: 1024, scale: 1, name: 'icon-1024.png' }
];

const androidResDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
const iosAppIconDir = path.join(__dirname, 'ios', 'IdhayamApp', 'Images.xcassets', 'AppIcon.appiconset');

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

  // Ensure Android dirs exist
  for (const density of androidDensities) {
    const folder = path.join(androidResDir, density.name);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    
    for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
      const outPath = path.join(folder, name);
      await img.clone().resize({ w: density.size, h: density.size }).write(outPath);
      console.log(`✅ Written: Android ${density.name}/${name} [${density.size}x${density.size}]`);
    }
  }

  // Ensure iOS dir exists
  if (!fs.existsSync(iosAppIconDir)) fs.mkdirSync(iosAppIconDir, { recursive: true });
  
  const iosImagesJson = [];
  for (const icon of iosIcons) {
    const outPath = path.join(iosAppIconDir, icon.name);
    const pxSize = icon.size * icon.scale;
    await img.clone().resize({ w: pxSize, h: pxSize }).write(outPath);
    console.log(`✅ Written: iOS ${icon.name} [${pxSize}x${pxSize}]`);
    
    iosImagesJson.push({
      size: `${icon.size}x${icon.size}`,
      idiom: icon.size === 1024 ? 'ios-marketing' : 'iphone',
      filename: icon.name,
      scale: `${icon.scale}x`
    });
  }

  // Write iOS Contents.json
  const contentsJson = {
    images: iosImagesJson,
    info: { author: 'xcode', version: 1 }
  };
  fs.writeFileSync(path.join(iosAppIconDir, 'Contents.json'), JSON.stringify(contentsJson, null, 2));
  console.log('✅ Written: iOS Contents.json');

  console.log('\nAll icons generated successfully!');
}

convert().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
