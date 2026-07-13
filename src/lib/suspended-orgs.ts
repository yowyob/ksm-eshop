/**
 * Gestion locale des organisations suspendues.
 * Stocke un fichier JSON dans le répertoire data/ du projet.
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SUSPENDED_FILE = path.join(DATA_DIR, 'suspended-orgs.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    // En environnements serverless ou en production le système de fichiers
    // peut être en lecture seule. Ne pas lever d'erreur ici pour éviter un
    // 500 sur les endpoints qui consultent les organisations.
    // On journalise l'erreur pour debugging côté serveur.
    // eslint-disable-next-line no-console
    console.warn('[suspended-orgs] impossible de créer le répertoire data/:', err && (err as Error).message);
  }
}

export function getSuspendedOrgs(): Record<string, boolean> {
  try {
    ensureDataDir();
    if (!fs.existsSync(SUSPENDED_FILE)) return {};
    const raw = fs.readFileSync(SUSPENDED_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    // En cas d'erreur (permission, JSON invalide, etc.) on retourne une map vide
    // plutôt que de faire planter l'API.
    // eslint-disable-next-line no-console
    console.warn('[suspended-orgs] impossible de lire le fichier suspendu:', err && (err as Error).message);
    return {};
  }
}

export function isOrgSuspended(orgId: string): boolean {
  const map = getSuspendedOrgs();
  return map[orgId] === true;
}

export async function setSuspendedOrg(orgId: string, suspended: boolean): Promise<void> {
  try {
    ensureDataDir();
    const map = getSuspendedOrgs();
    if (suspended) map[orgId] = true;
    else delete map[orgId];
    try {
      fs.writeFileSync(SUSPENDED_FILE, JSON.stringify(map, null, 2), 'utf-8');
    } catch (err) {
      // En environnements où l'écriture n'est pas permise, on log et on continue.
      // Ceci évite de casser l'API admin en production.
      // eslint-disable-next-line no-console
      console.warn('[suspended-orgs] impossible d\'écrire le fichier suspendu:', err && (err as Error).message);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[suspended-orgs] erreur lors du changement d\'état suspendu:', err && (err as Error).message);
  }
}
