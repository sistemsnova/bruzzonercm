
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ClipboardList, Filter, MoreHorizontal, 
  Eye, Printer, FileCheck, Truck, X, 
  ChevronRight, Calendar, User, Package,
  CheckSquare, Square, CreditCard, Receipt,
  CheckCircle2, AlertCircle, Wallet, Landmark,
  Edit3, Trash2, Info, Save, FileText,
  Plus, Loader2
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext'; 
import { Product, Remito as RemitoType, PaymentDetail, SaleItem, Sale, Client } from '../types'; 

// Extend the RemitoType from types.ts to use here
interface Remito extends RemitoType {}

// Mock remitos initially, will move to Firebase context 'remitos' later for real implementation
// These are local to the component for demo purposes
const localMockRemitos: Remito[] = [
  { 
    id: 'R-0001', 
    date: '2024-05-20', 
    client: 'Juan Perez S.R.L.', 
    clientId: 'client-123',
    itemsCount: 5, 
    itemsList: [
      { id: 'p1', sku: 'MART-001', name: 'Martillo Stanley 20oz', quantity: 2, price: 5500, brand: 'Stanley', selectedSaleUnit: 'unidad', originalPrimaryUnit: 'unidad', originalSaleUnit: 'unidad', originalSaleUnitConversionFactor: 1 },
      { id: 'p5', sku: 'CABLE-3X15', name: 'Cable Eléctrico 3x1.5mm', quantity: 3, price: 500, brand: 'Kalop', selectedSaleUnit: 'metro_lineal', originalPrimaryUnit: 'metro_lineal', originalSaleUnit: 'metro_lineal', originalSaleUnitConversionFactor: 1 }
    ],
    total: 12500, 
    status: 'pendiente' 
  },
  { 
    id: 'R-0002', 
    date: '2024-05-21', 
    client: 'Constructora del Centro', 
    clientId: 'client-456',
    itemsCount: 12, 
    itemsList: [
      { id: 'p2', sku: 'TAL-650', name: 'Taladro Bosch GSB 650', quantity: 1, price: 18500, brand: 'Bosch', selectedSaleUnit: 'unidad', originalPrimaryUnit: 'unidad', originalSaleUnit: 'unidad', originalSaleUnitConversionFactor: 1 },
      { id: 'p3', sku: 'PINT-BLANCA', name: 'Pintura Látex Blanca 4L', quantity: 10, price: 4200, brand: 'Alba', selectedSaleUnit: 'litro', originalPrimaryUnit: 'litro', originalSaleUnit: 'litro', originalSaleUnitConversionFactor: 1 }
    ],
    total: 85400, 
    status: 'pendiente' 
  },
  {
    id: 'R-0003',
    date: '2024-05-22',
    client: 'Alberto Gimenez',
    clientId: 'client-789',
    itemsCount: 2,
    itemsList: [
      { id: 'p4', sku: 'SINT-20L', name: 'Sinteplast Pintura Interior 20L', quantity: 1, price: 25000, brand: 'Sinteplast', selectedSaleUnit: 'litro', originalPrimaryUnit: 'litro', originalSaleUnit: 'litro', originalSaleUnitConversionFactor: 1 },
    ],
    total: 25000,
    status: 'facturado',
    invoiceId: 'F-INV-001' // Example of an already invoiced remito
  },
  { 
    id: 'R-0004', 
    date: '2024-05-23', 
    client: 'Juan Perez S.R.L.', 
    clientId: 'client-123',
    itemsCount: 3, 
    itemsList: [
      { id: 'p6', sku: 'TORN-M8', name: 'Tornillos M8 x 50mm', quantity: 100, price: 5, brand: 'Generico', selectedSaleUnit: 'unidad', originalPrimaryUnit: 'unidad', originalSaleUnit: 'unidad', originalSaleUnitConversionFactor: 1 },
      { id: 'p7', sku: 'ADHE-001', name: 'Adhesivo Epoxi', quantity: 1, price: 3500, brand: 'Poxipol', selectedSaleUnit: 'unidad', originalPrimaryUnit: 'unidad', originalSaleUnit: 'unidad', originalSaleUnitConversionFactor: 1 }
    ],
    total: 4000, 
    status: 'pendiente' 
  },
  { 
    id: 'R-0005', 
    date: '2024-05-24', 
    client: 'Juan Perez S.R.L.', 
    clientId: 'client-123',
    itemsCount: 8, 
    itemsList: [
      { id: 'p8', sku: 'TUER-M8', name: 'Tuercas M8', quantity: 100, price: 3, brand: 'Generico', selectedSaleUnit: 'unidad', originalPrimaryUnit: 'unidad', originalSaleUnit: 'unidad', originalSaleUnitConversionFactor: 1 },
      { id: 'p9', sku: 'LIJA-F100', name: 'Lija Grano 100', quantity: 10, price: 150, brand: '3M', selectedSaleUnit: 'unidad', originalPrimaryUnit: 'unidad', originalSaleUnit: 'unidad', originalSaleUnitConversionFactor: 1 }
    ],
    total: 1800, 
    status: 'pendiente' 
  }
];

// Mock sales for local demonstration, especially for 'facturado' remitos
const localMockSales: Sale[] = [
  {
    id: 'F-INV-001',
    clientName: 'Alberto Gimenez',
    clientId: 'client-789',
    items: [
      { id: 'p4', sku: 'SINT-20L', name: 'Sinteplast Pintura Interior 20L', quantity: 1, price: 25000, brand: 'Sinteplast', subtotal: 25000, selectedSaleUnit: 'litro' },
    ],
    total: 25000,
    // Fix: Added missing mandatory netAmount property
    paymentDetails: [{ id: 'pd1', method: 'efectivo', amount: 25000, netAmount: 25000 }],
    docType: 'factura_a',
    date: '2024-05-22T10:00:00Z',
    status: 'completado',
    seller: 'Sistema',
    remitoIds: ['R-0003'],
  },
  {
    id: 'F-INV-002', // Another example invoice for multiple remitos
    clientName: 'Juan Perez S.R.L.',
    clientId: 'client-123',
    items: [
      { id: 'p1', sku: 'MART-001', name: 'Martillo Stanley 20oz', quantity: 2, price: 5500, brand: 'Stanley', subtotal: 11000, selectedSaleUnit: 'unidad' },
      { id: 'p5', sku: 'CABLE-3X15', name: 'Cable Eléctrico 3x1.5mm', quantity: 3, price: 500, brand: 'Kalop', subtotal: 1500, selectedSaleUnit: 'metro_lineal' },
      { id: 'p6', sku: 'TORN-M8', name: 'Tornillos M8 x 50mm', quantity: 100, price: 5, brand: 'Generico', subtotal: 500, selectedSaleUnit: 'unidad' },
      { id: 'p7', sku: 'ADHE-001', name: 'Adhesivo Epoxi', quantity: 1, price: 3500, brand: 'Poxipol', subtotal: 3500, selectedSaleUnit: 'unidad' }
    ],
    total: 16500,
    // Fix: Added missing mandatory netAmount property
    paymentDetails: [{ id: 'pd2', method: 'transferencia', amount: 16500, netAmount: 16500 }],
    docType: 'factura_b',
    date: '2024-05-25T11:30:00Z',
    status: 'completado',
    seller: 'Usuario Actual',
    remitoIds: ['R-0001', 'R-0004'], // Links to multiple remitos
  }
];


export const Remitos: React.FC = () => {
  const { addSale, clients, remitos, updateRemito, sales } = useFirebase(); 
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false); // New modal for invoice details
  
  const [activeRemito, setActiveRemito] = useState<Remito | null>(null); // For single remito billing
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null); // New state for selected invoice
  
  // Soporte para pagos mixtos en la facturación de remitos
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  // Fix: Added missing mandatory netAmount property to initial state
  const [newPaymentDetail, setNewPaymentDetail] = useState<Omit<PaymentDetail, 'id'>>({
    method: 'efectivo', amount: 0, notes: '', netAmount: 0
  });

  // NEW: State for selected document type in billing modal
  const [billingDocType, setBillingDocType] = useState<'factura_a' | 'factura_b' | 'ticket'>('factura_a');

  // This should not be used for calculating total, only for additional charges/discounts
  const [extraAmount, setExtraAmount] = useState<number>(0); 
  const [extraDescription, setExtraDescription] = useState<string>('');

  const [currentRemitosDisplay, setCurrentRemitosDisplay] = useState<Remito[]>([]);

  useEffect(() => {
    // If remitos from Firebase context are available AND not empty, use them
    // Otherwise, use localMockRemitos for initial demo data
    if (remitos && remitos.length > 0) {
      // Merge local mock data with Firebase data, prioritizing Firebase if IDs overlap
      const firebaseRemitoMap = new Map(remitos.map(r => [r.id, r]));
      const mergedRemitos = localMockRemitos.map(mockR => firebaseRemitoMap.get(mockR.id) || mockR);
      const newFirebaseRemitos = remitos.filter(r => !localMockRemitos.some(mockR => mockR.id === r.id));
      setCurrentRemitosDisplay([...mergedRemitos, ...newFirebaseRemitos]);
    } else {
      setCurrentRemitosDisplay(localMockRemitos);
    }
  }, [remitos]);

  const [isProcessingBilling, setIsProcessingBilling] = useState(false); 

  const getStatusStyle = (status: Remito['status']) => {
    switch (status) {
      case 'pendiente': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'entregado': return 'bg-green-50 text-green-700 border-green-100';
      case 'cancelado': return 'bg-red-50 text-red-700 border-red-100';
      case 'facturado': return 'bg-blue-50 text-blue-700 border-blue-100'; // New style for facturado
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const filteredRemitos = currentRemitosDisplay.filter(r => {
    const matchesSearch = r.client.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'todos' || r.status === filter;
    return matchesSearch && matchesFilter;
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    // Only toggle selectable (non-facturado) remitos
    const selectableRemitoIds = filteredRemitos.filter(r => r.status !== 'facturado').map(r => r.id);
    if (selectedIds.length === selectableRemitoIds.length && selectableRemitoIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableRemitoIds);
    }
  };

  const selectedRemitosData = useMemo(() => currentRemitosDisplay.filter(r => selectedIds.includes(r.id)), [currentRemitosDisplay, selectedIds]);
  
  // Calculate total based on whether a single remito is active for billing or multiple are selected
  const billingTotalAmount = useMemo(() => {
    if (activeRemito) {
      return activeRemito.total;
    }
    return selectedRemitosData.reduce((acc, curr) => acc + curr.total, 0);
  }, [activeRemito, selectedRemitosData]);

  const finalTotal = billingTotalAmount + extraAmount;
  
  const sumOfCurrentPayments = paymentDetails.reduce((sum, detail) => sum + detail.amount, 0);
  const remainingToAllocate = finalTotal - sumOfCurrentPayments;

  const handleAddPaymentDetail = () => {
    if (newPaymentDetail.amount <= 0) {
      alert("Por favor, ingresa un monto mayor a cero.");
      return;
    }
    // Fix: Added mandatory netAmount property to PaymentDetail object
    const paymentWithNet: PaymentDetail = { 
      ...newPaymentDetail, 
      id: Date.now().toString(),
      netAmount: newPaymentDetail.amount 
    };
    setPaymentDetails(prev => [...prev, paymentWithNet]);
    setNewPaymentDetail({ method: 'efectivo', amount: 0, notes: '', netAmount: 0 }); 
  };

  const openBillingModal = (remito: Remito | null = null, isBulk: boolean = false) => {
    console.log("openBillingModal called:", { remito, isBulk, selectedIds: selectedIds, selectedRemitosData: selectedRemitosData });

    // If opening for bulk, and no items are selected, show alert
    if (isBulk && selectedIds.length === 0) {
      alert("No hay remitos seleccionados para facturar.");
      return;
    }
    
    // Validate client consistency for bulk action
    if (isBulk && selectedIds.length > 1) {
      const firstRemito = selectedRemitosData[0];
      const firstClientId = firstRemito?.clientId;
      const firstClientName = firstRemito?.client;
      const allSameClient = selectedRemitosData.every(r => r.clientId === firstClientId);
      if (!allSameClient) {
        alert(`Para facturar varios remitos juntos, todos deben ser del mismo cliente. Los remitos seleccionados pertenecen a clientes diferentes (ej. "${firstClientName}" y otros).`);
        return;
      }
    } else if (!remito && !isBulk) {
       // If no remito provided and not a bulk action, something is wrong
       alert("No se ha seleccionado ningún remito para facturar.");
       return;
    }

    setActiveRemito(remito); // Will be null if it's a bulk operation
    setPaymentDetails([]); // Clear previous payment details
    setNewPaymentDetail({ method: 'efectivo', amount: 0, notes: '', netAmount: 0 });
    setBillingDocType('factura_a'); // Default doc type for billing
    setExtraAmount(0); // Reset extra amounts
    setExtraDescription(''); // Reset extra description
    setShowBillingModal(true);
  };

  const handleConfirmInvoice = async () => {
    console.log("handleConfirmInvoice called.");
    // Determine which remitos to invoice: selected ones (if any) or the single active one
    const remitosToInvoice = selectedRemitosData.length > 0 ? selectedRemitosData : (activeRemito ? [activeRemito] : []);
    
    if (remitosToInvoice.length === 0) {
      alert("No hay remitos seleccionados para facturar.");
      setIsProcessingBilling(false);
      return;
    }

    // Client consistency validation (repeated to ensure this is done just before final action)
    const firstClient = remitosToInvoice[0]?.clientId;
    const allSameClient = remitosToInvoice.every(r => r.clientId === firstClient);
    if (!allSameClient) {
      alert(`Para facturar varios remitos juntos, todos deben ser del mismo cliente. Los remitos seleccionados pertenecen a clientes diferentes.`);
      setIsProcessingBilling(false);
      return;
    }

    if (paymentDetails.length === 0) {
      alert("Por favor, agrega al menos un medio de pago.");
      return;
    }
    if (Math.abs(remainingToAllocate) > 0.01) { 
      alert(`Falta asignar $${remainingToAllocate.toLocaleString()}`);
      return;
    }

    setIsProcessingBilling(true);
    try {
      // Aggregate all items from selected remitos
      const allSaleItems: SaleItem[] = [];
      for (const remito of remitosToInvoice) {
        for (const item of remito.itemsList) {
          // Check if item already exists in the aggregated list by ID and sale unit
          const existingItemIndex = allSaleItems.findIndex(si => si.id === item.id && si.selectedSaleUnit === item.selectedSaleUnit);
          if (existingItemIndex !== -1) {
            allSaleItems[existingItemIndex].quantity += item.quantity;
            allSaleItems[existingItemIndex].subtotal = parseFloat((allSaleItems[existingItemIndex].quantity * allSaleItems[existingItemIndex].price).toFixed(2));
          } else {
            allSaleItems.push({
              id: item.id,
              sku: item.sku,
              name: item.name,
              brand: item.brand,
              price: item.price, // Assuming remito item price is sale price
              quantity: item.quantity,
              subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
              selectedSaleUnit: item.selectedSaleUnit,
            });
          }
        }
      }

      // Get client data (guaranteed to be consistent by validation above)
      const clientForInvoice = clients.find(c => c.id === firstClient);

      // Create the Sale (Invoice) document
      const saleData: Omit<Sale, 'id'> = {
        clientName: clientForInvoice?.name || remitosToInvoice[0]?.client || 'Consumidor Final',
        clientId: clientForInvoice?.id || null,
        items: allSaleItems,
        total: finalTotal, 
        paymentDetails, 
        docType: billingDocType, // Use the selected document type
        date: new Date().toISOString(),
        status: 'completado', // Assuming immediate completion for invoice
        seller: 'Usuario Actual', // Placeholder, replace with actual user
        remitoIds: remitosToInvoice.map(r => r.id), // Link to remitos
      };

      const newInvoiceId = await addSale(saleData);

      // Update each remito with the new invoice ID and status
      for (const remito of remitosToInvoice) {
        await updateRemito(remito.id, { 
          invoiceId: newInvoiceId, 
          status: 'facturado', 
        });
      }

      alert(`¡Facturación completada! Se generó el comprobante N° ${newInvoiceId}.`);
      setSelectedIds([]);
      setShowBillingModal(false);
      setPaymentDetails([]);
      setActiveRemito(null); 
    } catch (e) {
      console.error("Error al confirmar factura:", e);
      alert("Error al procesar la facturación.");
    } finally {
      setIsProcessingBilling(false);
    }
  };

  const handleViewInvoiceDetails = async (invoiceId: string) => {
    console.log('Clicked "Ver Factura" for invoiceId:', invoiceId);
    // First, try to find in Firebase-backed sales
    let invoice = sales.find(s => s.id === invoiceId);
    
    // If not found, try to find in local mock sales (for demonstration of mock data)
    if (!invoice) {
      invoice = localMockSales.find(s => s.id === invoiceId);
    }

    if (invoice) {
      console.log('Found invoice:', invoice);
      setActiveInvoice(invoice);
      setShowInvoiceDetailsModal(true);
    } else {
      console.log('Invoice not found for invoiceId:', invoiceId);
      alert("No se encontró la factura.");
    }
  };

  const renderInvoiceDetailsModal = () => {
    if (!activeInvoice) return null;

    // Filter remitos from currentRemitosDisplay (which includes firebase or mock) that are linked to this invoice
    const linkedRemitos = currentRemitosDisplay.filter(r => activeInvoice.remitoIds?.includes(r.id));
    const client = clients.find(c => c.id === activeInvoice.clientId);

    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-blue-600 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <FileCheck className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Comprobante N° {activeInvoice.id}</h2>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mt-1">Detalle del comprobante {activeInvoice.docType.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>
            <button onClick={() => setShowInvoiceDetailsModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Información General</h3>
              <div className="grid grid-cols-2 gap-4 text-sm font-medium text-slate-700">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Cliente</p>
                  <p className="font-bold text-slate-900">{activeInvoice.clientName}</p>
                  {client && <p className="text-xs text-slate-600">{client.cuit}</p>}
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Fecha</p>
                  <p className="font-bold text-slate-900">{new Date(activeInvoice.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Tipo de Doc.</p>
                  <p className="font-bold text-slate-900">{activeInvoice.docType.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Estado</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${activeInvoice.status === 'completado' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                    {activeInvoice.status}
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ítems del Comprobante</h3>
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                      <th className="px-6 py-3">Artículo</th>
                      <th className="px-6 py-3 text-center">Cant.</th>
                      <th className="px-6 py-3 text-right">Unitario</th>
                      <th className="px-6 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeInvoice.items.map((item, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase">{item.sku} • {item.brand}</p>
                        </td>
                        <td className="px-6 py-4 text-center">{item.quantity}</td>
                        <td className="px-6 py-4 text-right">${item.price.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-black">${item.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remitos Vinculados</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {linkedRemitos.length > 0 ? (
                  linkedRemitos.map(r => (
                    <div key={r.id} className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-blue-900 text-sm">Remito N° {r.id}</p>
                        <p className="text-[10px] text-blue-600 font-bold uppercase">{new Date(r.date).toLocaleDateString()}</p>
                      </div>
                      <span className="font-black text-blue-900">${r.total.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-4 text-center text-slate-400 italic">No hay remitos vinculados a este comprobante.</div>
                )}
              </div>
            </section>

            <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-xl font-black uppercase tracking-tight">Total Comprobante</span>
                <span className="text-4xl font-black text-orange-500">${activeInvoice.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Total Pagado</span>
                <span>${activeInvoice.paymentDetails.reduce((acc, pd) => acc + pd.amount, 0).toLocaleString()}</span>
              </div>
            </section>
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
            <button onClick={() => setShowInvoiceDetailsModal(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cerrar</button>
            <button className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
              <Printer className="w-5 h-5" aria-hidden="true" /> Imprimir Comprobante
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24">
      {showInvoiceDetailsModal && renderInvoiceDetailsModal()} {/* Render invoice details modal */}

      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Remitos</h1>
          <p className="text-slate-500">Administra o factura remitos de entrega.</p>
        </div>
        {/* New button to open a "new remito" form or quick create, for future */}
        <button 
          onClick={() => alert("Aquí se abriría un modal para crear un nuevo remito.")}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
        >
          <Plus className="w-5 h-5" aria-hidden="true" /> Nuevo Remito
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
            <input 
              type="text" 
              placeholder="Buscar remito o cliente..." 
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shrink-0 shadow-sm">
              {['todos', 'pendiente', 'entregado', 'facturado'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                    filter === f ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          {selectedIds.length > 0 && (
            <button
              onClick={() => openBillingModal(null, true)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 ml-4"
            >
              <FileCheck className="w-5 h-5" aria-hidden="true" /> Facturar Seleccionados ({selectedIds.length})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <button onClick={toggleAll} className="p-1 rounded hover:bg-slate-200 transition-colors">
                    {selectedIds.length === filteredRemitos.filter(r => r.status !== 'facturado').length && filteredRemitos.filter(r => r.status !== 'facturado').length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-orange-600" aria-hidden="true" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" aria-hidden="true" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4">Remito N°</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-center">Items</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Monto</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRemitos.map((r) => (
                <tr key={r.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.includes(r.id) ? 'bg-orange-50/50' : ''}`}>
                  <td className="px-6 py-4 text-center" onClick={() => r.status !== 'facturado' && toggleSelection(r.id)}>
                    {r.status === 'facturado' ? (
                      /* Fix: Wrapped CheckSquare in span and moved 'title' attribute to span as Lucide components don't support it directly */
                      <span title="Remito ya facturado">
                        <CheckSquare className="w-5 h-5 text-blue-600 opacity-50" aria-hidden="true" />
                      </span>
                    ) : (
                      selectedIds.includes(r.id) ? <CheckSquare className="w-5 h-5 text-orange-600" aria-hidden="true" /> : <Square className="w-5 h-5 text-slate-200" aria-hidden="true" />
                    )}
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900">{r.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{r.client}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-600">{r.itemsCount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(r.status)}`}>
                      {r.status}
                    </span>
                    {r.invoiceId && (
                      <div className="flex items-center gap-1 mt-1">
                        <FileCheck className="w-3 h-3 text-blue-600" aria-hidden="true" />
                        {/* Fix: Moved Lucide icon into the button and applied title to the button */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleViewInvoiceDetails(r.invoiceId!); }}
                          className="text-[9px] font-black uppercase text-blue-600 hover:underline"
                        >
                          Factura {r.invoiceId}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">${r.total.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    {r.status === 'facturado' ? (
                      // Fix: Moved Lucide icon into the button and applied title to the button
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleViewInvoiceDetails(r.invoiceId!); }}
                        className="p-2 text-blue-600 hover:text-blue-700" 
                        title="Ver Factura"
                      >
                        <Eye className="w-5 h-5" aria-hidden="true" />
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); openBillingModal(r, false); }} // Open for single remito
                        className="p-2 text-slate-400 hover:text-orange-600" title="Facturar"
                      >
                        <FileCheck className="w-5 h-5" aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showBillingModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Cobro de Remito</h2>
                <p className="text-slate-500 mt-1">Cliente: <span className="font-bold text-orange-600">{activeRemito?.client || (selectedRemitosData.length > 0 ? selectedRemitosData[0].client : 'N/A')}</span></p>
              </div>
              <button onClick={() => setShowBillingModal(false)} className="p-3 text-slate-400"><X className="w-7 h-7" aria-hidden="true" /></button>
            </div>

            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* NEW: Document Type Selection */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tipo de Comprobante</h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="billingDocType" 
                      value="factura_a" 
                      checked={billingDocType === 'factura_a'}
                      onChange={(e) => setBillingDocType(e.target.value as any)}
                      className="form-radio h-5 w-5 text-blue-600"
                    />
                    <span className="text-sm font-bold text-slate-800">Factura A</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="billingDocType" 
                      value="factura_b" 
                      checked={billingDocType === 'factura_b'}
                      onChange={(e) => setBillingDocType(e.target.value as any)}
                      className="form-radio h-5 w-5 text-blue-600"
                    />
                    <span className="text-sm font-bold text-slate-800">Factura B</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="billingDocType" 
                      value="ticket" 
                      checked={billingDocType === 'ticket'}
                      onChange={(e) => setBillingDocType(e.target.value as any)}
                      className="form-radio h-5 w-5 text-blue-600"
                    />
                    <span className="text-sm font-bold text-slate-800">Ticket / Venta Simple</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Detalle de Pagos</h3>
                    <span className="font-black text-orange-600">Total a Facturar: ${billingTotalAmount.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2">
                    {paymentDetails.map(pd => (
                        <div key={pd.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border">
                            <span className="text-sm font-bold text-slate-700 capitalize">{pd.method.replace('_', ' ')}</span>
                            <div className="flex items-center gap-3">
                                <span className="font-black text-slate-900">${pd.amount.toLocaleString()}</span>
                                <button onClick={() => setPaymentDetails(paymentDetails.filter(p => p.id !== pd.id))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-slate-100 rounded-2xl space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <select 
                            className="px-4 py-2 border rounded-xl font-bold"
                            value={newPaymentDetail.method}
                            onChange={e => setNewPaymentDetail({...newPaymentDetail, method: e.target.value as any})}
                        >
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta_debito">Débito</option>
                            <option value="tarjeta_credito">Crédito</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="cuenta_corriente">Cuenta Corriente</option>
                        </select>
                        <input 
                            type="number"
                            placeholder="Monto"
                            className="px-4 py-2 border rounded-xl font-bold"
                            value={newPaymentDetail.amount || ''}
                            onChange={e => setNewPaymentDetail({...newPaymentDetail, amount: parseFloat(e.target.value) || 0})}
                        />
                    </div>
                    <button onClick={handleAddPaymentDetail} className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-black uppercase">+ Agregar Pago</button>
                </div>
              </div>

              <div className="pt-8 border-t flex justify-between items-center">
                <span className="text-xl font-black text-slate-800 uppercase">TOTAL FINAL</span>
                <span className="text-5xl font-black text-orange-600">${finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t flex gap-4">
              <button onClick={() => setShowBillingModal(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
              <button
                disabled={isProcessingBilling || Math.abs(remainingToAllocate) > 0.01}
                onClick={handleConfirmInvoice}
                className="flex-[1.5] py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
              >
                {isProcessingBilling ? <Loader2 className="w-5 h-5" aria-hidden="true" /> : <FileCheck className="w-5 h-5" aria-hidden="true" />}
                {isProcessingBilling ? 'Procesando...' : 'GENERAR COMPROBANTE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
