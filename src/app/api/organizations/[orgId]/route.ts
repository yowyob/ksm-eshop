import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;

  const result = await backendFetch(`/api/organizations/${orgId}`, {
    method: 'GET',
  });

  if (result.success && result.data) {
    const org = result.data;
    const normalized = {
      ...org,
      name: org.displayName || org.shortName || org.longName || org.legalName || org.code || org.id,
      description: org.description || null,
    };
    return Response.json({ ...result, data: normalized });
  }

  return Response.json(result, { status: result.status || (result.errorCode === '401' ? 401 : 400) });
}
