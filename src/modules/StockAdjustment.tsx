
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Package, PlusCircle, MinusCircle, Edit3, Save, X, Info, Loader2, RefreshCcw, ArrowUpRight } from 'lucide-react';
import { Product } from '../types';
import { useFirebase } from '../context/FirebaseContext';

const ITEMS_PER_PAGE = 20; // Number of items to load per page

const StockAdjustment: React.FC = () => {
  const { updateProduct, loading: firebaseContextLoading, fetchProductsPaginatedAndFiltered } = useFirebase();
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [currentProductToAdjust, setCurrentProductToAdjust] = useState<Product | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);

  // New states for paginated products
  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false); // Local loading for products

  // Fix: Changed NodeJS.Timeout to any to resolve namespace error in browser environment, initialized with null
  const debounceTimeoutRef = useRef<any>(null);

  const debouncedSetSearch = useCallback((value: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300); // 300ms debounce delay
  }, []);

  // Function to load products (initial, search, or load more)
  const loadProducts = useCallback(async (
    isNewSearch: boolean = false, 
    searchTerm: string = searchQuery, 
    currentLastVisibleDoc: any = lastVisibleDoc
  ) => {
    setIsProductsLoading(true);
    try {
      // Fix: Ensured orderDirection is cast as constant for type safety
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

  // Effect for initial load and search term changes
  useEffect(() => {
    if (!firebaseContextLoading) {
      setPaginatedProducts([]); 
      setLastVisibleDoc(null);
      setHasMoreProducts(true);
      loadProducts(true, searchQuery, null);
    }
  }, [searchQuery, firebaseContextLoading, loadProducts]);


  const openAdjustmentModal = (product: Product) => {
    setCurrentProductToAdjust(product);
    setAdjustmentQuantity(0);
    setAdjustmentReason('');
    setAdjustmentModalOpen(true);
  };

  const handleSaveAdjustment = async () => {
    if (!currentProductToAdjust) return;
    if (adjustmentQuantity === 0) {
      alert('Por favor, ingresa una cantidad de ajuste (positiva o negativa).');
      return;
    }
    if (!adjustmentReason.trim()) {
      alert('Por favor, ingresa un motivo para el ajuste.');
      return;
    }

    setIsSavingAdjustment(true);
    try {
      const newStock = (currentProductToAdjust.stock || 0) + adjustmentQuantity;
      await updateProduct(currentProductToAdjust.id, { 
        stock: newStock,
        // Optionally, add a stock movement log entry to a separate collection
        // e.g., addStockMovement({ productId: currentProductToAdjust.id, quantity: adjustmentQuantity, reason: adjustmentReason, date: new Date() });
      });
      alert(`Stock de "${currentProductToAdjust.name}" ajustado a ${newStock} unidades.`);
      setAdjustmentModalOpen(false);
      setCurrentProductToAdjust(null);
      // Optimistically update the local paginatedProducts list
      setPaginatedProducts(prev => 
        prev.map(p => p.id === currentProductToAdjust.id ? { ...p, stock: newStock } : p)
      );
    } catch (error) {
      console.error('Error al guardar el ajuste de stock:', error);
      alert('Hubo un error al guardar el ajuste de stock. Intenta de nuevo.');
    } finally {
      setIsSavingAdjustment(false);
    }
  };

  const overallLoading = firebaseContextLoading || isProductsLoading;

  if (overallLoading && paginatedProducts.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin mb-4" />
      <p className="font-bold uppercase tracking-widest text-xs">Cargando productos para ajuste...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Ajuste Manual de Stock</h1>
          <p className="text-slate-500">Realiza correcciones de inventario de forma individual por producto.</p>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative flex-1 w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto por SKU, nombre o marca..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                debouncedSetSearch(e.target.value);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Producto / SKU</th>
                <th className="px-8 py-5 text-center">Stock Actual</th>
                <th className="px-8 py-5 text-center">Stock Mínimo</th>
                <th className="px-8 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{product.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.sku} • {product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`text-lg font-black ${product.stock < (product.reorderPoint || 0) ? 'text-red-600' : 'text-slate-900'}`}>{product.stock}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-sm font-medium text-slate-500">{product.reorderPoint || 0}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button
                      onClick={() => openAdjustmentModal(product)}
                      className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm border border-orange-100 flex items-center justify-center gap-2"
                      title="Ajustar Stock"
                    >
                      <Edit3 className="w-5 h-5" /> Ajustar
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedProducts.length === 0 && !isProductsLoading && (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                    No se encontraron productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {isProductsLoading && (
          <div className="p-10 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">Cargando más productos...</p>
          </div>
        )}

        {!isProductsLoading && hasMoreProducts && (
          <div className="p-6 border-t border-slate-100 flex justify-center">
            <button
              onClick={() => loadProducts(false, searchQuery, lastVisibleDoc)}
              className="px-8 py-3 bg-white border border-slate-200 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
            >
              Cargar Más
              <ArrowUpRight className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        )}
      </div>

      {adjustmentModalOpen && currentProductToAdjust && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-orange-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ajustar Stock</h2>
                  <p className="text-orange-600 text-sm font-medium">{currentProductToAdjust.name} ({currentProductToAdjust.sku})</p>
                </div>
              </div>
              <button onClick={() => setAdjustmentModalOpen(false)} className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Actual</span>
                <span className="text-3xl font-black text-slate-900">{currentProductToAdjust.stock}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad a Ajustar</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAdjustmentQuantity(prev => prev - 1)}
                    className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                  >
                    <MinusCircle className="w-6 h-6" />
                  </button>
                  <input
                    type="number"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
                    className="flex-1 px-5 py-4 border border-slate-200 rounded-2xl text-center text-3xl font-black focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <button
                    onClick={() => setAdjustmentQuantity(prev => prev + 1)}
                    className="p-3 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors"
                  >
                    <PlusCircle className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 italic text-center">Usa números negativos para reducir stock.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo del Ajuste</label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Ej: Rotura en depósito, Error de conteo, Robo, Devolución de cliente..."
                  className="w-full px-5 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm h-24 resize-none"
                />
              </div>

              <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-900">Importante:</p>
                  <p className="text-xs text-blue-700 mt-1">Este ajuste impactará el stock global del producto en todas las sucursales.</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button
                onClick={() => setAdjustmentModalOpen(false)}
                className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAdjustment}
                disabled={isSavingAdjustment}
                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingAdjustment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSavingAdjustment ? 'Guardando...' : 'Aplicar Ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAdjustment;
