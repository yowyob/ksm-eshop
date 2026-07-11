'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Package, 
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { KernelProduct } from '@/lib/types';

export default function AdminProductsPage() {
  const { tenantId } = useParams() as { tenantId: string };
  const router = useRouter();

  const [products, setProducts] = useState<KernelProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create Form States
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    categoryCode: '',
    imageUrl: '',
    quantity: '0'
  });

  // Edit Form States
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products?organizationId=${tenantId}&t=${Date.now()}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.success || res.ok) {
        let list: KernelProduct[] = [];
        const raw = data.data || data;
        if (Array.isArray(raw)) list = raw;
        else if (raw?.content && Array.isArray(raw.content)) list = raw.content;
        else if (raw?.data && Array.isArray(raw.data)) list = raw.data;
        setProducts(list);
      } else {
        setError(data.message || 'Erreur lors de la récupération des produits.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, router]);

  useEffect(() => {
    if (tenantId) fetchProducts();
  }, [tenantId, fetchProducts]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        organizationId: tenantId,
        name: newProduct.name,
        description: newProduct.description,
        unitPrice: parseFloat(newProduct.price) || 1,
        photo: newProduct.imageUrl,
        imageUrl: newProduct.imageUrl,
        currency: 'FCFA',
        familyCode: newProduct.categoryCode || 'STANDARD',
        categoryCode: newProduct.categoryCode || 'STANDARD',
        variantLabel: 'Standard',
        quantity: parseInt(newProduct.quantity, 10) || 0,
        sku: `SKU-${Date.now()}`,
        status: 'ACTIVE'
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success || res.ok) {
        setIsAddingProduct(false);
        setNewProduct({
          name: '', description: '', price: '', categoryCode: '',
          imageUrl: '',
          quantity: '0'
        });
        await fetchProducts();
      } else {
        setError(data.message || 'Erreur lors de la création du produit.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditForm = (p: KernelProduct) => {
    setEditProduct({
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: (p.unitPrice !== undefined ? p.unitPrice : (p.price || 0)).toString(),
      categoryCode: p.categoryCode || p.familyCode || p.categoryId || '',
      imageUrl: p.photo || p.imageUrl || p.image || p.picture || '',
      quantity: p.quantity !== undefined ? p.quantity : 0,
      status: p.status || 'ACTIVE'
    });
    setIsEditingProduct(true);
    setIsAddingProduct(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct || !editProduct.id) return;
    setIsSubmittingEdit(true);
    setError(null);

    try {
      const payload: any = {
        organizationId: tenantId,
        name: editProduct.name,
        description: editProduct.description,
        unitPrice: parseFloat(editProduct.price) || 1, // Fallback to 1 to avoid <= 0 validation error
        photo: editProduct.imageUrl,
        status: editProduct.status,
        currency: 'FCFA',
        familyCode: editProduct.categoryCode || 'STANDARD',
        categoryCode: editProduct.categoryCode || 'STANDARD',
        variantLabel: 'Standard',
        quantity: parseInt(editProduct.quantity, 10) || 0,
        sku: editProduct.name.substring(0, 5).toUpperCase() + '-' + Date.now().toString().substring(7)
      };

      const res = await fetch(`/api/admin/products/${editProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success || res.ok) {
        setIsEditingProduct(false);
        setEditProduct(null);
        await fetchProducts();
      } else {
        setError(data.message || 'Erreur lors de la modification du produit.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le produit "${productName}" ?`)) return;
    
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}?organizationId=${tenantId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (data.success || res.ok) {
        await fetchProducts();
      } else {
        setError(data.message || 'Erreur lors de la suppression.');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-400">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-600" />
        <p className="font-bold uppercase tracking-widest text-sm">Chargement du catalogue...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">Produits</h1>
          <p className="text-zinc-500 font-medium">Gérez le catalogue pour cette organisation.</p>
        </div>
        {!isEditingProduct && (
          <Button 
            onClick={() => setIsAddingProduct(!isAddingProduct)}
            className={`h-11 font-black uppercase tracking-widest gap-2 px-6 shadow-lg transition-all ${isAddingProduct ? 'bg-zinc-100 text-zinc-900 shadow-none hover:bg-zinc-200' : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'}`}
          >
            {isAddingProduct ? <X className="h-4 w-4" /> : <Plus className="h-5 w-5" />}
            {isAddingProduct ? 'Annuler' : 'Nouveau Produit'}
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 font-bold border-2 border-red-200 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* CREATE FORM */}
      {isAddingProduct && !isEditingProduct && (
        <Card className="border-2 border-blue-600 bg-blue-50/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 rounded-2xl">
          <CardHeader className="bg-blue-600 text-white p-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Package className="h-4 w-4" /> Ajouter un produit au catalogue
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleProductSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nom du Produit</label>
                <input 
                  required
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  placeholder="Ex: T-shirt KSM"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Prix (CFA)</label>
                <input 
                  required
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  placeholder="15000"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quantité / Stock Initial</label>
                <input 
                  required
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Catégorie</label>
                <input 
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  placeholder="Ex: ELECTRONICS"
                  value={newProduct.categoryCode}
                  onChange={(e) => setNewProduct({...newProduct, categoryCode: e.target.value})}
                />
              </div>

              <div className="space-y-1 lg:col-span-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Image URL</label>
                <input 
                  type="url"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  placeholder="https://..."
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                />
              </div>

              <div className="space-y-1 lg:col-span-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label>
                <textarea 
                  className="w-full h-24 bg-white border-2 border-zinc-200 rounded-xl p-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors resize-none"
                  placeholder="Description du produit..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="h-11 bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest px-8 shadow-xl shadow-blue-600/20 rounded-xl">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Package className="h-5 w-5 mr-2" />}
                Créer le produit
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* EDIT FORM */}
      {isEditingProduct && editProduct && (
        <Card className="border-2 border-emerald-600 bg-emerald-50/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 rounded-2xl">
          <CardHeader className="bg-emerald-600 text-white p-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Edit2 className="h-4 w-4" /> Modifier le produit
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-emerald-700" onClick={() => setIsEditingProduct(false)}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <form onSubmit={handleEditSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              
              <div className="space-y-1 lg:col-span-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Identifiant Unique (Non Modifiable)</label>
                <input 
                  disabled
                  className="w-full h-11 bg-zinc-100 border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold text-zinc-500 cursor-not-allowed font-mono"
                  value={editProduct.id}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Nom du Produit</label>
                <input 
                  required
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors"
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({...editProduct, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Prix (CFA)</label>
                <input 
                  required
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors"
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({...editProduct, price: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Quantité / Stock</label>
                <input 
                  required
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors"
                  value={editProduct.quantity}
                  onChange={(e) => setEditProduct({...editProduct, quantity: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Catégorie</label>
                <input 
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors"
                  placeholder="Ex: ELECTRONICS"
                  value={editProduct.categoryCode}
                  onChange={(e) => setEditProduct({...editProduct, categoryCode: e.target.value})}
                />
              </div>

              <div className="space-y-1 lg:col-span-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Image URL</label>
                <input 
                  type="url"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors"
                  value={editProduct.imageUrl}
                  onChange={(e) => setEditProduct({...editProduct, imageUrl: e.target.value})}
                />
              </div>

              <div className="space-y-1 lg:col-span-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Description</label>
                <textarea 
                  className="w-full h-24 bg-white border-2 border-zinc-200 rounded-xl p-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors resize-none"
                  value={editProduct.description}
                  onChange={(e) => setEditProduct({...editProduct, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="h-11 font-black uppercase tracking-widest border-2" onClick={() => setIsEditingProduct(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmittingEdit} className="h-11 bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest px-8 shadow-xl shadow-emerald-600/20 rounded-xl">
                {isSubmittingEdit ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Edit2 className="h-5 w-5 mr-2" />}
                Mettre à jour
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* SEARCH */}
      {!isAddingProduct && !isEditingProduct && products.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
          <input 
            type="text"
            placeholder="Rechercher un produit..."
            className="w-full h-12 bg-white border-2 border-zinc-200 rounded-2xl pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-blue-600 transition-colors shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* PRODUCTS LIST */}
      {!isAddingProduct && !isEditingProduct && (
        products.length === 0 ? (
          <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl p-12 text-center">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Package className="h-8 w-8 text-zinc-300" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-widest text-zinc-900 mb-2">Aucun produit</h3>
            <p className="text-zinc-500 font-medium max-w-sm mx-auto mb-6">
              Cette organisation ne possède aucun produit dans son catalogue pour le moment.
            </p>
            <Button onClick={() => setIsAddingProduct(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-600/20">
              <Plus className="h-4 w-4 mr-2" /> Ajouter un produit
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((p) => {
              // Try to find the image URL from various potential fields
              const imageSource = p.photo || p.imageUrl || p.image || p.picture || p.logoUri || null;
              
              return (
                <Card key={p.id} className="border-2 border-zinc-200 hover:border-blue-600/30 transition-colors bg-white overflow-hidden rounded-2xl group">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4">
                    <div className="h-20 w-20 bg-zinc-100 rounded-xl overflow-hidden shrink-0 border border-zinc-200 flex items-center justify-center">
                      {imageSource ? (
                        <img src={imageSource} className="h-full w-full object-cover" alt={p.name} />
                      ) : (
                        <Package className="h-8 w-8 text-zinc-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-lg text-zinc-900 truncate">{p.name}</h3>
                      <p className="text-xs text-zinc-500 font-medium line-clamp-1 mb-2">{p.description || 'Aucune description'}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                          Stock: {p.quantity || 0}
                        </span>
                        <span className="bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md font-mono">
                          ID: {p.id.slice(0,8)}...
                        </span>
                        {(p.categoryCode || p.familyCode) && (
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                            Catégorie: {p.categoryCode || p.familyCode}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 w-full sm:w-auto mt-4 sm:mt-0 border-t sm:border-t-0 border-zinc-100 pt-4 sm:pt-0">
                      <div className="text-xl font-black text-blue-600 whitespace-nowrap">
                        {formatPrice(p.unitPrice !== undefined ? p.unitPrice : (p.price || 0))}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 border-2 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200" onClick={() => openEditForm(p)}>
                          <Edit2 className="h-3 w-3 mr-1" /> Éditer
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 border-2 font-black uppercase tracking-widest text-[10px] text-red-500 hover:bg-red-50 hover:border-red-200" onClick={() => handleDelete(p.id, p.name)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
