/**
 * Script para generar los iconos de la extensión desde el logo.
 * Ejecutar: node chrome-extension/create-icons.js
 * Requiere: npm install sharp --save-dev (o ejecutar una sola vez)
 */

const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '..', 'img', 'icono.png');
  const altLogoPath = path.join(__dirname, '..', 'img', 'logopng.png');
const sizes = [16, 48, 128];

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('Instalando sharp... Ejecuta: npm install sharp --save-dev');
    console.log('Luego vuelve a ejecutar: node chrome-extension/create-icons.js');
    process.exit(1);
  }

  const src = fs.existsSync(logoPath) ? logoPath : altLogoPath;
  if (!fs.existsSync(src)) {
    console.error('No se encontró el icono en img/icono.png ni img/logopng.png');
    process.exit(1);
  }

  for (const size of sizes) {
    const outPath = path.join(__dirname, `icon${size}.png`);
    await sharp(src)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Creado: icon${size}.png`);
  }
  console.log('Iconos generados correctamente.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
