import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  ShoppingBag,
  ChevronRight,
  Truck,
  BarChart3,
  Receipt
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  user?: any; 
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule, user }) => {
  
  // --- CAPA DE SEGURIDAD PARA EVITAR EL ERROR 'LOGO' ---
  // Si user es undefined o no tiene business, usamos estos datos por defecto
  const safeBusiness = user?.business || { 
    name: "FerroGest ERP", 
    logo: "", 
    address: "Administración Central" 
  };
  
  const safeName = user?.name || user?.displayName || "Administrador";
  const safeRole = user?.role || "Master";

  const menuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventario / Stock', icon: Package },
    { id: 'sales', label: 'Ventas y Caja', icon: ShoppingCart },
    { id: 'purchases', label: 'Compras / Gastos', icon: Receipt },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
    { id: 'reports', label: 'Reportes / Estadísticas', icon: BarChart3 },
    { id: 'users', label: 'Personal / Usuarios', icon: Settings },
  ];

  const handleLogout = () => {
    // Limpia la sesión y recarga la página
    window.location.reload();
  };

  return (
    <div className="w-72 bg-slate-900 h-full flex flex-col text-slate-300 border-r border-slate-800">
      
      {/* SECCIÓN DEL LOGO (CORREGIDA) */}
      <div className="p-8">
        <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-3xl border border-slate-700/50">
          <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-900/20">
            {/* Si existe logo lo muestra, si no, muestra el icono de maleta */}
            {safeBusiness.logo ? (
              <img 
                src={safeBusiness.logo} 
                alt="Logo" 
                className="w-full h-full object-cover rounded-2xl" 
              />
            ) : (
              <ShoppingBag className="text-white w-6 h-6" />
            )}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-white font-black text-sm truncate uppercase tracking-wider">
              {safeBusiness.name}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold truncate">
              {safeBusiness.address}
            </p>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Menú</p>
        </div>
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`
                w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200
                ${isActive 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}
              `}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} strokeWidth={isActive ? 3 : 2} />
                <span className="font-bold text-sm">{item.label}</span>
              </div>
              {isActive && <ChevronRight size={16} />}
            </button>
          );
        })}
      </nav>

      {/* PERFIL Y SALIDA */}
      <div className="p-6 mt-auto border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
            {safeName.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{safeName}</p>
            <p className="text-[10px] text-orange-500 font-black uppercase tracking-tighter">
              {safeRole}
            </p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-bold text-sm"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;