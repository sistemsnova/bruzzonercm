import React, { useState } from 'react';
// IMPORTANTE: Usamos ./ porque los archivos están en la misma carpeta raíz
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import LoginScreen from './LoginScreen';
import Sidebar from './components/Sidebar';
import Inventory from './modules/Inventory';
import Sales from './modules/Sales';
import Users from './modules/Users';

// Componente principal que decide qué ver (Login o Dashboard)
const AppContent: React.FC = () => {
  const { user, loading } = useFirebase();
  const [activeModule, setActiveModule] = useState('inventory');

  // Si Firebase está cargando la sesión, mostramos un aviso
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Iniciando FerroGest...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostramos la pantalla de Login
  if (!user) {
    return <LoginScreen />;
  }

  // Si hay usuario, mostramos el sistema principal
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {activeModule === 'inventory' && <Inventory />}
        {activeModule === 'sales' && <Sales />}
        {activeModule === 'users' && <Users />}
        {/* Aquí puedes agregar más módulos como 'customers', 'reports', etc. */}
      </main>
    </div>
  );
};

// Envolvemos todo en el Proveedor de Firebase
const App: React.FC = () => {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
};

export default App;