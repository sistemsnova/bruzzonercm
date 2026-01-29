import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, Search, Edit3, Trash2, Package, AlertTriangle,
  ArrowUpRight, Tag, Boxes, X, 
  Info, Save, DollarSign, Warehouse, Globe,
  Camera, Scale, Loader2, ListOrdered, Percent,
  ImageIcon, Upload, MoreHorizontal, LayoutGrid, Zap,
  ShoppingCart
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

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('general');
  const [isSaving, setIsSaving] = useState(false);

  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  
  // Estados del formulario
  const [generalFormData, setGeneralFormData] = useState<Partial<Product>>({
    name: '', sku: '', category: '', brand: '', saleCurrency: 'ARS', supplierProductCode: '', imageUrl: '',
    primaryUnit: 'unidad', saleUnit: 'unidad',
  });
  const [costData, setCostData] = useState({
    baseCost: 0, ivaRate: 21, discounts: [0, 0, 0], markup: companyInfo?.defaultMarkup || 30, supplierId: '', purchaseCurrency: 'ARS',
  });
  const [inventoryData, setInventoryData] = useState({
    stock: 0, minStock: 5, location: '', reorderPoint: 0, targetStock: 0, packQuantity: 1,
  });
  const [fractionedData, setFractionedData] = useState({
    isFractionable: false, saleUnitConversionFactor: 1,
  });
  const [ecommerceData, setEcommerceData] = useState({
    isOnline: false, onlinePriceAdjustment: 0, mlSync: false,
  });

  const loadProducts = useCallback(async (isNewSearch = false, searchTerm = search, currentLastVisibleDoc = lastVisibleDoc) => {
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
  }, [search, lastVisibleDoc, fetchProductsPaginatedAndFiltered]);

  useEffect(() => {
    if (!firebaseContextLoading) {
      loadProducts(true, search, null);
    }
  }, [search, firebaseContextLoading, loadProducts]);

  const calcResults = React.useMemo(() => {
    let currentNet = costData.baseCost;
    costData.discounts.forEach(d => { if (d > 0) currentNet = currentNet * (1 - d / 100); });
    const priceWithoutIva = currentNet * (1 + costData.markup / 100);
    const finalSalePricePrimaryUnit = priceWithoutIva * (1 + costData.ivaRate / 100);
    return { netCost: currentNet, priceWithoutIva, finalSalePricePrimaryUnit };
  }, [costData]);

  const openProductModal = (product: Product | null) => {
    setActiveProduct(product);
    if (product) {
      setGeneralFormData({ ...product });
      setCostData({
        baseCost: product.costPrice || 0,
        ivaRate: 21,
        discounts: [],
        markup: (product.salePrice && product.costPrice) ? ((product.salePrice / (product.costPrice * 1.21) - 1) * 100) : (companyInfo?.defaultMarkup || 30),
        supplierId: product.supplierId || '',
        purchaseCurrency: product.purchaseCurrency || 'ARS',
      });
      setInventoryData({
        stock: product.stock,
        minStock: product.minStock || 5,
        location: product.location || '',
        reorderPoint: product.reorderPoint || 0,
        targetStock: product.targetStock || 0,
        packQuantity: product.packQuantity || 1,
      });
      setFractionedData({ isFractionable: product.isFractionable || false, saleUnitConversionFactor: product.saleUnitConversionFactor || 1 });
    } else {
      setActiveModalTab('general');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const dataToSave = {
      ...generalFormData,
      costPrice: Number(costData.baseCost),
      salePrice: Number(calcResults.finalSalePricePrimaryUnit),
      stock: Number(inventoryData.stock),
      isFractionable: Boolean(fractionedData.isFractionable),
      saleUnitConversionFactor: fractionedData.isFractionable ? Number(fractionedData.saleUnitConversionFactor) : null,
    };

    try {
      if (activeProduct) await updateProduct(activeProduct.id, dataToSave);
      else await addProduct(dataToSave);
      setShowModal(false);
      loadProducts(true);
    } catch (e) {
      alert("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 italic">Inventario Maestro</h1>
          <p className="text-slate-500 text-sm">Control total de stock y precios.</p>
        </div>
        <button onClick={() => openProductModal(null)} className="bg-orange-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-orange-700">
          <Plus className="w-5 h-5" /> Nuevo Producto
        </button>
      </header>

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" placeholder="Buscar por nombre o SKU..." 
              className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-5">Producto</th>
              <th className="px-8 py-5 text-center">Stock</th>
              <th className="px-8 py-5 text-right">Precio Unitario</th>
              <th className="px-8 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedProducts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6"><p className="font-bold text-sm">{p.name}</p><p className="text-[10px] text-slate-400 font-mono">{p.sku}</p></td>
                <td className="px-8 py-6 text-center font-black">{p.stock} {p.primaryUnit}</td>
                <td className="px-8 py-6 text-right font-black text-orange-600">${p.salePrice?.toLocaleString()}</td>
                <td className="px-8 py-6 text-center space-x-2">
                  <button onClick={() => openProductModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isProductsLoading && <div className="p-10 text-center text-slate-400"><Loader2 className="animate-spin inline mr-2" /> Cargando catálogo...</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[80vh]">
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-black uppercase italic">{activeProduct ? 'Ficha de Producto' : 'Carga de Producto'}</h2>
              <button onClick={() => setShowModal(false)}><X /></button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/4 bg-slate-50 border-r p-6 space-y-2">
                <button onClick={() => setActiveModalTab('general')} className={`w-full text-left p-3 rounded-xl text-xs font-bold uppercase ${activeModalTab === 'general' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}><Package className="w-4 h-4 inline mr-2"/> General</button>
                <button onClick={() => setActiveModalTab('costs')} className={`w-full text-left p-3 rounded-xl text-xs font-bold uppercase ${activeModalTab === 'costs' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}><DollarSign className="w-4 h-4 inline mr-2"/> Costos</button>
              </div>
              
              <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-white">
                {activeModalTab === 'general' && (
                  <div className="space-y-6">
                    <input value={generalFormData.name} onChange={e => setGeneralFormData({...generalFormData, name: e.target.value})} placeholder="Nombre del producto" className="w-full p-4 border rounded-2xl font-bold text-lg" />
                    <input value={generalFormData.sku} onChange={e => setGeneralFormData({...generalFormData, sku: e.target.value})} placeholder="SKU / Código" className="w-full p-4 border rounded-2xl font-bold" />
                    <div className="grid grid-cols-2 gap-4">
                      <select value={generalFormData.primaryUnit} onChange={e => setGeneralFormData({...generalFormData, primaryUnit: e.target.value as any})} className="p-4 border rounded-2xl bg-white font-bold"><option value="unidad">Unidad</option><option value="kg">kg</option><option value="litro">Litro</option></select>
                      <input value={generalFormData.brand} onChange={e => setGeneralFormData({...generalFormData, brand: e.target.value})} placeholder="Marca" className="p-4 border rounded-2xl font-bold" />
                    </div>
                  </div>
                )}

                {activeModalTab === 'costs' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[10px] font-bold text-slate-400 uppercase">Costo Base $</label><input type="number" value={costData.baseCost} onChange={e => setCostData({...costData, baseCost: Number(e.target.value)})} className="w-full p-4 border rounded-2xl font-black text-green-600" /></div>
                      <div><label className="text-[10px] font-bold text-slate-400 uppercase">Markup %</label><input type="number" value={costData.markup} onChange={e => setCostData({...costData, markup: Number(e.target.value)})} className="w-full p-4 border rounded-2xl font-black text-orange-600" /></div>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-3xl text-white flex justify-between items-center">
                       <div><p className="text-xs font-bold text-slate-400 uppercase">Precio de Venta Sugerido</p><h4 className="text-4xl font-black text-orange-500">${calcResults.finalSalePricePrimaryUnit.toLocaleString()}</h4></div>
                       <DollarSign className="w-12 h-12 opacity-20" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-white border rounded-xl font-bold text-slate-400">CANCELAR</button>
              <button onClick={handleSave} disabled={isSaving} className="px-10 py-3 bg-slate-900 text-white rounded-xl font-black uppercase shadow-lg flex items-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" /> : <Save />} {activeProduct ? 'ACTUALIZAR' : 'GUARDAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;