const zlib = require('zlib');
const fs = require('fs');

function encodeKroki(text) {
    const data = Buffer.from(text, 'utf8');
    const compressed = zlib.deflateSync(data, { level: 9 });
    return compressed.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

const content = `
flowchart TD
    User([Utilisateur: Client / Admin])
    
    subgraph Tier1 ["Tier 1 : Présentation (Navigateur)"]
        UI[Interface Web React]
        Zustand[(État Local Zustand)]
        UI <--> Zustand
    end
    
    subgraph Tier2 ["Tier 2 : API Gateway (Next.js)"]
        API[Routes API Internes]
        Proxy[Proxy / Sécurité]
        API <--> Proxy
    end
    
    subgraph Tier3 ["Tier 3 : Métier & Données (ERP)"]
        Core[Kernel-Core Spring Boot]
        DB[(Base de Données Principale)]
        Core <--> DB
    end
    
    subgraph Services ["Services Tiers"]
        Pay[API de Paiement / Mobile Money]
    end

    User -->|Interagit| UI
    UI <-->|Appels HTTP JSON| API
    Proxy <-->|Authentification & Routage| Core
    Core -->|Valide transactions financières| Pay
`;

const dir = '/Users/computer-care/Documents/diagrams';
const filename = 'diagramme_architecture.png';

async function generate() {
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

generate();
