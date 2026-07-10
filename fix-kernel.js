const fs = require('fs');

function replaceKernel(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/synchronisée avec le Kernel/gi, '');
  content = content.replace(/boutique kernel/gi, 'boutique');
  content = content.replace(/depuis le Kernel/gi, '');
  content = content.replace(/directement avec le kernel/gi, '');
  content = content.replace(/Boutique Kernel Officielle/gi, 'Boutique Officielle');
  content = content.replace(/serveur Kernel/gi, 'serveur');
  content = content.replace(/dans le Kernel/gi, '');
  content = content.replace(/catalogue Kernel/gi, 'catalogue');
  content = content.replace(/Catégories Kernel/gi, 'Catégories');
  content = content.replace(/articles Kernel/gi, 'articles');
  content = content.replace(/produits kernel/gi, 'produits');
  fs.writeFileSync(filepath, content);
}

replaceKernel('./src/app/[tenantId]/layout.tsx');
replaceKernel('./src/app/[tenantId]/page.tsx');
replaceKernel('./src/app/[tenantId]/products/page.tsx');
