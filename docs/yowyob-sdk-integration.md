# Intégration des SDK Yowyob dans Shop

## Objectif

Shop utilise désormais deux adaptateurs server-side :

- `src/lib/yowyob-sdk/auth.ts` : connexion YowAuth et normalisation de la session ;
- `src/lib/yowyob-sdk/payment.ts` : wallets, recharge et paiement via Payment Core.

Les secrets Kernel restent exclusivement dans le BFF Next.js. Ils ne sont jamais
exposés au navigateur et ne doivent jamais être préfixés par `NEXT_PUBLIC_`.

## Flux d’authentification

1. Le navigateur envoie ses identifiants à `POST /api/auth/customer-login`.
2. Le BFF appelle `POST <KERNEL_BASE>/api/auth/login` avec `X-Client-Id` et `X-Api-Key`.
3. Le JWT retourné est placé dans le cookie `customerToken` (`httpOnly`, `secure` en production,
   `sameSite=lax`).
4. Les routes Shop récupèrent ce cookie et transmettent le Bearer au Kernel.
5. Le navigateur ne reçoit qu’un profil normalisé ; il ne porte pas la clé d’application.

En production, il faut remplacer l’authentification locale par le flux YowAuth popup/SSO
(code opaque à usage unique et échange côté serveur) lorsque Shop est lancé depuis une
autre application. Un access token ne doit jamais être placé dans l’URL.

## Flux de paiement

Pour un wallet personnel :

1. `GET /api/payments/my-wallet` appelle `GET /api/payments/wallets/mine` avec le JWT.
2. Si le wallet n’existe pas, le BFF appelle `POST /api/payments/wallets/mine`.
3. Une recharge appelle `POST /api/payments/wallets/{walletId}/recharge` avec une clé
   d’idempotence et redirige vers le provider (`MYCOOLPAY` ou `STRIPE`).
4. Le provider est confirmé par le Kernel ; Shop ne crédite jamais le solde lui-même.
5. Le checkout appelle Payment Core avec le JWT de l’acheteur. Le wallet marchand est
   résolu côté serveur avec le compte de service Shop.

Le paiement final utilise le challenge MFA Payment Core : Shop demande d’abord le challenge
via `POST /api/payments/my-wallet/pay/challenge`, affiche un champ de code à l’utilisateur,
puis transmet le code uniquement au BFF pour la confirmation.

Les endpoints Kernel utilisés sont :

```text
POST /api/payments/wallets/{walletId}/pay/challenge
POST /api/payments/wallets/{walletId}/pay
  { recipientWalletId, amount, challengeToken, code, reference }
```

Le code MFA est saisi dans l’interface Shop et envoyé uniquement au BFF ; il ne doit
jamais être journalisé ni envoyé à un service tiers. L’implémentation actuelle a déjà
supprimé la surcharge locale `wallet_override` et s’appuie sur le solde autoritatif du Kernel.

## Variables serveur

```dotenv
BACKEND_URL=https://kernel-core.yowyob.com
KERNEL_X_CLIENT_ID=<client application Shop>
KERNEL_X_API_KEY=<secret de la client application Shop>
KERNEL_X_TENANT_ID=11111111-1111-1111-1111-111111111111
NEXT_PUBLIC_SITE_URL=https://shop.yowyob.com
```

Ne pas committer les valeurs réelles. En production, les injecter via les secrets du
déploiement Docker/CI et vérifier que le conteneur ne publie pas ces variables dans le
bundle navigateur.

## Contrôles à effectuer avant mise en production

- vérifier que la ClientApplication Shop autorise les cores `AUTH` et `PAYMENT` ;
- vérifier que l’URL de callback de recharge est HTTPS ;
- tester une recharge avec le même `idempotencyKey` deux fois : une seule opération doit
  créditer le wallet ;
- tester un paiement avec solde insuffisant et confirmer l’erreur sans modification de
  commande ;
- tester un challenge MFA expiré, réutilisé et incorrect ;
- vérifier qu’un utilisateur ne peut pas payer depuis le wallet d’un autre utilisateur ;
- vérifier les logs : aucun JWT, API key, mot de passe ou code MFA ne doit apparaître ;
- vérifier que la commande n’est marquée `PAID` qu’après confirmation positive du Payment Core.

## Délimitation des responsabilités

Shop est un BFF d’orchestration : il collecte le panier, demande les devis/ordres et
présente les résultats. Le Kernel reste l’autorité pour l’identité, les permissions,
le solde, l’idempotence, la MFA, la confirmation provider et le ledger financier.
