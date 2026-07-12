const zlib = require('zlib');
const fs = require('fs');

function encodeKroki(text) {
    const data = Buffer.from(text, 'utf8');
    const compressed = zlib.deflateSync(data, { level: 9 });
    return compressed.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

const diagrams = {
    'diagramme_contexte.png': `
graph TD
    User((Utilisateur Final))
    NextFrontend[Application Web Frontend<br>Next.js]
    NextAPI[API Gateway<br>Next.js API Routes]
    KernelCore[(Kernel-Core ERP<br>Spring Boot / DB)]

    User -->|Consulte, ajoute au panier, paie| NextFrontend
    NextFrontend -->|Requêtes HTTP JSON| NextAPI
    NextAPI -->|Authentifie, sécurise et route les requêtes| KernelCore
    `,
    'diagramme_packages.png': `
classDiagram
    package "Application Next.js" {
        class src_app ["src/app (Routes & Pages)"]
        class src_components ["src/components (UI)"]
        class src_hooks ["src/hooks (Logique)"]
    }
    package "Gestion d'état (Zustand)" {
        class StoreClient ["État Utilisateur / Auth"]
        class StorePanier ["État Panier"]
    }
    package "Communication API" {
        class ApiClient ["Client Axios / Fetch"]
        class ApiRoutes ["Routes API Next.js (Proxy)"]
    }
    src_app --> src_components
    src_app --> src_hooks
    src_components --> StoreClient
    src_components --> StorePanier
    src_hooks --> ApiClient
    ApiClient --> ApiRoutes
    `,
    'diagramme_usecase.png': `
usecaseDiagram
    actor Client
    actor "Admin Boutique" as Organisation
    actor "Admin Plateforme" as Admin
    
    package "KSM eShop" {
        usecase "Consulter le catalogue" as UC1
        usecase "Gérer son panier" as UC2
        usecase "Passer une commande" as UC3
        usecase "S'authentifier" as UC4
        
        usecase "Gérer les produits" as UC5
        usecase "Gérer les catégories" as UC6
        usecase "Suivre les commandes" as UC7
        
        usecase "Gérer les organisations" as UC8
        usecase "Configuration globale" as UC9
    }
    
    Client --> UC1
    Client --> UC2
    Client --> UC3
    Client --> UC4
    
    Organisation --> UC4
    Organisation --> UC5
    Organisation --> UC6
    Organisation --> UC7
    
    Admin --> UC4
    Admin --> UC8
    Admin --> UC9
    `,
    'diagramme_classes_conceptuel.png': `
classDiagram
    class Organisation {
        +String identifiant
        +String nomCommercial
        +String contact
    }
    class Categorie {
        +String nom
    }
    class Produit {
        +String identifiant
        +String nom
        +String description
        +Float prix
        +Int quantiteDisponible
        +String image
    }
    class Client {
        +String nom
        +String email
        +String motDePasse
    }
    class Panier {
        +Float montantTotal
        +ajouterProduit()
        +modifierQuantite()
        +calculerTotal()
    }
    class Commande {
        +String adresseLivraison
        +String statutPaiement
        +Float montantTotal
    }
    Organisation "1" -- "*" Categorie : possède
    Categorie "1" -- "*" Produit : contient
    Client "1" -- "1" Panier : possède
    Client "1" -- "*" Commande : effectue
    Panier "*" -- "*" Produit : contient
    Commande "*" -- "*" Produit : inclut
    `,
    'diagramme_classes_technique.png': `
classDiagram
    class Product {
        <<interface>>
        +String id
        +String tenantId
        +String name
        +Float price
        +Int quantity
        +String categoryId
    }
    class ProductService {
        +getProducts()
        +createProduct()
    }
    class CategoryService {
        +getCategories()
    }
    class OrderService {
        +createOrder()
        +verifyPayment()
    }
    class ApiClient {
        +get()
        +post()
    }
    class StoreZustand {
        +Object cartState
        +Object userState
    }
    ProductService ..> Product : utilise
    ProductService --> ApiClient : requêtes HTTP
    CategoryService --> ApiClient : requêtes HTTP
    OrderService --> ApiClient : requêtes HTTP
    StoreZustand --> ProductService : invoque
    StoreZustand --> OrderService : invoque
    `,
    'sequence_catalogue.png': `
sequenceDiagram
    participant Client
    participant Frontend as UI (React)
    participant API_Gateway as API Gateway (Next.js)
    participant KernelCore as Kernel-Core (ERP)

    Client->>Frontend: 1. Accède au catalogue
    Frontend->>API_Gateway: 2. GET /api/products
    API_Gateway->>API_Gateway: 3. Injection Auth
    API_Gateway->>KernelCore: 4. Requête sécurisée
    KernelCore-->>API_Gateway: 5. Retourne produits
    API_Gateway->>API_Gateway: 6. Formatage
    API_Gateway-->>Frontend: 7. Données prêtes
    Frontend-->>Client: 8. Affiche catalogue
    `,
    'sequence_creation_produit.png': `
sequenceDiagram
    participant Admin as Administrateur
    participant Frontend as UI (React)
    participant API_Gateway as API Gateway
    participant KernelCore as Kernel-Core

    Admin->>Frontend: 1. Valide formulaire produit
    Frontend->>Frontend: 2. Validation locale
    Frontend->>API_Gateway: 3. POST /api/products
    API_Gateway->>API_Gateway: 4. Ajout Auth
    API_Gateway->>KernelCore: 5. Transmission
    KernelCore-->>API_Gateway: 6. Produit enregistré (201)
    API_Gateway-->>Frontend: 7. Confirmation
    Frontend-->>Admin: 8. Succès et MAJ
    `,
    'sequence_commande.png': `
sequenceDiagram
    participant Client
    participant Frontend as UI (React)
    participant API_Gateway as API Gateway
    participant KernelCore as Kernel-Core
    participant Paiement as API Paiement (Stripe)

    Client->>Frontend: 1. Valide panier et adresse
    Frontend->>API_Gateway: 2. POST /api/checkout
    API_Gateway->>KernelCore: 3. Transmet commande
    KernelCore->>KernelCore: 4. Crée commande
    KernelCore-->>API_Gateway: 5. Commande en attente
    API_Gateway->>Paiement: 6. Initie session paiement
    Paiement-->>API_Gateway: 7. URL de paiement
    API_Gateway-->>Frontend: 8. Redirection Stripe
    Frontend-->>Client: 9. Paiement
    Paiement->>API_Gateway: 10. Webhook succès
    API_Gateway->>KernelCore: 11. Commande payée
    Frontend-->>Client: 12. Succès
    `
};

const dir = '/Users/computer-care/Documents/diagrams';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

async function generateAll() {
    for (const [filename, content] of Object.entries(diagrams)) {
        // usecaseDiagram format issue with kroki sometimes, but we try
        // kroki parses mermaid perfectly
        const url = `https://kroki.io/mermaid/png/${encodeKroki(content)}`;
        console.log(`Downloading ${filename}...`);
        try {
            const res = await fetch(url);
            if(res.ok) {
                const buf = await res.arrayBuffer();
                fs.writeFileSync(`${dir}/${filename}`, Buffer.from(buf));
                console.log(`Saved ${filename}`);
            } else {
                console.log(`Failed ${filename}: ${res.status}`);
            }
        } catch (e) {
            console.log(`Error ${filename}:`, e);
        }
    }
}

generateAll();
