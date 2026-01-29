
import React, { useState, useMemo, useEffect } from 'react';
import { FirebaseProvider } from './context/FirebaseContext';
import Sidebar from './components/Sidebar';
import TabBar from './components/TabBar';
import CommandPalette from './components/CommandPalette';
import Dashboard from './modules/Dashboard';
import Inventory from './modules/Inventory';
import { Sales } from './modules/Sales';
import { Purchases } from './modules/Purchases';
import Clients from './modules/Clients';
import Suppliers from './modules/Suppliers';
import { Cashier } from './modules/Cashier';
import Reports from './modules/Reports';
import Settings from './modules/Settings';
import Branches from './modules/Branches';
import UsersModule from './modules/Users';
import PriceUpdate from './modules/PriceUpdate';
import BulkImport from './modules/BulkImport';
import Warehouse from './modules/Warehouse';
import PurchaseOrders from './modules/PurchaseOrders';
import { Balances } from './modules/Balances';
import { Finance } from './modules/Finance';
import Ecommerce from './modules/Ecommerce';
import Loyalty from './modules/Loyalty';
import Integrations from './modules/Integrations';
import { Quotes } from './modules/Quotes';
import Orders from './modules/Orders';
import Installments from './modules/Installments';
import SalesZones from './modules/SalesZones';
import { MissingItems } from './modules/MissingItems';
import StockAdjustment from './modules/StockAdjustment';
import BulkModification from './modules/BulkModification';
import { Remitos } from './modules/Remitos';
import CustomerPortal from './modules/CustomerPortal';
import CatalogConfig from './modules/CatalogConfig'; 
import LoginScreen from './LoginScreen';
import { Role, Client } from './types';
import { Search, Sparkles } from 'lucide-react';

export interface PrintSettings {
  pageSize: 'A4' | 'A5' | 'A6' | '80mm' | '58mm';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; bottom: number; left: number; right: number; };
  showLogo: boolean;
  showCuit: boolean;
  showAddress: boolean;
  showLegal: boolean;
  showQr: boolean;
  showPrices: boolean;
  copies: number;
}

export interface CompanyInfo {
  name: string;
  cuit: string;
  ivaCondition: string;
  address: string;
  logo: string | null;
  showLogoInSidebar: boolean;
  defaultMarkup: number; 
  arca: { enabled: boolean; puntoVenta: number; iibb: string; crtValidUntil: string; };
  printConfigs: { factura: PrintSettings; remito: PrintSettings; recibo: PrintSettings; etiqueta: PrintSettings; };
  paymentCommissions: Record<string, number>; 
}

const DEFAULT_PRINT_CONFIG: PrintSettings = {
  pageSize: 'A4', orientation: 'portrait', margins: { top: 10, bottom: 10, left: 10, right: 10 },
  showLogo: true, showCuit: true, showAddress: true, showLegal: true, showQr: true, showPrices: true, copies: 1,
};

const initialCompanyInfo: CompanyInfo = {
  name: 'Sistems Nova', cuit: '30-71122334-9', ivaCondition: 'Responsable Inscripto', address: 'Av. Rivadavia 1234, CABA',
  logo: null, showLogoInSidebar: true,
  defaultMarkup: 30, 
  arca: { enabled: true, puntoVenta: 5, iibb: '901-123456-7', crtValidUntil: '2025-12-31' },
  printConfigs: { factura: { ...DEFAULT_PRINT_CONFIG }, remito: { ...DEFAULT_PRINT_CONFIG }, recibo: { ...DEFAULT_PRINT_CONFIG }, etiqueta: { ...DEFAULT_PRINT_CONFIG, pageSize: '80mm' } },
  paymentCommissions: {
    'efectivo': 0,
    'tarjeta_debito': 1.5,
    'tarjeta_credito': 3.5,
    'transferencia': 0,
    'cheque': 0,
    'cuenta_corriente': 0,
    'otro': 0
  }
};

export const MODULE_METADATA: Record<string, { label: string; icon: any }> = {
  'dashboard': { label: 'Dashboard', icon: Search }, // Temporary, replaced by LayoutDashboard in actual run
  'inventory': { label: 'Inventario', icon: Search },
  'sales': { label: 'Ventas', icon: Search },
  'purchases': { label: 'Compras', icon: Search },
  'clients': { label: 'Clientes', icon: Search },
  'suppliers': { label: 'Proveedores', icon: Search },
  'cashier': { label: 'Cajas', icon: Search },
  'reports': { label: 'Informes', icon: Search },
  'settings': { label: 'Configuración', icon: Search },
  'branches': { label: 'Sucursales', icon: Search },
  'prices': { label: 'Precios', icon: Search },
  'bulk-import': { label: 'Importar', icon: Search },
  'warehouse': { label: 'Depósito', icon: Search },
  'purchase-orders': { label: 'Pedidos Compra', icon: Search },
  'ecommerce': { label: 'E-Commerce', icon: Search },
  'loyalty': { label: 'Fidelización', icon: Search },
  'remitos': { label: 'Remitos', icon: Search },
  'integrations': { label: 'Integraciones', icon: Search },
  'quotes': { label: 'Cotizaciones', icon: Search },
  'orders': { label: 'Pedidos', icon: Search },
  'installments': { label: 'Cuotas', icon: Search },
  'balances': { label: 'Saldos', icon: Search },
  'missing-items': { label: 'Faltantes', icon: Search },
  'stock-adjustment': { label: 'Ajuste Stock', icon: Search },
  'bulk-modification': { label: 'Modif. Masiva', icon: Search },
  'users': { label: 'Personal y Accesos', icon: Search },
  'catalog-config': { label: 'Marcas & Rubros', icon: Search }, 
};

const AppContent: React.FC = () => {
  const [openTabs, setOpenTabs] = useState<string[]>(['dashboard']);
  const [activeTabId, setActiveTabId] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{name: string, role: Role | 'customer', data?: any}>({ name: '', role: 'vendedor' });
  const [plan, setPlan] = useState<'basic' | 'premium' | 'enterprise'>('premium');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoginSuccess = (role: Role | 'customer', name: string, entityData?: any) => {
    setCurrentUser({ name, role, data: entityData });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser({ name: '', role: 'vendedor' });
    setOpenTabs(['dashboard']);
    setActiveTabId('dashboard');
  };

  const openTab = (id: string) => {
    if (!openTabs.includes(id)) {
      setOpenTabs(prev => [...prev, id]);
    }
    setActiveTabId(id);
  };

  const closeTab = (id: string) => {
    if (id === 'dashboard') return; 
    const newTabs = openTabs.filter(t => t !== id);
    setOpenTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1]);
    }
  };

  const handleAiAction = (action: string, target: string) => {
    switch (action) {
      case 'NAVIGATE':
        openTab(target);
        break;
      case 'SEARCH_PRODUCT':
        openTab('inventory');
        // Se podría pasar el target a Inventory vía context
        break;
      case 'CHECK_DEBT':
        openTab('balances');
        break;
      default:
        console.log('Action not handled:', action);
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentUser.role === 'customer') {
    return <CustomerPortal client={currentUser.data} onLogout={handleLogout} companyInfo={companyInfo} />;
  }

  const renderModule = (id: string) => {
    switch (id) {
      case 'dashboard': return <Dashboard openTab={openTab} />;
      case 'inventory': return <Inventory companyInfo={companyInfo} />;
      case 'missing-items': return <MissingItems />;
      case 'stock-adjustment': return <StockAdjustment />;
      case 'bulk-modification': return <BulkModification />;
      case 'sales': return <Sales companyInfo={companyInfo} />;
      case 'purchases': return <Purchases />;
      case 'clients': return <Clients onNavigate={openTab} />;
      case 'suppliers': return <Suppliers />;
      case 'cashier': return <Cashier />;
      case 'balances': return <Balances />;
      case 'installments': return <Installments />;
      case 'finance': return <Finance />;
      case 'reports': return <Reports />;
      case 'branches': return <Branches />;
      case 'users': return <UsersModule />;
      case 'prices': return <PriceUpdate />;
      case 'bulk-import': return <BulkImport />;
      case 'warehouse': return <Warehouse />;
      case 'purchase-orders': return <PurchaseOrders />;
      case 'ecommerce': return <Ecommerce />;
      case 'loyalty': return <Loyalty />;
      case 'remitos': return <Remitos />;
      case 'integrations': return <Integrations />;
      case 'quotes': return <Quotes />;
      case 'orders': return <Orders />;
      case 'catalog-config': return <CatalogConfig />; 
      case 'settings': return <Settings plan={plan} setPlan={setPlan} isAdmin={currentUser.role === 'admin'} companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden relative">
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        onAction={handleAiAction}
      />

      <Sidebar 
        activeTab={activeTabId} 
        setActiveTab={openTab} 
        companyInfo={companyInfo}
        currentUser={currentUser as any}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsCommandPaletteOpen(true)}
                className="flex items-center gap-3 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all group"
             >
                <Search className="w-4 h-4 text-slate-400 group-hover:text-orange-500" />
                <span className="text-xs font-bold text-slate-400">Comando Global Inteligente...</span>
                <span className="text-[9px] font-black bg-white border px-1.5 py-0.5 rounded-md text-slate-300">CTRL+K</span>
             </button>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-blue-600 animate-pulse" />
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">AI Engine Active</span>
             </div>
          </div>
        </header>

        <TabBar 
          openTabs={openTabs} 
          activeTabId={activeTabId} 
          setActiveTabId={setActiveTabId} 
          onCloseTab={closeTab} 
        />
        
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative bg-slate-50/50">
          <div className="max-w-7xl mx-auto h-full">
            {openTabs.map(tabId => (
              <div 
                key={tabId} 
                className={`h-full transition-all duration-300 ${tabId === activeTabId ? 'block animate-in fade-in zoom-in-95' : 'hidden'}`}
              >
                {renderModule(tabId)}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
};

export default App;
