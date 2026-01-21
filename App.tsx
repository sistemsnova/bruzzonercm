
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './modules/Dashboard';
import Sales from './modules/Sales';
import { Remitos } from './modules/Remitos'; 
import PriceUpdate from './modules/PriceUpdate';
import Loyalty from './modules/Loyalty';
import Ecommerce from './modules/Ecommerce';
import Reports from './modules/Reports'; 
import Settings from './modules/Settings';
import { Finance } from './modules/Finance';
import UsersModule from './modules/Users';
import Branches from './modules/Branches'; 
import Warehouse from './modules/Warehouse';
import Inventory from './modules/Inventory';
import BulkImport from './modules/BulkImport';
import PurchaseOrders from './modules/PurchaseOrders';
import { Balances } from './modules/Balances';
import { Cashier } from './modules/Cashier';
import { Purchases } from './modules/Purchases';
import StockAdjustment from './modules/StockAdjustment';
import BulkModification from './modules/BulkModification';
import Integrations from './modules/Integrations';
import Quotes from './modules/Quotes'; 
import Orders from './modules/Orders'; 
import Installments from './modules/Installments'; 
import SalesZones from './modules/SalesZones';
import { MissingItems } from './modules/MissingItems'; // New Module
import Clients from './modules/Clients';
import Suppliers from './modules/Suppliers'; 
import LoginScreen from './LoginScreen';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { Role } from './types';

export interface ArcaConfig {
  enabled: boolean;
  environment: 'testing' | 'production';
  puntoVenta: number;
  concepto: 'productos' | 'servicios' | 'ambos';
  iibb: string;
  activityStart: string;
  crtValidUntil: string;
  lastInvoiceA: number;
  lastInvoiceB: number;
}

export interface PrintSettings {
  pageSize: string;
  orientation: 'portrait' | 'landscape';
  margins: { top: number; bottom: number; left: number; right: number };
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
  logo: string | null;
  showLogoInSidebar: boolean;
  cuit: string;
  address: string;
  ivaCondition: string;
  phone: string;
  email: string;
  arca: ArcaConfig;
  printConfigs: {
    factura: PrintSettings;
    remito: PrintSettings;
    recibo: PrintSettings;
    etiqueta: PrintSettings;
  };
}

const AppContent: React.FC<{ currentUser: any; onLogout: () => void }> = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [plan, setPlan] = useState<'basic' | 'premium' | 'enterprise'>('enterprise');
  const { error: appError } = useFirebase(); 

  const defaultPrintSettings: PrintSettings = {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: { top: 10, bottom: 10, left: 10, right: 10 },
    showLogo: true,
    showCuit: true,
    showAddress: true,
    showLegal: true,
    showQr: true,
    showPrices: true,
    copies: 1
  };

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'FerroGest',
    logo: null,
    showLogoInSidebar: false,
    cuit: '30-12345678-9',
    address: 'Av. Principal 123, Ciudad',
    ivaCondition: 'Responsable Inscripto',
    phone: '+54 11 1234-5678',
    email: 'contacto@ferrogest.com',
    arca: {
      enabled: true,
      environment: 'testing',
      puntoVenta: 5,
      concepto: 'productos',
      iibb: '30-12345678-9',
      activityStart: '2020-01-15',
      crtValidUntil: '2025-12-31',
      lastInvoiceA: 1245,
      lastInvoiceB: 5678
    },
    printConfigs: {
      factura: { ...defaultPrintSettings },
      remito: { ...defaultPrintSettings, showQr: false, showPrices: false },
      recibo: { ...defaultPrintSettings, pageSize: 'A5', showQr: false },
      etiqueta: { ...defaultPrintSettings, pageSize: '80mm', showCuit: false, showAddress: false, showLegal: false, showQr: false, margins: { top: 2, bottom: 2, left: 2, right: 2 } },
    }
  });

  const modules = useMemo(() => [
    { id: 'dashboard', component: <Dashboard /> },
    { id: 'sales', component: <Sales /> },
    { id: 'remitos', component: <Remitos /> },
    { id: 'inventory', component: <Inventory /> },
    { id: 'missing-items', component: <MissingItems /> },
    { id: 'stock-adjustment', component: <StockAdjustment /> },
    { id: 'bulk-modification', component: <BulkModification /> },
    { id: 'warehouse', component: <Warehouse /> },
    { id: 'branches', component: <Branches /> },
    { id: 'clients', component: <Clients onNavigate={setActiveTab} /> },
    { id: 'suppliers', component: <Suppliers /> },
    { id: 'balances', component: <Balances /> },
    { id: 'sales-zones', component: <SalesZones /> },
    { id: 'loyalty', component: <Loyalty /> },
    { id: 'ecommerce', component: <Ecommerce /> },
    { id: 'integrations', component: <Integrations /> },
    { id: 'quotes', component: <Quotes /> },
    { id: 'orders', component: <Orders /> },
    { id: 'installments', component: <Installments /> },
    { id: 'reports', component: <Reports /> },
    { id: 'finance', component: <Finance /> },
    { id: 'users', component: <UsersModule /> },
    { id: 'bulk-import', component: <BulkImport /> },
    { id: 'purchase-orders', component: <PurchaseOrders /> },
    { id: 'prices', component: <PriceUpdate /> },
    { id: 'cashier', component: <Cashier /> },
    { id: 'purchases', component: <Purchases /> },
    { id: 'settings', component: <Settings 
        initialTab="company"
        plan={plan} 
        setPlan={setPlan} 
        isAdmin={currentUser.role === 'admin'} 
        companyInfo={companyInfo} 
        setCompanyInfo={setCompanyInfo} 
      /> 
    },
    { id: 'data', component: <Settings 
        initialTab="data"
        plan={plan} 
        setPlan={setPlan} 
        isAdmin={currentUser.role === 'admin'} 
        companyInfo={companyInfo} 
        setCompanyInfo={setCompanyInfo} 
      /> 
    },
  ], [plan, companyInfo, currentUser.role]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        companyInfo={companyInfo}
        currentUser={currentUser} 
        onLogout={onLogout} 
      />
      <main className="flex-1 h-screen overflow-y-auto p-8 relative">
        <div className="max-w-7xl mx-auto">
          {appError && (
            <div className="mb-6 p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] flex items-center gap-6">
               <AlertCircle className="w-6 h-6 text-red-600" />
               <div className="flex-1">
                 <p className="text-red-900 font-bold">Error de Sistema</p>
                 <p className="text-red-700 text-sm">{appError}</p>
               </div>
               <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-xs uppercase">Reintentar</button>
            </div>
          )}
          {modules.map((m) => (
            <div key={m.id} className={activeTab === m.id ? 'block' : 'hidden'}>
              {m.component}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleLoginSuccess = (role: Role, name: string) => {
    setCurrentUser({ name, role });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <FirebaseProvider>
      <AppContent currentUser={currentUser} onLogout={handleLogout} />
    </FirebaseProvider>
  );
};

export default App;
