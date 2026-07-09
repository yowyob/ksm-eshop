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

 let tenant = TENANTS.find((t) => t.slug === tenantId);

 useEffect(() => {
   setIsMounted(true);
 }, []);

 useEffect(() => {
   if (isMounted && !isAuthenticated && !pathname.endsWith('/login')) {
     router.push('/admin/login');
   }
 }, [isMounted, isAuthenticated, pathname, router]);

 if (!tenant) {
   tenant = {
     id: tenantId,
     name: 'Mon Organisation',
     slug: tenantId,
     description: 'Organisation d\'administration eShop',
     themeColor: '#2563eb'
   };
 }

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
