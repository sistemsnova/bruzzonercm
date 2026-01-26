import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Trash2, X, AlertTriangle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Product } from '../types';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', stock: '', code: '', category: 'General', factor: '1'
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const qSnap = await getDocs(collection(db, 'products'));
      setProducts(qSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // FORZAMOS LOS VALORES: Si es null o undefined, ponemos un valor seguro
      const finalData = {
        name: newProduct.name || "Producto Sin Nombre",
        price: Number(newProduct.price) || 0,
        stock: Number(newProduct.stock) || 0,
        code: newProduct.code || "S/N",
        category: newProduct.category || "General",
        saleUnitConversionFactor: Number(newProduct.factor) || 1, // <--- SOLUCIÓN AL ERROR
        createdAt: serverTimestamp()
      };

      console.log("Enviando a Firebase:", finalData); // Para que veas en consola qué se manda
      await addDoc(collection(db, 'products'), finalData);

      setShowModal(false);
      setNewProduct({ name: '', price: '', stock: '', code: '', category: 'General', factor: '1' });
      fetchProducts();
    } catch (error: any) {
      console.error("Error detallado:", error);
      alert("Error al guardar: " + error.message);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800">Inventario</h1>
        <button onClick={() => setShowModal(true)} className="bg-orange-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2">
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="px-8 py-5">Código</th><th className="px-8 py-5">Descripción</th><th className="px-8 py-5">Stock</th><th className="px-8 py-5">Precio</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5 font-mono text-xs text-slate-400">{p.code}</td>
                <td className="px-8 py-5 font-bold text-slate-800">{p.name}</td>
                <td className="px-8 py-5 font-black text-orange-600">{p.stock} U.</td>
                <td className="px-8 py-5 font-black text-slate-900">${p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-black text-slate-800 mb-6">Nuevo Artículo</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input required type="text" placeholder="Nombre" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="text" placeholder="Código" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={newProduct.code} onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })} />
                <input required type="number" placeholder="Precio" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
              </div>
              <input required type="number" placeholder="Stock Inicial" className="w-full p-4 bg-slate-50 rounded-2xl outline-none" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
              <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Guardar Producto</button>
              <button type="button" onClick={() => setShowModal(false)} className="w-full text-slate-400 font-bold py-2 text-xs uppercase">Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};