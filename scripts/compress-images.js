import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretórios a processar
const directories = [
  path.join(__dirname, '../src/assets'),
  path.join(__dirname, '../public')
];

// Extensões de imagem suportadas
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

async function compressImage(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    
    // Pular se já for .webp
    if (ext === '.webp') {
      console.log(`✓ Pulando ${basename}${ext} (já é WebP)`);
      return;
    }
    
    const stats = fs.statSync(filePath);
    const originalSize = stats.size;
    
    // Configurações de compressão
    const options = {
      quality: 80, // Qualidade para JPEG (0-100)
      mozjpeg: true, // Usar mozjpeg para melhor compressão
    };
    
    // Converter para WebP para melhor compressão
    const outputPath = path.join(dir, `${basename}.webp`);
    
    let image = sharp(filePath);
    
    // Redimensionar se muito grande (máximo 1920px de largura)
    const metadata = await image.metadata();
    if (metadata.width > 1920) {
      image = image.resize(1920, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    // Comprimir para WebP
    await image
      .webp({ quality: 85 })
      .toFile(outputPath);
    
    const newStats = fs.statSync(outputPath);
    const newSize = newStats.size;
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    console.log(`✓ ${basename}${ext} → ${basename}.webp`);
    console.log(`  ${(originalSize / 1024).toFixed(2)} KB → ${(newSize / 1024).toFixed(2)} KB (${reduction}% redução)`);
    
    // Se a redução for significativa, substituir o arquivo original
    if (reduction > 30) {
      // Backup do original
      const backupPath = path.join(dir, `${basename}_original${ext}`);
      fs.copyFileSync(filePath, backupPath);
      
      // Converter WebP de volta para o formato original se necessário manter compatibilidade
      // Ou podemos manter WebP e atualizar as referências no código
      console.log(`  Backup salvo em: ${path.basename(backupPath)}`);
    }
    
  } catch (error) {
    console.error(`✗ Erro ao processar ${filePath}:`, error.message);
  }
}

async function findImages(dir) {
  const images = [];
  
  if (!fs.existsSync(dir)) {
    return images;
  }
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      images.push(...await findImages(filePath));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        images.push(filePath);
      }
    }
  }
  
  return images;
}

async function main() {
  console.log('🖼️  Iniciando compressão de imagens...\n');
  
  const allImages = [];
  
  for (const dir of directories) {
    const images = await findImages(dir);
    allImages.push(...images);
  }
  
  if (allImages.length === 0) {
    console.log('Nenhuma imagem encontrada.');
    return;
  }
  
  console.log(`Encontradas ${allImages.length} imagens para processar.\n`);
  
  for (const imagePath of allImages) {
    await compressImage(imagePath);
  }
  
  console.log('\n✅ Compressão concluída!');
  console.log('\n⚠️  Lembre-se de:');
  console.log('1. Atualizar as referências no código de .jpg/.png para .webp');
  console.log('2. Testar se todas as imagens estão carregando corretamente');
  console.log('3. Remover os backups (_original) se estiver tudo OK');
}

main().catch(console.error);

