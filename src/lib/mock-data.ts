import { 
  Tenant, 
  Category, 
  CategoryI18n, 
  Product, 
  ProductSpec, 
  Variant, 
  VariantAttribute, 
  Price, 
  Batch, 
  MediaAsset,
  Warehouse,
  StockMovement,
  WarehouseTransfer,
  ProductTransformation,
  InventorySession,
  InventorySessionItem
} from './types';

export const TENANTS: Tenant[] = [
  {
    id: 't1',
    name: 'Boulangerie Délices',
    slug: 'boulangerie-delices',
    description: 'Le meilleur pain artisanal de Yaoundé, cuit au feu de bois.',
    themeColor: '#f59e0b',
  },
  {
    id: 't2',
    name: 'Tech Horizon',
    slug: 'tech-horizon',
    description: 'Matériel informatique de pointe et accessoires high-tech.',
    themeColor: '#3b82f6',
  },
  {
    id: 't3',
    name: 'Pharmacie du Soleil',
    slug: 'pharmacie-du-soleil',
    description: 'Santé et bien-être pour toute la famille.',
    themeColor: '#10b981',
  },
];

export const CATEGORIES: Category[] = [
  // Boulangerie categories
  { id: 'c1', tenantId: 't1', organizationId: 'o1', code: 'CAT-PAI', parentId: null, level: 0 },
  { id: 'c2', tenantId: 't1', organizationId: 'o1', code: 'CAT-VIE', parentId: null, level: 0 },
  { id: 'c3', tenantId: 't1', organizationId: 'o1', code: 'CAT-PAT', parentId: null, level: 0 },
  // Hierarchical children for Pains
  { id: 'c1_1', tenantId: 't1', organizationId: 'o1', code: 'CAT-PAI-STD', parentId: 'c1', level: 1 },
  { id: 'c1_2', tenantId: 't1', organizationId: 'o1', code: 'CAT-PAI-SPE', parentId: 'c1', level: 1 },

  // Tech Horizon categories
  { id: 'c4', tenantId: 't2', organizationId: 'o2', code: 'CAT-MAT', parentId: null, level: 0 },
  { id: 'c4_1', tenantId: 't2', organizationId: 'o2', code: 'CAT-MAT-COMP', parentId: 'c4', level: 1 },
  { id: 'c4_2', tenantId: 't2', organizationId: 'o2', code: 'CAT-MAT-PERI', parentId: 'c4', level: 1 },
  { id: 'c6', tenantId: 't2', organizationId: 'o2', code: 'CAT-PHO', parentId: null, level: 0 },

  // Pharmacie categories
  { id: 'c7', tenantId: 't3', organizationId: 'o3', code: 'CAT-MED', parentId: null, level: 0 },
  { id: 'c8', tenantId: 't3', organizationId: 'o3', code: 'CAT-PARA', parentId: null, level: 0 },
];

export const CATEGORY_I18NS: CategoryI18n[] = [
  // French
  { categoryId: 'c1', locale: 'fr', name: 'Pains', description: 'Tous nos pains croustillants' },
  { categoryId: 'c2', locale: 'fr', name: 'Viennoiseries', description: 'Croissants, pains au chocolat et gourmandises' },
  { categoryId: 'c3', locale: 'fr', name: 'Pâtisseries', description: 'Gâteaux et tartes fines' },
  { categoryId: 'c1_1', locale: 'fr', name: 'Pains Traditionnels', description: 'Pains tradition Camerounaise' },
  { categoryId: 'c1_2', locale: 'fr', name: 'Pains Spéciaux', description: 'Pains complets, céréales, sans gluten' },
  
  { categoryId: 'c4', locale: 'fr', name: 'Matériel Info', description: 'Ordinateurs et composants électroniques' },
  { categoryId: 'c4_1', locale: 'fr', name: 'Ordinateurs', description: 'Portables et PC de bureau' },
  { categoryId: 'c4_2', locale: 'fr', name: 'Accessoires & Périphériques', description: 'Claviers, souris et écrans' },
  { categoryId: 'c6', locale: 'fr', name: 'Téléphones & Tablettes', description: 'Dernières nouveautés mobiles' },

  { categoryId: 'c7', locale: 'fr', name: 'Médicaments', description: 'Produits pharmaceutiques sur ordonnance ou conseil' },
  { categoryId: 'c8', locale: 'fr', name: 'Parapharmacie', description: 'Cosmétiques, hygiène et compléments alimentaires' },

  // English (Translations)
  { categoryId: 'c1', locale: 'en', name: 'Breads', description: 'All our crispy breads' },
  { categoryId: 'c2', locale: 'en', name: 'Pastries', description: 'Croissants, chocolate breads and treats' },
  { categoryId: 'c3', locale: 'en', name: 'Cakes & Tarts', description: 'Fine cakes and tarts' },
  { categoryId: 'c4', locale: 'en', name: 'Hardware', description: 'Computers and electronic components' },
  { categoryId: 'c7', locale: 'en', name: 'Medicines', description: 'Prescription and over-the-counter medicines' }
];

export const PRODUCTS: Product[] = [
  // Tenant 1: Boulangerie (5 Produits principaux)
  {
    id: 'p1',
    tenantId: 't1',
    organizationId: 'o1',
    code: 'PRD-BAG-TRAD',
    name: 'Baguette Tradition',
    description: 'Baguette croustillante faite main à la farine locale camerounaise.',
    categoryId: 'c1_1',
    status: 'ACTIVE',
    createdAt: '2026-01-10T08:00:00Z',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80',
  },
  {
    id: 'p2',
    tenantId: 't1',
    organizationId: 'o1',
    code: 'PRD-CRO-BEU',
    name: 'Croissant au Beurre',
    description: 'Pur beurre, feuilletage parfait et doré.',
    categoryId: 'c2',
    status: 'ACTIVE',
    createdAt: '2026-01-11T08:00:00Z',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80',
  },
  {
    id: 'p3',
    tenantId: 't1',
    organizationId: 'o1',
    code: 'PRD-PAI-CHO',
    name: 'Pain au Chocolat',
    description: 'Un classique gourmand avec deux barres de chocolat.',
    categoryId: 'c2',
    status: 'ACTIVE',
    createdAt: '2026-01-12T08:00:00Z',
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=500&q=80',
  },
  {
    id: 'p7',
    tenantId: 't1',
    organizationId: 'o1',
    code: 'PRD-PAI-COM',
    name: 'Pain Complet',
    description: 'Riche en fibres pour un petit-déjeuner sain.',
    categoryId: 'c1_2',
    status: 'ACTIVE',
    createdAt: '2026-01-13T08:00:00Z',
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&q=80',
  },

  // Tenant 2: Tech Horizon (4 Produits principaux)
  {
    id: 'p4',
    tenantId: 't2',
    organizationId: 'o2',
    code: 'PRD-LAP-PRO15',
    name: 'Laptop Pro 15',
    description: 'Processeur ultra-rapide i7, idéal pour le travail et la création.',
    categoryId: 'c4_1',
    status: 'ACTIVE',
    createdAt: '2026-02-01T10:00:00Z',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80',
  },
  {
    id: 'p5',
    tenantId: 't2',
    organizationId: 'o2',
    code: 'PRD-MOU-WRL',
    name: 'Souris Sans Fil',
    description: 'Ergonomique avec une batterie longue durée.',
    categoryId: 'c4_2',
    status: 'ACTIVE',
    createdAt: '2026-02-02T10:00:00Z',
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80',
  },
  {
    id: 'p14',
    tenantId: 't2',
    organizationId: 'o2',
    code: 'PRD-PHN-IP15',
    name: 'iPhone 15 Pro',
    description: 'Titane, puce A17 Pro, système photo avancé.',
    categoryId: 'c6',
    status: 'ACTIVE',
    createdAt: '2026-02-05T12:00:00Z',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=500&q=80',
  },

  // Tenant 3: Pharmacie du Soleil (3 Produits principaux)
  {
    id: 'p21',
    tenantId: 't3',
    organizationId: 'o3',
    code: 'PRD-MED-PARA',
    name: 'Paracétamol Biogaran',
    description: 'Antalgique et antipyretique. Soulage douleurs et fièvre.',
    categoryId: 'c7',
    status: 'ACTIVE',
    createdAt: '2026-03-01T09:00:00Z',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&q=80',
  },
  {
    id: 'p22',
    tenantId: 't3',
    organizationId: 'o3',
    code: 'PRD-MED-AMOX',
    name: 'Amoxicilline 500mg',
    description: 'Antibiotique à large spectre pour le traitement des infections bactériennes.',
    categoryId: 'c7',
    status: 'ACTIVE',
    createdAt: '2026-03-02T09:00:00Z',
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=500&q=80',
  },
];

export const PRODUCT_SPECS: ProductSpec[] = [
  { productId: 'p1', weightKg: 0.25, lengthCm: 60, widthCm: 6, heightCm: 5, materials: 'Farine de Blé, Levain local' },
  { productId: 'p2', weightKg: 0.08, lengthCm: 15, widthCm: 10, heightCm: 6, materials: 'Beurre, Farine' },
  { productId: 'p4', weightKg: 1.8, lengthCm: 35.7, widthCm: 23.5, heightCm: 1.6, materials: 'Aluminium, Composants électroniques' },
  { productId: 'p14', weightKg: 0.187, lengthCm: 14.6, widthCm: 7.0, heightCm: 0.82, materials: 'Titane, Verre, Céramique' },
];

export const VARIANTS: Variant[] = [
  // Baguette Tradition variants
  { id: 'v1_1', productId: 'p1', sku: 'BAG-TRAD-STD', barcode: '3250390001011', isDefault: true, status: 'ACTIVE' },
  { id: 'v1_2', productId: 'p1', sku: 'BAG-TRAD-XL', barcode: '3250390001012', isDefault: false, status: 'ACTIVE' },
  
  // Croissant variants
  { id: 'v2_1', productId: 'p2', sku: 'CRO-BEU-STD', barcode: '3250390002011', isDefault: true, status: 'ACTIVE' },
  
  // Pain au Chocolat variants
  { id: 'v3_1', productId: 'p3', sku: 'CHO-STD', barcode: '3250390003011', isDefault: true, status: 'ACTIVE' },
  
  // Pain Complet variants
  { id: 'v7_1', productId: 'p7', sku: 'PAI-COM-STD', barcode: '3250390007011', isDefault: true, status: 'ACTIVE' },

  // Laptop Pro 15 variants
  { id: 'v4_1', productId: 'p4', sku: 'LAP15-16-512', barcode: '190199268301', isDefault: true, status: 'ACTIVE' },
  { id: 'v4_2', productId: 'p4', sku: 'LAP15-32-1TB', barcode: '190199268302', isDefault: false, status: 'ACTIVE' },

  // Souris variants
  { id: 'v5_1', productId: 'p5', sku: 'MOU-WRL-BLK', barcode: '097855146522', isDefault: true, status: 'ACTIVE' },
  
  // iPhone variants
  { id: 'v14_1', productId: 'p14', sku: 'IP15-128-TIT', barcode: '195949039301', isDefault: true, status: 'ACTIVE' },
  { id: 'v14_2', productId: 'p14', sku: 'IP15-256-BLK', barcode: '195949039302', isDefault: false, status: 'ACTIVE' },

  // Paracétamol variants
  { id: 'v21_1', productId: 'p21', sku: 'PARA-BIO-10G', barcode: '3400938473921', isDefault: true, status: 'ACTIVE' },
  { id: 'v21_2', productId: 'p21', sku: 'PARA-BIO-30G', barcode: '3400938473922', isDefault: false, status: 'ACTIVE' },

  // Amoxicilline variants
  { id: 'v22_1', productId: 'p22', sku: 'AMOX-500-14G', barcode: '3400931122334', isDefault: true, status: 'ACTIVE' },
];

export const VARIANT_ATTRIBUTES: VariantAttribute[] = [
  // Baguette
  { variantId: 'v1_1', attributeName: 'Taille', attributeValue: 'Standard' },
  { variantId: 'v1_2', attributeName: 'Taille', attributeValue: 'Grande (XL)' },

  // Laptop
  { variantId: 'v4_1', attributeName: 'RAM / Stockage', attributeValue: '16GB / 512GB SSD' },
  { variantId: 'v4_2', attributeName: 'RAM / Stockage', attributeValue: '32GB / 1TB SSD' },

  // Souris
  { variantId: 'v5_1', attributeName: 'Couleur', attributeValue: 'Noir Graphite' },

  // iPhone
  { variantId: 'v14_1', attributeName: 'Capacité / Couleur', attributeValue: '128GB / Titane Naturel' },
  { variantId: 'v14_2', attributeName: 'Capacité / Couleur', attributeValue: '256GB / Noir Sidéral' },

  // Paracétamol
  { variantId: 'v21_1', attributeName: 'Conditionnement', attributeValue: 'Boîte de 10 gélules' },
  { variantId: 'v21_2', attributeName: 'Conditionnement', attributeValue: 'Boîte de 30 gélules' },
];

export const PRICES: Price[] = [
  // Price versions (effectiveFrom date changes)
  // Baguette Standard
  { id: 'pr1', variantId: 'v1_1', amount: 150, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-01-01' },
  { id: 'pr1_updated', variantId: 'v1_1', amount: 200, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-06-01' }, // current price
  { id: 'pr2', variantId: 'v1_2', amount: 300, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-01-01' },

  // Croissant
  { id: 'pr3', variantId: 'v2_1', amount: 450, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-01-01' },
  { id: 'pr3_promo', variantId: 'v2_1', amount: 500, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-06-15' }, // current price is 500

  // Pain chocolat
  { id: 'pr4', variantId: 'v3_1', amount: 600, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-01-01' },

  // Pain Complet
  { id: 'pr7', variantId: 'v7_1', amount: 1000, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-01-01' },

  // Laptop
  { id: 'pr5', variantId: 'v4_1', amount: 850000, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-01-01' },
  { id: 'pr6', variantId: 'v4_2', amount: 1150000, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-01-01' },

  // Mouse
  { id: 'pr8', variantId: 'v5_1', amount: 25000, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-01-01' },

  // iPhone
  { id: 'pr14_1', variantId: 'v14_1', amount: 950000, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-01-01' },
  { id: 'pr14_2', variantId: 'v14_2', amount: 1100000, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-01-01' },

  // Paracétamol
  { id: 'pr21_1', variantId: 'v21_1', amount: 500, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-01-01' },
  { id: 'pr21_2', variantId: 'v21_2', amount: 1200, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-01-01' },

  // Amoxicilline
  { id: 'pr22_1', variantId: 'v22_1', amount: 1800, currency: 'FCFA', priceType: 'RETAIL', effectiveFrom: '2026-01-01' },
];

export const BATCHES: Batch[] = [
  { id: 'b1', productId: 'p1', lotNumber: 'LOT-BAG-20260615', manufacturingDate: '2026-06-15', expiryDate: '2026-06-18', quantity: 200 },
  { id: 'b2', productId: 'p2', lotNumber: 'LOT-CRO-20260616', manufacturingDate: '2026-06-16', expiryDate: '2026-06-19', quantity: 100 },
  { id: 'b3', productId: 'p21', lotNumber: 'LOT-MED-PARA003', manufacturingDate: '2026-02-10', expiryDate: '2028-02-10', quantity: 2000 },
];

export const MEDIA_ASSETS: MediaAsset[] = [
  { id: 'm1', targetType: 'PRODUCT', targetId: 'p1', fileId: 'f1', mimeType: 'image/jpeg', position: 1, altText: 'Baguette Tradition Camerounaise' },
  { id: 'm2', targetType: 'PRODUCT', targetId: 'p2', fileId: 'f2', mimeType: 'image/jpeg', position: 1, altText: 'Croissant au Beurre doré' },
  { id: 'm3', targetType: 'PRODUCT', targetId: 'p4', fileId: 'f3', mimeType: 'image/jpeg', position: 1, altText: 'Laptop Pro 15' },
];

// --- INVENTORY INITIAL SEEDS ---

export const WAREHOUSES: Warehouse[] = [
  // For tenant 1 (Boulangerie Délices)
  { id: 'wh1_1', tenantId: 't1', organizationId: 'o1', name: 'Four principal - Akwa', code: 'WH-AKWA', type: 'WAREHOUSE' },
  { id: 'wh1_2', tenantId: 't1', organizationId: 'o1', name: 'Boutique Bonapriso', code: 'WH-BONA', type: 'RETAIL' },

  // For tenant 2 (Tech Horizon)
  { id: 'wh2_1', tenantId: 't2', organizationId: 'o2', name: 'Dépôt Central Yaoundé', code: 'WH-YDE-CTR', type: 'WAREHOUSE' },
  { id: 'wh2_2', tenantId: 't2', organizationId: 'o2', name: 'Showroom Yaoundé', code: 'WH-YDE-SHW', type: 'RETAIL' },

  // For tenant 3 (Pharmacie du Soleil)
  { id: 'wh3_1', tenantId: 't3', organizationId: 'o3', name: 'Réserve Pharmacie', code: 'WH-PHA-RES', type: 'WAREHOUSE' },
];

export const STOCK_MOVEMENTS: StockMovement[] = [
  // Seed movements to establish starting stock levels
  // Boulangerie - Akwa Warehouse (wh1_1)
  { id: 'sm1', tenantId: 't1', organizationId: 'o1', variantId: 'v1_1', warehouseId: 'wh1_1', referenceNumber: 'MVT-20260601-0001', type: 'INBOUND', status: 'VALIDATED', quantity: 300, createdAt: '2026-06-01T06:00:00Z' },
  { id: 'sm2', tenantId: 't1', organizationId: 'o1', variantId: 'v1_2', warehouseId: 'wh1_1', referenceNumber: 'MVT-20260601-0002', type: 'INBOUND', status: 'VALIDATED', quantity: 100, createdAt: '2026-06-01T06:10:00Z' },
  { id: 'sm3', tenantId: 't1', organizationId: 'o1', variantId: 'v2_1', warehouseId: 'wh1_1', referenceNumber: 'MVT-20260601-0003', type: 'INBOUND', status: 'VALIDATED', quantity: 150, createdAt: '2026-06-01T06:20:00Z' },
  { id: 'sm4', tenantId: 't1', organizationId: 'o1', variantId: 'v3_1', warehouseId: 'wh1_1', referenceNumber: 'MVT-20260601-0004', type: 'INBOUND', status: 'VALIDATED', quantity: 80, createdAt: '2026-06-01T06:30:00Z' },
  
  // Deliveries/Outbounds (Boulangerie sales mock)
  { id: 'sm5', tenantId: 't1', organizationId: 'o1', variantId: 'v1_1', warehouseId: 'wh1_1', referenceNumber: 'MVT-20260610-0001', type: 'OUTBOUND', status: 'VALIDATED', quantity: 120, createdAt: '2026-06-10T18:00:00Z' },
  
  // Tech Horizon
  { id: 'sm6', tenantId: 't2', organizationId: 'o2', variantId: 'v4_1', warehouseId: 'wh2_1', referenceNumber: 'MVT-20260601-1001', type: 'INBOUND', status: 'VALIDATED', quantity: 20, createdAt: '2026-06-01T09:00:00Z' },
  { id: 'sm7', tenantId: 't2', organizationId: 'o2', variantId: 'v4_2', warehouseId: 'wh2_1', referenceNumber: 'MVT-20260601-1002', type: 'INBOUND', status: 'VALIDATED', quantity: 8, createdAt: '2026-06-01T09:15:00Z' },
  { id: 'sm8', tenantId: 't2', organizationId: 'o2', variantId: 'v5_1', warehouseId: 'wh2_1', referenceNumber: 'MVT-20260601-1003', type: 'INBOUND', status: 'VALIDATED', quantity: 150, createdAt: '2026-06-01T09:30:00Z' },
  { id: 'sm9', tenantId: 't2', organizationId: 'o2', variantId: 'v14_1', warehouseId: 'wh2_1', referenceNumber: 'MVT-20260601-1004', type: 'INBOUND', status: 'VALIDATED', quantity: 25, createdAt: '2026-06-01T10:00:00Z' },
  { id: 'sm10', tenantId: 't2', organizationId: 'o2', variantId: 'v14_2', warehouseId: 'wh2_1', referenceNumber: 'MVT-20260601-1005', type: 'INBOUND', status: 'VALIDATED', quantity: 15, createdAt: '2026-06-01T10:10:00Z' },

  // Pharmacie
  { id: 'sm11', tenantId: 't3', organizationId: 'o3', variantId: 'v21_1', warehouseId: 'wh3_1', referenceNumber: 'MVT-20260601-2001', type: 'INBOUND', status: 'VALIDATED', quantity: 1000, createdAt: '2026-06-01T08:00:00Z' },
  { id: 'sm12', tenantId: 't3', organizationId: 'o3', variantId: 'v21_2', warehouseId: 'wh3_1', referenceNumber: 'MVT-20260601-2002', type: 'INBOUND', status: 'VALIDATED', quantity: 400, createdAt: '2026-06-01T08:15:00Z' },
  { id: 'sm13', tenantId: 't3', organizationId: 'o3', variantId: 'v22_1', warehouseId: 'wh3_1', referenceNumber: 'MVT-20260601-2003', type: 'INBOUND', status: 'VALIDATED', quantity: 100, createdAt: '2026-06-01T08:30:00Z' },
];

export const WAREHOUSE_TRANSFERS: WarehouseTransfer[] = [
  // Inter-warehouse transfer from Akwa to Bonapriso
  { 
    id: 'trsf1', 
    tenantId: 't1', 
    organizationId: 'o1', 
    referenceNumber: 'TRSF-20260612-0001', 
    sourceWarehouseId: 'wh1_1', 
    targetWarehouseId: 'wh1_2', 
    variantId: 'v1_1', 
    quantity: 50, 
    status: 'COMPLETED', // will affect wh1_1 (-) and wh1_2 (+)
    createdAt: '2026-06-12T10:00:00Z' 
  },
  { 
    id: 'trsf2', 
    tenantId: 't1', 
    organizationId: 'o1', 
    referenceNumber: 'TRSF-20260614-0002', 
    sourceWarehouseId: 'wh1_1', 
    targetWarehouseId: 'wh1_2', 
    variantId: 'v2_1', 
    quantity: 30, 
    status: 'REQUESTED', // status is not completed, so does not affect balances yet
    createdAt: '2026-06-14T11:00:00Z' 
  },
];

export const PRODUCT_TRANSFORMATIONS: ProductTransformation[] = [
  // E.g. transformed 5 standard baguettes into 10 Toast Packs (if Toast Pack variant exists)
  // Let's model a mock transformation from Baguette STD (v1_1) into Croissant STD (v2_1) just for seed data
  {
    id: 'transf1',
    tenantId: 't1',
    organizationId: 'o1',
    referenceNumber: 'TRNF-20260615-0001',
    sourceVariantId: 'v1_1',
    targetVariantId: 'v2_1',
    sourceQuantity: 10,
    targetQuantity: 8,
    status: 'VALIDATED', // -10 v1_1, +8 v2_1
    createdAt: '2026-06-15T14:00:00Z'
  }
];

export const INVENTORY_SESSIONS: InventorySession[] = [
  {
    id: 'sess1',
    tenantId: 't1',
    organizationId: 'o1',
    referenceNumber: 'SESS-20260616-0001',
    warehouseId: 'wh1_1',
    status: 'VALIDATED',
    createdAt: '2026-06-16T17:00:00Z'
  }
];

export const INVENTORY_SESSION_ITEMS: InventorySessionItem[] = [
  { id: 'sitem1', sessionId: 'sess1', variantId: 'v1_1', quantityCounted: 110 }
];
