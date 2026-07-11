import { NextRequest } from 'next/server';
import { getLocalOrders, saveLocalOrder } from '@/lib/local-db';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Yowyob Payment webhook payload can vary, we try to extract event and metadata
    const event = payload.event || payload.type || (payload.transaction?.status ? `TRANSACTION_${payload.transaction.status}` : null);
    const metadata = payload.metadata || payload.transaction?.metadata || {};
    
    console.log('[WEBHOOK PAYMENT] Received event:', event, 'Metadata:', metadata);

    if (event === 'TRANSACTION_SUCCEEDED') {
      const orderIdsStr = metadata.orderIds;
      if (!orderIdsStr) {
        return Response.json({ success: false, message: 'Missing orderIds in metadata' }, { status: 400 });
      }

      const orderIds = orderIdsStr.split(',');
      
      // Mettre à jour le statut des commandes locales
      const ORDERS_FILE = path.join(process.cwd(), '.data', 'orders.json');
      let orders = [];
      if (fs.existsSync(ORDERS_FILE)) {
        const fileContent = fs.readFileSync(ORDERS_FILE, 'utf8');
        try {
          orders = JSON.parse(fileContent);
        } catch(e) {}
      }

      let updatedCount = 0;
      for (const orderId of orderIds) {
        const idx = orders.findIndex((o: any) => o.id === orderId);
        if (idx !== -1) {
          orders[idx].status = 'paid'; // ou 'processing' selon la logique KSM
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
        console.log(`[WEBHOOK PAYMENT] Successfully updated ${updatedCount} orders to 'paid' status.`);
      } else {
        console.warn(`[WEBHOOK PAYMENT] No matching local orders found for IDs: ${orderIdsStr}`);
      }
    }

    return Response.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('[WEBHOOK PAYMENT ERROR]', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
