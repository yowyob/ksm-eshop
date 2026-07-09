import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/api-client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ thirdPartyId: string }> }
) {
  const cookieStore = await cookies();
  const customerToken = cookieStore.get('customerToken')?.value;

  if (!customerToken) {
    return Response.json({ success: false, message: 'Non autorisé.' }, { status: 401 });
  }

  const { thirdPartyId } = await params;

  try {
    const body = await request.json();

    const result = await backendFetch(`/api/clients/${thirdPartyId}/bank-accounts`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Authorization': `Bearer ${customerToken}`,
      },
    });

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 400 });
  }
}
