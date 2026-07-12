const zlib = require('zlib');
const fs = require('fs');

function encodeKroki(text) {
    const data = Buffer.from(text, 'utf8');
    const compressed = zlib.deflateSync(data, { level: 9 });
    return compressed.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

const diagrams = {
    'diagramme_packages.png': `
@startuml
package "Application Next.js" {
  class "src/app (Routes & Pages)" as src_app
  class "src/components (UI)" as src_components
  class "src/hooks (Logique)" as src_hooks
}
package "Gestion d'état (Zustand)" {
  class "État Utilisateur / Auth" as StoreClient
  class "État Panier" as StorePanier
}
package "Communication API" {
  class "Client Axios / Fetch" as ApiClient
  class "Routes API Next.js (Proxy)" as ApiRoutes
}
src_app --> src_components
src_app --> src_hooks
src_components --> StoreClient
src_components --> StorePanier
src_hooks --> ApiClient
ApiClient --> ApiRoutes
@enduml
`,
    'diagramme_usecase.png': `
@startuml
left to right direction
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
@enduml
`
};

const dir = '/Users/computer-care/Documents/diagrams';

async function generateAll() {
    for (const [filename, content] of Object.entries(diagrams)) {
        const url = `https://kroki.io/plantuml/png/${encodeKroki(content)}`;
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
