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
    
    // Se já for .webp, verificar tamanho e recomprimir se necessário
    if (ext === '.webp') {
      const stats = fs.statSync(filePath);
      const size = stats.size;
      // Se maior que 250KB, recomprimir com mais agressividade
      if (size > 250 * 1024) {
        console.log(`⚠️  ${basename}${ext} é grande (${(size / 1024).toFixed(2)} KB), recomprimindo...`);
        // Continuar processamento
      } else {
        console.log(`✓ Pulando ${basename}${ext} (já otimizado: ${(size / 1024).toFixed(2)} KB)`);
        return;
      }
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
    
    // Obter metadados da imagem
    const metadata = await image.metadata();
    
    // Redimensionar se muito grande - máximo 1600px de largura OU altura
    // Para web, não precisamos de imagens gigantes
    let width = metadata.width;
    let height = metadata.height;
    const maxDimension = 1600;
    
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        width = maxDimension;
        height = null; // manter aspect ratio
      } else {
        height = maxDimension;
        width = null; // manter aspect ratio
      }
      
      image = image.resize(width, height, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    // Ajustar qualidade baseado no tamanho original
    // Imagens maiores precisam de mais compressão
    let quality = 80;
    if (originalSize > 200 * 1024) { // > 200KB
      quality = 75;
    }
    if (originalSize > 300 * 1024) { // > 300KB
      quality = 70;
    }
    if (originalSize > 500 * 1024) { // > 500KB
      quality = 65;
    }
    
    // Comprimir para WebP
    await image
      .webp({ quality, effort: 6 }) // effort 6 = melhor compressão (mais lento mas menor arquivo)
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

