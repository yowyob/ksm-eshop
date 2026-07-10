import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { getLocalReservedQuantities } from '@/lib/local-db';

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
      currency: 'FCFA',
      tenantName: 'KSM GADGETS'
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
      currency: 'FCFA',
      tenantName: 'KSM GADGETS'
    },
    {
      id: 'demo-prod-3',
      organizationId: 'o1',
      code: 'PROD-003',
      sku: 'PROD-003',
      name: 'Enceinte Bluetooth',
      description: 'Enceinte portable puissante avec 12h d\'autonomie et son à 360 degrés.',
      categoryId: 'c1',
      status: 'ACTIVE',
      photo: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=600',
      unitPrice: 18000,
      currency: 'FCFA',
      tenantName: 'KSM SARL'
    },
    {
      id: 'demo-prod-4',
      organizationId: 'o2',
      code: 'PROD-004',
      sku: 'PROD-004',
      name: 'Sneakers Urbaines',
      description: 'Chaussures de sport urbaines, confortables et stylées.',
      categoryId: 'c3',
      status: 'ACTIVE',
      photo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
      unitPrice: 35000,
      currency: 'FCFA',
      tenantName: 'KSM FASHION'
    },
    {
      id: 'demo-prod-5',
      organizationId: 'o3',
      code: 'PROD-005',
      sku: 'PROD-005',
      name: 'Sac à Dos Pro',
      description: 'Sac à dos pour ordinateur avec port USB de recharge intégré.',
      categoryId: 'c4',
      status: 'ACTIVE',
      photo: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600',
      unitPrice: 22000,
      currency: 'FCFA',
      tenantName: 'KSM LUGGAGE'
    },
    {
      id: 'demo-prod-6',
      organizationId: 'o1',
      code: 'PROD-006',
      sku: 'PROD-006',
      name: 'Écran 27" 4K',
      description: 'Moniteur haute résolution pour professionnels de l\'image.',
      categoryId: 'c1',
      status: 'ACTIVE',
      photo: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=600',
      unitPrice: 195000,
      currency: 'FCFA',
      tenantName: 'KSM SARL'
    }
  ];

  if (organizationId === 'ALL') {
    return Response.json({
      success: true,
      data: mockProducts
    });
  }

  if (organizationId === 'demo-org') {
    return Response.json({
      success: true,
      data: mockProducts.filter(p => p.organizationId === 'demo-org' || p.organizationId === 'o1')
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

  if (!result.success) {
    const reserved = getLocalReservedQuantities(organizationId);
    const orgMockProducts = mockProducts.filter(p => p.organizationId === organizationId || organizationId === 'ALL');
    const updatedMock = orgMockProducts.map(p => {
       const deduction = reserved[p.id] || 0;
       return { ...p, quantity: Math.max(0, (p.quantity || 0) - deduction) };
    });
    return Response.json({
      success: true,
      data: updatedMock.length > 0 ? updatedMock : mockProducts // Fallback to all mocks if empty for demo
    });
  }
  
  if (result.success && result.data) {
    const reserved = getLocalReservedQuantities(organizationId);
    let content = result.data.content || result.data;
    
    if (Array.isArray(content)) {
      content.forEach((p: any) => {
        if (reserved[p.id]) {
          if (typeof p.quantity === 'number') p.quantity = Math.max(0, p.quantity - reserved[p.id]);
          if (typeof p.inStock === 'number') p.inStock = Math.max(0, p.inStock - reserved[p.id]);
          if (p.variants && Array.isArray(p.variants)) {
             p.variants.forEach((v: any) => {
               if (reserved[v.id]) {
                 if (typeof v.quantity === 'number') v.quantity = Math.max(0, v.quantity - reserved[v.id]);
                 if (typeof v.inStock === 'number') v.inStock = Math.max(0, v.inStock - reserved[v.id]);
               }
             });
          }
        }
      });
    }
    return Response.json({ ...result, data: result.data });
  }

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
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
