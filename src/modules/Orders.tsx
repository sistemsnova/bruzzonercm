import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ListTodo, Plus, Search, User, Calendar, Tag, ShoppingCart,
  Package, DollarSign, Edit3, Trash2, X, Info, Loader2,
  CheckCircle2, AlertCircle, RefreshCw, FileText, Printer,
  ChevronRight, ArrowUpRight, Ban, Save, Truck
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { Product, Client, Order, OrderItem, RemitoItem, Remito } from '../types';

// Mantenemos estas constantes aquí dentro para evitar errores de importación externa
type OrderStatus = 'pendiente_preparacion' | 'listo_retiro' | 'en_camino' | 'entregado' | 'cancelado';

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  'pendiente_preparacion': 'Pendiente',
  'listo_retiro': 'Listo para Retiro',
  'en_camino': 'En Camino',
  'entregado': 'Entregado',
  'cancelado': 'Cancelado',
};

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  'pendiente_preparacion': 'bg-red-50 text-red-700 border-red-100',
  'listo_retiro': 'bg-blue-50 text-blue-700 border-blue-100',
  'en_camino': 'bg-orange-50 text-orange-700 border-orange-100',
  'entregado': 'bg-green-50 text-green-700 border-green-100',
  'cancelado': 'bg-slate-50 text-slate-500 border-slate-100',
};

const ITEMS_PER_PAGE_PICKER = 10;

export const Orders: React.FC = () => {
  const { clients, orders, addOrder, updateOrder, deleteOrder, fetchProductsPaginatedAndFiltered, addRemito } = useFirebase();

  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderFormData, setOrderFormData] = useState<Partial<Order>>({
    clientId: '',
    clientName: '',
    dateCreated: new Date().toISOString().split('T')[0],
    dateDue: '',
    items: [],
    total: 0,
    status: 'pendiente_preparacion',
    notes: '',
    isServiceOrder: false,
  });
  const [orderItemsForm, setOrderItemsForm] = useState<OrderItem[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerProducts, setPickerProducts] = useState<Product[]>([]);
  const [pickerLastVisibleDoc, setPickerLastVisibleDoc] = useState<any>(null);
  const [hasMorePickerProducts, setHasMorePickerProducts] = useState(true);
  const [isPickerProductsLoading, setIsPickerProductsLoading] = useState(false);
  const debounceTimeoutRefPicker = useRef<any>(null);
  const [showServiceItemModal, setShowServiceItemModal] = useState(false);
  const [serviceItemData, setServiceItemData] = useState({ name: '', serviceDescription: '', unitPrice: 0, quantity: 1 });
  const [showGenerateRemitoModal, setShowGenerateRemitoModal] = useState(false);
  const [isGeneratingRemito, setIsGeneratingRemito] = useState(false);
  const [selectedOrderForRemito, setSelectedOrderForRemito] = useState<Order | null>(null);

  const loadPickerProducts = useCallback(async (isNewSearch: boolean = false, searchTerm: string = pickerSearchQuery, currentLastVisibleDoc: any = pickerLastVisibleDoc) => {
    setIsPickerProductsLoading(true);
    try {
      const options = {
        limit: ITEMS_PER_PAGE_PICKER,
        searchTerm: searchTerm.toLowerCase().trim(),
        orderByField: 'name',
        orderDirection: 'asc' as 'asc',
        startAfterDoc: isNewSearch ? undefined : currentLastVisibleDoc,
      };
      const { products: fetchedProducts, lastVisible, hasMore } = await fetchProductsPaginatedAndFiltered(options);
      setPickerProducts(prev => isNewSearch ? fetchedProducts : [...prev, ...fetchedProducts]);
      setPickerLastVisibleDoc(lastVisible);
      setHasMorePickerProducts(hasMore);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setIsPickerProductsLoading(false);
    }
  }, [pickerSearchQuery, pickerLastVisibleDoc, fetchProductsPaginatedAndFiltered]);

  const debouncedPickerSearch = useCallback((value: string) => {
    if (debounceTimeoutRefPicker.current) clearTimeout(debounceTimeoutRefPicker.current);
    debounceTimeoutRefPicker.current = setTimeout(() => { loadPickerProducts(true, value, null); }, 300);
  }, [loadPickerProducts]);

  useEffect(() => {
    if (showProductPicker) {
      setPickerProducts([]);
      setPickerLastVisibleDoc(null);
      setHasMorePickerProducts(true);
      loadPickerProducts(true, pickerSearchQuery, null);
    }
  }, [pickerSearchQuery, showProductPicker, loadPickerProducts]);

  useEffect(() => {
    if (orderFormData.clientId) {
      const client = clients.find(c => c.id === orderFormData.clientId);
      if (client) setOrderFormData(prev => ({ ...prev, clientName: client.name }));
    }
  }, [orderFormData.clientId, clients]);

  useEffect(() => {
    const newTotal = orderItemsForm.reduce((sum, item) => sum + item.subtotal, 0);
    setOrderFormData(prev => ({ ...prev, total: parseFloat(newTotal.toFixed(2)) }));
  }, [orderItemsForm]);

  const openOrderForm = (order: Order | null) => {
    if (order) {
      setActiveOrder(order);
      setOrderFormData(order);
      setOrderItemsForm(order.items);
    } else {
      setActiveOrder(null);
      setOrderFormData({
        clientId: '', clientName: '', dateCreated: new Date().toISOString().split('T')[0],
        dateDue: '', items: [], total: 0, status: 'pendiente_preparacion', notes: '', isServiceOrder: false,
      });
      setOrderItemsForm([]);
    }
    setShowOrderModal(true);
  };

  const addProductToOrder = (product: Product) => {
    const existingIndex = orderItemsForm.findIndex(item => item.productId === product.id && !item.isService);
    if (existingIndex !== -1) {
      const newQty = orderItemsForm[existingIndex].quantity + 1;
      setOrderItemsForm(prev => prev.map((it, i) => i === existingIndex ? { ...it, quantity: newQty, subtotal: it.unitPrice * newQty } : it));
    } else {
      setOrderItemsForm(prev => [...prev, {
        productId: product.id, sku: product.sku, name: product.name, brand: product.brand,
        quantity: 1, unitPrice: product.salePrice, subtotal: product.salePrice, originalProduct: product,
      }]);
    }
    setShowProductPicker(false);
  };

  const handleSaveOrder = async () => {
    if (!orderFormData.clientId || orderItemsForm.length === 0) {
      alert('Selecciona un cliente e ítems.');
      return;
    }
    setIsSavingOrder(true);
    try {
      const data = { ...orderFormData, items: orderItemsForm, total: orderFormData.total || 0 } as Omit<Order, 'id'>;
      if (activeOrder) await updateOrder(activeOrder.id, data);
      else await addOrder(data);
      setShowOrderModal(false);
    } catch (e) { alert('Error al guardar'); }
    finally { setIsSavingOrder(false); }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const mSearch = o.clientName.toLowerCase().includes(filterSearch.toLowerCase()) || o.id.toLowerCase().includes(filterSearch.toLowerCase());
      const mStatus = filterStatus === 'all' || o.status === filterStatus;
      return mSearch && mStatus;
    });
  }, [orders, filterSearch, filterStatus]);

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-lg"><ListTodo className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Pedidos</h1>
            <p className="text-sm text-slate-500">Administra solicitudes de clientes</p>
          </div>
        </div>
        <button onClick={() => openOrderForm(null)} className="bg-orange-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nuevo Pedido
        </button>
      </header>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex gap-4">
           <input 
            type="text" placeholder="Buscar pedido..." 
            className="flex-1 px-4 py-2 border rounded-xl outline-none focus:border-orange-500"
            value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
           />
           <select 
            className="px-4 py-2 border rounded-xl bg-white"
            value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
           >
              <option value="all">Todos los estados</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
           </select>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-xs">{order.id}</td>
                <td className="px-6 py-4 text-sm font-medium">{order.clientName}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase border ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-black">${order.total.toLocaleString()}</td>
                <td className="px-6 py-4 text-center space-x-2">
                  <button onClick={() => openOrderForm(order)} className="p-2 text-slate-400 hover:text-orange-600"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteOrder(order.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* El modal de formulario de pedido simplificado para el ejemplo */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden">
             <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <h2 className="font-black uppercase">Detalle del Pedido</h2>
                <button onClick={() => setShowOrderModal(false)}><X className="w-6 h-6" /></button>
             </div>
             <div className="p-8 space-y-4">
                <select 
                  className="w-full p-3 border rounded-xl"
                  value={orderFormData.clientId} 
                  onChange={e => setOrderFormData({...orderFormData, clientId: e.target.value})}
                >
                  <option value="">Seleccionar Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="border rounded-2xl overflow-hidden">
                   <table className="w-full text-xs">
                      <thead className="bg-slate-50 font-bold">
                        <tr><th className="p-3 text-left">Ítem</th><th className="p-3 text-right">Subtotal</th></tr>
                      </thead>
                      <tbody>
                        {orderItemsForm.map((it, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-3">{it.name} (x{it.quantity})</td>
                            <td className="p-3 text-right font-bold">${it.subtotal}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
                <button onClick={() => setShowProductPicker(true)} className="w-full py-2 bg-slate-100 border-dashed border-2 rounded-xl text-xs font-bold text-slate-500">+ Añadir Producto</button>
             </div>
             <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
                <p className="font-black text-xl">${orderFormData.total}</p>
                <button 
                  onClick={handleSaveOrder} 
                  className="px-8 py-3 bg-orange-600 text-white rounded-xl font-bold uppercase text-xs"
                >
                  {isSavingOrder ? 'Guardando...' : 'Guardar Pedido'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Picker de productos simplificado */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center">
           <div className="bg-white p-8 rounded-3xl w-full max-w-md">
              <input 
                type="text" placeholder="Buscar en inventario..." 
                className="w-full p-3 border rounded-xl mb-4"
                onChange={e => debouncedPickerSearch(e.target.value)}
              />
              <div className="max-h-60 overflow-y-auto space-y-2">
                {pickerProducts.map(p => (
                  <div key={p.id} onClick={() => addProductToOrder(p)} className="p-3 border rounded-xl hover:bg-orange-50 cursor-pointer flex justify-between">
                    <span className="text-sm font-bold">{p.name}</span>
                    <span className="font-black">${p.salePrice}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowProductPicker(false)} className="mt-4 w-full text-xs font-bold text-slate-400">Cerrar</button>
           </div>
        </div>
      )}
    </div>
  );
};