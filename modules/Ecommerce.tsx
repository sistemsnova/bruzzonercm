
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe, ShoppingCart, Layout, Eye, Settings,
  Share2, MousePointer2, Plus, Search, Image as ImageIcon,
  CheckCircle2, X, ArrowUpRight, ShoppingBag, Users,
  Star, Tag, ExternalLink, Camera, Save, Trash2,
  ChevronRight, Laptop, Smartphone, Monitor, Menu, Heart,
  Truck, RefreshCcw, User, Lock, Mail, UserPlus,
  Zap, Package, AlertTriangle, CloudIcon, Link2, Key, Loader2,
  Plug, Send, MapPin, Info, Smartphone as MobileIcon,
  MessageCircle, Home, Navigation, PhoneCall
} from 'lucide-react';
import { Product } from '../types'; 
import { useFirebase } from '../context/FirebaseContext'; 

type EcommerceTab = 'dashboard' | 'catalogo' | 'pedidos' | 'diseno';

const ITEMS_PER_PAGE_PICKER = 10;

const mockOnlineOrders = [
  { id: 'ORD-1001', client: 'Alberto Sanchez', date: '2024-05-20', total: 15400, status: 'pendiente', address: 'Calle 1 nro 123' },
  { id: 'ORD-1002', client: 'Maria Gomez', date: '2024-05-21', total: 24500, status: 'entregado', address: 'Av. Siempre Viva 742' },
  { id: 'ORD-1003', client: 'Roberto Garcia', date: '2024-05-21', total: 8900, status: 'pendiente', address: 'Bulnes 500' },
];

const Ecommerce: React.FC = () => {
  const { fetchProductsPaginatedAndFiltered } = useFirebase(); 

  const [activeTab, setActiveTab] = useState<EcommerceTab>('dashboard');
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');

  const [storeProducts, setStoreProducts] = useState<any[]>([
    { id: '1', name: 'Martillo Stanley 20oz Pro', price: 15500, stock: 15, visits: 124, status: 'publicado', img: 'https://images.unsplash.com/photo-1581147036324-c17da42e2602?auto=format&fit=crop&q=80&w=300', mlStatus: 'sync' },
    { id: '2', name: 'Taladro Bosch GSB 650 13mm', price: 88500, stock: 8, visits: 89, status: 'publicado', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=300', mlStatus: 'none' },
    { id: '3', name: 'Pintura Alba Latex 20L', price: 42300, stock: 20, visits: 245, status: 'publicado', img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=300', mlStatus: 'sync' },
    { id: '4', name: 'Juego de Llaves Combinadas', price: 12900, stock: 12, visits: 56, status: 'publicado', img: 'https://images.unsplash.com/photo-1621905252507-b35222028781?auto=format&fit=crop&q=80&w=300', mlStatus: 'none' },
  ]);

  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [showCustomerAuth, setShowCustomerAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [customerSession, setCustomerSession] = useState<{name: string} | null>(null);
  
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerProducts, setPickerProducts] = useState<Product[]>([]);
  const [pickerLastVisibleDoc, setPickerLastVisibleDoc] = useState<any>(null);
  const [hasMorePickerProducts, setHasMorePickerProducts] = useState(true);
  const [isPickerProductsLoading, setIsPickerProductsLoading] = useState(false);

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
      // Fix: Corrected typo in setter function name to match state variable
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

  const addToStore = (item: Product) => {
    setStoreProducts([...storeProducts, {
      id: item.id,
      name: item.name,
      price: item.salePrice || 0,
      stock: item.stock,
      visits: 0,
      status: 'publicado',
      img: 'https://images.unsplash.com/photo-1581147036324-c17da42e2602?auto=format&fit=crop&q=80&w=300',
      mlStatus: 'none'
    }]);
    alert(`${item.name} agregado a la tienda.`);
  };

  const renderPublicStore = (mode: 'mobile' | 'desktop') => (
    <div className={`bg-white h-full flex flex-col ${mode === 'mobile' ? 'w-full max-w-[375px] mx-auto shadow-2xl border-[8px] border-slate-900 rounded-[3rem] overflow-hidden' : 'w-full'}`}>
      {/* Header Store */}
      <header className={`p-4 flex justify-between items-center bg-white border-b sticky top-0 z-[60] ${mode === 'mobile' ? 'rounded-t-[2rem]' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-600 rounded-lg text-white"><ShoppingBag className="w-4 h-4" /></div>
          <span className="text-lg font-black text-slate-800 tracking-tighter uppercase italic">Sistems Nova</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative"><ShoppingCart className="w-5 h-5 text-slate-700" /><span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">2</span></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 pb-20">
        {/* Banner */}
        <section className="p-4">
          <div className="w-full aspect-[16/9] bg-slate-900 rounded-2xl relative overflow-hidden flex items-center p-6">
            <div className="relative z-10 space-y-2">
              <span className="bg-orange-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Super Oferta</span>
              <h1 className="text-xl font-black text-white leading-tight">TODO EN HERRAMIENTAS</h1>
              <button className="bg-white text-slate-900 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-xl">Ver más</button>
            </div>
            <img src="https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400" className="absolute inset-0 w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 to-transparent"></div>
          </div>
        </section>

        {/* Categories Circle */}
        <section className="px-4 py-2 overflow-x-auto no-scrollbar flex gap-4">
          {['Pinturas', 'Eléctricas', 'Buloneria', 'Plomeria'].map(c => (
            <div key={c} className="flex flex-col items-center gap-1 shrink-0">
               <div className="w-14 h-14 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-orange-600 font-bold text-[8px]"><Package className="w-6 h-6" /></div>
               <span className="text-[9px] font-bold text-slate-500 uppercase">{c}</span>
            </div>
          ))}
        </section>

        {/* Product Grid */}
        <section className="px-4 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Los más vendidos</h2>
            <button className="text-orange-600 font-bold text-[10px] uppercase">Ver todos</button>
          </div>
          <div className={`grid ${mode === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'} gap-4`}>
            {storeProducts.map(p => (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex flex-col">
                <div className="aspect-square relative bg-slate-50 overflow-hidden">
                  <img src={p.img} className="w-full h-full object-cover" />
                  <button className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-slate-400 hover:text-red-500 transition-colors"><Heart className="w-3 h-3" /></button>
                </div>
                <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-[11px] leading-tight line-clamp-2">{p.name}</h3>
                    <p className="text-xs font-black text-slate-900 mt-1">${p.price.toLocaleString()}</p>
                  </div>
                  <button className="w-full py-1.5 bg-orange-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md">Comprar</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Mobile Nav Bar */}
      <nav className={`bg-white border-t p-3 flex justify-around items-center sticky bottom-0 z-[60] ${mode === 'mobile' ? 'rounded-b-[2rem]' : ''}`}>
        <button className="flex flex-col items-center gap-1 text-orange-600"><Home className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Inicio</span></button>
        <button className="flex flex-col items-center gap-1 text-slate-400"><Search className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Buscar</span></button>
        <button className="flex flex-col items-center gap-1 text-slate-400 relative"><ShoppingCart className="w-5 h-5" /><span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[7px] w-3 h-3 rounded-full flex items-center justify-center">2</span><span className="text-[8px] font-black uppercase">Carrito</span></button>
        <button className="flex flex-col items-center gap-1 text-slate-400"><User className="w-5 h-5" /><span className="text-[8px] font-black uppercase">Perfil</span></button>
      </nav>

      {/* Floating Action Buttons simulation for mobile */}
      {mode === 'mobile' && (
        <div className="absolute bottom-20 right-6 z-[70] flex flex-col gap-3">
          <button className="p-3 bg-green-500 text-white rounded-full shadow-2xl animate-bounce"><MessageCircle className="w-5 h-5" /></button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {showPublicPreview && (
        <div className="fixed inset-0 bg-slate-900/95 z-[200] flex flex-col animate-in fade-in duration-300">
           <div className="p-4 flex justify-between items-center bg-slate-800 text-white">
              <div className="flex items-center gap-4">
                 <Globe className="w-5 h-5 text-orange-500" />
                 <span className="font-bold text-sm tracking-tight">Vista Previa: Ferretería Norte Tienda Online</span>
              </div>
              <div className="flex bg-slate-700 p-1 rounded-xl">
                 <button onClick={() => setPreviewMode('mobile')} className={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Smartphone className="w-4 h-4" /></button>
                 <button onClick={() => setPreviewMode('desktop')} className={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Monitor className="w-4 h-4" /></button>
              </div>
              <button onClick={() => setShowPublicPreview(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"><X className="w-5 h-5" /></button>
           </div>
           <div className="flex-1 overflow-hidden p-8 flex items-center justify-center">
              {renderPublicStore(previewMode)}
           </div>
        </div>
      )}

      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600 text-white rounded-[1.5rem] shadow-xl"><Globe className="w-6 h-6" /></div>
          <div><h1 className="text-2xl font-bold text-slate-800 tracking-tight italic">E-Commerce & Mobile Store</h1><p className="text-slate-500 text-sm">Tu ferretería abierta las 24hs en el bolsillo del cliente.</p></div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => { setShowPublicPreview(true); setPreviewMode('mobile'); }} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-xs uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"><MobileIcon className="w-4 h-4 text-orange-600" /> Ver en Celular</button>
           <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg">Publicar Cambios</button>
        </div>
      </header>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        {[
          { id: 'dashboard', label: 'App Dashboard', icon: Laptop },
          { id: 'catalogo', label: 'Catálogo Online', icon: Tag },
          { id: 'pedidos', label: 'Pedidos Web', icon: ShoppingBag },
          { id: 'diseno', label: 'UX Mobile Custom', icon: Layout },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as EcommerceTab)} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><tab.icon className="w-4 h-4" />{tab.label}</button>
        ))}
      </div>

      <div className="py-2">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
             <div className="lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                      <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><ShoppingBag className="w-8 h-8" /></div>
                      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Ventas Web</p><h3 className="text-2xl font-black text-slate-800">124</h3></div>
                   </div>
                   <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                      <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Users className="w-8 h-8" /></div>
                      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Clientes Web</p><h3 className="text-2xl font-black text-slate-800">482</h3></div>
                   </div>
                   <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white flex items-center gap-5">
                      <div className="p-4 bg-white/10 rounded-2xl"><Zap className="w-8 h-8 text-orange-500" /></div>
                      <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Sincronización</p><h3 className="text-lg font-black text-white">ACTIVA 100%</h3></div>
                   </div>
                </div>

                <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Monitor className="w-6 h-6 text-blue-600" /> Rendimiento Multicanal</h3>
                   <div className="space-y-6">
                      {[
                        { name: 'Tienda Directa', val: '65%', color: 'bg-orange-500' },
                        { name: 'MercadoLibre', val: '25%', color: 'bg-yellow-400' },
                        { name: 'WhatsApp Bot', val: '10%', color: 'bg-green-500' },
                      ].map(c => (
                        <div key={c.name} className="space-y-2">
                           <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest"><span className="text-slate-500">{c.name}</span><span className="text-slate-900">{c.val}</span></div>
                           <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${c.color}`} style={{ width: c.val }}></div></div>
                        </div>
                      ))}
                   </div>
                </section>
             </div>

             <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-slate-50 rounded-[3rem] p-6 border-2 border-slate-100 flex flex-col items-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Mobile Mockup</p>
                   <div className="w-full max-w-[280px] aspect-[9/18.5] bg-slate-900 rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 inset-x-0 h-4 flex justify-center"><div className="w-16 h-4 bg-slate-800 rounded-b-xl"></div></div>
                      {renderPublicStore('mobile')}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button onClick={() => { setShowPublicPreview(true); setPreviewMode('mobile'); }} className="bg-white text-slate-900 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 shadow-xl scale-110"><Eye className="w-4 h-4" /> Expandir</button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'catalogo' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center">
               <div className="relative w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none text-sm font-bold" placeholder="Buscar en tienda..." /></div>
               <button onClick={() => setShowProductPicker(true)} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95 transition-all"><Plus className="w-4 h-4" /> Agregar desde Inventario</button>
            </div>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b"><tr><th className="px-8 py-5">Producto Web</th><th className="px-8 py-5">Estado</th><th className="px-8 py-5 text-center">Stock</th><th className="px-8 py-5 text-right">Precio Web</th><th className="px-8 py-5 text-center">Visitas</th><th className="px-8 py-5 text-center">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{storeProducts.map(p => (<tr key={p.id} className="hover:bg-slate-50/50 transition-colors"><td className="px-8 py-4"><div className="flex items-center gap-4"><img src={p.img} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm" /><div className="font-bold text-slate-800 text-sm">{p.name}</div></div></td><td className="px-8 py-4"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${p.status === 'publicado' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{p.status}</span></td><td className="px-8 py-4 text-center text-sm font-black text-slate-700">{p.stock}</td><td className="px-8 py-4 text-right font-black text-slate-900">${p.price.toLocaleString()}</td><td className="px-8 py-4 text-center font-bold text-slate-500 text-xs">{p.visits}</td><td className="px-8 py-4 text-center"><div className="flex items-center justify-center gap-2"><button className="p-2 text-slate-300 hover:text-orange-600 transition-all"><Settings className="w-4 h-4" /></button><button className="p-2 text-slate-300 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button></div></td></tr>))}</tbody></table></div>
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"><div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center"><h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-orange-600" /> Pedidos Online Pendientes</h4></div><table className="w-full text-left"><thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b"><tr><th className="px-8 py-5">Pedido #</th><th className="px-8 py-5">Cliente</th><th className="px-8 py-5">Fecha</th><th className="px-8 py-5 text-right">Total</th><th className="px-8 py-5 text-center">Estado</th><th className="px-8 py-5 text-center">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{mockOnlineOrders.map(order => (<tr key={order.id} className="hover:bg-slate-50/50 transition-colors"><td className="px-8 py-4"><p className="font-bold text-slate-800 text-sm">{order.id}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest"><MapPin className="inline w-3 h-3 mr-1" /> {order.address}</p></td><td className="px-8 py-4"><p className="font-bold text-slate-800 text-sm">{order.client}</p></td><td className="px-8 py-4 text-sm font-medium text-slate-600">{order.date}</td><td className="px-8 py-4 text-right font-black text-slate-900 text-sm">${order.total.toLocaleString()}</td><td className="px-8 py-4 text-center"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${order.status === 'pendiente' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{order.status}</span></td><td className="px-8 py-4 text-center"><div className="flex items-center justify-center gap-2"><button className="p-2 text-slate-300 hover:text-blue-600 transition-all" title="Ver Detalle"><ExternalLink className="w-4 h-4" /></button><button disabled className="p-2 text-slate-300 disabled:opacity-50" title="Integración de Envíos"><Truck className="w-4 h-4" /></button></div></td></tr>))}</tbody></table></div>
          </div>
        )}

        {activeTab === 'diseno' && (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-12 animate-in slide-in-from-bottom duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                   <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Layout className="w-6 h-6 text-orange-600" /> Personalización Mobile UI</h3>
                   
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Color de Marca (Botones y TabBar)</label>
                         <div className="flex gap-4 items-center">
                            <input type="color" defaultValue="#f97316" className="w-14 h-14 rounded-2xl border-none p-0 cursor-pointer shadow-lg" />
                            <input className="flex-1 px-5 py-4 border-2 border-slate-100 rounded-2xl font-black uppercase outline-none focus:ring-2 focus:ring-orange-500" defaultValue="#F97316" />
                         </div>
                      </div>

                      <div className="space-y-4">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Botones de Acción Flotante (Mobile)</p>
                         <div className="grid grid-cols-1 gap-3">
                            <label className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 cursor-pointer group hover:border-orange-500 transition-all">
                               <div className="flex items-center gap-4"><div className="p-2 bg-green-100 text-green-600 rounded-lg"><MessageCircle className="w-5 h-5" /></div><span className="text-xs font-black uppercase text-slate-700">Botón WhatsApp Flotante</span></div>
                               <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-orange-600" />
                            </label>
                            <label className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 cursor-pointer group hover:border-orange-500 transition-all">
                               <div className="flex items-center gap-4"><div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Navigation className="w-5 h-5" /></div><span className="text-xs font-black uppercase text-slate-700">Botón "Como llegar" (Maps)</span></div>
                               <input type="checkbox" className="w-5 h-5 rounded accent-orange-600" />
                            </label>
                            <label className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 cursor-pointer group hover:border-orange-500 transition-all">
                               <div className="flex items-center gap-4"><div className="p-2 bg-red-100 text-red-600 rounded-lg"><PhoneCall className="w-5 h-5" /></div><span className="text-xs font-black uppercase text-slate-700">Botón Llamar Ahora</span></div>
                               <input type="checkbox" defaultChecked className="w-5 h-5 rounded accent-orange-600" />
                            </label>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-600/10 rounded-full blur-3xl"></div>
                   <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
                   
                   <div className="p-6 bg-white/5 rounded-full backdrop-blur-md mb-4 border border-white/10"><Smartphone className="w-16 h-16 text-orange-500" /></div>
                   <h4 className="text-white font-black text-xl uppercase tracking-tight">Experiencia Optimizada</h4>
                   <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs">El diseño mobile-first asegura que tus clientes compren cómodamente desde la obra o su casa.</p>
                   
                   <div className="flex gap-2 pt-4">
                      <button onClick={() => { setShowPublicPreview(true); setPreviewMode('mobile'); }} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-orange-500 hover:text-white transition-all">Abrir Simulador</button>
                   </div>
                </div>
             </div>
          </div>
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
                {isPickerProductsLoading ? (
                  <div className="text-center py-10">
                    <Loader2 className="w-10 h-10 text-slate-200 mx-auto mb-2 animate-spin" />
                  </div>
                ) : pickerProducts.length > 0 ? (
                  pickerProducts.map(item => (
                    <div key={item.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group" onClick={() => addToStore(item)}>
                      <div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-orange-500 transition-colors"><Tag className="w-5 h-5" /></div><div><p className="font-bold text-slate-800 text-sm">{item.name}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.sku}</p></div></div>
                      <div className="flex items-center gap-4 text-right"><div><p className="text-sm font-black text-slate-900">${item.salePrice?.toLocaleString()}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stock: {item.stock}</p></div><div className="p-2 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm"><Plus className="w-5 h-5" /></div></div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <Info className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Escribe para buscar productos</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4"><button onClick={() => setShowProductPicker(false)} className="py-4 px-8 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest">Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ecommerce;
