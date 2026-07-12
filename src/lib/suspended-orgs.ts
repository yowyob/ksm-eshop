/**
 * Gestion locale des organisations suspendues.
 * Stocke un fichier JSON dans le répertoire data/ du projet.
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SUSPENDED_FILE = path.join(DATA_DIR, 'suspended-orgs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getSuspendedOrgs(): Record<string, boolean> {
  ensureDataDir();
  if (!fs.existsSync(SUSPENDED_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(SUSPENDED_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

export function isOrgSuspended(orgId: string): boolean {
  const map = getSuspendedOrgs();
  return map[orgId] === true;
}

export async function setSuspendedOrg(orgId: string, suspended: boolean): Promise<void> {
  ensureDataDir();
  const map = getSuspendedOrgs();
  if (suspended) {
    map[orgId] = true;
  } else {
    delete map[orgId];
  }
  fs.writeFileSync(SUSPENDED_FILE, JSON.stringify(map, null, 2), 'utf-8');
}
