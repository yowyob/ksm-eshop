import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

type Context = {
  params: Promise<{ sessionId: string }>;
};

export async function POST(request: NextRequest, { params }: Context) {
  const { sessionId } = await params;
  const result = await backendFetch(`/api/inventory/sessions/${sessionId}/validate`, {
    method: 'POST',
  });
  return Response.json(result);
}
