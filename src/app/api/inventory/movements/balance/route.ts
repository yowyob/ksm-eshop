import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId') || process.env.DEFAULT_ORGANIZATION_ID || 'o1';
  const agencyId = searchParams.get('agencyId') || process.env.DEFAULT_AGENCY_ID || 'wh1_2';
  const productId = searchParams.get('productId') || '';

  const result = await backendFetch('/api/inventory/movements/balance', {
    method: 'GET',
    params: {
      organizationId,
      agencyId,
      productId,
    },
  });
  return Response.json(result);
}
