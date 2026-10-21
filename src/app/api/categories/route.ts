import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { listerCategories } from '@/lib/kernel-catalog';

/** Les catégories sont propres à une organisation : celle demandée, sinon celle de la boutique. */
function organisation(request: NextRequest): string | undefined {
  return request.nextUrl.searchParams.get('organizationId') || process.env.DEFAULT_ORGANIZATION_ID || undefined;
}

export async function GET(request: NextRequest) {
  const organizationId = organisation(request);
  if (!organizationId) {
    return Response.json({ success: true, data: [] });
  }
  return Response.json(await listerCategories(organizationId));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await backendFetch('/api/product-core/classification/categories', {
      method: 'POST',
      body: JSON.stringify({ organizationId: organisation(request), ...body }),
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
