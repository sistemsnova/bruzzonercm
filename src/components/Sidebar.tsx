import React from 'react';
import {
  LayoutDashboard, ShoppingCart, Users, Package,
  Truck, CreditCard, BarChart3, Settings,
  LogOut, ShoppingBag, ChevronRight, FileText,
  Layers, Database, Globe, Receipt
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  companyInfo: any;
  currentUser: any;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, companyInfo, currentUser, onLogout }) => {

  const menuSchema = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Comercial',
      items: [
        { id: 'sales', label: 'Ventas', icon: ShoppingCart },
        { id: 'quotes', label: 'Cotizaciones', icon: FileText },
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'ecommerce', label: 'E-Commerce', icon: Globe },
      ]
    },
    {
      title: 'Productos & Stock',
      items: [
        { id: 'inventory', label: 'Inventario', icon: Package },
        { id: 'stock-adjustment', label: 'Ajuste de Stock', icon: Layers },
        { id: 'suppliers', label: 'Proveedores', icon: Truck },
        { id: 'prices', label: 'Precios', icon: Receipt },
      ]
    },
    {
      title: 'Administración',
      items: [
        { id: 'cashier', label: 'Cajas y Pagos', icon: CreditCard },
        { id: 'finance', label: 'Finanzas', icon: BarChart3 },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { id: 'users', label: 'Usuarios', icon: Settings },
        { id: 'settings', label: 'Configuración', icon: Database },
      ]
    }
  ];

  return (
    <div className="w-72 bg-slate-900 h-full flex flex-col text-slate-300 border-r border-slate-800">
      <div className="p-6">
        <div className="flex items-center gap-3 bg-orange-600 p-4 rounded-2xl shadow-lg shadow-orange-900/20">
          <ShoppingBag className="text-white" size={24} />
          <div className="overflow-hidden">
            <h1 className="text-white font-black text-sm truncate uppercase tracking-tighter">
              {companyInfo?.name || "FerroGest ERP"}
            </h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar pb-10">
        {menuSchema.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-50">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)} // <--- AQUÍ SE CONECTA EL CABLE
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40'
                        : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                      <span className="font-bold text-xs">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={14} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-6 bg-slate-950/50 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white border border-slate-600">
            {currentUser?.name?.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
            <p className="text-[9px] text-orange-500 font-black uppercase tracking-tighter">
              {currentUser?.role}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-2 text-red-400 hover:text-red-300 transition-colors font-black text-[10px] uppercase tracking-widest"
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;