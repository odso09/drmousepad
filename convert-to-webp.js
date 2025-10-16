import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, 'src', 'assets');
const quality = 85;

// Imágenes a convertir (las más pesadas según Lighthouse)
const imagesToConvert = [
  'gallery-1.jpg',
  'gallery-2.jpg',
  'gallery-3.jpg',
  'gallery-4.jpg',
  'gallery-5.jpg',
  'gallery-6.jpg',
  'gallery-7.jpg',
  'gallery-8.jpg',
  'gallery-9.jpg',
  'gallery-10.jpg',
  'hero-mousepad.jpg'
];

async function convertToWebP() {
  console.log('🖼️  Convirtiendo imágenes a WebP (calidad 85%)...\n');
  
  for (const filename of imagesToConvert) {
    const inputPath = path.join(assetsDir, filename);
    const outputPath = path.join(assetsDir, filename.replace(/\.jpg$/, '.webp'));
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  ${filename} no encontrado, saltando...`);
      continue;
    }
    
    try {
      const inputStats = fs.statSync(inputPath);
      const inputSizeKB = (inputStats.size / 1024).toFixed(2);
      
      await sharp(inputPath)
        .webp({ quality })
        .toFile(outputPath);
      
      const outputStats = fs.statSync(outputPath);
      const outputSizeKB = (outputStats.size / 1024).toFixed(2);
      const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
      
      console.log(`✅ ${filename}`);
      console.log(`   ${inputSizeKB} KB → ${outputSizeKB} KB (${reduction}% reducción)\n`);
    } catch (error) {
      console.error(`❌ Error convirtiendo ${filename}:`, error.message);
    }
  }
  
  console.log('✨ Conversión completada!');
  console.log('\n📝 Próximo paso: Actualizar las importaciones en los componentes');
  console.log('   Cambiar .jpg por .webp en Hero.tsx y Gallery.tsx');
}

convertToWebP();
