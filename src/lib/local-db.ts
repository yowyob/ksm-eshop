import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');

// Ensure directory and file exist
const initDb = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(CLIENTS_FILE)) {
      fs.writeFileSync(CLIENTS_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('[LOCAL-DB] Failed to initialize local DB:', error);
  }
};

export const getLocalOrders = (organizationId?: string): any[] => {
  try {
    initDb();
    const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
    let orders = JSON.parse(data || '[]');
    
    if (organizationId) {
      orders = orders.filter((o: any) => o.organizationId === organizationId || o.tenantId === organizationId);
    }
    
    // Return latest first
    return orders.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('[LOCAL-DB] Error reading orders:', error);
    return [];
  }
};

export const saveLocalOrder = (order: any): boolean => {
  try {
    initDb();
    const orders = getLocalOrders(); // Get all without org filter
    
    // Add createdAt if not exists
    if (!order.createdAt) {
      order.createdAt = new Date().toISOString();
    }
    
    // Default status if missing
    if (!order.status) {
      order.status = 'PENDING';
    }
    
    // Default organizationId
    if (!order.organizationId && order.tenantId) {
      order.organizationId = order.tenantId;
    }

    // Assign id if missing
    if (!order.id) {
       order.id = order.orderNumber || `KSM-LOCAL-${Math.floor(Math.random() * 1000000)}`;
       if (!order.orderNumber) order.orderNumber = order.id;
    }
    if (!order.documentNumber) {
        order.documentNumber = order.orderNumber;
    }
    
    // Map lines to standard format if needed
    if (order.lines && Array.isArray(order.lines)) {
      order.lines = order.lines.map((l: any) => ({
        ...l,
        id: l.id || `line-${Math.random().toString(36).substring(2, 9)}`
      }));
    }
    
    orders.push(order);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    console.log('[LOCAL-DB] Order saved successfully:', order.orderNumber || order.id);
    return true;
  } catch (error) {
    console.error('[LOCAL-DB] Error saving order:', error);
    return false;
  }
};
export const getLocalReservedQuantities = (organizationId?: string): Record<string, number> => {
  try {
    const orders = getLocalOrders(organizationId);
    const reserved: Record<string, number> = {};
    
    orders.forEach((order: any) => {
      // Only count pending or processing orders, ignore cancelled
      if (order.status !== 'CANCELLED') {
        order.lines?.forEach((line: any) => {
          const pId = line.productId;
          if (pId) {
            reserved[pId] = (reserved[pId] || 0) + (Number(line.quantity) || 1);
          }
        });
      }
    });
    
    return reserved;
  } catch (error) {
    return {};
  }
};

export const getLocalClients = (organizationId?: string): any[] => {
  try {
    initDb();
    const data = fs.readFileSync(CLIENTS_FILE, 'utf-8');
    let clients = JSON.parse(data || '[]');
    if (organizationId) {
      clients = clients.filter((c: any) => c.organizationId === organizationId || c.tenantId === organizationId);
    }
    return clients;
  } catch (error) {
    console.error('[LOCAL-DB] Error reading clients:', error);
    return [];
  }
};

export const saveLocalClient = (client: any): boolean => {
  try {
    initDb();
    const clients = getLocalClients();
    if (!client.id) client.id = client.code || `C-${Math.random().toString(36).substring(2, 9)}`;
    if (!client.partyId) client.partyId = client.id;
    clients.push(client);
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2));
    console.log('[LOCAL-DB] Client saved successfully:', client.name);
    return true;
  } catch (error) {
    console.error('[LOCAL-DB] Error saving client:', error);
    return false;
  }
};

const USERS_FILE = path.join(DATA_DIR, 'users.json');

export const getLocalUsers = (): any[] => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    return [];
  }
};

export const saveLocalUser = (user: any): boolean => {
  try {
    const users = getLocalUsers();
    // Check for duplicates
    if (!users.find(u => u.email === user.email)) {
      users.push({ ...user, registeredAt: new Date().toISOString() });
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }
    return true;
  } catch (error) {
    return false;
  }
};

