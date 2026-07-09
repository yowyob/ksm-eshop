import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

type Context = {
  params: Promise<{ movementId: string }>;
};

export async function POST(request: NextRequest, { params }: Context) {
  const { movementId } = await params;
  const result = await backendFetch(`/api/inventory/movements/${movementId}/validate`, {
    method: 'POST',
  });
  return Response.json(result);
}
