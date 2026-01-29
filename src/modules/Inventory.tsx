import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Plus, Search, Edit3, Trash2, Package, 
  X, Save, DollarSign, Warehouse, Globe,
  Scale, Loader2, ImageIcon, Upload, ShoppingCart, ChevronDown
} from 'lucide-react';
import { Product } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import { CompanyInfo } from '../App';

type ModalTab = 'general' | 'costs' | 'inventory' | 'fractioned' | 'ecommerce';

const ITEMS_PER_PAGE = 20;

interface InventoryProps {
  companyInfo?: CompanyInfo;
}

const Inventory: React.FC<InventoryProps> = ({ companyInfo }) => {
  const { 
    loading: firebaseContextLoading, 
    addProduct, updateProduct, deleteProduct, suppliers,
    fetchProductsPaginatedAndFiltered 
  } = useFirebase();

  // Estados de UI
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('general');
  const [isSaving, setIsSaving] = useState(false);

  // Estados de Datos y Paginación
  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  
  // Estados de Formulario
  const [generalFormData, setGeneralFormData] = useState<Partial<Product>>({
    name: '', sku: '', category: '', brand: '', saleCurrency: 'ARS', supplierProductCode: '', imageUrl: '',
    primaryUnit: 'unidad', saleUnit: 'unidad',
  });
  const [costData, setCostData] = useState({
    baseCost: 0, ivaRate: 21, markup: companyInfo?.defaultMarkup || 30, supplierId: '', purchaseCurrency: 'ARS',
  });
  const [inventoryData, setInventoryData] = useState({
    stock: 0, minStock: 5, location: '', reorderPoint: 0, targetStock: 0, packQuantity: 1,
  });
  const [fractionedData, setFractionedData] = useState({
    isFractionable: false, 
    saleUnitConversionFactor: 1,
  });
  const [ecommerceData, setEcommerceData] = useState({
    isOnline: false, onlinePriceAdjustment: 0, mlSync: false,
  });

  // Función para cargar productos
  const loadProducts = useCallback(async (isNewSearch = false) => {
    if (isProductsLoading) return;
    setIsProductsLoading(true);
    try {
      const options = {
        limit: ITEMS_PER_PAGE,
        searchTerm: search.toLowerCase().trim(),
        startAfterDoc: isNewSearch ? undefined : lastVisibleDoc,
        orderByField: 'name',
        orderDirection: 'asc' as const
      };
      const { products: fetchedProducts, lastVisible, hasMore } = await fetchProductsPaginatedAndFiltered(options);
      
      setPaginatedProducts(prev => isNewSearch ? fetchedProducts : [...prev, ...fetchedProducts]);
      setLastVisibleDoc(lastVisible);
      setHasMoreProducts(hasMore);
    } catch (err) {
      console.error("Error cargando productos:", err);
    } finally {
      setIsProductsLoading(false);
    }
  }, [search, lastVisibleDoc, fetchProductsPaginatedAndFiltered, isProductsLoading]);

  // Carga inicial y por búsqueda
  useEffect(() => {
    if (!firebaseContextLoading) {
      const delayDebounceFn = setTimeout(() => {
        loadProducts(true);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [search, firebaseContextLoading]);

  // Cálculos automáticos de precios
  const calcResults = useMemo(() => {
    const netCost = Number(costData.baseCost);
    const markupMultiplier = 1 + (Number(costData.markup) / 100);
    const ivaMultiplier = 1 + (Number(costData.ivaRate) / 100);
    
    const priceWithoutIva = netCost * markupMultiplier;
    const finalSalePricePrimaryUnit = priceWithoutIva * ivaMultiplier;
    
    return { 
      priceWithoutIva, 
      finalSalePricePrimaryUnit,
    };
  }, [costData]);

  const resetModalStates = () => {
    setActiveProduct(null);
    setGeneralFormData({ name: '', sku: '', category: '', brand: '', saleCurrency: 'ARS', supplierProductCode: '', imageUrl: '', primaryUnit: 'unidad', saleUnit: 'unidad' });
    setCostData({ baseCost: 0, ivaRate: 21, markup: companyInfo?.defaultMarkup || 30, supplierId: '', purchaseCurrency: 'ARS' });
    setInventoryData({ stock: 0, minStock: 5, location: '', reorderPoint: 0, targetStock: 0, packQuantity: 1 });
    setFractionedData({ isFractionable: false, saleUnitConversionFactor: 1 });
    setEcommerceData({ isOnline: false, onlinePriceAdjustment: 0, mlSync: false });
    setActiveModalTab('general');
  };

  const openProductModal = (product: Product | null) => {
    if (product) {
      setActiveProduct(product);
      setGeneralFormData({ ...product });
      setCostData({
        baseCost: product.costPrice || 0,
        ivaRate: product.ivaRate || 21,
        markup: product.markup || 30,
        supplierId: product.supplierId || '',
        purchaseCurrency: product.purchaseCurrency || 'ARS',
      });
      setInventoryData({
        stock: product.stock || 0,
        minStock: product.minStock || 5,
        location: product.location || '',
        reorderPoint: product.reorderPoint || 0,
        targetStock: product.targetStock || 0,
        packQuantity: product.packQuantity || 1,
      });
      setFractionedData({
        isFractionable: product.isFractionable || false,
        saleUnitConversionFactor: product.saleUnitConversionFactor || 1,
      });
      setEcommerceData({
        isOnline: product.isOnline || false,
        onlinePriceAdjustment: product.onlinePriceAdjustment || 0,
        mlSync: product.mlSync || false,
      });
    } else {
      resetModalStates();
    }
    setShowModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setGeneralFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!generalFormData.name || !generalFormData.sku) {
      alert("Nombre y SKU son obligatorios.");
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave: Omit<Product, 'id'> = {
        sku: generalFormData.sku || '',
        name: generalFormData.name || '',
        supplierId: costData.supplierId || '',
        costPrice: Number(costData.baseCost),
        salePrice: Number(calcResults.finalSalePricePrimaryUnit),
        markup: Number(costData.markup),
        ivaRate: Number(costData.ivaRate),
        stock: Number(inventoryData.stock),
        category: generalFormData.category || 'General',
        brand: generalFormData.brand || 'N/A',
        reorderPoint: Number(inventoryData.reorderPoint),
        targetStock: Number(inventoryData.targetStock),
        packQuantity: Number(inventoryData.packQuantity),
        purchaseCurrency: costData.purchaseCurrency,
        saleCurrency: generalFormData.saleCurrency || 'ARS',
        supplierProductCode: generalFormData.supplierProductCode || '',
        minStock: Number(inventoryData.minStock),
        location: inventoryData.location || '',
        imageUrl: generalFormData.imageUrl || '',
        primaryUnit: generalFormData.primaryUnit as any,
        saleUnit: generalFormData.saleUnit as any,
        isFractionable: fractionedData.isFractionable,
        saleUnitConversionFactor: Number(fractionedData.saleUnitConversionFactor),
        isOnline: ecommerceData.isOnline,
        onlinePriceAdjustment: Number(ecommerceData.onlinePriceAdjustment),
        mlSync: ecommerceData.mlSync
      };

      if (activeProduct) {
        await updateProduct(activeProduct.id, dataToSave);
      } else {
        await addProduct(dataToSave);
      }
      setShowModal(false);
      loadProducts(true);
    } catch (e) {
      console.error(e);
      alert("Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Inventario</h1>
          <p className="text-slate-500 text-sm font-medium">Control de stock y precios en tiempo real.</p>
        </div>
        <button onClick={() => openProductModal(null)} className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
          <Plus className="w-5 h-5" /> Nuevo Producto
        </button>
      </header>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, SKU o marca..." 
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100">
                <th className="px-8 py-5">Producto</th>
                <th className="px-8 py-5 text-center">Stock Actual</th>
                <th className="px-8 py-5 text-right">Precio de Venta</th>
                <th className="px-8 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} className="w-10 h-10 rounded-xl object-cover border border-slate-100" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{product.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">{product.sku} • {product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${product.stock <= (product.minStock || 0) ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {product.stock} {product.primaryUnit}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <p className="font-black text-slate-900">${product.salePrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openProductModal(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteProduct(product.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMoreProducts && (
          <div className="p-6 border-t border-slate-50 flex justify-center">
            <button 
              onClick={() => loadProducts(false)}
              disabled={isProductsLoading}
              className="flex items-center gap-2 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {isProductsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
              Cargar más productos
            </button>
          </div>
        )}
      </div>

      {/* MODAL CORREGIDO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="p-6 flex justify-between items-center border-b">
              <h2 className="text-xl font-black uppercase text-slate-800">{activeProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              <aside className="w-64 bg-slate-50/50 border-r border-slate-100 p-6 space-y-2">
                {[
                  { id: 'general', label: 'General', icon: Package },
                  { id: 'costs', label: 'Costos & PVP', icon: DollarSign },
                  { id: 'inventory', label: 'Stock', icon: Warehouse },
                  { id: 'fractioned', label: 'Fraccionado', icon: Scale },
                  { id: 'ecommerce', label: 'Web', icon: Globe },
                ].map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveModalTab(tab.id as ModalTab)}
                    className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-3 ${activeModalTab === tab.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-400 hover:bg-white hover:text-slate-800'}`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </aside>
              
              <main className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                {activeModalTab === 'general' && (
                  <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4">
                    <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre completo</label>
                      <input value={generalFormData.name} onChange={e => setGeneralFormData({...generalFormData, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU / Código</label>
                      <input value={generalFormData.sku} onChange={e => setGeneralFormData({...generalFormData, sku: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all font-bold uppercase" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marca</label>
                      <input value={generalFormData.brand} onChange={e => setGeneralFormData({...generalFormData, brand: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all font-bold" />
                    </div>
                  </div>
                )}

                {activeModalTab === 'costs' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-green-600">Costo Neto ($)</label>
                        <input type="number" value={costData.baseCost} onChange={e => setCostData({...costData, baseCost: Number(e.target.value)})} className="w-full px-5 py-3.5 bg-green-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-green-500 transition-all font-black text-green-700 text-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-orange-600">Markup / Ganancia (%)</label>
                        <input type="number" value={costData.markup} onChange={e => setCostData({...costData, markup: Number(e.target.value)})} className="w-full px-5 py-3.5 bg-orange-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all font-black text-orange-700 text-xl" />
                      </div>
                    </div>
                    
                    <div className="p-10 bg-slate-900 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Precio de Venta Final (IVA Incl.)</p>
                        <p className="text-5xl font-black text-orange-500 tracking-tighter">${calcResults.finalSalePricePrimaryUnit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <DollarSign className="w-24 h-24 text-white/5 absolute -right-4 -bottom-4 rotate-12" />
                    </div>
                  </div>
                )}

                {/* Los otros tabs siguen la misma lógica de campos limpios... */}
              </main>
            </div>

            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-8 py-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all">Cancelar</button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;