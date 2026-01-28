import React, { useState } from 'react';
import { FirebaseProvider } from './context/FirebaseContext';
import Sidebar from './components/Sidebar';

// IMPORTACIONES NOMBRADAS (Sincronizadas con tu lista de archivos)
import { Dashboard } from './modules/Dashboard';
import { Inventory } from './modules/Inventory';
import { Sales } from './modules/Sales';
import { Purchases } from './modules/Purchases';
import { Clients } from './modules/Clients';
import { Suppliers } from './modules/Suppliers';
import { Cashier } from './modules/Cashier';
import { Reports } from './modules/Reports';
import { Settings } from './modules/Settings';
import { Branches } from './modules/Branches';
import { Users } from './modules/Users'; // Cambiado a Users según tu lista
import { PriceUpdate } from './modules/PriceUpdate';
import { BulkImport } from './modules/BulkImport';
import { Warehouse } from './modules/Warehouse';
import { PurchaseOrders } from './modules/PurchaseOrders';
import { Balances } from './modules/Balances';
import { Finance } from './modules/Finance';
import { Ecommerce } from './modules/Ecommerce';
import { Loyalty } from './modules/Loyalty';
import { Integrations } from './modules/Integrations';
import { Quotes } from './modules/Quotes';
import { Orders } from './modules/Orders';
import { Installments } from './modules/Installments';
import { SalesZones } from './modules/SalesZones';
import { MissingItems } from './modules/MissingItems';
import { StockAdjustment } from './modules/StockAdjustment';
import { BulkModification } from './modules/BulkModification';
import { Remitos } from './modules/Remitos';

import LoginScreen from './LoginScreen';
import { Role } from './types';

export interface CompanyInfo {
  name: string;
  cuit: string;
  ivaCondition: string;
  address: string;
  logo: string | null;
  arca: { enabled: boolean; puntoVenta: number; iibb: string; crtValidUntil: string; };
}

const initialCompanyInfo: CompanyInfo = {
  name: 'Ferretería Bruzzone ERP',
  cuit: '30-71122334-9',
  ivaCondition: 'Responsable Inscripto',
  address: 'Sede Central',
  logo: null,
  arca: { enabled: true, puntoVenta: 5, iibb: '', crtValidUntil: '' }
};

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string, role: Role }>({ name: '', role: 'vendedor' });
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(initialCompanyInfo);

  const handleLoginSuccess = (role: Role, name: string) => {
    setCurrentUser({ name, role });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser({ name: '', role: 'vendedor' });
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'inventory': return <Inventory />;
      case 'missing-items': return <MissingItems />;
      case 'stock-adjustment': return <StockAdjustment />;
      case 'bulk-modification': return <BulkModification />;
      case 'sales': return <Sales />;
      case 'purchases': return <Purchases />;
      case 'clients': return <Clients />;
      case 'suppliers': return <Suppliers />;
      case 'cashier': return <Cashier />;
      case 'balances': return <Balances />;
      case 'installments': return <Installments />;
      case 'finance': return <Finance />;
      case 'reports': return <Reports />;
      case 'branches': return <Branches />;
      case 'users': return <Users />;
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
      case 'sales-zones': return <SalesZones />;
      case 'settings':
        return <Settings isAdmin={currentUser.role === 'admin'} companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        companyInfo={companyInfo}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
        <div className="max-w-7xl mx-auto">
          {renderActiveModule()}
        </div>
      </main>
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