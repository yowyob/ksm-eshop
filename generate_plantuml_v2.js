const zlib = require('zlib');
const fs = require('fs');

function encodeKroki(text) {
    const data = Buffer.from(text, 'utf8');
    const compressed = zlib.deflateSync(data, { level: 9 });
    return compressed.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

const diagrams = {
    'diagramme_usecase.png': `
@startuml
left to right direction
skinparam packageStyle rectangle

actor Visiteur
actor Client
actor Admin

Client --|> Visiteur

package "Système KSM eShop" {
  usecase "Consulter le catalogue" as UC1
  usecase "Rechercher un produit" as UC2
  
  usecase "Passer et suivre une commande" as UC3
  usecase "Gérer le panier" as UC4
  usecase "Payer en ligne" as UC5
  
  usecase "Gérer les commandes" as UC6
  usecase "Gérer les utilisateurs" as UC7
  usecase "Gérer le catalogue" as UC8
  usecase "Consulter les statistiques" as UC9
  
  usecase "S'authentifier" as Auth
}

actor "Kernel-Core ERP" as Kernel << Système Externe >>
actor "API de Paiement" as PayAPI << Système Externe >>

Visiteur --> UC1
Visiteur --> UC2

Client --> UC3
Client --> UC4
Client --> UC5

Admin --> UC6
Admin --> UC7
Admin --> UC8
Admin --> UC9

UC3 ..> Auth : <<include>>
UC4 ..> Auth : <<include>>
UC5 ..> Auth : <<include>>
UC6 ..> Auth : <<include>>
UC7 ..> Auth : <<include>>
UC8 ..> Auth : <<include>>
UC9 ..> Auth : <<include>>

UC3 --> Kernel
UC5 --> PayAPI
UC6 --> Kernel
UC8 --> Kernel
UC9 --> Kernel
Auth --> Kernel
@enduml
`,
    'diagramme_contexte.png': `
@startuml
left to right direction
skinparam componentStyle rectangle

actor Visiteur
actor Client
actor Administrateur

actor "API de Paiement\n(Stripe / Mobile Money)" as Paiement << Système Externe >>
actor "Kernel-Core ERP" as Kernel << Système Externe >>

rectangle "== KSM eShop ==\n(Plateforme E-Commerce)" as System #LightBlue

Visiteur --> System : Consulte le catalogue
Client --> System : Achète des produits
Administrateur --> System : Gère la boutique

System --> Kernel : Synchronise (Produits, Commandes, Auth)
System --> Paiement : Traite les transactions financières
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
