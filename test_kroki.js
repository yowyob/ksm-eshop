const zlib = require('zlib');
const fs = require('fs');

function encodeKroki(text) {
    const data = Buffer.from(text, 'utf8');
    const compressed = zlib.deflateSync(data, { level: 9 });
    return compressed.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

const url = `https://kroki.io/mermaid/png/${encodeKroki("graph TD\nA-->B")}`;
console.log("URL:", url);

fetch(url)
  .then(res => res.arrayBuffer())
  .then(buf => fs.writeFileSync('test_kroki.png', Buffer.from(buf)))
  .then(() => console.log("Saved test_kroki.png"));
