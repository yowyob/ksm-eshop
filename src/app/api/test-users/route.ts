import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || "fac51104-41e7-4760-bdf4-4abd8f0ea059";
  const result = await backendFetch(`/api/third-parties?organizationId=${orgId}&page=0&size=500`, {
    method: 'GET',
    headers: { 'X-Organization-Id': orgId }
  });
  return NextResponse.json(result);
}
