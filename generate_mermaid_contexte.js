const zlib = require('zlib');
const fs = require('fs');

function encodeKroki(text) {
    const data = Buffer.from(text, 'utf8');
    const compressed = zlib.deflateSync(data, { level: 9 });
    return compressed.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

const diagrams = {
    'diagramme_contexte.png': `
flowchart LR
    Visiteur([Visiteur])
    Client([Client])
    Admin([Administrateur])
    
    subgraph KSM ["KSM eShop (Système)"]
        System[Plateforme Web et API Gateway]
    end
    
    Kernel([Kernel-Core ERP])
    Paiement([API de Paiement])
    
    Visiteur -->|Consulte le catalogue| System
    Client -->|Passe des commandes| System
    Admin -->|Gère la boutique| System
    
    System -->|Synchronise les données| Kernel
    System -->|Traite les transactions| Paiement
`
};

const dir = '/Users/computer-care/Documents/diagrams';

async function generateAll() {
    for (const [filename, content] of Object.entries(diagrams)) {
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
