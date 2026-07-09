import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

type Context = {
  params: Promise<{ orderId: string }>;
};

export async function POST(request: NextRequest, { params }: Context) {
  const { orderId } = await params;
  const result = await backendFetch(`/api/sales/orders/${orderId}/cancel`, {
    method: 'POST',
  });
  return Response.json(result);
}
