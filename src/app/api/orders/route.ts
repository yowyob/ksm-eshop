import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { getLocalOrders } from '@/lib/local-db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId') || process.env.DEFAULT_ORGANIZATION_ID || 'o1';

  // The user explicitly requested that we strictly use the local database (.data/orders.json) 
  // for orders, instead of trying to fetch from the kernel, due to POST/permissions issues.
  const localOrders = getLocalOrders(organizationId || undefined);
  
  return Response.json({ 
    success: true, 
    data: localOrders,
    totalElements: localOrders.length
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Inject default organizationId and agencyId if not provided
    if (!body.organizationId) {
      body.organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'o1';
    }
    if (!body.agencyId) {
      body.agencyId = process.env.DEFAULT_AGENCY_ID || 'wh1_2';
    }

    const result = await backendFetch('/api/sales/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return Response.json(result);
  } catch (error: any) {
    return Response.json({
      success: false,
      message: error.message || 'Invalid JSON request body.',
      errorCode: 'BAD_REQUEST',
    }, { status: 400 });
  }
}
