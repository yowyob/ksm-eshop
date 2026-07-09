import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId') || process.env.DEFAULT_ORGANIZATION_ID || 'o1';
  const familyCode = searchParams.get('familyCode') || undefined;
  const status = searchParams.get('status') || undefined;

  const mockProducts = [
    {
      id: 'demo-prod-1',
      organizationId: 'demo-org',
      code: 'PROD-001',
      sku: 'PROD-001',
      name: 'Casque Audio Sans Fil',
      description: 'Casque audio haute définition avec réduction de bruit active. Parfait pour la musique et les appels.',
      categoryId: 'c1',
      status: 'ACTIVE',
      photo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
      unitPrice: 45000,
      currency: 'FCFA'
    },
    {
      id: 'demo-prod-2',
      organizationId: 'demo-org',
      code: 'PROD-002',
      sku: 'PROD-002',
      name: 'Montre Connectée Sport',
      description: 'Montre connectée avec suivi de fréquence cardiaque, GPS et étanche.',
      categoryId: 'c2',
      status: 'ACTIVE',
      photo: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
      unitPrice: 25000,
      currency: 'FCFA'
    },
    {
      id: 'demo-prod-3',
      organizationId: 'demo-org',
      code: 'PROD-003',
      sku: 'PROD-003',
      name: 'Enceinte Bluetooth',
      description: 'Enceinte portable puissante avec 12h d\'autonomie et son à 360 degrés.',
      categoryId: 'c1',
      status: 'ACTIVE',
      photo: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=600',
      unitPrice: 18000,
      currency: 'FCFA'
    }
  ];

  if (organizationId === 'demo-org') {
    return Response.json({
      success: true,
      data: mockProducts
    });
  }

  const result = await backendFetch('/api/products', {
    method: 'GET',
    params: {
      organizationId,
      familyCode,
      status,
    },
  });

  // Fallback au mock si le kernel ne répond pas (pour test hors ligne étendu)
  if (!result.success) {
    return Response.json({
      success: true,
      data: mockProducts
    });
  }

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Inject default organizationId if not provided
    if (!body.organizationId) {
      body.organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'o1';
    }

    const result = await backendFetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return Response.json(result);
  } catch (error: any) {
    return Response.json({
      success: false,
      message: error.message || 'Invalid JSON request body.',
      errorCode: 'BAD_REQUEST',
    }, { status: 400 });
  }
}
