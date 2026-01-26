
import React, { useState, useMemo } from 'react';
import { FirebaseProvider } from './context/FirebaseContext';
import Sidebar from './components/Sidebar';
import TabBar from './components/TabBar';
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
import LoginScreen from './LoginScreen';
import { Role, Client } from './types';
import { 
  LayoutDashboard, Boxes, BadgeDollarSign, ShoppingCart, Users, Truck, 
  Wallet, BarChart3, Settings as SettingsIcon, Store, RefreshCcw, FileUp, 
  Warehouse as WarehouseIcon, ListChecks, Globe, Gift, ClipboardList, 
  Plug, MessageSquareText, ListTodo, CreditCard, Scale, ClipboardCheck, 
  PlusCircle, Layers, UserCog
} from 'lucide-react';

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
  arca: { enabled: boolean; puntoVenta: number; iibb: string; crtValidUntil: string; };
  printConfigs: { factura: PrintSettings; remito: PrintSettings; recibo: PrintSettings; etiqueta: PrintSettings; };
}

const DEFAULT_PRINT_CONFIG: PrintSettings = {
  pageSize: 'A4', orientation: 'portrait', margins: { top: 10, bottom: 10, left: 10, right: 10 },
  showLogo: true, showCuit: true, showAddress: true, showLegal: true, showQr: true, showPrices: true, copies: 1,
};

const initialCompanyInfo: CompanyInfo = {
  name: 'FerroGest Pro', cuit: '30-71122334-9', ivaCondition: 'Responsable Inscripto', address: 'Av. Rivadavia 1234, CABA',
  logo: null, showLogoInSidebar: true,
  arca: { enabled: true, puntoVenta: 5, iibb: '901-123456-7', crtValidUntil: '2025-12-31' },
  printConfigs: { factura: { ...DEFAULT_PRINT_CONFIG }, remito: { ...DEFAULT_PRINT_CONFIG }, recibo: { ...DEFAULT_PRINT_CONFIG }, etiqueta: { ...DEFAULT_PRINT_CONFIG, pageSize: '80mm' } }
};

export const MODULE_METADATA: Record<string, { label: string; icon: any }> = {
  'dashboard': { label: 'Dashboard', icon: LayoutDashboard },
  'inventory': { label: 'Inventario', icon: Boxes },
  'sales': { label: 'Ventas', icon: BadgeDollarSign },
  'purchases': { label: 'Compras', icon: ShoppingCart },
  'clients': { label: 'Clientes', icon: Users },
  'suppliers': { label: 'Proveedores', icon: Truck },
  'cashier': { label: 'Cajas', icon: Wallet },
  'reports': { label: 'Informes', icon: BarChart3 },
  'settings': { label: 'Configuración', icon: SettingsIcon },
  'branches': { label: 'Sucursales', icon: Store },
  'prices': { label: 'Precios', icon: RefreshCcw },
  'bulk-import': { label: 'Importar', icon: FileUp },
  'warehouse': { label: 'Depósito', icon: WarehouseIcon },
  'purchase-orders': { label: 'Pedidos Compra', icon: ListChecks },
  'ecommerce': { label: 'E-Commerce', icon: Globe },
  'loyalty': { label: 'Fidelización', icon: Gift },
  'remitos': { label: 'Remitos', icon: ClipboardList },
  'integrations': { label: 'Integraciones', icon: Plug },
  'quotes': { label: 'Cotizaciones', icon: MessageSquareText },
  'orders': { label: 'Pedidos', icon: ListTodo },
  'installments': { label: 'Cuotas', icon: CreditCard },
  'balances': { label: 'Saldos', icon: Scale },
  'missing-items': { label: 'Faltantes', icon: ClipboardCheck },
  'stock-adjustment': { label: 'Ajuste Stock', icon: PlusCircle },
  'bulk-modification': { label: 'Modif. Masiva', icon: Layers },
  'users': { label: 'Personal y Accesos', icon: UserCog },
};

const AppContent: React.FC = () => {
  const [openTabs, setOpenTabs] = useState<string[]>(['dashboard']);
  const [activeTabId, setActiveTabId] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{name: string, role: Role | 'customer', data?: any}>({ name: '', role: 'vendedor' });
  const [plan, setPlan] = useState<'basic' | 'premium' | 'enterprise'>('premium');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);

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

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // --- MODO PORTAL DE CLIENTES ---
  if (currentUser.role === 'customer') {
    return <CustomerPortal client={currentUser.data} onLogout={handleLogout} companyInfo={companyInfo} />;
  }

  // --- MODO ERP (STAFF) ---
  const renderModule = (id: string) => {
    switch (id) {
      case 'dashboard': return <Dashboard openTab={openTab} />;
      case 'inventory': return <Inventory />;
      case 'missing-items': return <MissingItems />;
      case 'stock-adjustment': return <StockAdjustment />;
      case 'bulk-modification': return <BulkModification />;
      case 'sales': return <Sales />;
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
      case 'settings': return <Settings plan={plan} setPlan={setPlan} isAdmin={currentUser.role === 'admin'} companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar 
        activeTab={activeTabId} 
        setActiveTab={openTab} 
        companyInfo={companyInfo}
        currentUser={currentUser as any}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
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
