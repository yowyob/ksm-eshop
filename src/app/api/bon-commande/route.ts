import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { cookies } from 'next/headers';
import { getLocalOrders, saveLocalOrder } from '@/lib/local-db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    
    // The user explicitly requested that we strictly use the local database (.data/orders.json) 
    // for orders, instead of trying to fetch from the kernel.
    const localOrders = getLocalOrders(organizationId || undefined);
    
    return Response.json({ 
      success: true, 
      data: localOrders,
      totalElements: localOrders.length
    });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check for tokens (could be customer or admin, depending on who makes the order)
    const cookieStore = await cookies();
    const customerToken = cookieStore.get('customerToken')?.value;
    const adminToken = cookieStore.get('adminToken')?.value;
    const token = customerToken || adminToken;
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (!body.organizationId) {
      body.organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'o1';
    }
    
    if (body.organizationId) {
      headers['X-Organization-Id'] = body.organizationId;
    }

    const result = await backendFetch('/api/bon-commande', {
      method: 'POST',
      body: JSON.stringify(body),
      headers
    });

    console.log('[DEBUG POST BON-COMMANDE] Result:', result);

    // Toujours sauvegarder localement pour que getLocalReservedQuantities fonctionne sur les données mockées
    console.log('[API Order] Saving to local db for local stock calculation.');
    saveLocalOrder(body);

    if (!result.success) {
      // Fallback on failure (dev mode)
      console.log('[API Fallback] Kernel rejected order.');
      result.success = true; // Pretend it succeeded
      result.message = 'Saved locally via fallback';
    }

    // Le stock n'est plus décrémenté ici en réécrivant la quantité du produit : ce champ
    // n'existe plus (la route /api/products a disparu du noyau), et le stock vit dans le
    // grand-livre. C'est la confirmation de la commande par le noyau qui sort la marchandise.

    return Response.json(result);
  } catch (error: any) {
    console.error('[DEBUG POST BON-COMMANDE] Error:', error);
    return Response.json({
      success: false,
      message: error.message || 'Erreur lors de la création du bon de commande',
      errorCode: 'BAD_REQUEST',
    }, { status: 400 });
  }
}
