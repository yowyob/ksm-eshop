const zlib = require('zlib');
const fs = require('fs');

function encodeKroki(text) {
    const data = Buffer.from(text, 'utf8');
    const compressed = zlib.deflateSync(data, { level: 9 });
    return compressed.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

const diagrams = {
    'diagramme_contexte.png': `
@startuml
left to right direction

actor Visiteur
actor Client
actor Administrateur

actor "API de Paiement" as Paiement << Externe >>
actor "Kernel-Core ERP" as Kernel << Externe >>

rectangle "KSM eShop\n(Plateforme E-Commerce)" as System #LightBlue

Visiteur --> System : Consulte le catalogue
Client --> System : Achète des produits
Administrateur --> System : Gère la boutique

System --> Kernel : Synchronise
System --> Paiement : Transactions
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
