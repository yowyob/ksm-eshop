// --- KERNEL ORGANIZATIONS ---
// Structure exacte retournée par GET /api/organizations du kernel Yowyob

export type Organization = {
  id: string;
  tenantId?: string;
  businessActorId?: string;
  code?: string;
  service?: string;
  isIndividualBusiness?: boolean;
  email?: string | null;
  shortName?: string;       // Nom court — ex: "Test BC SARL"
  longName?: string;        // Nom complet — ex: "Test Business Core Org"
  displayName?: string;     // Nom d'affichage préféré — ex: "Test BC SARL"
  legalName?: string;
  description?: string | null;
  logoUri?: string | null;
  websiteUrl?: string | null;
  governanceStatus?: string;
  isActive?: boolean;
  status?: string;
  organizationType?: string;
  keywords?: string[];
  // Champ virtuel utilisé en interne pour l'affichage (résolu depuis displayName > shortName > longName > code)
  name: string;
  [key: string]: any;
};

export type KernelProduct = {
  id: string;
  organizationId: string;
  tenantId?: string;
  code?: string;
  name: string;
  description?: string;
  status?: string;
  categoryId?: string;
  isFeatured?: boolean;
  createdAt?: string;
  [key: string]: any;
};

export type StockEntry = {
  variantId: string;
  productId?: string;
  warehouseId?: string;
  quantity: number;
  [key: string]: any;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description: string;
  themeColor: string;
};

// --- PRODUCT-CORE ---

export type ProductStatus = 'ACTIVE' | 'ARCHIVED' | 'DRAFT';

export type Category = {
  id: string;
  tenantId: string;
  organizationId: string;
  code: string;
  parentId: string | null;
  level: number;
};

export type CategoryI18n = {
  categoryId: string;
  locale: string; // 'fr' | 'en'
  name: string;
  description: string;
};

export type Product = {
  id: string;
  tenantId: string;
  organizationId: string;
  code: string;
  name: string; // fallback/default name
  description: string; // fallback/default description
  categoryId: string;
  status: ProductStatus;
  createdAt: string;
  isFeatured?: boolean;
  imageUrl: string; // kept for compatibility with UI display
  price?: number;
  stock?: number;
  unitPrice?: number;
  wholesalePrice?: number;
  currency?: string;
  photo?: string;
  quantity?: number;
  categoryCode?: string;
  familyCode?: string;
  stockCount?: number;
  options?: { name: string; values: string[] }[]; // e.g. [{name: "Taille", values: ["S", "M", "L"]}]
};

export type ProductSpec = {
  productId: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  materials: string;
};

export type Variant = {
  id: string;
  productId: string;
  sku: string;
  barcode: string;
  isDefault: boolean;
  status: ProductStatus;
};

export type VariantAttribute = {
  variantId: string;
  attributeName: string; // e.g. "taille", "couleur", "matiere"
  attributeValue: string; // e.g. "M", "Rouge", "Coton"
};

export type PriceType = 'RETAIL' | 'WHOLESALE';

export type Price = {
  id: string;
  variantId: string;
  amount: number;
  currency: string;
  priceType: PriceType;
  effectiveFrom: string; // 'YYYY-MM-DD'
};

export type Batch = {
  id: string;
  productId: string;
  lotNumber: string;
  manufacturingDate: string; // 'YYYY-MM-DD'
  expiryDate: string; // 'YYYY-MM-DD'
  quantity: number;
};

export type MediaAsset = {
  id: string;
  targetType: 'PRODUCT' | 'VARIANT';
  targetId: string;
  fileId: string;
  mimeType: string;
  position: number;
  altText: string;
};

// --- INVENTORY-CORE ---

export type WarehouseType = 'WAREHOUSE' | 'RETAIL';

export type Warehouse = {
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;
  code: string;
  type: WarehouseType;
};

export type StockMovementType = 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT';

export type StockMovementStatus = 'DRAFT' | 'VALIDATED';

export type StockMovement = {
  id: string;
  tenantId: string;
  organizationId: string;
  variantId: string;
  warehouseId: string;
  referenceNumber: string;
  type: StockMovementType;
  sourceDoc?: string; // e.g. sales order ID, transfer ID, session ID
  status: StockMovementStatus;
  quantity: number; // strictly positive
  createdAt: string;
};

export type WarehouseTransferStatus = 'REQUESTED' | 'COMPLETED';

export type WarehouseTransfer = {
  id: string;
  tenantId: string;
  organizationId: string;
  referenceNumber: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  variantId: string;
  quantity: number; // strictly positive
  status: WarehouseTransferStatus;
  createdAt: string;
};

export type ProductTransformationStatus = 'DRAFT' | 'VALIDATED';

export type ProductTransformation = {
  id: string;
  tenantId: string;
  organizationId: string;
  referenceNumber: string;
  sourceVariantId: string;
  targetVariantId: string;
  sourceQuantity: number;
  targetQuantity: number;
  status: ProductTransformationStatus;
  createdAt: string;
};

export type InventorySessionStatus = 'DRAFT' | 'VALIDATED';

export type InventorySession = {
  id: string;
  tenantId: string;
  organizationId: string;
  referenceNumber: string;
  warehouseId: string;
  status: InventorySessionStatus;
  createdAt: string;
};

export type InventorySessionItem = {
  id: string;
  sessionId: string;
  variantId: string;
  quantityCounted: number; // strictly positive
};

// --- ORDERS ---

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type OrderItem = {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  tenantId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  paymentMethod: 'epay' | 'mobile_money' | 'card';
};
