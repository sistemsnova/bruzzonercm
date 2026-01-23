
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { 
  Search, Plus, Trash2, ShoppingCart, 
  CreditCard, Wallet, Landmark, FileText, 
  CheckCircle2, X, ChevronRight,
  PackagePlus, Receipt, Tag, Scale,
  AlertCircle, Loader2, Save, FileSignature,
  ClipboardList, MessageSquareText, PlusCircle,
  Banknote, CalendarDays, Building,
  DollarSign, User, UserPlus,
  Users as UsersIcon
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { Product, Client, PaymentDetail, SaleItem, Sale } from '../types'; // Import Sale and SaleItem

interface CartItem { // This is an internal UI type, not directly stored as SaleItem
  id: string; // Product ID
  sku: string;
  name: string;
  brand: string;
  price: number; // Price per SELECTED unit
  quantity: number; // Quantity in SELECTED unit
  stockBeforeSale: number; 
  isManual?: boolean;
  primaryUnit: Product['primaryUnit']; // Keep track of primary unit for stock deduction
  selectedSaleUnit: Product['saleUnit']; // The unit the user selected to sell in
  saleUnitConversionFactor?: number; // The factor for this specific product
}

type SaleDocType = 'ticket' | 'factura_a' | 'factura_b' | 'remito' | 'presupuesto';

const Sales: React.FC = () => {
  const { 
    addSale,
    addOrder,
    fetchProductsPaginatedAndFiltered,
    clients,
    updateProduct // Necesitamos updateProduct para deducir stock
  } = useFirebase();

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showManualItemModal, setShowManualItemModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para el ítem manual
  const [manualItem, setManualItem] = useState({ name: '', price: 0, quantity: 1 });

  // Estados de Clientes (Movidos a nivel principal)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientResults, setShowClientResults] = useState(false);

  // Estados del Checkout
  const [docType, setDocType] = useState<SaleDocType>('ticket');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [newPaymentDetail, setNewPaymentDetail] = useState<Omit<PaymentDetail, 'id'>>({
    method: 'efectivo', amount: 0, notes: '', bank: '', checkNumber: '', dueDate: ''
  });
  
  const [searchableProducts, setSearchableProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Estado para la selección de unidad en el buscador
  const [selectedProductForUnit, setSelectedProductForUnit] = useState<Product | null>(null);
  const [tempSaleUnit, setTempSaleUnit] = useState<Product['saleUnit'] | 'primary'>('primary'); // 'primary' or actual sale unit

  const debounceTimeoutRef = useRef<any>(null);

  const debouncedSearchProducts = useCallback((value: string) => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(async () => {
      if (value.length < 2) {
        setSearchableProducts([]);
        return;
      }
      setIsSearching(true);
      try {
        const { products } = await fetchProductsPaginatedAndFiltered({
          limit: 8,
          searchTerm: value.toLowerCase().trim(),
          orderByField: 'name',
          orderDirection: 'asc'
        });
        setSearchableProducts(products);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [fetchProductsPaginatedAndFiltered]);

  const handleProductSelectionInSearch = (product: Product) => {
    if (product.isFractionable && product.saleUnitConversionFactor && product.saleUnit !== product.primaryUnit) {
        // Show unit selection UI
        setSelectedProductForUnit(product);
        setTempSaleUnit('primary'); // Default to primary unit for selection
    } else {
        // Add directly if not fractionable or units are the same
        addToCart(product, product.primaryUnit);
        setSelectedProductForUnit(null); // Clear selection UI
    }
  };

  const handleConfirmUnitSelection = () => {
    if (selectedProductForUnit && tempSaleUnit) {
        let unitToAddToCart: Product['saleUnit'] = selectedProductForUnit.primaryUnit; // Default to primary for deduction clarity
        if (tempSaleUnit !== 'primary') {
            unitToAddToCart = selectedProductForUnit.saleUnit;
        }
        addToCart(selectedProductForUnit, unitToAddToCart);
        setSelectedProductForUnit(null); // Clear modal/selection UI
        setTempSaleUnit('primary'); // Reset temp unit
    }
  };

  const addToCart = (product: Product, unitToSell: Product['saleUnit']) => {
    let pricePerSelectedUnit = product.salePrice; // Default to primary unit price
    let conversionFactor = 1; // Default no conversion

    if (unitToSell === product.saleUnit && product.isFractionable && product.saleUnitConversionFactor) {
        pricePerSelectedUnit = product.salePrice * product.saleUnitConversionFactor;
        conversionFactor = product.saleUnitConversionFactor;
    }

    const existingIndex = cart.findIndex(item => item.id === product.id && item.selectedSaleUnit === unitToSell);
    if (existingIndex !== -1) {
      setCart(cart.map((item, idx) => idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { 
        id: product.id, 
        sku: product.sku, 
        name: product.name, 
        brand: product.brand,
        price: parseFloat(pricePerSelectedUnit.toFixed(2)), // Store calculated price
        quantity: 1, 
        stockBeforeSale: product.stock,
        primaryUnit: product.primaryUnit, // Store primary unit
        selectedSaleUnit: unitToSell, // Store selected sale unit
        saleUnitConversionFactor: conversionFactor, // Store factor for deduction
      }]);
    }
    setSearch('');
    setSearchableProducts([]);
    setSelectedProductForUnit(null); // Clear any unit selection UI
  };

  const addManualItemToCart = () => {
    if (!manualItem.name || manualItem.price <= 0) return;
    const newItem: CartItem = {
      id: `manual-${Date.now()}`,
      sku: 'MANUAL',
      name: manualItem.name,
      brand: 'Venta Libre',
      price: manualItem.price,
      quantity: manualItem.quantity,
      stockBeforeSale: 9999,
      isManual: true,
      primaryUnit: 'unidad', // Default for manual items
      selectedSaleUnit: 'unidad', // Default for manual items
      saleUnitConversionFactor: 1,
    };
    setCart([...cart, newItem]);
    setShowManualItemModal(false);
    setManualItem({ name: '', price: 0, quantity: 1 });
  };

  const totalCartAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const sumOfPayments = paymentDetails.reduce((sum, d) => sum + d.amount, 0);
  const remainingToPay = totalCartAmount - sumOfPayments;

  const filteredClients = useMemo(() => {
    if (!clientSearch) return [];
    return clients.filter(c => 
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
      c.cuit.includes(clientSearch) ||
      c.email?.toLowerCase().includes(clientSearch.toLowerCase())
    ).slice(0, 5);
  }, [clients, clientSearch]);

  const handleAddPayment = () => {
    if (newPaymentDetail.amount <= 0) return;
    
    if ((newPaymentDetail.method === 'cheque' || newPaymentDetail.method === 'echeq') && 
        (!newPaymentDetail.bank || !newPaymentDetail.checkNumber || !newPaymentDetail.dueDate)) {
      alert('Por favor, completa los datos del cheque (Banco, Número y Vencimiento).');
      return;
    }

    setPaymentDetails([...paymentDetails, { ...newPaymentDetail, id: Date.now().toString() }]);
    setNewPaymentDetail({ method: 'efectivo', amount: 0, notes: '', bank: '', checkNumber: '', dueDate: '' });
  };

  const handleFinishSale = async () => {
    if (docType !== 'presupuesto' && Math.abs(remainingToPay) > 0.01) {
      alert(`Falta cubrir $${remainingToPay.toLocaleString()} del total.`);
      return;
    }

    setIsProcessing(true);
    try {
      const saleItems: SaleItem[] = [];
      const productUpdates: Promise<void>[] = [];

      for (const item of cart) {
        saleItems.push({
          id: item.id,
          sku: item.sku,
          name: item.name,
          brand: item.brand,
          price: item.price,
          quantity: item.quantity,
          subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
          isManual: item.isManual,
          selectedSaleUnit: item.selectedSaleUnit,
        });

        // Deduct stock if it's not a manual item and not a quote
        if (!item.isManual && docType !== 'presupuesto') {
          // Convert sold quantity back to primary unit for stock deduction
          const quantityToDeductInPrimaryUnit = item.quantity * item.saleUnitConversionFactor!;
          
          productUpdates.push(updateProduct(item.id, { 
            stock: item.stockBeforeSale - quantityToDeductInPrimaryUnit 
          }));
        }
      }

      // Wait for all product stock updates to complete
      await Promise.all(productUpdates);

      const saleData: Omit<Sale, 'id'> = {
        clientName: selectedClient?.name || 'Mostrador',
        clientId: selectedClient?.id || null,
        items: saleItems,
        total: totalCartAmount,
        paymentDetails,
        docType,
        date: new Date().toISOString(),
        status: docType === 'presupuesto' ? 'pendiente' : 'completado',
        seller: 'Vendedor Demo', // Placeholder for actual user's name
        remitoIds: [], 
      };

      if (docType === 'presupuesto') {
        await addOrder({
          clientId: selectedClient?.id || 'mostrador',
          clientName: selectedClient?.name || 'Mostrador',
          items: cart.map(i => ({ 
            productId: i.id, 
            sku: i.sku, 
            name: i.name, 
            brand: i.brand, 
            quantity: i.quantity, 
            unitPrice: i.price, 
            subtotal: i.price * i.quantity, 
            originalProduct: null,
            selectedSaleUnit: i.selectedSaleUnit // Keep selected unit in order item
          })),
          total: totalCartAmount,
          status: 'pendiente_preparacion',
          dateCreated: new Date().toISOString()
        });
        alert("Presupuesto guardado con éxito.");
      } else {
        await addSale(saleData); 
        alert(`Operación "${docType.toUpperCase()}" finalizada con éxito.`);
      }

      setCart([]);
      setShowCheckout(false);
      setPaymentDetails([]);
      setSelectedClient(null);
      setClientSearch('');
    } catch (e) {
      console.error(e);
      alert("Error al procesar la operación.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Terminal de Ventas</h1>
          <p className="text-slate-500">Punto de venta integrado con stock y AFIP.</p>
        </div>
        <button 
          onClick={() => setShowManualItemModal(true)}
          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2 border border-slate-200"
        >
          <PlusCircle className="w-4 h-4" /> Venta Libre
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Lado Izquierdo: Buscador y Productos */}
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input 
                type="text" 
                placeholder="Busca por nombre, SKU o escanea código..." 
                className="w-full pl-12 pr-4 py-5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-xl font-medium"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  debouncedSearchProducts(e.target.value);
                }}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {isSearching && (
                <div className="col-span-2 py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" /></div>
              )}
              {searchableProducts.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => handleProductSelectionInSearch(p)}
                  className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:border-orange-300 hover:bg-orange-50/30 transition-all cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                    <PackagePlus className="w-6 h-6 text-slate-300 group-hover:text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{p.sku} • Stock: <span className={p.stock < (p.reorderPoint || 0) ? 'text-red-500' : 'text-green-600'}>{p.stock} {p.primaryUnit}</span></p>
                  </div>
                  <p className="text-lg font-black text-slate-900">${p.salePrice.toLocaleString()} / {p.primaryUnit}</p>
                </div>
              ))}
              {!isSearching && search.length > 2 && searchableProducts.length === 0 && (
                <div className="col-span-2 py-10 text-center text-slate-400 font-medium italic">No se encontraron productos.</div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Carrito y Buscador de Clientes */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden">
          {/* SECCIÓN CLIENTE (Nueva ubicación prominente) */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/30">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Cliente de la Venta</label>
            <div className="relative">
              {selectedClient ? (
                <div className="w-full p-4 bg-orange-50 border-2 border-orange-500 rounded-2xl flex justify-between items-center animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 bg-orange-200 rounded-lg flex items-center justify-center text-orange-700 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-orange-900 text-sm truncate">{selectedClient.name}</p>
                      <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest truncate">{selectedClient.cuit}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedClient(null)}
                    className="p-1.5 hover:bg-orange-100 rounded-lg text-orange-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar cliente (Nombre o CUIT)..."
                    className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientResults(true);
                    }}
                    onFocus={() => setShowClientResults(true)}
                  />
                  {showClientResults && clientSearch.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[130] overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="p-1 space-y-1">
                        {filteredClients.map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedClient(c);
                              setClientSearch('');
                              setShowClientResults(false);
                            }}
                            className="w-full p-3 hover:bg-slate-50 rounded-xl flex items-center justify-between group transition-all text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-xs">{c.name}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.cuit}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-orange-500" />
                          </button>
                        ))}
                        {filteredClients.length === 0 && (
                          <div className="p-4 text-center text-slate-400 text-xs italic">No se encontraron clientes</div>
                        )}
                        <button
                          onClick={() => {
                            setSelectedClient(null);
                            setClientSearch('');
                            setShowClientResults(false);
                          }}
                          className="w-full p-3 border-t border-slate-50 hover:bg-slate-50 rounded-xl flex items-center gap-3 text-slate-500 transition-all"
                        >
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                            <UsersIcon className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-xs">Usar Cliente Mostrador</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-600" /> Carrito
            </h3>
            <button onClick={() => setCart([])} className="text-[10px] font-black uppercase text-red-500 hover:underline">Vaciar</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 space-y-4">
                <ShoppingCart className="w-16 h-16" />
                <p className="font-bold uppercase text-xs tracking-widest text-center">Sin artículos</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={`${item.id}-${item.selectedSaleUnit}`} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between group">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => {
                          const q = parseFloat(e.target.value) || 0; // Allow fractional quantity
                          setCart(cart.map((c, i) => i === idx ? { ...c, quantity: q } : c));
                        }}
                        className="w-20 bg-transparent font-black text-orange-600 outline-none"
                        step="0.01" // Allow decimal input
                      />
                      <span className="text-[10px] text-slate-400 font-bold uppercase">x ${item.price.toLocaleString()} /{item.selectedSaleUnit}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <p className="font-black text-slate-900">${(item.price * item.quantity).toLocaleString()}</p>
                    <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-slate-900 text-white space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">Total Cobrar</span>
              <span className="text-4xl font-black text-orange-500">${totalCartAmount.toLocaleString()}</span>
            </div>
            <button 
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
              className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-orange-600/20 hover:bg-orange-500 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              COBRAR <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Unit Selection for Fractionable Products */}
      {selectedProductForUnit && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[130] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-orange-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center">
                        <Scale className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Seleccionar Unidad</h2>
                        <p className="text-sm font-medium text-orange-700">{selectedProductForUnit.name}</p>
                    </div>
                </div>
                <button onClick={() => setSelectedProductForUnit(null)} className="p-2 hover:bg-white rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">¿En qué unidad deseas vender?</p>
                <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                        <input 
                            type="radio" 
                            name="unitSelection" 
                            value="primary" 
                            checked={tempSaleUnit === 'primary'} 
                            onChange={() => setTempSaleUnit('primary')}
                            className="form-radio h-5 w-5 text-orange-600"
                        />
                        <div className="flex-1">
                            <p className="font-bold text-slate-800 text-sm">{selectedProductForUnit.primaryUnit} (Stock)</p>
                            <p className="text-xs text-slate-500">${selectedProductForUnit.salePrice.toLocaleString()} / {selectedProductForUnit.primaryUnit}</p>
                        </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-200 cursor-pointer">
                        <input 
                            type="radio" 
                            name="unitSelection" 
                            value="sale" 
                            checked={tempSaleUnit === 'sale'} 
                            onChange={() => setTempSaleUnit('sale')}
                            className="form-radio h-5 w-5 text-orange-600"
                        />
                        <div className="flex-1">
                            <p className="font-bold text-orange-900 text-sm">{selectedProductForUnit.saleUnit} (Fraccionado)</p>
                            <p className="text-xs text-orange-700">
                                ${((selectedProductForUnit.salePrice || 0) * (selectedProductForUnit.saleUnitConversionFactor || 1)).toLocaleString()} / {selectedProductForUnit.saleUnit}
                                <span className="ml-1 text-slate-500 text-[10px] italic"> (1 {selectedProductForUnit.saleUnit} = {selectedProductForUnit.saleUnitConversionFactor} {selectedProductForUnit.primaryUnit})</span>
                            </p>
                        </div>
                    </label>
                </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                    onClick={() => setSelectedProductForUnit(null)} 
                    className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-500 uppercase text-xs"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleConfirmUnitSelection} 
                    className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-black shadow-lg hover:bg-orange-500 uppercase text-xs"
                >
                    Confirmar
                </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal: Checkout */}
      {showCheckout && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col md:flex-row max-h-[90vh]">
            
            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 uppercase italic">Confirmar Venta</h2>
                <button onClick={() => setShowCheckout(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
              </div>

              {/* Información del Cliente */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                    <p className="text-xl font-black text-slate-800">{selectedClient?.name || 'Mostrador'}</p>
                    <p className="text-xs text-slate-500 font-bold">{selectedClient?.cuit || 'Sin CUIT registrado'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowCheckout(false); setShowClientResults(true); }}
                  className="text-blue-600 text-xs font-black uppercase hover:underline"
                >
                  Cambiar
                </button>
              </div>

              {/* Tipo Documento */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Comprobante</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { id: 'ticket', label: 'Ticket', icon: Receipt },
                    { id: 'factura_a', label: 'Fact. A', icon: FileSignature },
                    { id: 'factura_b', label: 'Fact. B', icon: FileSignature },
                    { id: 'remito', label: 'Remito', icon: ClipboardList },
                    { id: 'presupuesto', label: 'Presup.', icon: MessageSquareText },
                  ].map(type => (
                    <button 
                      key={type.id}
                      onClick={() => setDocType(type.id as SaleDocType)}
                      className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${docType === type.id ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      <type.icon className="w-5 h-5" />
                      <span className="text-[9px] font-black uppercase tracking-tight">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pagos */}
              {docType !== 'presupuesto' && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medios de Pago</label>
                  
                  <div className="space-y-2">
                    {paymentDetails.map(pd => (
                      <div key={pd.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 capitalize">{pd.method.replace('_', ' ')}</span>
                            {(pd.method === 'cheque' || pd.method === 'echeq') && (
                              <span className="text-[9px] text-slate-400 font-bold uppercase">{pd.bank} #{pd.checkNumber} - Vence: {pd.dueDate}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-slate-900">${pd.amount.toLocaleString()}</span>
                          <button onClick={() => setPaymentDetails(paymentDetails.filter(p => p.id !== pd.id))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <select 
                        className="px-4 py-3 border border-slate-200 rounded-xl font-bold"
                        value={newPaymentDetail.method}
                        onChange={e => setNewPaymentDetail({...newPaymentDetail, method: e.target.value as any})}
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta_debito">Débito</option>
                        <option value="tarjeta_credito">Crédito</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque Físico</option>
                        <option value="echeq">E-Cheq</option>
                        <option value="cuenta_corriente" disabled={!selectedClient}>Cta. Corriente</option>
                      </select>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="number"
                          placeholder="Monto"
                          className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl font-bold"
                          value={newPaymentDetail.amount || ''}
                          onChange={e => setNewPaymentDetail({...newPaymentDetail, amount: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>

                    {(newPaymentDetail.method === 'cheque' || newPaymentDetail.method === 'echeq') && (
                      <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Banco</label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                            <input 
                              placeholder="Ej: Galicia" 
                              className="w-full pl-8 pr-3 py-2 border rounded-lg text-xs font-bold"
                              value={newPaymentDetail.bank}
                              onChange={e => setNewPaymentDetail({...newPaymentDetail, bank: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">N° Cheque</label>
                          <input 
                            placeholder="000123" 
                            className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
                            value={newPaymentDetail.checkNumber}
                            onChange={e => setNewPaymentDetail({...newPaymentDetail, checkNumber: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Vencimiento</label>
                          <input 
                            type="date"
                            className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
                            value={newPaymentDetail.dueDate}
                            onChange={e => setNewPaymentDetail({...newPaymentDetail, dueDate: e.target.value})}
                          />
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handleAddPayment}
                      className="w-full py-3 bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Registrar Pago
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-[380px] bg-slate-900 p-10 text-white flex flex-col justify-between border-l border-white/5">
              <div className="space-y-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resumen</p>
                  <h3 className="text-2xl font-black text-orange-500 uppercase">{docType.replace('_', ' ')}</h3>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/10">
                  <div className="flex justify-between items-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    <span>Neto Gravado</span>
                    <span>${(totalCartAmount / 1.21).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    <span>IVA (21%)</span>
                    <span>${(totalCartAmount - (totalCartAmount / 1.21)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-4">
                    <span className="font-black uppercase text-lg">Total</span>
                    <span className="text-4xl font-black text-white">${totalCartAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-white/10">
                  <div className="flex justify-between items-center font-bold text-sm">
                    <span className="text-slate-400">Pagado:</span>
                    <span className="text-green-400">${sumOfPayments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center font-black text-lg">
                    <span className="text-slate-400 uppercase text-xs tracking-widest">Restante:</span>
                    <span className={remainingToPay > 0 ? 'text-red-500' : 'text-orange-500'}>${remainingToPay.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {Math.abs(remainingToPay) > 0.01 && docType !== 'presupuesto' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-[10px] font-bold text-red-400 uppercase leading-tight">El pago debe cubrir el 100%.</p>
                  </div>
                )}
                <button 
                  onClick={handleFinishSale}
                  disabled={isProcessing || (docType !== 'presupuesto' && Math.abs(remainingToPay) > 0.01)}
                  className="w-full py-6 bg-orange-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-orange-600/40 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-20"
                >
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                  {isProcessing ? 'CONFIRMANDO...' : 'FINALIZAR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Venta Libre */}
      {showManualItemModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 uppercase">Ítem Manual</h2>
              <button onClick={() => setShowManualItemModal(false)}><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
                <input 
                  type="text" 
                  value={manualItem.name} 
                  onChange={e => setManualItem({...manualItem, name: e.target.value})}
                  className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                  placeholder="Descripción del servicio/item"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio</label>
                  <input 
                    type="number" 
                    value={manualItem.price || ''} 
                    onChange={e => setManualItem({...manualItem, price: parseFloat(e.target.value) || 0})}
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cant.</label>
                  <input 
                    type="number" 
                    value={manualItem.quantity} 
                    onChange={e => setManualItem({...manualItem, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                  />
                </div>
              </div>
              <button 
                onClick={addManualItemToCart}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest mt-4 shadow-lg active:scale-95"
              >
                Añadir al Carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
