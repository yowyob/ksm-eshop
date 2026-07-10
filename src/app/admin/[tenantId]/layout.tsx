'use client';

import { useEffect, useState } from 'react';
import { notFound, usePathname, useRouter, useParams } from 'next/navigation';
import { TENANTS } from '@/lib/mock-data';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminNavbar from '@/components/admin/AdminNavbar';
import { useAuthStore } from '@/store/useAuthStore';
import StoreInitializer from '@/components/shop/StoreInitializer';

interface AdminLayoutProps {
 children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
 const params = useParams();
 const tenantId = params.tenantId as string;
 const pathname = usePathname();
 const router = useRouter();
 const { isAuthenticated } = useAuthStore();
 const [isMounted, setIsMounted] = useState(false);

  const [dynamicTenant, setDynamicTenant] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Fetch dynamic tenant name if not in static list
    if (tenantId && !TENANTS.find((t) => t.slug === tenantId)) {
      // Instead of hitting /api/organizations/[orgId] which might 401,
      // we hit /api/organizations and find the matching one, because the user
      // could view the list in /admin/organizations.
      fetch(`/api/organizations?size=100`)
        .then(res => res.json())
        .then(data => {
          let foundOrg = null;
          if (data.success && data.data) {
             const orgs = Array.isArray(data.data) ? data.data : (data.data.content || []);
             foundOrg = orgs.find((o: any) => o.id === tenantId);
          }
          
          if (foundOrg) {
            setDynamicTenant({
              id: tenantId,
              name: foundOrg.name || foundOrg.displayName || foundOrg.shortName || foundOrg.id,
              slug: tenantId,
              description: foundOrg.description || 'Organisation d\'administration eShop',
              themeColor: '#2563eb'
            });
          } else {
            // Fallback to single endpoint if not in list
            return fetch(`/api/organizations/${tenantId}`).then(res => res.json());
          }
        })
        .then(singleData => {
           if (singleData && singleData.success && singleData.data) {
             setDynamicTenant({
                id: tenantId,
                name: singleData.data.name || singleData.data.title || tenantId,
                slug: tenantId,
                description: 'Organisation d\'administration eShop',
                themeColor: '#2563eb'
              });
           } else if (singleData) {
             // If both failed, just use the ID as the name instead of "Introuvable"
             setDynamicTenant({
                id: tenantId,
                name: tenantId,
                slug: tenantId,
                description: 'Organisation d\'administration eShop',
                themeColor: '#2563eb'
              });
           }
        })
        .catch((err) => {
          console.error(err);
          setDynamicTenant({
              id: tenantId,
              name: tenantId, // Simply use the ID if everything fails
              slug: tenantId,
              description: 'Organisation d\'administration eShop',
              themeColor: '#2563eb'
            });
        });
    }
  }, [tenantId]);

  useEffect(() => {
    if (isMounted && !isAuthenticated && !pathname.endsWith('/login')) {
      router.push('/admin/login');
    }
  }, [isMounted, isAuthenticated, pathname, router]);

  let tenant = TENANTS.find((t) => t.slug === tenantId) || dynamicTenant || {
    id: tenantId,
    name: 'Chargement...',
    slug: tenantId,
    description: 'Organisation d\'administration eShop',
    themeColor: '#2563eb'
  };

 // Prevent hydration mismatch
 if (!isMounted) {
   return null;
 }

 const isLoginPage = pathname.endsWith('/login');

 if (isLoginPage) {
   return <>{children}</>;
 }

 if (!isAuthenticated) {
   return null; // Will redirect via useEffect
 }

 return (
 <div className="flex min-h-screen bg-zinc-50 ">
 <StoreInitializer tenantId={tenant.id} />
 <AdminSidebar tenant={tenant} />
 <div className="flex flex-1 flex-col">
 <AdminNavbar />
 <main className="p-8">{children}</main>
 </div>
 </div>
 );
}
