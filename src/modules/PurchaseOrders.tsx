
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, Plus, Search, Truck, AlertTriangle, 
  Loader2, ArrowUpRight, PlusCircle, Trash2, Send, History, Package
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { Product } from '../types';

const ITEMS_PER_PAGE_SEARCH = 10;

const PurchaseOrders: React.FC = () => {
  const { fetchProductsPaginatedAndFiltered, loading: firebaseContextLoading } = useFirebase();

  const [activeTab, setActiveTab] = useState<'sugerencias' | 'historial'>('sugerencias');
  const [manualProductSearchQuery, setManualProductSearchQuery] = useState('');
  const [manualSearchProducts, setManualSearchProducts] = useState<Product[]>([]);
  const [isManualSearchLoading, setIsManualSearchLoading] = useState(false);

  const debouncedSearch = useCallback((value: string) => {
    const timer = setTimeout(async () => {
      if (value.length < 2) return;
      setIsManualSearchLoading(true);
      try {
        const { products } = await fetchProductsPaginatedAndFiltered({
          limit: ITEMS_PER_PAGE_SEARCH,
          searchTerm: value,
          orderByField: 'name',
          orderDirection: 'asc'
        });
        setManualSearchProducts(products);
      } finally {
        setIsManualSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchProductsPaginatedAndFiltered]);

  useEffect(() => {
    if (manualProductSearchQuery) debouncedSearch(manualProductSearchQuery);
  }, [manualProductSearchQuery, debouncedSearch]);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pedidos de Compra</h1>
          <p className="text-slate-500">Gestión de reposición y abastecimiento.</p>
        </div>
        <button className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2">
          <Plus className="w-5 h-5" /> Orden Manual
        </button>
      </header>

      <div className="bg-white rounded-3xl border shadow-sm p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            placeholder="Buscar productos para pedir..." 
            value={manualProductSearchQuery} 
            onChange={e => setManualProductSearchQuery(e.target.value)} 
            className="w-full border pl-10 p-3 rounded-xl" 
          />
        </div>

        <div className="space-y-3">
          {manualSearchProducts.map(p => (
            <div key={p.id} className="p-4 border rounded-2xl flex justify-between items-center hover:bg-slate-50">
              <div>
                <p className="font-bold text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-400">{p.sku}</p>
              </div>
              <button className="bg-orange-600 text-white p-2 rounded-xl"><PlusCircle className="w-5 h-5" /></button>
            </div>
          ))}
          {isManualSearchLoading && <Loader2 className="animate-spin mx-auto" />}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrders;
