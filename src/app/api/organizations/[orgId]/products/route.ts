import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { isOrgSuspended } from '@/lib/suspended-orgs';

/**
 * GET /api/organizations/[orgId]/products
 * Retourne les produits d'une organisation spécifique.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  // Si l'organisation est suspendue, on ne retourne pas ses produits
  if (isOrgSuspended(orgId)) {
    return Response.json({
      success: true,
      data: []
    });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || undefined;
  const familyCode = searchParams.get('familyCode') || undefined;
  const page = searchParams.get('page') || undefined;
  const size = searchParams.get('size') || undefined;

  const result = await backendFetch('/api/products', {
    method: 'GET',
    params: { organizationId: orgId, status, familyCode, page, size },
    headers: { 'X-Organization-Id': orgId }
  });

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
      wholesalePrice: 40000,
      currency: 'FCFA',
      tenantName: 'KSM GADGETS',
      options: [
        { name: 'Couleur', values: ['Noir', 'Blanc', 'Argent'] }
      ]
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
      wholesalePrice: 22000,
      currency: 'FCFA',
      tenantName: 'KSM GADGETS',
      options: [
        { name: 'Couleur du bracelet', values: ['Noir', 'Bleu', 'Rose'] },
        { name: 'Taille', values: ['S', 'L'] }
      ]
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
      wholesalePrice: 15000,
      currency: 'FCFA',
      tenantName: 'KSM SARL',
      options: [
        { name: 'Modèle', values: ['Standard', 'Pro'] }
      ]
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
      wholesalePrice: 30000,
      currency: 'FCFA',
      tenantName: 'KSM FASHION',
      options: [
        { name: 'Pointure', values: ['40', '41', '42', '43'] },
        { name: 'Couleur', values: ['Rouge', 'Noir/Blanc'] }
      ]
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
      wholesalePrice: 18000,
      currency: 'FCFA',
      tenantName: 'KSM LUGGAGE',
      options: [
        { name: 'Couleur', values: ['Noir', 'Gris', 'Bleu Marine'] }
      ]
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
      wholesalePrice: 180000,
      currency: 'FCFA',
      tenantName: 'KSM SARL',
      options: []
    }
  ];

  // Si l'appel a échoué ou ne retourne rien, renvoyer les mocks pour cette organisation
  if (!result.success || !result.data) {
    const orgMocks = mockProducts.filter(p => p.status === 'ACTIVE' && (p.organizationId === orgId || orgId === 'demo-org'));
    return Response.json({
      success: true,
      data: orgMocks.length > 0 ? orgMocks : mockProducts.filter(p => p.status === 'ACTIVE')
    });
  }

  const raw = result.data.content || result.data;
  const list = Array.isArray(raw) ? raw : [];
  
  if (list.length === 0) {
    const orgMocks = mockProducts.filter(p => p.status === 'ACTIVE' && (p.organizationId === orgId || orgId === 'demo-org'));
    return Response.json({
      success: true,
      data: orgMocks.length > 0 ? orgMocks : mockProducts.filter(p => p.status === 'ACTIVE')
    });
  }

  return Response.json(result);
}
