/**
 * Traduction entre le vocabulaire de la boutique et celui du grand-livre de stock.
 *
 * La boutique parlait à `/api/inventory/*`, qui tenait son propre solde. Le noyau n'a plus qu'un
 * seul moteur de stock : `stock-core` détient les soldes des produits finis, et `inventory-core`
 * ne fait plus que les inventaires. Les deux interfaces ne sont pas équivalentes — ce n'est pas un
 * renommage, et ce fichier porte les trois écarts réels.
 *
 * 1. **Les natures de mouvement sont plus fines.** La boutique connaît trois sens (entrée, sortie,
 *    ajustement) ; le grand-livre distingue en outre l'origine — une réception fournisseur, une
 *    sortie client, un transfert, une transformation. Traduire dans ce sens perd de l'information,
 *    d'où la table ci-dessous : la boutique n'émet que ce qu'elle sait nommer, et lit tout le reste.
 *
 * 2. **Le grand-livre ne connaît pas le brouillon.** Un mouvement enregistré a déjà bougé le stock.
 *    La boutique conserve donc ses brouillons chez elle et n'écrit qu'à la validation, faute de
 *    quoi l'écran afficherait « brouillon » alors que le stock aurait déjà bougé.
 *
 * 3. **Un transfert passe par un état intermédiaire.** Le grand-livre expédie puis réceptionne, ce
 *    qui rend visible la marchandise en route ; la boutique n'a qu'un bouton. Voir la route
 *    correspondante.
 */

/** Les trois sens que l'interface de la boutique sait nommer. */
export type ShopMovementType = 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT';

/**
 * Ce que la boutique émet, pour chacun de ses trois sens.
 *
 * Une entrée saisie à la main est une réception, une sortie est une sortie client. L'ajustement se
 * décide au signe : le grand-livre n'accepte que des quantités positives, la direction étant portée
 * par la nature et non par le signe — c'est ce qui rend un solde relisible sans convention cachée.
 */
export function toLedgerMovementType(type: ShopMovementType, quantity: number): string {
  switch (type) {
    case 'INBOUND':
      return 'RECEIPT';
    case 'OUTBOUND':
      return 'ISSUE';
    case 'ADJUSTMENT':
      return quantity < 0 ? 'ADJUSTMENT_OUT' : 'ADJUSTMENT_IN';
  }
}

/** Les natures qui augmentent le stock, telles que le grand-livre les nomme. */
const INBOUND_LEDGER_TYPES = new Set([
  'RECEIPT',
  'RETURN_IN',
  'TRANSFER_IN',
  'TRANSFORM_IN',
  'PRODUCTION_RECEIPT',
  'ADJUSTMENT_IN',
]);

/** Les natures qui le diminuent. */
const OUTBOUND_LEDGER_TYPES = new Set([
  'ISSUE',
  'SCRAP',
  'TRANSFER_OUT',
  'TRANSFORM_OUT',
  'PRODUCTION_ISSUE',
  'ADJUSTMENT_OUT',
]);

/**
 * Ce que la boutique affiche, pour une nature venue du grand-livre.
 *
 * Une nature inconnue est rendue comme un ajustement plutôt qu'ignorée : le mouvement a bien eu
 * lieu, et le masquer donnerait un historique qui ne concorde pas avec le solde.
 */
export function toShopMovementType(ledgerType: string | null | undefined): ShopMovementType {
  if (!ledgerType) return 'ADJUSTMENT';
  const normalized = ledgerType.toUpperCase();
  if (INBOUND_LEDGER_TYPES.has(normalized)) return 'INBOUND';
  if (OUTBOUND_LEDGER_TYPES.has(normalized)) return 'OUTBOUND';
  return 'ADJUSTMENT';
}

/**
 * La boutique préfixe ses identifiants de déclinaison ; le grand-livre parle de produits.
 *
 * Les deux fonctions ci-dessous sont l'unique endroit où cette convention est écrite. Elle était
 * jusqu'ici répétée à chaque appel, et une seule omission suffisait à faire lire le solde d'un
 * produit qui n'existe pas — silencieusement, puisqu'un solde inconnu vaut zéro.
 */
export function toProductId(variantId: string): string {
  return variantId.startsWith('v-') ? variantId.slice(2) : variantId;
}

export function toVariantId(productId: string | null | undefined): string {
  if (!productId) return 'v1_1';
  return productId.startsWith('v-') ? productId : `v-${productId}`;
}

/** Clé d'un solde : un stock est toujours celui d'un produit **dans un dépôt**. */
export function balanceKey(warehouseId: string, variantId: string): string {
  return `${warehouseId}:${variantId}`;
}
