import { NextRequest } from 'next/server';
import { backendFetch } from '@/lib/api-client';
import { getLocalReservedQuantities } from '@/lib/local-db';
import { isOrgSuspended } from '@/lib/suspended-orgs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get('organizationId') || process.env.DEFAULT_ORGANIZATION_ID || 'o1';
  const familyCode = searchParams.get('familyCode') || undefined;
  const status = searchParams.get('status') || undefined;

  // Si l'organisation spécifique est suspendue, on ne retourne aucun produit
  if (organizationId !== 'ALL' && isOrgSuspended(organizationId)) {
    return Response.json({
      success: true,
      data: []
    });
  }

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

  if (organizationId === 'ALL') {
    // Fetch all organizations first
    const orgsResult = await backendFetch('/api/organizations', { method: 'GET' });
    let orgs: any[] = [];
    if (orgsResult.success && orgsResult.data) {
      const raw = orgsResult.data;
      if (Array.isArray(raw)) orgs = raw;
      else if (raw?.content && Array.isArray(raw.content)) orgs = raw.content;
      else if (raw?.data && Array.isArray(raw.data)) orgs = raw.data;
      else if (raw && typeof raw === 'object' && raw.id) orgs = [raw];
    }

    // Filtrer les organisations suspendues pour ne pas afficher leurs produits
    orgs = orgs.filter((org: any) => !isOrgSuspended(org.id));

    if (orgs.length === 0) {
      return Response.json({ success: true, data: [] }); // plus de fallback avec les mocks des orgs suspendues
    }

    // Fetch products for each organization
    const productPromises = orgs.map(async (org) => {
      try {
        const prodRes = await backendFetch('/api/products', {
          method: 'GET',
          params: { organizationId: org.id, familyCode, status },
          headers: {
            'X-Organization-Id': org.id
          }
        });
        
        console.log(`[DEBUG] prodRes for ${org.id}:`, JSON.stringify(prodRes).substring(0, 200));

        if (prodRes.success && prodRes.data) {
          let content = prodRes.data.content || prodRes.data;
          if (!Array.isArray(content)) content = [];
          
          // Apply reserved quantities
          const reserved = getLocalReservedQuantities(org.id);
          content.forEach((p: any) => {
            // Assign tenantName/organizationId for the frontend
            p.organizationId = org.id;
            p.tenantName = org.displayName || org.shortName || org.legalName || org.code || org.name || org.id;
            
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
          return content;
        }
      } catch (err) {
        console.error(`Failed to fetch products for org ${org.id}`, err);
      }
      return [];
    });

    const allProductsArrays = await Promise.all(productPromises);
    const allProducts = allProductsArrays.flat();

    // Filtre pour ne garder que les produits actifs (ACTIVE)
    const activeProducts = allProducts.filter((p: any) => p.status === 'ACTIVE');

    if (activeProducts.length === 0) {
      // Filtrer aussi le mock par défaut pour s'assurer qu'il est actif
      return Response.json({ success: true, data: mockProducts.filter(p => p.status === 'ACTIVE') }); 
    }

    return Response.json({
      success: true,
      data: activeProducts
    });
  }

  const result = await backendFetch('/api/products', {
    method: 'GET',
    params: {
      organizationId,
      familyCode,
      status: 'ACTIVE', // Forcer le statut ACTIVE lors de la requête au backend
    },
  });

  if (!result.success) {
    const reserved = getLocalReservedQuantities(organizationId);
    const orgMockProducts = mockProducts.filter(p => p.organizationId === organizationId || organizationId === 'ALL');
    const updatedMock = orgMockProducts.map(p => {
       const deduction = reserved[p.id] || 0;
       return { ...p, quantity: Math.max(0, ((p as any).quantity || 0) - deduction) };
     });
    // Filtre les mocks inactifs
    const activeMocks = updatedMock.filter(p => p.status === 'ACTIVE');
    return Response.json({
      success: true,
      data: activeMocks.length > 0 ? activeMocks : mockProducts.filter(p => p.status === 'ACTIVE')
    });
  }
  
  if (result.success && result.data) {
    const reserved = getLocalReservedQuantities(organizationId);
    let content = result.data.content || result.data;
    let list: any[] = Array.isArray(content) ? content : [];
    
    // Filtrer pour n'avoir que les produits actifs (ACTIVE)
    const activeContent = list.filter((p: any) => p.status === 'ACTIVE');
    
    activeContent.forEach((p: any) => {
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

    // Retourner uniquement la liste des produits actifs
    if (Array.isArray(result.data)) {
      return Response.json({ ...result, data: activeContent });
    } else if (result.data.content) {
      return Response.json({ 
        ...result, 
        data: { 
          ...result.data, 
          content: activeContent 
        } 
      });
    }
    return Response.json({ ...result, data: activeContent });
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
