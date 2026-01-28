
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
  
  // State for different sections of the form
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
    isFractionable: false, 
    saleUnitConversionFactor: 1,
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

  // Derived calculated fields for display
  const calcResults = React.useMemo(() => {
    let currentNet = costData.baseCost;
    costData.discounts.forEach(d => { if (d > 0) currentNet = currentNet * (1 - d / 100); });
    const priceWithoutIva = currentNet * (1 + costData.markup / 100);
    const finalSalePricePrimaryUnit = priceWithoutIva * (1 + costData.ivaRate / 100);
    
    const finalSalePriceSaleUnit = fractionedData.isFractionable && fractionedData.saleUnitConversionFactor
      ? finalSalePricePrimaryUnit * fractionedData.saleUnitConversionFactor
      : finalSalePricePrimaryUnit;

    return { 
      netCost: currentNet, 
      priceWithoutIva, 
      finalSalePricePrimaryUnit,
      finalSalePriceSaleUnit,
    };
  }, [costData, fractionedData]);

  const resetModalStates = () => {
    setActiveProduct(null);
    setGeneralFormData({ name: '', sku: '', category: '', brand: '', saleCurrency: 'ARS', supplierProductCode: '', imageUrl: '', primaryUnit: 'unidad', saleUnit: 'unidad' });
    setCostData({ baseCost: 0, ivaRate: 21, discounts: [0, 0, 0], markup: companyInfo?.defaultMarkup || 30, supplierId: '', purchaseCurrency: 'ARS' });
    setInventoryData({ stock: 0, minStock: 5, location: '', reorderPoint: 0, targetStock: 0, packQuantity: 1 });
    setFractionedData({ isFractionable: false, saleUnitConversionFactor: 1 });
    setEcommerceData({ isOnline: false, onlinePriceAdjustment: 0, mlSync: false });
    setActiveModalTab('general');
  };

  const openProductModal = (product: Product | null) => {
    setActiveProduct(product);
    if (product) {
      setGeneralFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        brand: product.brand,
        saleCurrency: product.saleCurrency || 'ARS',
        supplierProductCode: product.supplierProductCode || '',
        imageUrl: product.imageUrl || '',
        primaryUnit: product.primaryUnit || 'unidad',
        saleUnit: product.saleUnit || 'unidad',
      });
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
    setIsSaving(true);

    if (!generalFormData.name || !generalFormData.sku || !generalFormData.primaryUnit || !generalFormData.saleUnit) {
      alert("Por favor, complete los campos obligatorios: Nombre, SKU, Unidad Primaria y Unidad de Venta.");
      setIsSaving(false);
      return;
    }
    if (costData.baseCost <= 0) {
        alert("El costo base unitario debe ser mayor a 0.");
        setIsSaving(false);
        return;
    }
    if (fractionedData.isFractionable && (!fractionedData.saleUnitConversionFactor || fractionedData.saleUnitConversionFactor <= 0)) {
        alert("Si la venta es fraccionable, el factor de conversión debe ser mayor a 0.");
        setIsSaving(false);
        return;
    }

    // FIREBASE FIX: Ensure no 'undefined' values are passed. Use 'null' or fallback defaults.
    const dataToSave: any = {
      sku: generalFormData.sku || '',
      name: generalFormData.name || '',
      supplierId: costData.supplierId || null,
      costPrice: Number(costData.baseCost),
      salePrice: Number(calcResults.finalSalePricePrimaryUnit),
      stock: Number(inventoryData.stock),
      category: generalFormData.category || 'General',
      brand: generalFormData.brand || 'N/A',
      reorderPoint: Number(inventoryData.reorderPoint) || 0,
      targetStock: Number(inventoryData.targetStock) || 0,
      packQuantity: Number(inventoryData.packQuantity) || 1,
      purchaseCurrency: costData.purchaseCurrency || 'ARS',
      saleCurrency: generalFormData.saleCurrency || 'ARS',
      supplierProductCode: generalFormData.supplierProductCode || '',
      minStock: Number(inventoryData.minStock) || 0,
      location: inventoryData.location || '',
      imageUrl: generalFormData.imageUrl || '',
      primaryUnit: generalFormData.primaryUnit,
      saleUnit: generalFormData.saleUnit,
      isFractionable: Boolean(fractionedData.isFractionable),
      saleUnitConversionFactor: fractionedData.isFractionable ? Number(fractionedData.saleUnitConversionFactor) : null,
      isOnline: Boolean(ecommerceData.isOnline),
      onlinePriceAdjustment: ecommerceData.isOnline ? Number(ecommerceData.onlinePriceAdjustment) : null,
      mlSync: Boolean(ecommerceData.mlSync),
    };

    try {
      if (activeProduct) {
        await updateProduct(activeProduct.id, dataToSave);
      } else {
        await addProduct(dataToSave);
      }
      setShowModal(false);
      resetModalStates();
      loadProducts(true);
    } catch (e) {
      alert("Error al guardar en la base de datos. Verifique los campos.");
      console.error("Error saving product:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrderProduct = (product: Product) => {
    alert(`Producto "${product.name}" añadido a la lista de pedidos de reposición.`);
    // Here you could trigger a navigation to purchase-orders or add to a global draft order state
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inventario Real-Time</h1>
          <p className="text-slate-500">Gestión centralizada de stock.</p>
        </div>
        <button onClick={() => { openProductModal(null); }} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700">
          <Plus className="w-5 h-5" /> Nuevo Producto
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-5">Producto / SKU</th>
              <th className="px-8 py-5 text-center">Stock</th>
              <th className="px-8 py-5 text-right">Precio ({generalFormData.primaryUnit})</th>
              <th className="px-8 py-5 text-right">Precio ({generalFormData.saleUnit})</th>
              <th className="px-8 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedProducts.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <p className="font-bold text-slate-800 text-sm">{product.name}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase">{product.sku}</p>
                </td>
                <td className="px-8 py-6 text-center font-black">{product.stock} {product.primaryUnit}</td>
                <td className="px-8 py-6 text-right font-black">${product.salePrice?.toLocaleString()}</td>
                <td className="px-8 py-6 text-right font-black">
                    {product.isFractionable && product.saleUnitConversionFactor && product.salePrice
                     ? `$${(product.salePrice * product.saleUnitConversionFactor).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                     : 'N/A'
                    }
                </td>
                <td className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => handleOrderProduct(product)} 
                      className="p-2 text-slate-300 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                      title="Pedir Reposición"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openProductModal(product)} 
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteProduct(product.id)} 
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Borrar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isProductsLoading && <div className="p-10 text-center"><Loader2 className="animate-spin inline mr-2" /> Cargando...</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-5 flex justify-between items-center text-white">
              <h2 className="text-xl font-black uppercase">{activeProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex h-[600px]">
              <div className="w-1/4 bg-slate-50 border-r border-slate-100 p-6 space-y-2">
                {[
                  { id: 'general', label: 'General', icon: Package },
                  { id: 'costs', label: 'Costos y Precios', icon: DollarSign },
                  { id: 'inventory', label: 'Inventario Físico', icon: Warehouse },
                  { id: 'fractioned', label: 'Venta Fraccionada', icon: Scale },
                  { id: 'ecommerce', label: 'E-commerce', icon: Globe },
                ].map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveModalTab(tab.id as ModalTab)}
                    className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeModalTab === tab.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
                  >
                    <tab.icon className="w-4 h-4 inline-block mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="flex-1 p-10 overflow-y-auto space-y-8 custom-scrollbar">
                {activeModalTab === 'general' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-600" /> Datos Generales
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Producto <span className="text-red-500">*</span></label>
                        <input 
                          value={generalFormData.name || ''} 
                          onChange={e => setGeneralFormData({...generalFormData, name: e.target.value})}
                          placeholder="Ej: Martillo Stanley 20oz" 
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU / Código Interno <span className="text-red-500">*</span></label>
                        <input 
                          value={generalFormData.sku || ''} 
                          onChange={e => setGeneralFormData({...generalFormData, sku: e.target.value})}
                          placeholder="Ej: MST-20Z" 
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidad Primaria (Stock) <span className="text-red-500">*</span></label>
                        <select 
                          value={generalFormData.primaryUnit || 'unidad'} 
                          onChange={e => setGeneralFormData({...generalFormData, primaryUnit: e.target.value as any})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white"
                        >
                          <option value="unidad">Unidad</option>
                          <option value="m2">m2</option>
                          <option value="kg">kg</option>
                          <option value="litro">Litro</option>
                          <option value="pie">Pie</option>
                          <option value="cm">cm</option>
                          <option value="metro_lineal">Metro Lineal</option>
                          <option value="tabla">Tabla</option>
                          <option value="caja">Caja</option>
                          <option value="barra">Barra</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidad de Venta <span className="text-red-500">*</span></label>
                        <select 
                          value={generalFormData.saleUnit || 'unidad'} 
                          onChange={e => setGeneralFormData({...generalFormData, saleUnit: e.target.value as any})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white"
                        >
                          <option value="unidad">Unidad</option>
                          <option value="m2">m2</option>
                          <option value="kg">kg</option>
                          <option value="litro">Litro</option>
                          <option value="tabla">Tabla</option>
                          <option value="caja">Caja</option>
                          <option value="barra">Barra</option>
                          <option value="metro_lineal">Metro Lineal</option>
                          <option value="pie">Pie</option>
                          <option value="cm">cm</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría / Rubro</label>
                        <input 
                          value={generalFormData.category || ''} 
                          onChange={e => setGeneralFormData({...generalFormData, category: e.target.value})}
                          placeholder="Ej: Herramientas Manuales" 
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
                        <input 
                          value={generalFormData.brand || ''} 
                          onChange={e => setGeneralFormData({...generalFormData, brand: e.target.value})}
                          placeholder="Ej: Stanley" 
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cód. Proveedor</label>
                        <input 
                          value={generalFormData.supplierProductCode || ''} 
                          onChange={e => setGeneralFormData({...generalFormData, supplierProductCode: e.target.value})}
                          placeholder="Ej: ST201-M" 
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Moneda de Venta</label>
                        <select 
                          value={generalFormData.saleCurrency || 'ARS'} 
                          onChange={e => setGeneralFormData({...generalFormData, saleCurrency: e.target.value})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white"
                        >
                          <option value="ARS">ARS - Pesos Argentinos</option>
                          <option value="USD">USD - Dólares Estadounidenses</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest ml-1 flex items-center gap-2">
                         <ImageIcon className="w-4 h-4 text-orange-600" /> Imagen del Producto
                      </h4>
                      <div className="flex items-center gap-6">
                        <div className="relative w-32 h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                          {generalFormData.imageUrl ? (
                            <img src={generalFormData.imageUrl} alt="Producto" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" /> Subir Imagen
                          </button>
                          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Costs & Prices Tab */}
                {activeModalTab === 'costs' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" /> Estructura de Costos y Precios
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Costo Base Unitario ($) <span className="text-red-500">*</span></label>
                        <input 
                          type="number" 
                          value={costData.baseCost || ''} 
                          onChange={e => setCostData({...costData, baseCost: Number(e.target.value)})}
                          placeholder="0.00" 
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-green-600" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IVA (%)</label>
                        <input 
                          type="number" 
                          value={costData.ivaRate || ''} 
                          onChange={e => setCostData({...costData, ivaRate: Number(e.target.value)})}
                          placeholder="21" 
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800" 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ganancia (Markup %)</label>
                        <input 
                          type="number" 
                          value={costData.markup || ''} 
                          onChange={e => setCostData({...costData, markup: Number(e.target.value)})}
                          placeholder="30" 
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-orange-600" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proveedor Principal</label>
                        <select 
                          value={costData.supplierId || ''} 
                          onChange={e => setCostData({...costData, supplierId: e.target.value})}
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white"
                        >
                          <option value="">Ninguno</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex justify-between items-center relative overflow-hidden shadow-xl">
                      <div className="relative z-10 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio Final Sugerido</p>
                        <p className="text-4xl font-black text-orange-500">${calcResults.finalSalePricePrimaryUnit.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <DollarSign className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
                    </div>
                  </div>
                )}

                {/* Inventory Tab */}
                {activeModalTab === 'inventory' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-blue-600" /> Detalles de Inventario
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Actual</label>
                        <input 
                          type="number" 
                          value={inventoryData.stock || ''} 
                          onChange={e => setInventoryData({...inventoryData, stock: Number(e.target.value)})}
                          placeholder="0" 
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mínimo de Alerta</label>
                        <input 
                          type="number" 
                          value={inventoryData.minStock || ''} 
                          onChange={e => setInventoryData({...inventoryData, minStock: Number(e.target.value)})}
                          placeholder="5" 
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubicación</label>
                        <input 
                          value={inventoryData.location || ''} 
                          onChange={e => setInventoryData({...inventoryData, location: e.target.value})}
                          placeholder="Ej: A-05" 
                          className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Fractioned Tab */}
                {activeModalTab === 'fractioned' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-600" /> Venta Fraccionada
                    </h3>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={fractionedData.isFractionable || false}
                          onChange={(e) => setFractionedData({...fractionedData, isFractionable: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                      <div className="flex-1">
                        <p className="text-sm font-black text-slate-800 uppercase">Habilitar Fraccionado</p>
                        <p className="text-xs text-slate-500 mt-1">Permite vender en una unidad distinta al stock.</p>
                      </div>
                    </div>

                    {fractionedData.isFractionable && (
                      <div className="pt-6 border-t border-slate-100 animate-in fade-in">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Factor de Conversión (1 {generalFormData.saleUnit} = ? {generalFormData.primaryUnit})</label>
                        <input 
                          type="number" 
                          value={fractionedData.saleUnitConversionFactor || ''} 
                          onChange={e => setFractionedData({...fractionedData, saleUnitConversionFactor: Number(e.target.value)})}
                          placeholder="1.00" 
                          className="w-full mt-2 px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold" 
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* E-commerce Tab */}
                {activeModalTab === 'ecommerce' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Globe className="w-4 h-4 text-yellow-600" /> E-Commerce
                    </h3>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={ecommerceData.isOnline || false}
                          onChange={(e) => setEcommerceData({...ecommerceData, isOnline: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                      <div className="flex-1">
                        <p className="text-sm font-black text-slate-800 uppercase">Publicar Online</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-4 bg-slate-50">
              <button onClick={() => setShowModal(false)} className="px-8 py-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
              <button 
                onClick={handleSave} 
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
