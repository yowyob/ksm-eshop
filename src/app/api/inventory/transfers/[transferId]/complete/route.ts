import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

type Context = {
  params: Promise<{ transferId: string }>;
};

export async function POST(request: NextRequest, { params }: Context) {
  const { transferId } = await params;
  const result = await backendFetch(`/api/inventory/transfers/${transferId}/complete`, {
    method: 'POST',
  });
  return Response.json(result);
}
