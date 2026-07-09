import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

type Context = {
  params: Promise<{ transformationId: string }>;
};

export async function POST(request: NextRequest, { params }: Context) {
  const { transformationId } = await params;
  const result = await backendFetch(`/api/inventory/transformations/${transformationId}/validate`, {
    method: 'POST',
  });
  return Response.json(result);
}
