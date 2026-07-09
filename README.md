# KSM-Eshop

Une plateforme d'e-commerce multi-tenant moderne construite avec Next.js.

## Fonctionnalités

- **Multi-tenant** : Chaque boutique a sa propre URL (`/[tenantId]`).
- **Boutique en ligne** : Navigation dans les produits, panier d'achat et processus de paiement.
- **Interface d'administration** : Gestion des produits et des commandes pour chaque marchand.
- **Design Réactif** : Interface optimisée pour mobile et bureau.
- **Gestion d'état** : Utilisation de Zustand pour une gestion fluide du panier et de l'authentification.

## Technologies utilisées

- **Framework** : Next.js (App Router)
- **Langage** : TypeScript
- **Style** : Vanilla CSS
- **État** : Zustand
- **Base de données** : SQLite (Schéma inclus)

## Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/Naomitsague/ksm-eshop.git
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

Ouvrez [http://localhost:3000](http://localhost:3000) pour voir l'application.

## Structure du projet

- `src/app/[tenantId]` : Pages de la boutique côté client.
- `src/app/admin/[tenantId]` : Pages du tableau de bord administrateur.
- `src/components` : Composants UI réutilisables.
- `src/store` : Magasins d'état Zustand.
- `database/` : Fichiers liés à la base de données.
