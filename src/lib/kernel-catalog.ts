import { backendFetch } from '@/lib/api-client';

/**
 * Le catalogue de la boutique, lu sur l'API produit du noyau.
 *
 * Le 23/08/2026, le noyau a retiré son ancienne façade produit : `/api/products`,
 * `/api/product-categories` et `/api/product-core/catalog` n'existent plus (404). La boutique
 * continuait à les appeler, et ses replis de démonstration masquaient la panne : shop.yowyob.com
 * affichait des produits fictifs au lieu du vrai catalogue.
 *
 * Ce module est la SEULE traduction entre les deux modèles : les routes de la boutique gardent la
 * forme produit qu'attendent ses écrans, et lisent ici ce que le noyau publie réellement.
 */

const VENDABLES = '/api/product-core/sellable-products';
const DEFINITIONS = '/api/product-core/products';
const CATEGORIES = '/api/product-core/classification/categories';

type Reponse<T> = { success: boolean; data?: T; message?: string; errorCode?: string };

/** Un article en vente, tel que le noyau le publie. */
export type SellableProduct = {
  productId: string;
  tenantId: string;
  organizationId: string;
  globalCode: string;
  name: string;
  shortDescription?: string | null;
  variantName?: string | null;
  barcode?: string | null;
  familyCode?: string | null;
  categoryCode?: string | null;
  unitPrice?: number | null;
  currency?: string | null;
  cost?: number | null;
  quantity?: number | null;
  imageUri?: string | null;
  uomCode?: string | null;
  lifecycleStatus?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

/** La forme produit des écrans de la boutique (champs historiques conservés). */
export function versProduitBoutique(p: SellableProduct) {
  const prix = p.unitPrice ?? undefined;
  const quantite = p.quantity ?? undefined;
  return {
    id: p.productId,
    tenantId: p.tenantId,
    organizationId: p.organizationId,
    code: p.globalCode,
    sku: p.globalCode,
    name: p.name,
    description: p.shortDescription ?? '',
    categoryId: p.categoryCode ?? '',
    categoryCode: p.categoryCode ?? undefined,
    familyCode: p.familyCode ?? undefined,
    status: (p.lifecycleStatus ?? 'ACTIVE').toUpperCase(),
    createdAt: p.createdAt ?? '',
    imageUrl: p.imageUri ?? '',
    photo: p.imageUri ?? undefined,
    unitPrice: prix,
    price: prix,
    currency: p.currency ?? undefined,
    quantity: quantite,
    stock: quantite,
    variantLabel: p.variantName ?? undefined,
    barcode: p.barcode ?? undefined,
  };
}

export type ProduitBoutique = ReturnType<typeof versProduitBoutique>;

/** Les articles en vente d'une organisation, à la forme de la boutique. */
export async function listerProduits(
  organizationId: string,
  filtres: { familyCode?: string; status?: string } = {},
  headers?: Record<string, string>,
): Promise<Reponse<ProduitBoutique[]>> {
  const r = await backendFetch<SellableProduct[]>(VENDABLES, {
    method: 'GET',
    params: { organizationId, familyCode: filtres.familyCode, status: filtres.status },
    headers,
  });
  if (!r.success) return { ...r, data: undefined };
  const liste = Array.isArray(r.data) ? r.data : [];
  return { success: true, data: liste.map(versProduitBoutique) };
}

/** Un article en vente, à la forme de la boutique. */
export async function lireProduit(productId: string, headers?: Record<string, string>): Promise<Reponse<ProduitBoutique>> {
  const r = await backendFetch<SellableProduct>(`${VENDABLES}/${productId}`, { method: 'GET', headers });
  if (!r.success || !r.data) return { ...r, data: undefined };
  return { success: true, data: versProduitBoutique(r.data) };
}

/** Variantes d'un produit, à la forme de la boutique. */
export async function listerVariantes(productId: string): Promise<Reponse<unknown[]>> {
  const r = await backendFetch<{ id: string; productId: string; sku: string; variantName?: string; status?: string }[]>(
    `${DEFINITIONS}/${productId}/variants`, { method: 'GET' });
  if (!r.success) return { ...r, data: undefined };
  return {
    success: true,
    data: (r.data ?? []).map((v, rang) => ({
      id: v.id,
      productId: v.productId,
      sku: v.sku,
      name: v.variantName ?? v.sku,
      barcode: '',
      isDefault: rang === 0,
      status: (v.status ?? 'ACTIVE').toUpperCase(),
    })),
  };
}

/** Catégories d'une organisation, à la forme de la boutique. */
export async function listerCategories(organizationId: string): Promise<Reponse<unknown[]>> {
  const r = await backendFetch<{ id: string; parentCategoryId?: string | null; code: string; name: string; path?: string; status?: string }[]>(
    CATEGORIES, { method: 'GET', params: { organizationId } });
  if (!r.success) return { ...r, data: undefined };
  return {
    success: true,
    data: (r.data ?? []).map((c) => ({
      id: c.id,
      organizationId,
      code: c.code,
      name: c.name,
      parentId: c.parentCategoryId ?? null,
      // Le chemin « a/b/c » donne la profondeur : 0 à la racine.
      level: c.path ? Math.max(0, c.path.split('/').filter(Boolean).length - 1) : 0,
      status: c.status,
    })),
  };
}

/**
 * Met un article en vente (création depuis l'arrière-boutique de la boutique).
 *
 * Le noyau sépare ce qu'un produit EST de ce qu'une organisation en FAIT ; cette route fait les
 * deux en un appel, ce qui correspond à l'intention de l'écran.
 */
export async function creerProduit(corps: any, headers?: Record<string, string>): Promise<Reponse<unknown>> {
  return backendFetch(VENDABLES, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      organizationId: corps.organizationId,
      globalCode: corps.sku || corps.code || `SKU-${Date.now()}`,
      name: corps.name,
      shortDescription: corps.description,
      variantName: corps.variantLabel,
      barcode: corps.barcode,
      imageUri: corps.photo || corps.imageUrl,
      unitPrice: corps.unitPrice ?? corps.price,
      currency: corps.currency,
      cost: corps.cost,
      quantity: corps.quantity,
      familyCode: corps.familyCode,
      categoryCode: corps.categoryCode,
    }),
  });
}

/**
 * Modifie un article. Le noyau n'a plus de mise à jour « en bloc » : le nom et la description
 * passent par la définition du produit, le retrait de la vente par son cycle de vie.
 */
export async function modifierProduit(productId: string, corps: any, headers?: Record<string, string>): Promise<Reponse<unknown>> {
  if (corps.status && String(corps.status).toUpperCase() !== 'ACTIVE') {
    return backendFetch(`${DEFINITIONS}/${productId}/suspend`, { method: 'POST', headers });
  }
  if (corps.name) {
    return backendFetch(`${DEFINITIONS}/${productId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: corps.name, globalCode: corps.sku || corps.code, shortDescription: corps.description }),
    });
  }
  if (corps.description !== undefined) {
    return backendFetch(`${DEFINITIONS}/${productId}/description`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ shortDescription: corps.description }),
    });
  }
  return { success: false, message: "Rien à modifier : seuls le nom, la description et le statut se changent ici.", errorCode: 'BAD_REQUEST' };
}

/** Retire un article de la vente : il reste tracé, il ne se supprime pas. */
export async function retirerProduit(productId: string, headers?: Record<string, string>): Promise<Reponse<unknown>> {
  return backendFetch(`${DEFINITIONS}/${productId}/retire`, { method: 'POST', headers });
}
