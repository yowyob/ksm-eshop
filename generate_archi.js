const zlib = require('zlib');
const fs = require('fs');

function encodeKroki(text) {
    const data = Buffer.from(text, 'utf8');
    const compressed = zlib.deflateSync(data, { level: 9 });
    return compressed.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

const content = `
@startuml
skinparam componentStyle rectangle

actor "Utilisateur\n(Client / Admin)" as User

node "Tier 1 : Présentation\n(Client Side)" as Tier1 {
  component "Interface Web\n(React.js / TailwindCSS)" as UI
  database "État Local\n(Zustand)" as Zustand
  UI <-> Zustand : Lecture / Écriture
}

node "Tier 2 : API Gateway\n(Next.js Server / Node.js)" as Tier2 {
  component "Routes API internes\n(Backend-For-Frontend)" as API
  component "Proxy & Sécurité" as Proxy
  API <-> Proxy
}

node "Tier 3 : Métier & Données\n(Backend Externe)" as Tier3 {
  component "Kernel-Core ERP\n(Spring Boot)" as Core
  database "Base de Données\n(PostgreSQL)" as DB
  Core <--> DB
}

cloud "Services Tiers" as Services {
  component "API de Paiement\n(Stripe / Yowyob)" as Pay
}

User --> UI : Interagit
UI <--> API : Appels API (JSON)
Proxy <--> Core : Authentification & Routage
Core --> Pay : Transactions
@enduml
`;

const dir = '/Users/computer-care/Documents/diagrams';
const filename = 'diagramme_architecture.png';

async function generate() {
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

generate();
