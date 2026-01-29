
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
  Users as UsersIcon, Percent, ArrowDownCircle,
  Info
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { Product, Client, PaymentDetail, SaleItem, Sale, Box, RemitoItem, Order, Remito } from '../types'; // Import Order and Remito type
import { CompanyInfo } from '../App';

interface CartItem { 
  id: string; 
  sku: string; 
  name: string;
  brand: string;
  price: number; 
  quantity: number; 
  stockBeforeSale: number; 
  isManual?: boolean;
  primaryUnit: Product['primaryUnit']; 
  selectedSaleUnit: Product['saleUnit']; 
  saleUnitConversionFactor?: number; 
}

type SaleDocType = 'ticket' | 'factura_a' | 'factura_b' | 'remito' | 'presupuesto';

interface SalesProps {
  companyInfo: CompanyInfo;
}

export const Sales: React.FC<SalesProps> = ({ companyInfo }) => {
  const { 
    addSale, addOrder, fetchProductsPaginatedAndFiltered, clients, updateProduct, boxes, addTransaction, updateBox, addRemito 
  } = useFirebase();

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showManualItemModal, setShowManualItemModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [manualItem, setManualItem] = useState({ name: '', price: 0, quantity: 1 });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientResults, setShowClientResults] = useState(false);

  const [docType, setDocType] = useState<SaleDocType>('ticket'); // Default document type for sale
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [newPaymentDetail, setNewPaymentDetail] = useState<Omit<PaymentDetail, 'id' | 'netAmount'>>({
    method: 'efectivo', 
    amount: 0, 
    notes: '', 
    bank: '', 
    checkNumber: '', 
    dueDate: '',
    targetBoxId: '' // This will be mandatory
  });
  
  const [searchableProducts, setSearchableProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProductForUnit, setSelectedProductForUnit] = useState<Product | null>(null);
  const [tempSaleUnit, setTempSaleUnit] = useState<Product['saleUnit'] | 'primary'>('primary');

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
          limit: 8, searchTerm: value.toLowerCase().trim(), orderByField: 'name', orderDirection: 'asc'
        });
        setSearchableProducts(products);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [fetchProductsPaginatedAndFiltered]);

  const handleProductSelectionInSearch = (product: Product) => {
    if (product.isFractionable && product.saleUnitConversionFactor && product.saleUnit !== product.primaryUnit) {
        setSelectedProductForUnit(product);
        setTempSaleUnit('primary');
    } else {
        addToCart(product, product.primaryUnit);
        setSelectedProductForUnit(null);
    }
  };

  const handleConfirmUnitSelection = () => {
    if (selectedProductForUnit && tempSaleUnit) {
        let unitToAddToCart: Product['saleUnit'] = selectedProductForUnit.primaryUnit;
        if (tempSaleUnit !== 'primary') unitToAddToCart = selectedProductForUnit.saleUnit;
        addToCart(selectedProductForUnit, unitToAddToCart);
        setSelectedProductForUnit(null);
        setTempSaleUnit('primary');
    }
  };

  const addToCart = (product: Product, unitToSell: Product['saleUnit']) => {
    let pricePerSelectedUnit = product.salePrice;
    let conversionFactor = 1;
    if (unitToSell === product.saleUnit && product.isFractionable && product.saleUnitConversionFactor) {
        pricePerSelectedUnit = product.salePrice * product.saleUnitConversionFactor;
        conversionFactor = product.saleUnitConversionFactor;
    }
    const existingIndex = cart.findIndex(item => item.id === product.id && item.selectedSaleUnit === unitToSell);
    if (existingIndex !== -1) {
      setCart(cart.map((item, idx) => idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { 
        id: product.id, sku: product.sku, name: product.name, brand: product.brand,
        price: parseFloat(pricePerSelectedUnit.toFixed(2)), quantity: 1, stockBeforeSale: product.stock,
        primaryUnit: product.primaryUnit, selectedSaleUnit: unitToSell, saleUnitConversionFactor: conversionFactor,
      }]);
    }
    setSearch('');
    setSearchableProducts([]);
    setSelectedProductForUnit(null);
  };

  const addManualItemToCart = () => {
    if (!manualItem.name || manualItem.price <= 0) return;
    setCart([...cart, {
      id: `manual-${Date.now()}`, sku: 'MANUAL', name: manualItem.name, brand: 'Venta Libre',
      price: manualItem.price, quantity: manualItem.quantity, stockBeforeSale: 9999, isManual: true,
      primaryUnit: 'unidad', selectedSaleUnit: 'unidad', saleUnitConversionFactor: 1,
    }]);
    setShowManualItemModal(false);
    setManualItem({ name: '', price: 0, quantity: 1 });
  };

  const totalCartAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const sumOfPayments = paymentDetails.reduce((sum, d) => sum + d.amount, 0);
  const remainingToPay = totalCartAmount - sumOfPayments;

  const filteredClients = useMemo(() => {
    if (!clientSearch) return [];
    return clients.filter(c => 
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.cuit.includes(clientSearch)
    ).slice(0, 5);
  }, [clients, clientSearch]);

  const handleAddPayment = () => {
    if (newPaymentDetail.amount <= 0) {
      alert("Por favor ingrese un monto mayor a cero.");
      return;
    }
    if (!newPaymentDetail.targetBoxId) {
      alert("Por favor seleccione una caja de destino para este pago.");
      return;
    }
    if (['cheque', 'echeq'].includes(newPaymentDetail.method) && (!newPaymentDetail.bank || !newPaymentDetail.checkNumber || !newPaymentDetail.dueDate)) {
        alert("Para pagos con cheque/echeq, complete todos los campos de cheque.");
        return;
    }

    const commissionRate = companyInfo.paymentCommissions[newPaymentDetail.method] || 0;
    const commissionAmount = parseFloat((newPaymentDetail.amount * (commissionRate / 100)).toFixed(2));
    const netAmount = parseFloat((newPaymentDetail.amount - commissionAmount).toFixed(2));

    setPaymentDetails([...paymentDetails, { 
      ...newPaymentDetail, 
      id: Date.now().toString(),
      commissionRate,
      commissionAmount,
      netAmount
    }]);
    setNewPaymentDetail({ method: 'efectivo', amount: 0, notes: '', bank: '', checkNumber: '', dueDate: '', targetBoxId: '' });
  };

  const handleFinishSale = async () => {
    if (docType !== 'presupuesto' && Math.abs(remainingToPay) > 0.01 && docType !== 'remito') { // Remitos can have deferred payment
      alert(`Falta cubrir $${remainingToPay.toLocaleString()} del total.`);
      return;
    }

    setIsProcessing(true);
    try {
      // Common items mapping for all document types
      const mappedItems = cart.map(item => ({
        productId: item.id,
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
        isManual: item.isManual,
        selectedSaleUnit: item.selectedSaleUnit,
        // For RemitoItem specific fields, we need the original Product
        originalPrimaryUnit: item.primaryUnit,
        originalSaleUnit: item.selectedSaleUnit,
        originalSaleUnitConversionFactor: item.saleUnitConversionFactor,
        // For OrderItem specific fields
        originalProduct: null, // This would be fetched for Order if needed. Keeping it simple.
      }));

      const client = selectedClient; // Current client

      // --- Conditional Document Creation ---
      if (docType === 'presupuesto') {
        const orderData: Omit<Order, 'id'> = {
          clientId: client?.id || null,
          clientName: client?.name || 'Cliente Ocasional',
          dateCreated: new Date().toISOString(),
          items: mappedItems.map(item => ({...item, originalProduct: null})), // Adapt to OrderItem
          total: totalCartAmount,
          status: 'pendiente_preparacion',
          notes: 'Generado como presupuesto desde ventas',
          isServiceOrder: mappedItems.some(item => item.isManual),
        };
        await addOrder(orderData);
        alert("Presupuesto generado con éxito!");
      } else if (docType === 'remito') {
        const remitoItems: RemitoItem[] = mappedItems.map(item => ({
            id: item.productId,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            price: item.unitPrice,
            brand: item.brand,
            selectedSaleUnit: item.selectedSaleUnit!,
            originalPrimaryUnit: item.primaryUnit,
            originalSaleUnit: item.selectedSaleUnit!,
            originalSaleUnitConversionFactor: item.saleUnitConversionFactor!,
        }));

        const remitoData: Omit<Remito, 'id'> = {
          date: new Date().toISOString(),
          client: client?.name || 'Cliente Ocasional',
          clientId: client?.id || null,
          itemsCount: remitoItems.length,
          itemsList: remitoItems,
          total: totalCartAmount,
          status: 'pendiente', // Remito is pending payment
        };
        await addRemito(remitoData);
        alert("Remito generado con éxito! El stock ha sido deducido.");

        // Deduct stock for physical items for remito
        for (const item of cart) {
          if (!item.isManual) {
            const qtyToDeduct = item.quantity * item.saleUnitConversionFactor!;
            await updateProduct(item.id, { stock: item.stockBeforeSale - qtyToDeduct });
          }
        }

      } else { // 'ticket', 'factura_a', 'factura_b' (direct sale)
        const saleItems: SaleItem[] = mappedItems;

        await addSale({
          clientName: client?.name || 'Mostrador',
          clientId: client?.id || null,
          items: saleItems,
          total: totalCartAmount,
          paymentDetails,
          docType,
          date: new Date().toISOString(),
          status: 'completado',
          seller: 'Usuario Actual', // Placeholder, replace with actual user
          remitoIds: [], 
        });

        // Deduct stock for physical items
        for (const item of cart) {
          if (!item.isManual) {
            const qtyToDeduct = item.quantity * item.saleUnitConversionFactor!;
            await updateProduct(item.id, { stock: item.stockBeforeSale - qtyToDeduct });
          }
        }
        
        // Process payments and update boxes
        for (const pd of paymentDetails) {
          const box = boxes.find(b => b.id === pd.targetBoxId);
          if (box) {
            await addTransaction({
              date: new Date().toISOString(),
              amount: pd.netAmount,
              type: 'ingreso',
              boxId: pd.targetBoxId!,
              category: 'venta',
              description: `Venta ${docType.toUpperCase()} - Cliente: ${client?.name || 'Mostrador'}`,
              paymentDetails: [pd]
            });
            await updateBox(box.id, { balance: box.balance + pd.netAmount });
          }
        }
        alert("Operación completada. Caja y stock actualizados con valores NETOS.");
      }

      setCart([]);
      setShowCheckout(false);
      setPaymentDetails([]);
      setSelectedClient(null);
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
          <p className="text-slate-500">Ventas integradas con Tesorería y Stock.</p>
        </div>
        <button onClick={() => setShowManualItemModal(true)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center gap-2 border border-slate-200 hover:bg-slate-200 transition-all">
          <PlusCircle className="w-4 h-4" /> Venta Libre
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input 
                type="text" 
                placeholder="Busca productos o escanea..." 
                className="w-full pl-12 pr-4 py-5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none text-xl font-medium"
                value={search}
                onChange={(e) => { setSearch(e.target.value); debouncedSearchProducts(e.target.value); }}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {isSearching && <div className="col-span-2 py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" /></div>}
              {searchableProducts.map(p => (
                <div key={p.id} onClick={() => handleProductSelectionInSearch(p)} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:border-orange-300 hover:bg-orange-50/30 transition-all cursor-pointer group">
                  <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0">
                    <PackagePlus className="w-6 h-6 text-slate-300 group-hover:text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{p.sku} • Stock: {p.stock}</p>
                  </div>
                  <p className="text-lg font-black text-slate-900">${p.salePrice.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30">
            <div className="relative">
              {selectedClient ? (
                <div className="w-full p-4 bg-orange-50 border-2 border-orange-500 rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 bg-orange-200 rounded-lg flex items-center justify-center text-orange-700 shrink-0"><User className="w-5 h-5" /></div>
                    <div className="min-w-0"><p className="font-black text-orange-900 text-sm truncate">{selectedClient.name}</p></div>
                  </div>
                  <button onClick={() => setSelectedClient(null)} className="p-1.5 hover:bg-orange-100 rounded-lg text-orange-600"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" placeholder="Buscar cliente..." 
                    className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm"
                    value={clientSearch} onChange={(e) => { setClientSearch(e.target.value); setShowClientResults(true); }}
                    onFocus={() => setShowClientResults(true)}
                  />
                  {showClientResults && clientSearch.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[130] overflow-hidden">
                      <div className="p-1 space-y-1">
                        {filteredClients.map(c => (
                          <button key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(''); setShowClientResults(false); }} className="w-full p-3 hover:bg-slate-50 rounded-xl flex items-center justify-between text-left">
                            <span className="font-bold text-xs">{c.name}</span>
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-orange-600" /> Carrito</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
            {cart.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between group">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{item.quantity} x ${item.price.toLocaleString()}</p>
                </div>
                <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div className="p-8 bg-slate-900 text-white space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">Total</span>
              <span className="text-4xl font-black text-orange-500">${totalCartAmount.toLocaleString()}</span>
            </div>
            <button disabled={cart.length === 0} onClick={() => setShowCheckout(true)} className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-orange-500 transition-all flex items-center justify-center gap-3">
              COBRAR <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Checkout con Gestión de Comisiones y Cajas */}
      {showCheckout && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col md:flex-row max-h-[90vh]">
            
            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 uppercase italic">Confirmar Operación</h2>
                <button onClick={() => setShowCheckout(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
              </div>

              {/* Document Type Selection */}
              <div className="space-y-4 pt-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Comprobante</label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'ticket', label: 'Ticket', icon: Receipt },
                    { id: 'factura_a', label: 'Factura A', icon: FileText },
                    { id: 'factura_b', label: 'Factura B', icon: FileText },
                    { id: 'remito', label: 'Remito', icon: ClipboardList },
                    { id: 'presupuesto', label: 'Presupuesto', icon: MessageSquareText },
                  ].map(doc => (
                    <label key={doc.id} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer has-[:checked]:bg-orange-50 has-[:checked]:border-orange-500 transition-all">
                      <input 
                        type="radio" 
                        name="docType" 
                        value={doc.id} 
                        checked={docType === doc.id} 
                        onChange={(e) => setDocType(e.target.value as SaleDocType)}
                        className="form-radio h-5 w-5 text-orange-600 focus:ring-orange-500"
                      />
                      <doc.icon className="w-5 h-5 text-slate-400 has-[:checked]:text-orange-600" />
                      <span className="font-bold text-slate-700 has-[:checked]:text-orange-900">{doc.label}</span>
                    </label>
                  ))}
                </div>
                {(docType === 'remito' || docType === 'presupuesto') && (
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-2xl flex items-center gap-3">
                        <Info className="w-5 h-5 shrink-0" />
                        <span className="text-sm font-medium">
                            {docType === 'remito' 
                                ? "Un remito deduce stock pero no registra el cobro. Se factura posteriormente."
                                : "Un presupuesto no afecta stock ni caja. Es solo una cotización."}
                        </span>
                    </div>
                )}
              </div>

              {/* Pagos y Comisiones (Hidden for Remito/Presupuesto) */}
              {(docType === 'ticket' || docType === 'factura_a' || docType === 'factura_b') && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detalle de Medios de Pago</label>
                
                <div className="space-y-2">
                  {paymentDetails.map(pd => (
                    <div key={pd.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 capitalize">{pd.method.replace('_', ' ')}</span>
                          <div className="flex gap-2">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              Hacia: {boxes.find(b => b.id === pd.targetBoxId)?.name}
                            </span>
                            {pd.commissionAmount! > 0 && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                                Comisión {pd.commissionRate}% (-${pd.commissionAmount})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-black text-slate-900">${pd.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-green-600 font-bold">Neto: ${pd.netAmount.toLocaleString()}</p>
                        </div>
                        <button onClick={() => setPaymentDetails(paymentDetails.filter(p => p.id !== pd.id))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1 md:col-span-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Medio</label>
                      <select 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-xs"
                        value={newPaymentDetail.method}
                        onChange={e => setNewPaymentDetail({...newPaymentDetail, method: e.target.value as any, bank: '', checkNumber: '', dueDate: ''})} // Clear cheque fields on method change
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta_debito">Débito</option>
                        <option value="tarjeta_credito">Crédito</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                        <option value="echeq">E-Cheq</option>
                        <option value="cuenta_corriente">Cta. Corriente</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1 md:col-span-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Monto Bruto</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="number" placeholder="0.00"
                          className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl font-bold text-xs"
                          value={newPaymentDetail.amount || ''}
                          onChange={e => setNewPaymentDetail({...newPaymentDetail, amount: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Caja Destino</label>
                      <select 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-xs bg-white"
                        value={newPaymentDetail.targetBoxId}
                        onChange={e => setNewPaymentDetail({...newPaymentDetail, targetBoxId: e.target.value})}
                        required // Make target box selection mandatory
                      >
                        <option value="">Seleccionar Caja...</option>
                        {boxes.filter(b => b.status === 'abierta').map(b => (
                          <option key={b.id} value={b.id}>{b.name} (${b.balance.toLocaleString()})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cheque / E-Cheq specific fields */}
                  {(newPaymentDetail.method === 'cheque' || newPaymentDetail.method === 'echeq') && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200 pt-3 border-t border-slate-100">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Banco</label>
                            <input 
                                type="text"
                                value={newPaymentDetail.bank || ''}
                                onChange={e => setNewPaymentDetail({...newPaymentDetail, bank: e.target.value})}
                                placeholder="Nombre del Banco"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-xs"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">N° Cheque</label>
                            <input 
                                type="text"
                                value={newPaymentDetail.checkNumber || ''}
                                onChange={e => setNewPaymentDetail({...newPaymentDetail, checkNumber: e.target.value})}
                                placeholder="Número de Cheque"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-xs"
                                required
                            />
                        </div>
                        <div className="space-y-1 col-span-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Fecha de Vencimiento</label>
                            <input 
                                type="date"
                                value={newPaymentDetail.dueDate || ''}
                                onChange={e => setNewPaymentDetail({...newPaymentDetail, dueDate: e.target.value})}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-xs"
                                required
                            />
                        </div>
                    </div>
                  )}

                  {/* Preview de lo que ingresará */}
                  {newPaymentDetail.amount > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl animate-in fade-in">
                       <Info className="w-4 h-4 text-orange-600" />
                       <span className="text-[10px] font-bold text-orange-800 uppercase">
                          Comisión bancaria: {companyInfo.paymentCommissions[newPaymentDetail.method] || 0}% 
                          (-${(newPaymentDetail.amount * ((companyInfo.paymentCommissions[newPaymentDetail.method] || 0) / 100)).toFixed(2)}). 
                          Ingresará neto a caja: ${(newPaymentDetail.amount * (1 - (companyInfo.paymentCommissions[newPaymentDetail.method] || 0) / 100)).toFixed(2)}
                       </span>
                    </div>
                  )}

                  <button 
                    onClick={handleAddPayment}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Registrar Cobro
                  </button>
                </div>
              </div>
              )}
            </div>

            <div className="w-full md:w-[380px] bg-slate-900 p-10 text-white flex flex-col justify-between border-l border-white/5">
              <div className="space-y-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Liquidación Final</p>
                  <h3 className="text-2xl font-black text-orange-500 uppercase">{docType.replace('_', ' ')}</h3>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/10">
                  <div className="flex justify-between items-baseline">
                    <span className="font-black uppercase text-lg">Total</span>
                    <span className="text-4xl font-black text-white">${totalCartAmount.toLocaleString()}</span>
                  </div>
                  {(docType === 'ticket' || docType === 'factura_a' || docType === 'factura_b') && (
                    <div className="flex justify-between items-center text-green-400 font-bold uppercase text-[10px] tracking-widest">
                        <span>A Recibir (Neto)</span>
                        <span>${paymentDetails.reduce((acc, pd) => acc + pd.netAmount, 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {(docType === 'ticket' || docType === 'factura_a' || docType === 'factura_b') && (
                <div className="space-y-4 pt-8 border-t border-white/10">
                  <div className="flex justify-between items-center font-bold text-sm">
                    <span className="text-slate-400">Restante Cobrar:</span>
                    <span className={remainingToPay > 0 ? 'text-red-500' : 'text-orange-500'}>${remainingToPay.toLocaleString()}</span>
                  </div>
                </div>
                )}
              </div>

              <button 
                onClick={handleFinishSale}
                disabled={isProcessing || (docType !== 'remito' && docType !== 'presupuesto' && Math.abs(remainingToPay) > 0.01)}
                className="w-full py-6 bg-orange-600 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-orange-500 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-20"
              >
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                {isProcessing ? 'PROCESANDO...' : 'FINALIZAR OPERACIÓN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Venta Libre */}
      {showManualItemModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 uppercase">Ítem Manual</h2>
              <button onClick={() => setShowManualItemModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descripción</label>
                <input 
                  type="text" value={manualItem.name} 
                  onChange={e => setManualItem({...manualItem, name: e.target.value})}
                  className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Precio</label>
                  <input 
                    type="number" value={manualItem.price || ''} 
                    onChange={e => setManualItem({...manualItem, price: parseFloat(e.target.value) || 0})}
                    className="w-full px-5 py-3 border border-slate-200 rounded-xl outline-none font-bold" 
                  />
                </div>
              </div>
              <button onClick={addManualItemToCart} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Añadir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};