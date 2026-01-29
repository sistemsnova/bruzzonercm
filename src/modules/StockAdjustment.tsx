import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, Package, PlusCircle, MinusCircle, Edit3, Save, X, 
  Info, Loader2, RefreshCcw, ArrowUpRight, AlertTriangle 
} from 'lucide-react'; 
import { Product } from '../types';
import { useFirebase } from '../context/FirebaseContext';

const ITEMS_PER_PAGE = 20;

const StockAdjustment: React.FC = () => {
  const { updateProduct, loading: firebaseContextLoading, fetchProductsPaginatedAndFiltered } = useFirebase();
  
  const [localSearchInput, setLocalSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [currentProductToAdjust, setCurrentProductToAdjust] = useState<Product | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);

  const [showConfirmAdjustmentModal, setShowConfirmAdjustmentModal] = useState(false);

  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const debounceTimeoutRef = useRef<any>(null);

  const debouncedSetSearchQuery = useCallback((value: string) => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }, []);

  const fetchAndDisplayProducts = useCallback(async (
    isNewSearch: boolean = false, 
    searchTerm: string = searchQuery, 
    currentLastVisibleDoc: any = lastVisibleDoc
  ) => {
    setIsProductsLoading(true);
    try {
      const options = {
        limit: ITEMS_PER_PAGE,
        searchTerm: searchTerm.toLowerCase().trim(),
        startAfterDoc: isNewSearch ? undefined : currentLastVisibleDoc,
        orderByField: 'name', 
        orderDirection: 'asc' as const 
      };

      const { products: fetchedProducts, lastVisible, hasMore } = await fetchProductsPaginatedAndFiltered(options);

      setPaginatedProducts(prev => isNewSearch ? fetchedProducts : [...prev, ...fetchedProducts]);
      setLastVisibleDoc(lastVisible);
      setHasMoreProducts(hasMore);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setIsProductsLoading(false);
    }
  }, [searchQuery, lastVisibleDoc, fetchProductsPaginatedAndFiltered]);

  useEffect(() => {
    if (!firebaseContextLoading) {
      setPaginatedProducts([]); 
      setLastVisibleDoc(null);
      setHasMoreProducts(true);
      fetchAndDisplayProducts(true, searchQuery, null);
    }
  }, [searchQuery, firebaseContextLoading, fetchAndDisplayProducts]);

  const openAdjustmentModal = (product: Product) => {
    setCurrentProductToAdjust(product);
    setAdjustmentQuantity(0);
    setAdjustmentReason('');
    setAdjustmentModalOpen(true);
  };

  const handleConfirmAndSaveAdjustment = async () => {
    if (!currentProductToAdjust) return;
    setIsSavingAdjustment(true);
    setShowConfirmAdjustmentModal(false);
    try {
      const newStock = (currentProductToAdjust.stock || 0) + adjustmentQuantity;
      await updateProduct(currentProductToAdjust.id, { stock: Number(newStock) });
      
      alert(`Stock ajustado correctamente.`);
      setAdjustmentModalOpen(false);
      setPaginatedProducts(prev => 
        prev.map(p => p.id === currentProductToAdjust.id ? { ...p, stock: newStock } : p)
      );
    } catch (error) {
      alert('Error al guardar el ajuste.');
    } finally {
      setIsSavingAdjustment(false);
    }
  };

  if (firebaseContextLoading && paginatedProducts.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-[10px]">Cargando Inventario...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-800 italic">Ajuste de Stock</h1>
        <p className="text-slate-500 text-sm">Correcciones manuales de inventario.</p>
      </header>

      <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              className="w-full pl-12 pr-4 py-3 border rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
              value={localSearchInput}
              onChange={(e) => {
                setLocalSearchInput(e.target.value);
                debouncedSetSearchQuery(e.target.value);
              }}
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-5">Producto</th>
              <th className="px-8 py-5 text-center">Stock</th>
              <th className="px-8 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedProducts.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/50">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><Package /></div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{product.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase">{product.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`text-lg font-black ${product.stock < (product.reorderPoint || 0) ? 'text-red-600' : 'text-slate-900'}`}>{product.stock}</span>
                </td>
                <td className="px-8 py-6 text-center">
                  <button onClick={() => openAdjustmentModal(product)} className="p-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {hasMoreProducts && (
          <div className="p-6 flex justify-center">
            <button onClick={() => fetchAndDisplayProducts(false)} className="px-8 py-2 bg-slate-100 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200">
              Cargar más
            </button>
          </div>
        )}
      </div>

      {/* MODAL AJUSTE */}
      {adjustmentModalOpen && currentProductToAdjust && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="p-8 bg-orange-50 border-b flex justify-between items-center">
              <h2 className="text-xl font-black uppercase">Ajustar Stock</h2>
              <button onClick={() => setAdjustmentModalOpen(false)}><X /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex justify-between bg-slate-100 p-4 rounded-2xl font-black">
                <span>Stock Actual</span><span>{currentProductToAdjust.stock}</span>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setAdjustmentQuantity(q => q - 1)} className="p-4 bg-red-100 rounded-2xl"><MinusCircle /></button>
                <input type="number" className="flex-1 text-center text-3xl font-black border-2 rounded-2xl p-2" value={adjustmentQuantity} onChange={e => setAdjustmentQuantity(Number(e.target.value))}/>
                <button onClick={() => setAdjustmentQuantity(q => q + 1)} className="p-4 bg-green-100 rounded-2xl"><PlusCircle /></button>
              </div>
              <textarea placeholder="Motivo del ajuste..." className="w-full p-4 border rounded-2xl h-24" value={adjustmentReason} onChange={e => setAdjustmentReason(e.target.value)}/>
              <button onClick={() => setShowConfirmAdjustmentModal(true)} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase shadow-xl">
                 Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACION */}
      {showConfirmAdjustmentModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center">
           <div className="bg-white p-10 rounded-[2.5rem] text-center max-w-sm">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black uppercase mb-2">¿Confirmar Ajuste?</h3>
              <p className="text-sm text-slate-500 mb-6">El stock final será de {(currentProductToAdjust?.stock || 0) + adjustmentQuantity} unidades.</p>
              <div className="flex gap-2">
                 <button onClick={() => setShowConfirmAdjustmentModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancelar</button>
                 <button onClick={handleConfirmAndSaveAdjustment} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Confirmar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StockAdjustment;