
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe, ShoppingCart, Layout, Eye, Settings,
  Share2, MousePointer2, Plus, Search, Image as ImageIcon,
  CheckCircle2, X, ArrowUpRight, ShoppingBag, Users,
  Star, Tag, ExternalLink, Camera, Save, Trash2,
  ChevronRight, Laptop, Smartphone, Monitor, Menu, Heart,
  Truck, RefreshCcw, User, Lock, Mail, UserPlus,
  Zap, Package, AlertTriangle, CloudIcon, Link2, Key, Loader2,
  Plug, Send, MapPin, Info
} from 'lucide-react';
import { Product } from '../types'; 
import { useFirebase } from '../context/FirebaseContext'; 

type EcommerceTab = 'dashboard' | 'catalogo' | 'pedidos' | 'diseno'; // Removed mercadolibre and envios tabs

interface EcommerceProps {
  // companyInfo and setCompanyInfo removed as Andreani/ML config moved to Integrations.tsx
}

const ITEMS_PER_PAGE_PICKER = 10; // Number of items to load in the product picker

const mockOnlineOrders = [
  { id: 'ORD-1001', client: 'Alberto Sanchez', date: '2024-05-20', total: 15400, status: 'pendiente', address: 'Calle 1 nro 123' },
  { id: 'ORD-1002', client: 'Maria Gomez', date: '2024-05-21', total: 24500, status: 'entregado', address: 'Av. Siempre Viva 742' },
  { id: 'ORD-1003', client: 'Roberto Garcia', date: '2024-05-21', total: 8900, status: 'pendiente', address: 'Bulnes 500' },
];

const Ecommerce: React.FC<EcommerceProps> = () => {
  const { fetchProductsPaginatedAndFiltered } = useFirebase(); 

  const [activeTab, setActiveTab] = useState<EcommerceTab>('dashboard');

  const [storeProducts, setStoreProducts] = useState<any[]>([
    { id: '1', name: 'Martillo Stanley 20oz', price: 5500, stock: 15, visits: 124, status: 'publicado', img: 'https://images.unsplash.com/photo-1581147036324-c17da42e2602?auto=format&fit=crop&q=80&w=150', mlStatus: 'sync' },
    { id: '2', name: 'Taladro Bosch GSB 650', price: 18500, stock: 8, visits: 89, status: 'publicado', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=150', mlStatus: 'none' },
  ]);

  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [showCustomerAuth, setShowCustomerAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [customerSession, setCustomerSession] = useState<{name: string} | null>(null);
  
  // New states for product picker search
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerProducts, setPickerProducts] = useState<Product[]>([]);
  const [pickerLastVisibleDoc, setPickerLastVisibleDoc] = useState<any>(null);
  const [hasMorePickerProducts, setHasMorePickerProducts] = useState(true);
  const [isPickerProductsLoading, setIsPickerProductsLoading] = useState(false);

  // Removed ML and Andreani related states

  // Fix: Initialize useRef with null to satisfy TypeScript requirement
  const debounceTimeoutRefPicker = useRef<any>(null);

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
        startAfterDoc: isNewSearch ? undefined : currentLastVisibleDoc,
        orderByField: 'name', 
        orderDirection: 'asc' as 'asc' 
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
      loadPickerProducts(true, value, null); // Trigger a new search for the picker
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


  const handleViewStore = () => {
    setShowPublicPreview(true);
  };

  // Removed ML Sync handler
  // Removed ML Connection handler
  // Removed Save ML Settings handler
  // Removed Andreani Handlers
  // Removed Andreani Connection handler
  // Removed Save Andreani Settings handler
  // Removed Andreani Shipment handler

  const addToStore = (item: Product) => {
    setStoreProducts([...storeProducts, {
      id: item.id,
      name: item.name,
      price: item.salePrice || 0,
      stock: item.stock,
      visits: 0,
      status: 'publicado',
      img: 'https://images.unsplash.com/photo-1581147036324-c17da42e2602?auto=format&fit=crop&q=80&w=150', // Generic image
      mlStatus: 'none'
    }]);
    // setShowProductPicker(false); // Keep modal open for adding multiple
    // setPickerSearchQuery(''); // Clear search after adding one
  };

  const renderCustomerAuthModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-8 text-center space-y-2">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {authMode === 'login' ? <User className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {authMode === 'login' ? '¡Hola de nuevo!' : 'Crea tu cuenta'}
          </h3>
          <p className="text-slate-500 text-sm">Ingresa a Ferretería Norte para comprar.</p>
        </div>

        <div className="px-8 pb-8 space-y-4">
          {authMode === 'register' && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" placeholder="Tu nombre..." />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" placeholder="email@ejemplo.com" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold" placeholder="••••••••" />
            </div>
          </div>

          <button 
            onClick={() => {
              setCustomerSession({ name: 'Cliente Demo' });
              setShowCustomerAuth(false);
            }}
            className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all mt-4"
          >
            {authMode === 'login' ? 'Iniciar Sesión' : 'Registrarme ahora'}
          </button>
          <p className="text-center text-xs font-bold text-slate-400 pt-4">
            {authMode === 'login' ? '¿No tienes cuenta?' : '¿Ya eres cliente?'}
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-orange-600 ml-1 hover:underline"
            >
              {authMode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
            </button>
          </p>
        </div>
        <button onClick={() => setShowCustomerAuth(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderPublicPreview = () => (
    <div className="fixed inset-0 bg-white z-[200] overflow-y-auto animate-in fade-in duration-300 flex flex-col">
      {showCustomerAuth && renderCustomerAuthModal()}
      <div className="bg-slate-100 p-3 flex justify-between items-center border-b sticky top-0 z-50">
        <div className="flex gap-1.5 ml-4"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-yellow-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div></div>
        <div className="bg-white border rounded-full px-8 py-1.5 text-xs text-slate-500 font-bold flex items-center gap-2"><Globe className="w-3 h-3" /> https://ferreteria-norte.tiendafort.com</div>
        <button onClick={() => setShowPublicPreview(false)} className="mr-4 p-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all flex items-center gap-2 px-4 py-2 font-black text-[10px] uppercase tracking-widest shadow-lg"><X className="w-4 h-4" /> Salir de vista previa</button>
      </div>
      <div className="max-w-6xl mx-auto w-full flex-1 pb-20">
        <header className="p-8 flex justify-between items-center bg-white border-b">
          <div className="flex items-center gap-3"><div className="p-2 bg-orange-500 rounded-lg text-white"><ShoppingBag className="w-6 h-6" /></div><span className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Ferretería Norte</span></div>
          <nav className="hidden md:flex gap-8 font-bold text-slate-500 uppercase text-xs tracking-widest"><a href="#" className="text-orange-600 border-b-2 border-orange-500 pb-1">Inicio</a><a href="#" className="hover:text-orange-500 transition-colors">Productos</a><a href="#" className="hover:text-orange-500 transition-colors">Contacto</a></nav>
          <div className="flex items-center gap-6">
            <button onClick={() => customerSession ? setCustomerSession(null) : setShowCustomerAuth(true)} className="flex items-center gap-2 font-bold text-slate-700 hover:text-orange-600 transition-colors">{customerSession ? (<div className="flex items-center gap-2"><div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200"><User className="w-4 h-4" /></div><span className="text-xs uppercase tracking-widest hidden lg:block">{customerSession.name}</span></div>) : (<div className="flex items-center gap-2"><User className="w-5 h-5" /><span className="text-xs uppercase tracking-widest hidden lg:block">Ingresar</span></div>)}</button>
            <button className="relative"><ShoppingCart className="w-6 h-6 text-slate-700" /><span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">0</span></button>
          </div>
        </header>
        <section className="px-8 mt-8"><div className="w-full h-[400px] bg-slate-900 rounded-[2.5rem] relative overflow-hidden flex items-center p-16 group"><div className="relative z-10 space-y-6 max-w-lg"><span className="bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">Oferta de Lanzamiento</span><h1 className="text-5xl font-black text-white leading-tight">Equipá tu taller con lo mejor</h1><p className="text-slate-400 text-lg font-medium leading-relaxed">Envíos gratis en compras superiores a $50.000. Pagá en 3 cuotas sin interés.</p><button className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95">Ver Ofertas</button></div><img src="https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000" alt="Banner" /><div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent"></div></div></section>
        <section className="px-8 mt-12 overflow-x-auto"><div className="flex gap-4">{['Herramientas Eléctricas', 'Pinturas', 'Bulonería', 'Electricidad', 'Jardín'].map(c => (<button key={c} className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl whitespace-nowrap text-xs font-black text-slate-500 uppercase tracking-widest hover:border-orange-500 hover:border-orange-600 transition-all shadow-sm">{c}</button>))}</div></section>
        <section className="px-8 mt-16 space-y-8"><div className="flex justify-between items-end"><h2 className="text-3xl font-black text-slate-800 tracking-tight">Productos Destacados</h2><button className="text-orange-600 font-black text-sm uppercase tracking-widest flex items-center gap-1 hover:underline">Ver todo <ChevronRight className="w-4 h-4" /></button></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{storeProducts.filter(p => p.status === 'publicado').map(p => (<div key={p.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 group hover:shadow-2xl transition-all duration-300"><div className="aspect-square relative overflow-hidden bg-slate-50"><img src={p.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} /></div><div className="p-6 space-y-3"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ferretería Norte</p><h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2 min-h-[3rem]">{p.name}</h3><div className="pt-2 flex justify-between items-center"><p className="text-2xl font-black text-slate-900">${p.price.toLocaleString()}</p><button className="p-3 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all shadow-lg active:scale-90"><Plus className="w-5 h-5" /></button></div></div></div>))}</div></section>
        <footer className="mt-32 border-t pt-20 px-8 text-center space-y-8"><div className="flex items-center justify-center gap-3"><div className="p-2 bg-slate-800 rounded-lg text-white"><ShoppingBag className="w-6 h-6" /></div><span className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Ferretería Norte</span></div><p className="text-slate-400 text-xs font-medium">© 2025 FerroGest Ecommerce. Todos los derechos reservados.</p></footer>
      </div>
    </div>
  );

  // Removed renderMLTab
  // Removed renderEnviosTab

  const renderPedidosTab = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-600" /> Pedidos Online Pendientes
          </h4>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold" placeholder="Buscar pedido..." />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-5">Pedido #</th>
              <th className="px-8 py-5">Cliente</th>
              <th className="px-8 py-5">Fecha</th>
              <th className="px-8 py-5 text-right">Total</th>
              <th className="px-8 py-5 text-center">Estado</th>
              <th className="px-8 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockOnlineOrders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-4">
                  <p className="font-bold text-slate-800 text-sm">{order.id}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    <MapPin className="inline w-3 h-3 mr-1" /> {order.address}
                  </p>
                </td>
                <td className="px-8 py-4">
                  <p className="font-bold text-slate-800 text-sm">{order.client}</p>
                </td>
                <td className="px-8 py-4 text-sm font-medium text-slate-600">{order.date}</td>
                <td className="px-8 py-4 text-right font-black text-slate-900 text-sm">${order.total.toLocaleString()}</td>
                <td className="px-8 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    order.status === 'pendiente' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-green-50 text-green-700 border-green-100'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-8 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      className="p-2 text-slate-300 hover:text-blue-600 transition-all"
                      title="Ver Detalle"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    {/* Removed Andreani shipment button */}
                    <button 
                        disabled 
                        className="p-2 text-slate-300 disabled:opacity-50" 
                        title="Integración de Envíos"
                      >
                        <Truck className="w-4 h-4" />
                      </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );


  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><ShoppingBag className="w-6 h-6" /></div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+14%</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Online (Mes)</p>
          <h3 className="text-2xl font-black text-slate-800">$840.500</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Users className="w-6 h-6" /></div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+5%</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visitas Únicas</p>
          <h3 className="text-2xl font-black text-slate-800">12.480</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl"><MousePointer2 className="w-6 h-6" /></div>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Estable</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conv. Checkout</p>
          <h3 className="text-2xl font-black text-slate-800">3.2%</h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1 relative z-10">Estado del Dominio</p>
          <h3 className="text-lg font-bold relative z-10">ferreteria-norte.com</h3>
          <div className="flex items-center gap-2 mt-4 relative z-10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">SSL Activo</span>
          </div>
          <Globe className="absolute -bottom-6 -right-6 w-24 h-24 text-white/5 rotate-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 rounded-[3rem] p-10 flex flex-col items-center justify-center gap-8 border border-slate-200">
           <div className="flex gap-4">
             <button className="p-3 bg-white shadow-sm rounded-xl text-orange-600"><Monitor className="w-5 h-5" /></button>
             <button className="p-3 bg-slate-200 shadow-sm rounded-xl text-slate-500"><Laptop className="w-5 h-5" /></button>
             <button className="p-3 bg-slate-200 shadow-sm rounded-xl text-slate-500"><Smartphone className="w-5 h-5" /></button>
           </div>
           <div onClick={handleViewStore} className="w-full aspect-video bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 group relative cursor-pointer">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                 <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400"></div><div className="w-2 h-2 rounded-full bg-yellow-400"></div><div className="w-2 h-2 rounded-full bg-green-400"></div></div>
                 <div className="bg-white border rounded-lg px-4 py-0.5 text-[9px] text-slate-400 font-bold">https://ferreteria-norte.com</div>
                 <div className="w-4"></div>
              </div>
              <div className="p-8 space-y-6">
                 <div className="w-full h-32 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-300 font-black text-xl uppercase tracking-widest">Banner Oferta</div>
                 <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => (<div key={i} className="aspect-square bg-slate-50 rounded-xl"></div>))}</div>
              </div>
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <button className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"><Eye className="w-4 h-4" /> Previsualizar Tienda</button>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Acciones Rápidas</h4>
           <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setActiveTab('diseno')} className="p-8 bg-white border border-slate-100 rounded-[2rem] text-center space-y-4 hover:shadow-xl transition-all group">
                 <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl mx-auto group-hover:scale-110 transition-transform"><Camera className="w-6 h-6" /></div>
                 <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Subir Banners</p>
              </button>
              {/* Removed MercadoLibre button */}
              <button onClick={() => { /* Navigate to Integrations or show info */ }} className="p-8 bg-yellow-50 border border-yellow-200 rounded-[2rem] text-center space-y-4 hover:shadow-xl transition-all group">
                 <div className="p-4 bg-yellow-400 text-slate-900 rounded-2xl mx-auto group-hover:scale-110 transition-transform"><Zap className="w-6 h-6 fill-current" /></div>
                 <p className="text-xs font-black text-slate-800 uppercase tracking-widest">MercadoLibre</p>
              </button>
              {/* Removed Envios button */}
              <button onClick={() => { /* Navigate to Integrations or show info */ }} className="p-8 bg-blue-50 border border-blue-200 rounded-[2rem] text-center space-y-4 hover:shadow-xl transition-all group">
                 <div className="p-4 bg-blue-400 text-white rounded-2xl mx-auto group-hover:scale-110 transition-transform"><Truck className="w-6 h-6" /></div>
                 <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Gestión de Envíos</p>
              </button>
              <button onClick={handleViewStore} className="p-8 bg-white border border-slate-100 rounded-[2rem] text-center space-y-4 hover:shadow-xl transition-all group">
                 <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl mx-auto group-hover:scale-110 transition-transform"><ExternalLink className="w-6 h-6" /></div>
                 <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Ver mi Sitio</p>
              </button>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {showPublicPreview && renderPublicPreview()}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600 text-white rounded-[1.5rem] shadow-xl"><Globe className="w-6 h-6" /></div>
          <div><h1 className="text-2xl font-bold text-slate-800 tracking-tight">Multi-Channel Management</h1><p className="text-slate-500 text-sm">Vende en tu propia tienda y MercadoLibre sincronizado.</p></div>
        </div>
        <div className="flex gap-2">
           <button onClick={handleViewStore} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-xs uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"><Eye className="w-4 h-4" /> Ver Tienda</button>
           <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">Publicar Cambios</button>
        </div>
      </header>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Laptop },
          { id: 'catalogo', label: 'Catálogo Web', icon: Tag },
          // Removed MercadoLibre tab here
          { id: 'pedidos', label: 'Pedidos Online', icon: ShoppingBag },
          // Removed Envíos & Integraciones tab here
          { id: 'diseno', label: 'Personalización UI', icon: Layout },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as EcommerceTab)} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><tab.icon className="w-4 h-4" />{tab.label}</button>
        ))}
      </div>

      <div className="py-2">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'catalogo' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center">
               <div className="relative w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none text-sm font-bold" placeholder="Buscar en tienda..." /></div>
               <button 
                 onClick={() => {
                   setShowProductPicker(true);
                   setPickerSearchQuery(''); // Clear search on modal open
                   setPickerProducts([]); // Clear old results
                   setPickerLastVisibleDoc(null);
                   setHasMorePickerProducts(true);
                 }} 
                 className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
               >
                 <Plus className="w-4 h-4" /> Agregar desde Inventario
               </button>
            </div>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b"><tr><th className="px-8 py-5">Producto Web</th><th className="px-8 py-5">Estado</th><th className="px-8 py-5 text-center">Stock</th><th className="px-8 py-5 text-right">Precio Web</th><th className="px-8 py-5 text-center">Visitas</th><th className="px-8 py-5 text-center">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{storeProducts.map(p => (<tr key={p.id} className="hover:bg-slate-50/50 transition-colors"><td className="px-8 py-4"><div className="flex items-center gap-4"><img src={p.img} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm" /><div className="font-bold text-slate-800 text-sm">{p.name}</div></div></td><td className="px-8 py-4"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${p.status === 'publicado' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{p.status}</span></td><td className="px-8 py-4 text-center text-sm font-black text-slate-700">{p.stock}</td><td className="px-8 py-4 text-right font-black text-slate-900">${p.price.toLocaleString()}</td><td className="px-8 py-4 text-center font-bold text-slate-500 text-xs">{p.visits}</td><td className="px-8 py-4 text-center"><div className="flex items-center justify-center gap-2"><button className="p-2 text-slate-300 hover:text-orange-600 transition-all"><Settings className="w-4 h-4" /></button><button className="p-2 text-slate-300 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button></div></td></tr>))}</tbody></table></div>
          </div>
        )}
        {/* Removed mercadolibre tab content */}
        {activeTab === 'pedidos' && renderPedidosTab()}
        {/* Removed envios tab content */}
        {activeTab === 'diseno' && (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8"><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Layout className="w-6 h-6 text-orange-600" /> Configuración de Diseño</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-12"><div className="space-y-6"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Color Principal</label><div className="flex gap-4"><input type="color" defaultValue="#f97316" className="w-12 h-12 rounded-xl border-none p-0 cursor-pointer" /><input className="flex-1 px-5 py-3 border border-slate-200 rounded-xl font-bold uppercase" defaultValue="#F97316" /></div></div><div className="space-y-4 pt-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Opciones de Cabecera</p><div className="grid grid-cols-1 gap-2"><label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group hover:border-orange-500 transition-all"><span className="text-xs font-bold text-slate-700">Mostrar buscador prominente</span><input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-orange-600" /></label><label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group hover:border-orange-500 transition-all"><span className="text-xs font-bold text-slate-700">Habilitar Portal de Clientes</span><input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-orange-600" /></label></div></div></div><div className="bg-slate-100 rounded-[2.5rem] p-8 border border-slate-200 flex flex-col items-center justify-center text-center space-y-4"><Monitor className="w-12 h-12 text-slate-300" /><p className="text-sm font-bold text-slate-400">Los cambios se aplican globalmente al publicar.</p><button onClick={handleViewStore} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">Abrir Previsualizador</button></div></div></div>
        )}
      </div>

      {/* Modal: PRODUCT PICKER FROM INVENTORY */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4"><div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Plus className="w-6 h-6" /></div><div><h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Vincular a Tienda</h2><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Busca productos en tu inventario para publicar</p></div></div>
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
                    <div key={item.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group" onClick={() => addToStore(item)}>
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
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4"><div className="flex items-center gap-3 text-slate-400 flex-1"><ImageIcon className="w-5 h-5" /><p className="text-[10px] font-bold leading-tight">Al vincular, se tomarán los datos de stock y precio automáticamente.</p></div><button onClick={() => setShowProductPicker(false)} className="py-4 px-8 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest">Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ecommerce;
