import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, Search, Truck, AlertTriangle, 
  Printer, Share2, 
  Loader2, CheckCircle2, MoreVertical, PlusCircle, Info
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { Product } from '../types';

export const MissingItems: React.FC = () => {
  const { products, suppliers, updateProduct } = useFirebase();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const missingItems = useMemo(() => {
    return products.filter(p => {
      const stock = p.stock || 0;
      const reorder = p.reorderPoint || 0;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return stock <= reorder && matchesSearch;
    });
  }, [products, searchQuery]);

  const groupedBySupplier = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    missingItems.forEach(item => {
      const supId = item.supplierId || 'unassigned';
      if (!groups[supId]) groups[supId] = [];
      groups[supId].push(item);
    });
    return groups;
  }, [missingItems]);

  const handleUpdateSupplier = async (productId: string, newSupplierId: string) => {
    setIsUpdating(productId);
    try {
      await updateProduct(productId, { supplierId: newSupplierId });
    } catch (e) {
      alert("Error al actualizar proveedor");
    } finally {
      setIsUpdating(null);
    }
  };

  const getSupplierName = (id: string) => {
    if (id === 'unassigned') return 'Sin Proveedor Asignado';
    return suppliers.find(s => s.id === id)?.name || 'Proveedor Desconocido';
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600 text-white rounded-[1.5rem] shadow-xl">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Artículos Faltantes</h1>
            <p className="text-slate-500 text-sm">Monitor de stock crítico y reposición inteligente.</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button className="px-5 py-2 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
             <Printer className="w-4 h-4" /> Imprimir
           </button>
           <button className="px-5 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
             <PlusCircle className="w-4 h-4" /> Generar Pedidos
           </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por SKU o Nombre..." 
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {missingItems.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-100 shadow-sm text-center space-y-4">
           <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
             <CheckCircle2 className="w-10 h-10" />
           </div>
           <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Stock al día</h2>
           <p className="text-slate-400 max-w-xs mx-auto text-sm font-medium">No hay productos que necesiten reposición urgente.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {(Object.entries(groupedBySupplier) as [string, Product[]][]).map(([supplierId, items]) => (
            <section key={supplierId} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
                        <Truck className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{getSupplierName(supplierId)}</h3>
                     <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">{items.length} Faltantes</span>
                  </div>
                  <button className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                    Enviar pedido <Share2 className="w-3 h-3" />
                  </button>
               </div>

               <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                      <tr>
                        <th className="px-8 py-5">Producto / SKU</th>
                        <th className="px-8 py-5 text-center">Stock</th>
                        <th className="px-8 py-5 text-center">Pto. Pedido</th>
                        <th className="px-8 py-5 text-right">Reponer</th>
                        <th className="px-8 py-5">Proveedor</th>
                        <th className="px-8 py-5 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map(product => (
                        <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-2xl ${product.stock <= 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                <AlertTriangle className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{product.name}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center font-black">
                            <span className={product.stock <= 0 ? 'text-red-600' : 'text-orange-600'}>{product.stock}</span>
                          </td>
                          <td className="px-8 py-6 text-center font-bold text-slate-400">{product.reorderPoint || 0}</td>
                          <td className="px-8 py-6 text-right font-black text-slate-900">
                            {(product.targetStock || 0) - (product.stock || 0) > 0 ? (product.targetStock || 0) - (product.stock || 0) : 1}
                          </td>
                          <td className="px-8 py-6">
                             <div className="relative">
                               <select 
                                 disabled={isUpdating === product.id}
                                 onChange={(e) => handleUpdateSupplier(product.id, e.target.value)}
                                 value={product.supplierId || ''}
                                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                               >
                                  <option value="">Seleccionar...</option>
                                  {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                               </select>
                               {isUpdating === product.id && <Loader2 className="absolute right-2 top-2 w-4 h-4 animate-spin text-blue-500" />}
                             </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                             <button className="p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-500 transition-all shadow-lg" title="Añadir">
                                <PlusCircle className="w-4 h-4" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </section>
          ))}
        </div>
      )}
      
      <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
        <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-900">¿Cómo funciona?</p>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            Los productos aparecen aquí cuando su stock actual es menor al <b>Punto de Reorden</b>.
          </p>
        </div>
      </div>
    </div>
  );
};