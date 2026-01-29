
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Truck, Wallet, 
  ShoppingCart, RefreshCcw, Gift, Globe, 
  BarChart3, Settings as SettingsIcon, TrendingUp,
  Tags, UserCog, BadgeDollarSign, ClipboardList,
  Store, Warehouse, Boxes, FileUp, ListChecks,
  Scale, PackagePlus, DollarSign, Cloud, Home,
  ChevronDown, LogOut, PlusCircle, Layers, 
  Archive, Plug, MessageSquareText, ListTodo,
  CreditCard, ClipboardCheck, Loader2, Pin, 
  Plus, X, Check, Settings2
} from 'lucide-react';
import { CompanyInfo } from '../App';
import { Role } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  companyInfo: CompanyInfo;
  currentUser: { name: string; role: Role; };
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, companyInfo, currentUser, onLogout }) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Principal', 'Comercial', 'Productos & Abastecimiento', 'Administración & Finanzas']);
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [pinnedShortcuts, setPinnedShortcuts] = useState<string[]>(['sales', 'inventory', 'cashier']);

  useEffect(() => {
    const saved = localStorage.getItem('ferrogest_shortcuts');
    if (saved) {
      try {
        setPinnedShortcuts(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading shortcuts", e);
      }
    }
  }, []);

  const togglePin = (id: string) => {
    const newShortcuts = pinnedShortcuts.includes(id)
      ? pinnedShortcuts.filter(s => s !== id)
      : [...pinnedShortcuts, id];
    
    setPinnedShortcuts(newShortcuts);
    localStorage.setItem('ferrogest_shortcuts', JSON.stringify(newShortcuts));
  };

  const menuGroups = [
    {
      name: 'Principal',
      icon: Home,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      name: 'Comercial',
      icon: BadgeDollarSign,
      items: [
        { id: 'sales', label: 'Ventas', icon: BadgeDollarSign, color: 'bg-orange-500' },
        { id: 'remitos', label: 'Remitos', icon: ClipboardList, color: 'bg-blue-500' },
        { id: 'quotes', label: 'Cotizaciones', icon: MessageSquareText, color: 'bg-purple-500' },
        { id: 'orders', label: 'Pedidos', icon: ListTodo, color: 'bg-indigo-500' },
        { id: 'clients', label: 'Clientes', icon: Users, color: 'bg-emerald-500' },
        { id: 'loyalty', label: 'Fidelización', icon: Gift, color: 'bg-pink-500' },
        { id: 'ecommerce', label: 'E-Commerce', icon: Globe, color: 'bg-sky-500' },
      ]
    },
    {
      name: 'Productos & Abastecimiento',
      icon: Boxes,
      items: [
        { id: 'inventory', label: 'Inventario', icon: Boxes, color: 'bg-amber-600' },
        { id: 'missing-items', label: 'Faltantes', icon: ClipboardCheck, color: 'bg-red-500' },
        { id: 'stock-adjustment', label: 'Ajuste de Stock', icon: PlusCircle, color: 'bg-teal-500' },
        { id: 'bulk-modification', label: 'Modificación Masiva', icon: Layers, color: 'bg-violet-500' },
        { id: 'warehouse', label: 'Depósito', icon: Warehouse, color: 'bg-stone-500' },
        { id: 'purchase-orders', label: 'Pedidos Compra', icon: ListChecks, color: 'bg-cyan-600' },
        { id: 'suppliers', label: 'Proveedores', icon: Truck, color: 'bg-orange-400' },
        { id: 'prices', label: 'Lista Precios', icon: RefreshCcw, color: 'bg-lime-600' },
        { id: 'bulk-import', label: 'Importar Datos', icon: FileUp, color: 'bg-slate-400' },
        { id: 'catalog-config', label: 'Marcas & Rubros', icon: Tags, color: 'bg-purple-500' }, // New: Catalog Config
      ]
    },
    {
      name: 'Administración & Finanzas',
      icon: Wallet,
      items: [
        { id: 'cashier', label: 'Cajas y Pagos', icon: Wallet, color: 'bg-green-600' },
        { id: 'purchases', label: 'Compras & IA', icon: ShoppingCart, color: 'bg-yellow-600' },
        { id: 'balances', label: 'Saldos y Deudas', icon: Scale, color: 'bg-rose-500' },
        { id: 'installments', label: 'Cuotas Internas', icon: CreditCard, color: 'bg-fuchsia-600' },
        { id: 'finance', label: 'Finanzas', icon: TrendingUp, color: 'bg-emerald-600' },
        { id: 'reports', label: 'Informes e IVA', icon: BarChart3, color: 'bg-blue-400' },
        { id: 'users', label: 'Personal y Accesos', icon: UserCog, color: 'bg-indigo-400' },
      ]
    },
  ];

  const allItems = menuGroups.flatMap(g => g.items);
  const pinnedItems = allItems.filter(item => pinnedShortcuts.includes(item.id));

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) ? prev.filter(name => name !== groupName) : [...prev, groupName]
    );
  };

  if (!companyInfo || !('name' in companyInfo)) {
    return (
      <div className="w-64 bg-slate-900 text-white flex flex-col h-screen border-r border-slate-800 justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
        <span className="text-xs text-slate-400">Iniciando...</span>
      </div>
    );
  }

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen border-r border-slate-800 shrink-0 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3">
          {companyInfo?.logo && companyInfo?.showLogoInSidebar ? (
            <img src={companyInfo.logo} className="w-10 h-10 rounded-lg object-cover bg-white" alt="Logo Empresa" />
          ) : (
            <div className="p-2 bg-orange-500 rounded-lg"><Tags className="w-6 h-6 text-white" /></div>
          )}
          <span className="text-xl font-bold tracking-tight truncate">{companyInfo?.name || 'Sistems Nova'}</span>
        </div>
      </div>

      <div className="px-4 mb-4">
        <div className="flex items-center justify-between px-4 mb-3">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accesos Rápidos</span>
          <button onClick={() => setShowShortcutModal(true)} className="p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-orange-500 transition-colors">
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 px-2">
          {pinnedItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`aspect-square flex items-center justify-center rounded-xl transition-all ${activeTab === item.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40 scale-105' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
          <button onClick={() => setShowShortcutModal(true)} className="aspect-square flex items-center justify-center rounded-xl bg-slate-800/20 border border-dashed border-slate-700 text-slate-600 hover:border-slate-500 hover:text-slate-400 transition-all">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar overscroll-contain pb-10">
        {menuGroups.map((group) => (
          <div key={group.name} className="space-y-1">
            <button 
              onClick={() => toggleGroup(group.name)}
              className="w-full flex items-center justify-between px-4 pt-4 pb-2 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
            >
              <span className="flex items-center gap-2"><group.icon className="w-4 h-4" />{group.name}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedGroups.includes(group.name) ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            {expandedGroups.includes(group.name) && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top duration-200">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === item.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        <div className="pt-4 border-t border-slate-800/50 mt-4 space-y-1">
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'settings' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
            <SettingsIcon className="w-5 h-5" /><span>Configuración</span>
          </button>
          <button onClick={() => setActiveTab('integrations')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'integrations' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
            <Plug className="w-5 h-5" /><span>Integraciones</span>
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl mb-4">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} className="w-10 h-10 rounded-full border border-slate-700 bg-slate-700" alt="User" />
          <div className="overflow-hidden text-left">
            <p className="text-sm font-semibold truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{currentUser.role}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all text-red-400 hover:bg-red-900 hover:text-white bg-red-950/50">
          <LogOut className="w-5 h-5 shrink-0" /><span className="truncate">Cerrar Sesión</span>
        </button>
      </div>

      {showShortcutModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-600 rounded-2xl flex items-center justify-center"><Pin className="w-6 h-6" /></div>
                <div><h2 className="text-2xl font-black uppercase tracking-tight">Personalizar Accesos</h2><p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mt-1">Selecciona tus herramientas favoritas</p></div>
              </div>
              <button onClick={() => setShowShortcutModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                {allItems.map(item => (
                  <button key={item.id} onClick={() => togglePin(item.id)} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${pinnedShortcuts.includes(item.id) ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    <div className={`p-3 rounded-xl ${pinnedShortcuts.includes(item.id) ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}><item.icon className="w-6 h-6" /></div>
                    <div className="flex-1 overflow-hidden"><p className={`font-black text-xs uppercase tracking-tight truncate ${pinnedShortcuts.includes(item.id) ? 'text-orange-900' : 'text-slate-600'}`}>{item.label}</p></div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${pinnedShortcuts.includes(item.id) ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-200 text-transparent'}`}><Check className="w-3 h-3 stroke-[4px]" /></div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center"><p className="text-xs font-bold text-slate-400 italic">Máximo recomendado: 8 accesos.</p><button onClick={() => setShowShortcutModal(false)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">Listo</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
