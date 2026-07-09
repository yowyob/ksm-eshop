import { Metadata } from 'next';
import { TENANTS } from '@/lib/mock-data';
import ShopNavbar from '@/components/shop/ShopNavbar';
import ShopFooter from '@/components/shop/ShopFooter';
import StoreInitializer from '@/components/shop/StoreInitializer';
import { backendFetch } from '@/lib/api-client';

interface ShopLayoutProps {
 children: React.ReactNode;
 params: Promise<{ tenantId: string }>;
}

async function getTenantInfo(tenantId: string) {
  let organizationName = 'Boutique Officielle';
  try {
    const orgResult = await backendFetch(`/api/organizations/${tenantId}`);
    if (orgResult.success && orgResult.data) {
      const raw = orgResult.data;
      organizationName = raw.displayName || raw.shortName || raw.longName || raw.name || raw.code || 'Boutique Officielle';
    }
  } catch (e) {
    // Silent fail, use default
  }

  return TENANTS.find((t) => t.slug === tenantId) || {
    id: tenantId,
    name: organizationName,
    slug: tenantId,
    description: 'Boutique certifiée ',
    themeColor: '#2563eb'
  };
}

export async function generateMetadata({ params }: { params: Promise<{ tenantId: string }> }): Promise<Metadata> {
 const { tenantId } = await params;
 const tenant = await getTenantInfo(tenantId);

 return {
 title: `${tenant.name} | KSM eShop`,
 description: tenant.description,
 };
}

export default async function ShopLayout({ children, params }: ShopLayoutProps) {
 const { tenantId } = await params;
 const tenant = await getTenantInfo(tenantId);

 return (
 <div className="flex min-h-screen flex-col">
 <StoreInitializer tenantId={tenant.id} />
 <ShopNavbar tenant={tenant} />
 <main className="flex-1">{children}</main>
 <ShopFooter tenant={tenant} />
 </div>
 );
}
