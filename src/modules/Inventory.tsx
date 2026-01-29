import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit3, Trash2, X, Loader2, Save } from 'lucide-react';
import { Product } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import { CompanyInfo } from '../App'; // Importamos el tipo desde App

// Definimos que el componente acepta companyInfo
interface InventoryProps {
  companyInfo?: CompanyInfo;
}

export const Inventory: React.FC<InventoryProps> = ({ companyInfo }) => {
  const { addProduct, updateProduct, deleteProduct, fetchProductsPaginatedAndFiltered } = useFirebase() || {};
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  
  const [generalFormData, setGeneralFormData] = useState<Partial<Product>>({ 
    name: '', sku: '', stock: 0, costPrice: 0, salePrice: 0 
  });

  const resetModalStates = () => {
    setActiveProduct(null);
    setGeneralFormData({ 
      name: '', 
      sku: '', 
      stock: 0, 
      costPrice: 0, 
      salePrice: 0 
    });
    setIsSaving(false);
  };

  const loadProducts = useCallback(async () => {
    if (!fetchProductsPaginatedAndFiltered) return;
    try {
      const res = await fetchProductsPaginatedAndFiltered({ limit: 50, searchTerm: search });
      setProducts(res.products || []);
    } catch (e) {
      console.error("Error al cargar productos", e);
    }
  }, [search, fetchProductsPaginatedAndFiltered]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleSave = async () => {
    if (!generalFormData.name || !generalFormData.sku || !addProduct || !updateProduct) {
      alert("Nombre y SKU son obligatorios");
      return;
    }
    setIsSaving(true);
    try {
      const dataToSave: any = { 
        name: generalFormData.name,
        sku: generalFormData.sku,
        stock: Number(generalFormData.stock) || 0, 
        costPrice: Number(generalFormData.costPrice) || 0, 
        salePrice: Number(generalFormData.salePrice) || 0,
        category: generalFormData.category || 'General',
        brand: generalFormData.brand || 'N/A'
      };

      if (activeProduct) {
        await updateProduct(activeProduct.id, dataToSave);
      } else {
        await addProduct(dataToSave);
      }
      
      setShowModal(false);
      resetModalStates();
      loadProducts();
    } catch (e) {
      alert("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold italic">Inventario Maestro</h1>
        <button onClick={() => { resetModalStates(); setShowModal(true); }} className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg">
          <Plus className="w-4 h-4" /> Nuevo Producto
        </button>
      </header>
      
      <div className="bg-white rounded-3xl border overflow-hidden">
        <div className="p-4 border-b">
           <input type="text" placeholder="Buscar producto..." className="w-full max-w-md p-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase border-b">
            <tr>
              <th className="px-8 py-5">Producto</th>
              <th className="px-8 py-5 text-center">Stock</th>
              <th className="px-8 py-5 text-right">Precio</th>
              <th className="px-8 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-8 py-6 font-bold">{p.name}</td>
                <td className="px-8 py-6 text-center">{p.stock}</td>
                <td className="px-8 py-6 text-right font-black">${p.salePrice}</td>
                <td className="px-8 py-6 text-center space-x-2">
                  <button onClick={() => { setActiveProduct(p); setGeneralFormData(p); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteProduct && deleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase">{activeProduct ? 'Editar' : 'Nuevo'} Producto</h2>
              <button onClick={() => setShowModal(false)}><X /></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Nombre" className="w-full p-3 border rounded-xl font-bold" value={generalFormData.name || ''} onChange={e=>setGeneralFormData({...generalFormData, name: e.target.value})}/>
              <input placeholder="SKU" className="w-full p-3 border rounded-xl font-bold" value={generalFormData.sku || ''} onChange={e=>setGeneralFormData({...generalFormData, sku: e.target.value})}/>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Stock" className="p-3 border rounded-xl font-bold" value={generalFormData.stock || ''} onChange={e=>setGeneralFormData({...generalFormData, stock: Number(e.target.value)})}/>
                <input type="number" placeholder="Precio" className="p-3 border rounded-xl font-bold" value={generalFormData.salePrice || ''} onChange={e=>setGeneralFormData({...generalFormData, salePrice: Number(e.target.value)})}/>
              </div>
              <button onClick={handleSave} disabled={isSaving} className="w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase shadow-lg">
                {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Guardar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;