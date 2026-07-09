import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ thirdPartyId: string; bankAccountId: string }> }
) {
  try {
    const { thirdPartyId, bankAccountId } = await params;

    // Forward the set-primary request to Kernel Core
    const result = await backendFetch(`/api/clients/${thirdPartyId}/bank-accounts/${bankAccountId}/set-primary`, {
      method: 'POST',
    });

    return Response.json(result);
  } catch (error: any) {
    return Response.json({
      success: false,
      message: error.message || 'Erreur lors de la modification du compte principal.',
      errorCode: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}
