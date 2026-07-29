'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  Search, 
  Edit2, 
  Package, 
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { KernelProduct } from '@/lib/types';
import { Camera, Upload } from 'lucide-react';

function splitImagesString(str: string): string[] {
  if (!str) return [];
  const rawParts = str.split(',').map(s => s.trim()).filter(Boolean);
  const result: string[] = [];
  
  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    if (part.startsWith('data:image/') && part.endsWith('base64') && i + 1 < rawParts.length) {
      result.push(part + ',' + rawParts[i + 1]);
      i++;
    } else {
      result.push(part);
    }
  }
  return result;
}

interface ImageGalleryManagerProps {
  imagesString: string;
  onChange: (value: string) => void;
  colorTheme?: 'blue' | 'emerald';
}

function ImageGalleryManager({ imagesString, onChange, colorTheme = 'blue' }: ImageGalleryManagerProps) {
  const images = splitImagesString(imagesString)
    .filter(s => s && (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image/')));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach(file => {
      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const max_size = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
            const updated = [...images, compressedBase64].join(',');
            onChange(updated);
          } else {
            throw new Error("Canvas context 2D non disponible");
          }
        } catch (err) {
          console.error("Erreur de compression, fallback base64 brut:", err);
          const reader = new FileReader();
          reader.onloadend = () => {
            const updated = [...images, reader.result as string].join(',');
            onChange(updated);
          };
          reader.readAsDataURL(file);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };

      img.onerror = (err) => {
        console.error("Erreur de chargement de l'image, fallback base64 brut:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          const updated = [...images, reader.result as string].join(',');
          onChange(updated);
        };
        reader.readAsDataURL(file);
        URL.revokeObjectURL(objectUrl);
      };

      img.src = objectUrl;
    });
  };

  const removeImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove).join(',');
    onChange(updated);
  };

  const isBlue = colorTheme === 'blue';

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-zinc-200 bg-zinc-50 shadow-sm transition-all hover:scale-105 hover:shadow-md">
              <img 
                src={img} 
                alt={`Photo ${idx + 1}`} 
                className="w-full h-full object-cover" 
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-lg transition-transform hover:scale-110 active:scale-95"
                title="Supprimer l'image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <label className={`flex items-center gap-2 cursor-pointer px-4 h-11 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
          isBlue 
            ? 'border-blue-600 text-blue-600 bg-blue-50/20 hover:bg-blue-50/50' 
            : 'border-emerald-600 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-50/50'
        }`}>
          <Upload className="h-4 w-4" />
          Importer des photos
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            className="hidden" 
            onChange={handleFileChange} 
          />
        </label>

        <label className={`flex items-center gap-2 cursor-pointer px-4 h-11 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
          isBlue 
            ? 'border-blue-600 text-blue-600 bg-blue-50/20 hover:bg-blue-50/50' 
            : 'border-emerald-600 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-50/50'
        }`}>
          <Camera className="h-4 w-4" />
          Prendre une photo
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            onChange={handleFileChange} 
          />
        </label>
      </div>

      <div className="text-[10px] text-zinc-500 font-mono mt-2 p-2 bg-zinc-100 rounded-lg break-all">
        <strong>Debug Galerie :</strong> {images.length} images. {images.map((img, i) => `[Img ${i+1}]: ${img.substring(0, 50)}... (${img.length} chars)`).join(' | ')}
      </div>
    </div>
  );
}

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
    retailPrice: '',
    categoryCode: '',
    imageUrl: '',
    quantity: '0',
    variantLabel: '',
    variantValues: '',
    semiWholesalePrice: '',
    semiWholesaleMinQty: '5',
    wholesalePrice: '',
    wholesaleMinQty: '10',
    superWholesalePrice: '',
    superWholesaleMinQty: '20',
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
    if (!newProduct.name || !newProduct.retailPrice) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Encoder label + valeurs dans variantLabel: "Couleur: Noir, Blanc" ou "Standard"
      const variantLabelEncoded = newProduct.variantLabel && newProduct.variantValues
        ? `${newProduct.variantLabel}: ${newProduct.variantValues}`
        : newProduct.variantLabel || 'Standard';

      const allowedSaleSizes = [
        { size: 'DETAIL', unitPrice: parseFloat(newProduct.retailPrice) || 1, minQuantity: 1, active: true }
      ];
      if (newProduct.semiWholesalePrice) {
        allowedSaleSizes.push({
          size: 'DEMIS_GROS',
          unitPrice: parseFloat(newProduct.semiWholesalePrice),
          minQuantity: parseInt(newProduct.semiWholesaleMinQty, 10) || 5,
          active: true
        });
      }
      if (newProduct.wholesalePrice) {
        allowedSaleSizes.push({
          size: 'GROS',
          unitPrice: parseFloat(newProduct.wholesalePrice),
          minQuantity: parseInt(newProduct.wholesaleMinQty, 10) || 10,
          active: true
        });
      }
      if (newProduct.superWholesalePrice) {
        allowedSaleSizes.push({
          size: 'SUPER_GROS',
          unitPrice: parseFloat(newProduct.superWholesalePrice),
          minQuantity: parseInt(newProduct.superWholesaleMinQty, 10) || 20,
          active: true
        });
      }

      const payload: any = {
        organizationId: tenantId,
        name: newProduct.name,
        description: newProduct.description,
        unitPrice: parseFloat(newProduct.retailPrice) || 1,
        retailPrice: parseFloat(newProduct.retailPrice) || 1,
        photo: newProduct.imageUrl,
        imageUrl: newProduct.imageUrl,
        currency: 'FCFA',
        familyCode: newProduct.categoryCode || 'STANDARD',
        categoryCode: newProduct.categoryCode || 'STANDARD',
        variantLabel: variantLabelEncoded,
        quantity: parseInt(newProduct.quantity, 10) || 0,
        sku: `SKU-${Date.now()}`,
        status: 'ACTIVE',
        allowedSaleSizes
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
          name: '', description: '', retailPrice: '', categoryCode: '',
          imageUrl: '', quantity: '0', variantLabel: '', variantValues: '',
          semiWholesalePrice: '', semiWholesaleMinQty: '5',
          wholesalePrice: '', wholesaleMinQty: '10',
          superWholesalePrice: '', superWholesaleMinQty: '20'
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
    // Décoder variantLabel: "Couleur: Noir, Blanc" → label="Couleur", values="Noir, Blanc"
    const rawLabel = (p as any).variantLabel || '';
    const colonIdx = rawLabel.indexOf(':');
    const parsedLabel  = colonIdx >= 0 ? rawLabel.slice(0, colonIdx).trim() : (rawLabel === 'Standard' ? '' : rawLabel);
    const parsedValues = colonIdx >= 0 ? rawLabel.slice(colonIdx + 1).trim() : '';

    const sizes = p.allowedSaleSizes || [];
    const detailSize = sizes.find((s: any) => s.size === 'DETAIL');
    const semiGrosSize = sizes.find((s: any) => s.size === 'DEMIS_GROS' || s.size === 'SEMI_GROS');
    const grosSize = sizes.find((s: any) => s.size === 'GROS');
    const superGrosSize = sizes.find((s: any) => s.size === 'SUPER_GROS');

    setEditProduct({
      id: p.id,
      sku: (p as any).sku || '',
      name: p.name,
      description: p.description || '',
      retailPrice: (detailSize?.unitPrice || detailSize?.price || p.unitPrice || p.price || 0).toString(),
      categoryCode: p.categoryCode || p.familyCode || '',
      imageUrl: p.photo || p.imageUrl || p.image || p.picture || '',
      quantity: p.quantity !== undefined ? p.quantity : 0,
      status: p.status || 'ACTIVE',
      variantLabel: parsedLabel,
      variantValues: parsedValues,
      semiWholesalePrice: semiGrosSize ? (semiGrosSize.unitPrice || semiGrosSize.price || '').toString() : '',
      semiWholesaleMinQty: semiGrosSize ? (semiGrosSize.minQuantity || semiGrosSize.minQty || '5').toString() : '5',
      wholesalePrice: grosSize ? (grosSize.unitPrice || grosSize.price || '').toString() : '',
      wholesaleMinQty: grosSize ? (grosSize.minQuantity || grosSize.minQty || '10').toString() : '10',
      superWholesalePrice: superGrosSize ? (superGrosSize.unitPrice || superGrosSize.price || '').toString() : '',
      superWholesaleMinQty: superGrosSize ? (superGrosSize.minQuantity || superGrosSize.minQty || '20').toString() : '20',
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
      const variantLabelEncoded = editProduct.variantLabel && editProduct.variantValues
        ? `${editProduct.variantLabel}: ${editProduct.variantValues}`
        : editProduct.variantLabel || 'Standard';

      const allowedSaleSizes = [
        { size: 'DETAIL', unitPrice: parseFloat(editProduct.retailPrice) || 1, minQuantity: 1, active: true }
      ];
      if (editProduct.semiWholesalePrice) {
        allowedSaleSizes.push({
          size: 'DEMIS_GROS',
          unitPrice: parseFloat(editProduct.semiWholesalePrice),
          minQuantity: parseInt(editProduct.semiWholesaleMinQty, 10) || 5,
          active: true
        });
      }
      if (editProduct.wholesalePrice) {
        allowedSaleSizes.push({
          size: 'GROS',
          unitPrice: parseFloat(editProduct.wholesalePrice),
          minQuantity: parseInt(editProduct.wholesaleMinQty, 10) || 10,
          active: true
        });
      }
      if (editProduct.superWholesalePrice) {
        allowedSaleSizes.push({
          size: 'SUPER_GROS',
          unitPrice: parseFloat(editProduct.superWholesalePrice),
          minQuantity: parseInt(editProduct.superWholesaleMinQty, 10) || 20,
          active: true
        });
      }

      const payload: any = {
        organizationId: tenantId,
        sku: editProduct.sku || editProduct.name.substring(0, 5).toUpperCase() + '-' + Date.now().toString().substring(7),
        name: editProduct.name,
        description: editProduct.description,
        unitPrice: parseFloat(editProduct.retailPrice) || 1,
        retailPrice: parseFloat(editProduct.retailPrice) || 1,
        photo: editProduct.imageUrl,
        status: editProduct.status,
        currency: 'FCFA',
        familyCode: editProduct.categoryCode || 'STANDARD',
        categoryCode: editProduct.categoryCode || 'STANDARD',
        variantLabel: variantLabelEncoded,
        quantity: parseInt(editProduct.quantity, 10) || 0,
        allowedSaleSizes
      };

      const res = await fetch(`/api/admin/products/${editProduct.id}`, {
        method: 'PUT',
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

  const handleToggleStatus = async (product: KernelProduct) => {
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = newStatus === 'ACTIVE' ? 'réactiver' : 'désactiver';
    if (!confirm(`Voulez-vous vraiment ${actionLabel} le produit "${product.name}" ?`)) return;
    
    setError(null);
    try {
      // Pour modifier le statut, on réutilise le endpoint PUT/PATCH de l'admin produit
      // en lui passant l'ensemble de l'objet produit avec le statut modifié
      const payload = {
        organizationId: tenantId,
        sku: (product as any).sku || `SKU-${product.id.slice(0, 8)}`,
        name: product.name,
        description: product.description || '',
        variantLabel: (product as any).variantLabel || 'Standard',
        unitPrice: product.unitPrice || product.price || 1,
        retailPrice: product.unitPrice || product.price || 1,
        photo: product.photo || (product as any).imageUrl || '',
        quantity: product.quantity !== undefined ? product.quantity : 0,
        status: newStatus,
        currency: product.currency || 'FCFA',
        familyCode: product.categoryCode || product.familyCode || 'STANDARD',
        categoryCode: product.categoryCode || product.familyCode || 'STANDARD',
      };

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success || res.ok) {
        await fetchProducts();
      } else {
        setError(data.message || `Erreur lors de la modification du statut.`);
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
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Prix de Détail (CFA)</label>
                <input 
                  required
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  placeholder="Ex: 15000"
                  value={newProduct.retailPrice}
                  onChange={(e) => setNewProduct({...newProduct, retailPrice: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Prix Demi-Gros (CFA)</label>
                <input 
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  placeholder="Ex: 13500"
                  value={newProduct.semiWholesalePrice}
                  onChange={(e) => setNewProduct({...newProduct, semiWholesalePrice: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Qté Min. Demi-Gros</label>
                <input 
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  value={newProduct.semiWholesaleMinQty}
                  onChange={(e) => setNewProduct({...newProduct, semiWholesaleMinQty: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Prix de Gros (CFA)</label>
                <input 
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  placeholder="Ex: 12000"
                  value={newProduct.wholesalePrice}
                  onChange={(e) => setNewProduct({...newProduct, wholesalePrice: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Qté Min. Gros</label>
                <input 
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  value={newProduct.wholesaleMinQty}
                  onChange={(e) => setNewProduct({...newProduct, wholesaleMinQty: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Prix Super-Gros (CFA)</label>
                <input 
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  placeholder="Ex: 10000"
                  value={newProduct.superWholesalePrice}
                  onChange={(e) => setNewProduct({...newProduct, superWholesalePrice: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Qté Min. Super-Gros</label>
                <input 
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  value={newProduct.superWholesaleMinQty}
                  onChange={(e) => setNewProduct({...newProduct, superWholesaleMinQty: e.target.value})}
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
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Photos du produit</label>
                <ImageGalleryManager 
                  imagesString={newProduct.imageUrl}
                  onChange={(val) => setNewProduct({...newProduct, imageUrl: val})}
                  colorTheme="blue"
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

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Libellé Variante
                  <span className="ml-1 font-medium normal-case text-zinc-400">(ex : Couleur, Taille...)</span>
                </label>
                <input 
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  placeholder="Ex : Couleur"
                  value={newProduct.variantLabel}
                  onChange={(e) => setNewProduct({...newProduct, variantLabel: e.target.value})}
                />
              </div>

              <div className="space-y-1 lg:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Valeurs de Variante
                  <span className="ml-1 font-medium normal-case text-zinc-400">(séparées par une virgule)</span>
                </label>
                <input 
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-blue-600 outline-none transition-colors"
                  placeholder="Ex : Noir, Blanc, Rouge"
                  value={newProduct.variantValues}
                  onChange={(e) => setNewProduct({...newProduct, variantValues: e.target.value})}
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
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Prix de Détail (CFA)</label>
                <input 
                  required
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors"
                  value={editProduct.retailPrice}
                  onChange={(e) => setEditProduct({...editProduct, retailPrice: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Prix Demi-Gros (CFA)</label>
                <input 
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors"
                  value={editProduct.semiWholesalePrice}
                  onChange={(e) => setEditProduct({...editProduct, semiWholesalePrice: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Qté Min. Demi-Gros</label>
                <input 
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors"
                  value={editProduct.semiWholesaleMinQty}
                  onChange={(e) => setEditProduct({...editProduct, semiWholesaleMinQty: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Prix de Gros (CFA)</label>
                <input 
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors"
                  value={editProduct.wholesalePrice}
                  onChange={(e) => setEditProduct({...editProduct, wholesalePrice: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Qté Min. Gros</label>
                <input 
                  type="number"
                  className="w-full h-11 bg-white border-2 border-emerald-600 outline-none transition-colors"
                  value={editProduct.wholesaleMinQty}
                  onChange={(e) => setEditProduct({...editProduct, wholesaleMinQty: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Prix Super-Gros (CFA)</label>
                <input 
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors"
                  value={editProduct.superWholesalePrice || ''}
                  onChange={(e) => setEditProduct({...editProduct, superWholesalePrice: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Qté Min. Super-Gros</label>
                <input 
                  type="number"
                  className="w-full h-11 bg-white border-2 border-emerald-600 outline-none transition-colors"
                  value={editProduct.superWholesaleMinQty || '20'}
                  onChange={(e) => setEditProduct({...editProduct, superWholesaleMinQty: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Prix de Gros (CFA)</label>
                <input 
                  required
                  type="number"
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors"
                  value={editProduct.wholesalePrice}
                  onChange={(e) => setEditProduct({...editProduct, wholesalePrice: e.target.value})}
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
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Photos du produit</label>
                <ImageGalleryManager 
                  imagesString={editProduct.imageUrl}
                  onChange={(val) => setEditProduct({...editProduct, imageUrl: val})}
                  colorTheme="emerald"
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

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Libellé Variante
                  <span className="ml-1 font-medium normal-case text-zinc-400">(ex : Couleur, Taille...)</span>
                </label>
                <input 
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors"
                  placeholder="Ex : Couleur"
                  value={editProduct.variantLabel || ''}
                  onChange={(e) => setEditProduct({...editProduct, variantLabel: e.target.value})}
                />
              </div>

              <div className="space-y-1 lg:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Valeurs de Variante
                  <span className="ml-1 font-medium normal-case text-zinc-400">(séparées par une virgule)</span>
                </label>
                <input 
                  className="w-full h-11 bg-white border-2 border-zinc-200 rounded-xl px-4 text-sm font-bold focus:border-emerald-600 outline-none transition-colors"
                  placeholder="Ex : Noir, Blanc, Rouge"
                  value={editProduct.variantValues || ''}
                  onChange={(e) => setEditProduct({...editProduct, variantValues: e.target.value})}
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
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                          p.status === 'ACTIVE' 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {p.status === 'ACTIVE' ? 'Actif' : 'Désactivé'}
                        </span>
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`h-8 border-2 font-black uppercase tracking-widest text-[10px] ${
                            p.status === 'ACTIVE'
                              ? 'text-red-500 hover:bg-red-50 hover:border-red-200'
                              : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                          }`}
                          onClick={() => handleToggleStatus(p)}
                        >
                          <Package className="h-3 w-3 mr-1" />
                          {p.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
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
