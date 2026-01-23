import React, { useState } from 'react';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import LoginScreen from './LoginScreen';
import Sidebar from './components/Sidebar';
import Inventory from './modules/Inventory';
import Sales from './modules/Sales';
import Users from './modules/Users';
// Importa los nuevos módulos si ya los tienes creados:
// import Dashboard from './modules/Dashboard';
// import Customers from './modules/Customers';

const AppContent: React.FC = () => {
  const { user, loading } = useFirebase();
  // Cambiamos el inicio a 'dashboard'
  const [activeModule, setActiveModule] = useState('dashboard');
  const [masterUser, setMasterUser] = useState<{ role: any; name: string } | null>(null);

  const handleLoginSuccess = (role: any, name: string) => {
    if (role === 'admin' && name === 'Administrador Maestro') {
      setMasterUser({ role, name });
    }
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-bold">Iniciando...</div>;
  if (!user && !masterUser) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;

  const profile = {
    name: user?.displayName || masterUser?.name || 'Usuario',
    role: (user as any)?.role || masterUser?.role || 'admin',
    business: (user as any)?.business || { name: "FerroGest ERP", logo: "" }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} user={profile} />
      
      <main className="flex-1 overflow-y-auto p-8">
        {/* Lógica para mostrar cada módulo */}
        {activeModule === 'dashboard' && <div className="text-2xl font-black text-slate-800">Bienvenido al Panel de Control</div>}
        {activeModule === 'inventory' && <Inventory />}
        {activeModule === 'sales' && <Sales />}
        {activeModule === 'users' && <Users />}
        
        {/* Mensaje temporal para módulos que aún no conectas */}
        {!['dashboard', 'inventory', 'sales', 'users'].includes(activeModule) && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <ShoppingBag size={64} className="mb-4 opacity-20" />
            <h2 className="text-xl font-bold italic">Módulo "{activeModule}" en desarrollo...</h2>
            <p className="text-sm">Muy pronto estará disponible la gestión completa aquí.</p>
          </div>
        )}
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