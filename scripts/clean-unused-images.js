import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lista de imagens que estão sendo usadas no código
const usedImages = new Set([
  'mastermind.webp',
  'bolsa100.webp',
  '50desconto 2.webp',
  'networking.webp',
  'participacao.webp',
  'foto 1 ceme.jpg',
  'foto 2 ceme.jpg',
  'foto 3 ceme.jpg',
  'foto 4 ceme.jpg',
  'foto 5 ceme.jpg',
  'foto 7 ceme.jpg',
  'foto 8 ceme.jpg',
  'foto 9 ceme.jpg',
  'foto 10 ceme.jpg',
  'foto 11 ceme.jpg',
  'foto 12 ceme.jpg',
  'foto 13 ceme.jpg',
  'foto 14 ceme.jpg',
  'foto ceme 15.jpg',
  'foto 16 ceme.jpg',
  'foto 1 brant.jpg',
  'foto 2 brant.jpg',
  'foto 2.webp',
  'foto 3 bramt.jpg',
  'foto 5 brat.jpg',
  'foto 6 brant.jpg',
  'foto bone american dream.jpg',
  'logo-bg.webp',
  'placeholder.svg' // Mantém placeholder
]);

const publicDir = path.join(__dirname, '..', 'public');
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];

function getAllImageFiles(dir) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (imageExtensions.includes(ext)) {
          files.push(item);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

function shouldKeepImage(filename) {
  // Mantém se estiver na lista de usadas
  if (usedImages.has(filename)) {
    return true;
  }
  
  // Mantém arquivos que não são imagens
  const ext = path.extname(filename).toLowerCase();
  if (!imageExtensions.includes(ext)) {
    return true;
  }
  
  return false;
}

function main() {
  console.log('🔍 Procurando imagens não utilizadas...\n');
  
  const allImages = getAllImageFiles(publicDir);
  const unusedImages = [];
  
  for (const image of allImages) {
    if (!shouldKeepImage(image)) {
      unusedImages.push(image);
    }
  }
  
  if (unusedImages.length === 0) {
    console.log('✅ Nenhuma imagem não utilizada encontrada!');
    return;
  }
  
  console.log(`📊 Encontradas ${unusedImages.length} imagens não utilizadas:\n`);
  
  // Agrupa por categoria
  const categories = {
    original: unusedImages.filter(f => f.includes('_original')),
    duplicates: unusedImages.filter(f => {
      const base = f.replace(/_\d+\.(jpg|jpeg|png|webp)$/i, '');
      return usedImages.has(base.replace(/\.[^.]+$/, ''));
    }),
    other: unusedImages.filter(f => !f.includes('_original') && !f.match(/_\d+\.(jpg|jpeg|png|webp)$/i))
  };
  
  if (categories.original.length > 0) {
    console.log('📦 Versões _original (arquivos de backup da compressão):');
    categories.original.forEach(img => console.log(`   - ${img}`));
    console.log('');
  }
  
  if (categories.duplicates.length > 0) {
    console.log('📋 Duplicatas/versões antigas:');
    categories.duplicates.forEach(img => console.log(`   - ${img}`));
    console.log('');
  }
  
  if (categories.other.length > 0) {
    console.log('🗑️  Outras imagens não utilizadas:');
    categories.other.forEach(img => console.log(`   - ${img}`));
    console.log('');
  }
  
  console.log(`\n💾 Total: ${unusedImages.length} arquivos\n`);
  console.log('⚠️  Para deletar estas imagens, execute este script com o argumento --delete');
  console.log('   Exemplo: node scripts/clean-unused-images.js --delete\n');
  
  // Se --delete foi passado, deleta os arquivos
  if (process.argv.includes('--delete')) {
    console.log('🗑️  Deletando imagens não utilizadas...\n');
    let deleted = 0;
    let errors = 0;
    
    for (const image of unusedImages) {
      try {
        const filePath = path.join(publicDir, image);
        fs.unlinkSync(filePath);
        console.log(`   ✅ Deletado: ${image}`);
        deleted++;
      } catch (error) {
        console.error(`   ❌ Erro ao deletar ${image}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n✅ ${deleted} arquivos deletados`);
    if (errors > 0) {
      console.log(`⚠️  ${errors} erros durante a deleção`);
    }
  }
}

main();

