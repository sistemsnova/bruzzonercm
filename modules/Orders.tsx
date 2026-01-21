
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ListTodo, Plus, Search, User, Calendar, Tag, ShoppingCart,
  Package, DollarSign, Edit3, Trash2, X, Info, Loader2,
  CheckCircle2, AlertCircle, RefreshCw, FileText, Printer,
  ChevronRight, ArrowUpRight, Ban, Save // Fix: Added Save icon import
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { Product, Client, Order, OrderItem } from '../types';

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

const Orders: React.FC = () => {
  const { clients, orders, addOrder, updateOrder, deleteOrder, fetchProductsPaginatedAndFiltered } = useFirebase();

  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null); // For editing/viewing
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
  const [orderItemsForm, setOrderItemsForm] = useState<OrderItem[]>([]); // Items being edited in modal
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Product Picker states (reused from Quotes/Sales)
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerProducts, setPickerProducts] = useState<Product[]>([]);
  const [pickerLastVisibleDoc, setPickerLastVisibleDoc] = useState<any>(null);
  const [hasMorePickerProducts, setHasMorePickerProducts] = useState(true);
  const [isPickerProductsLoading, setIsPickerProductsLoading] = useState(false);
  const debounceTimeoutRefPicker = useRef<any>();

  // Service Item states
  const [showServiceItemModal, setShowServiceItemModal] = useState(false);
  const [serviceItemData, setServiceItemData] = useState({
    name: '',
    serviceDescription: '',
    unitPrice: 0,
    quantity: 1,
  });

  const loadPickerProducts = useCallback(async (
    isNewSearch: boolean = false,
    searchTerm: string = pickerSearchQuery,
    currentLastVisibleDoc: any = pickerLastVisibleDoc
  ) => {
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
      console.error("Error loading products for picker:", err);
    } finally {
      setIsPickerProductsLoading(false);
    }
  }, [pickerSearchQuery, pickerLastVisibleDoc, fetchProductsPaginatedAndFiltered]);

  const debouncedPickerSearch = useCallback((value: string) => {
    if (debounceTimeoutRefPicker.current) {
      clearTimeout(debounceTimeoutRefPicker.current);
    }
    debounceTimeoutRefPicker.current = setTimeout(() => {
      loadPickerProducts(true, value, null);
    }, 300);
  }, [loadPickerProducts]);

  useEffect(() => {
    if (showProductPicker) {
      setPickerProducts([]);
      setPickerLastVisibleDoc(null);
      setHasMorePickerProducts(true);
      loadPickerProducts(true, pickerSearchQuery, null);
    }
  }, [pickerSearchQuery, showProductPicker, loadPickerProducts]);

  // Handle client selection in order form
  useEffect(() => {
    if (orderFormData.clientId) {
      const client = clients.find(c => c.id === orderFormData.clientId);
      if (client) {
        setOrderFormData(prev => ({ ...prev, clientName: client.name }));
      }
    } else {
      setOrderFormData(prev => ({ ...prev, clientName: '' }));
    }
  }, [orderFormData.clientId, clients]);

  // Recalculate total whenever order items change
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
      setOrderItemsForm([]);
    }
    setShowOrderModal(true);
  };

  const handleOrderItemQuantityChange = (idx: number, newQuantity: number) => {
    setOrderItemsForm(prev => prev.map((item, i) => {
      if (i === idx) {
        const quantity = Math.max(1, newQuantity);
        const subtotal = item.unitPrice * quantity;
        return { ...item, quantity, subtotal: parseFloat(subtotal.toFixed(2)) };
      }
      return item;
    }));
  };

  const handleRemoveOrderItem = (idx: number) => {
    setOrderItemsForm(prev => prev.filter((_, i) => i !== idx));
  };

  const addProductToOrder = (product: Product) => {
    const existingIndex = orderItemsForm.findIndex(item => item.productId === product.id && !item.isService);
    if (existingIndex !== -1) {
      handleOrderItemQuantityChange(existingIndex, orderItemsForm[existingIndex].quantity + 1);
    } else {
      const unitPrice = product.salePrice; // Use sale price for orders
      setOrderItemsForm(prev => [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          brand: product.brand,
          quantity: 1,
          unitPrice: unitPrice,
          subtotal: parseFloat(unitPrice.toFixed(2)),
          originalProduct: product,
        }
      ]);
    }
    setShowProductPicker(false);
    setPickerSearchQuery('');
  };

  const addServiceToOrder = () => {
    if (!serviceItemData.name || serviceItemData.unitPrice <= 0 || serviceItemData.quantity <= 0) {
      alert('Por favor, completa el nombre, precio y cantidad para el servicio.');
      return;
    }
    const subtotal = serviceItemData.unitPrice * serviceItemData.quantity;
    setOrderItemsForm(prev => [
      ...prev,
      {
        productId: `service-${Date.now()}`, // Unique ID for service
        sku: 'SERVICIO',
        name: serviceItemData.name,
        brand: 'N/A',
        quantity: serviceItemData.quantity,
        unitPrice: serviceItemData.unitPrice,
        subtotal: parseFloat(subtotal.toFixed(2)),
        isService: true,
        serviceDescription: serviceItemData.serviceDescription,
      }
    ]);
    setShowServiceItemModal(false);
    setServiceItemData({ name: '', serviceDescription: '', unitPrice: 0, quantity: 1 });
  };

  const handleSaveOrder = async () => {
    if (!orderFormData.clientId || orderItemsForm.length === 0) {
      alert('Selecciona un cliente y añade al menos un artículo/servicio al pedido.');
      return;
    }
    setIsSavingOrder(true);
    try {
      const orderToSave: Omit<Order, 'id'> = {
        ...orderFormData,
        items: orderItemsForm,
        total: orderItemsForm.reduce((sum, item) => sum + item.subtotal, 0),
        status: orderFormData.status || 'pendiente_preparacion',
        dateCreated: orderFormData.dateCreated || new Date().toISOString().split('T')[0],
        isServiceOrder: orderItemsForm.some(item => item.isService), // Determine if it's a service order based on items
      };

      if (activeOrder) {
        await updateOrder(activeOrder.id, orderToSave);
      } else {
        await addOrder(orderToSave);
      }
      alert('Pedido guardado con éxito!');
      setShowOrderModal(false);
    } catch (error) {
      console.error('Error al guardar el pedido:', error);
      alert('Ocurrió un error al guardar el pedido.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este pedido? Esta acción es irreversible.')) {
      try {
        await deleteOrder(orderId);
        alert('Pedido eliminado con éxito.');
      } catch (error) {
        console.error('Error al eliminar el pedido:', error);
        alert('Ocurrió un error al eliminar el pedido.');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (window.confirm(`¿Estás seguro de cambiar el estado del pedido a "${ORDER_STATUS_LABELS[newStatus]}"?`)) {
      try {
        await updateOrder(orderId, { status: newStatus });
        alert('Estado del pedido actualizado.');
      } catch (error) {
        console.error('Error al actualizar estado del pedido:', error);
        alert('Ocurrió un error al actualizar el estado.');
      }
    }
  };


  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.clientName.toLowerCase().includes(filterSearch.toLowerCase()) || order.id.toLowerCase().includes(filterSearch.toLowerCase());
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()); // Sort by most recent
  }, [orders, filterSearch, filterStatus]);


  const renderProductPickerModal = () => (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4"><div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Plus className="w-6 h-6" /></div><div><h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Añadir Producto</h2><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Busca productos en tu inventario</p></div></div>
          <button onClick={() => setShowProductPicker(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Busca por SKU, nombre o marca..."
              className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-slate-50/50 shadow-sm"
              value={pickerSearchQuery}
              onChange={(e) => {
                setPickerSearchQuery(e.target.value);
                debouncedPickerSearch(e.target.value);
              }}
              autoFocus
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {isPickerProductsLoading && pickerSearchQuery.length > 1 ? (
              <div className="text-center py-10">
                <Loader2 className="w-10 h-10 text-slate-200 mx-auto mb-2 animate-spin" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Buscando productos...</p>
              </div>
            ) : pickerProducts.length > 0 ? (
              pickerProducts.map(item => (
                <div key={item.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group" onClick={() => addProductToOrder(item)}>
                  <div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-orange-500 transition-colors"><Tag className="w-5 h-5" /></div><div><p className="font-bold text-slate-800 text-sm">{item.name}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.sku} • {item.brand}</p></div></div>
                  <div className="flex items-center gap-4 text-right"><div><p className="text-sm font-black text-slate-900">${item.salePrice?.toLocaleString()}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stock: {item.stock}</p></div><div className="p-2 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm"><Plus className="w-5 h-5" /></div></div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <Info className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Escribe para buscar productos del catálogo</p>
              </div>
            )}
          </div>

          {!isPickerProductsLoading && hasMorePickerProducts && (
            <div className="p-4 border-t border-slate-100 flex justify-center">
              <button
                onClick={() => loadPickerProducts(false, pickerSearchQuery, pickerLastVisibleDoc)}
                className="px-8 py-3 bg-white border border-slate-200 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
              >
                Cargar Más
                <ArrowUpRight className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          )}
        </div>
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <div className="flex items-center gap-3 text-slate-400 flex-1"><Info className="w-5 h-5" /><p className="text-[10px] font-bold leading-tight">Selecciona un producto para añadirlo al pedido.</p></div>
          <button onClick={() => setShowProductPicker(false)} className="py-4 px-8 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest">Cerrar</button>
        </div>
      </div>
    </div>
  );

  const renderServiceItemModal = () => (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-blue-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><FileText className="w-6 h-6" /></div>
            <div><h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Añadir Servicio</h2><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Define un ítem de servicio personalizado</p></div>
          </div>
          <button onClick={() => setShowServiceItemModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Servicio</label>
            <input
              type="text"
              value={serviceItemData.name}
              onChange={e => setServiceItemData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Servicio de Flete, Instalación, etc."
              className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción Detallada (Opcional)</label>
            <textarea
              value={serviceItemData.serviceDescription}
              onChange={e => setServiceItemData(prev => ({ ...prev, serviceDescription: e.target.value }))}
              placeholder="Ej: Flete de materiales a obra, CABA. Incluye descarga."
              className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium h-24 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio Unitario ($)</label>
              <input
                type="number"
                value={serviceItemData.unitPrice || ''}
                onChange={e => setServiceItemData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cantidad</label>
              <input
                type="number"
                value={serviceItemData.quantity || ''}
                onChange={e => setServiceItemData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                placeholder="1"
                min="1"
                className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              />
            </div>
          </div>
        </div>
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button onClick={() => setShowServiceItemModal(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest">Cancelar</button>
          <button onClick={addServiceToOrder} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
            Añadir Servicio <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );


  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600 text-white rounded-[1.5rem] shadow-xl"><ListTodo className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Pedidos</h1>
            <p className="text-slate-500 text-sm">Organiza y procesa las solicitudes de productos y servicios de tus clientes.</p>
          </div>
        </div>
        <button
          onClick={() => openOrderForm(null)}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
        >
          <Plus className="w-5 h-5" /> Nuevo Pedido
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente o ID de pedido..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shrink-0 shadow-sm">
              {(['all', 'pendiente_preparacion', 'listo_retiro', 'en_camino', 'entregado', 'cancelado'] as (OrderStatus | 'all')[])
                .map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                      filterStatus === status ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {status === 'all' ? 'Todos' : ORDER_STATUS_LABELS[status as OrderStatus]}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Pedido N°</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Fecha Creación</th>
                <th className="px-6 py-4">Entrega Estimada</th>
                <th className="px-6 py-4 text-center">Items</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-20 text-center flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                      <ListTodo className="w-10 h-10 text-slate-200" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold">No se encontraron pedidos</p>
                      <p className="text-slate-400 text-sm">Prueba ajustando los filtros de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-black text-slate-900">{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                          {order.clientName.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700 text-sm">{order.clientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(order.dateCreated).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order.dateDue ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(order.dateDue).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 bg-white text-slate-600 rounded text-xs font-bold border border-slate-200">
                        {order.items.length} art.
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-slate-900">${order.total.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openOrderForm(order)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver/Editar Pedido"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar Pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="relative group/status-dropdown">
                          <button className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Cambiar Estado">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg z-10 hidden group-hover/status-dropdown:block animate-in fade-in duration-150">
                            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((statusKey) => (
                              <button
                                key={statusKey}
                                onClick={() => handleUpdateOrderStatus(order.id, statusKey)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                              >
                                <span className={`w-3 h-3 rounded-full ${ORDER_STATUS_COLORS[statusKey].split(' ')[0]} ${ORDER_STATUS_COLORS[statusKey].split(' ')[1]}`}></span>
                                {ORDER_STATUS_LABELS[statusKey]}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NEW/EDIT ORDER */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          {showProductPicker && renderProductPickerModal()}
          {showServiceItemModal && renderServiceItemModal()}
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <ListTodo className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{activeOrder ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{activeOrder ? `ID: ${activeOrder.id}` : 'Registro de nueva orden'}</p>
                </div>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* General Order Info */}
              <section className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Cliente
                  </label>
                  <select
                    value={orderFormData.clientId || ''}
                    onChange={e => setOrderFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white"
                  >
                    <option value="">Seleccionar Cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name} ({client.cuit})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Fecha de Entrega/Vencimiento
                  </label>
                  <input
                    type="date"
                    value={orderFormData.dateDue || ''}
                    onChange={e => setOrderFormData(prev => ({ ...prev, dateDue: e.target.value }))}
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas del Pedido</label>
                  <textarea
                    value={orderFormData.notes || ''}
                    onChange={e => setOrderFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Detalles importantes para la preparación o entrega..."
                    className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-medium h-24 resize-none"
                  ></textarea>
                </div>
              </section>

              {/* Order Items */}
              <section className="space-y-6 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-orange-600" /> Artículos y Servicios
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowServiceItemModal(true)}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-blue-100 transition-all"
                    >
                      <FileText className="w-4 h-4" /> Añadir Servicio
                    </button>
                    <button
                      onClick={() => setShowProductPicker(true)}
                      className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-orange-100 transition-all"
                    >
                      <Package className="w-4 h-4" /> Añadir Producto
                    </button>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                      <tr>
                        <th className="px-6 py-3 text-left">Artículo/Servicio</th>
                        <th className="px-6 py-3 text-center">Cant.</th>
                        <th className="px-6 py-3 text-right">Precio Unit.</th>
                        <th className="px-6 py-3 text-right">Subtotal</th>
                        <th className="px-6 py-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderItemsForm.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                            No hay ítems en este pedido.
                          </td>
                        </tr>
                      ) : (
                        orderItemsForm.map((item, idx) => (
                          <tr key={idx} className="text-sm hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.isService ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                  {item.isService ? <FileText className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{item.name}</p>
                                  <p className="text-[10px] text-slate-400 uppercase">{item.isService ? 'Servicio' : `${item.sku} • ${item.brand}`}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleOrderItemQuantityChange(idx, Number(e.target.value))}
                                className="w-20 px-2 py-1 border border-slate-200 rounded-md text-center font-bold"
                                min="1"
                              />
                            </td>
                            <td className="px-6 py-4 text-right">${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-6 py-4 text-right font-black">${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleRemoveOrderItem(idx)}
                                className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {orderItemsForm.length > 0 && (
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <span className="text-xl font-black uppercase tracking-tight">TOTAL PEDIDO</span>
                      <span className="text-4xl font-black text-orange-500">${orderFormData.total?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setShowOrderModal(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest">Cancelar</button>
              <button
                onClick={handleSaveOrder}
                disabled={isSavingOrder || !orderFormData.clientId || orderItemsForm.length === 0}
                className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingOrder ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSavingOrder ? 'Guardando Pedido...' : 'Guardar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
