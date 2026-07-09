import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId') || process.env.DEFAULT_ORGANIZATION_ID || 'o1';

  const result = await backendFetch('/api/inventory/transfers', {
    method: 'GET',
    params: {
      organizationId,
    },
  });
  return Response.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Inject default organizationId if not provided
    if (!body.organizationId) {
      body.organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'o1';
    }

    const result = await backendFetch('/api/inventory/transfers', {
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
