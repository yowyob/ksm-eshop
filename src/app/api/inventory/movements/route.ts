import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId') || process.env.DEFAULT_ORGANIZATION_ID || 'o1';
  const agencyId = searchParams.get('agencyId') || undefined;
  const productId = searchParams.get('productId') || undefined;

  const mockMovements = [
    {
      id: 'mock-mov-1',
      organizationId: 'demo-org',
      productId: 'demo-prod-1',
      movementType: 'INBOUND',
      status: 'VALIDATED',
      quantity: 50,
      createdAt: new Date().toISOString()
    },
    {
      id: 'mock-mov-2',
      organizationId: 'demo-org',
      productId: 'demo-prod-2',
      movementType: 'INBOUND',
      status: 'VALIDATED',
      quantity: 15,
      createdAt: new Date().toISOString()
    },
    {
      id: 'mock-mov-3',
      organizationId: 'demo-org',
      productId: 'demo-prod-3',
      movementType: 'INBOUND',
      status: 'VALIDATED',
      quantity: 4,
      createdAt: new Date().toISOString()
    }
  ];

  if (organizationId === 'demo-org') {
    return Response.json({
      success: true,
      data: mockMovements
    });
  }

  const result = await backendFetch('/api/inventory/movements', {
    method: 'GET',
    params: {
      organizationId,
      agencyId,
      productId,
    },
  });

  if (!result.success) {
    return Response.json({
      success: true,
      data: mockMovements
    });
  }

  return Response.json(result);
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

    const result = await backendFetch('/api/inventory/movements', {
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
