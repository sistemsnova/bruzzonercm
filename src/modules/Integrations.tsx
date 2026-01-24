
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe, ShoppingCart, Layout, Eye, Settings,
  Share2, MousePointer2, Plus, Search, Image as ImageIcon,
  CheckCircle2, X, ArrowUpRight, ShoppingBag, Users,
  Star, Tag, ExternalLink, Camera, Save, Trash2,
  ChevronRight, Laptop, Smartphone, Monitor, Menu, Heart,
  Truck, RefreshCcw, User, Lock, Mail, UserPlus,
  Zap, Package, AlertTriangle, CloudIcon, Link2, Key, Loader2,
  Plug, Send, MapPin, Info
} from 'lucide-react';
import { AndreaniConfig } from '../types'; // Import AndreaniConfig type

type IntegrationTab = 'mercadolibre' | 'andreani' | 'other';

const Integrations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IntegrationTab>('mercadolibre');

  // MercadoLibre Configuration States
  const [mlClientId, setMlClientId] = useState(''); 
  const [mlClientSecret, setMlClientSecret] = useState(''); 
  const [mlUserId, setMlUserId] = useState<string | null>(null); 
  const [mlNickname, setMlNickname] = useState<string | null>(null); 
  const [mlAutoSyncStock, setMlAutoSyncStock] = useState(true);
  const [mlAutoSyncPrices, setMlAutoSyncPrices] = useState(true);
  const [isConnectingML, setIsConnectingML] = useState(false);
  const [isSyncingML, setIsSyncingML] = useState(false);

  // Andreani Configuration States
  const [andreaniConfig, setAndreaniConfig] = useState<AndreaniConfig>({
    enabled: false,
    clientId: '',
    clientSecret: '',
    accountNumber: '',
    branchCode: '',
    connected: false,
    nickname: undefined,
  });
  const [isConnectingAndreani, setIsConnectingAndreani] = useState(false);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false); // For simulating shipment creation

  const MERCADOLIBRE_REDIRECT_URI = "https://ferrogest.app/ml-callback"; // Static Redirect URI

  // Load configs (mock for now, would be from Firebase in a real app)
  useEffect(() => {
    // Simulate loading MercadoLibre config
    const storedMlClientId = localStorage.getItem('mlClientId') || '';
    const storedMlClientSecret = localStorage.getItem('mlClientSecret') || '';
    const storedMlUserId = localStorage.getItem('mlUserId') || null;
    const storedMlNickname = localStorage.getItem('mlNickname') || null;
    const storedMlAutoSyncStock = localStorage.getItem('mlAutoSyncStock') === 'true';
    const storedMlAutoSyncPrices = localStorage.getItem('mlAutoSyncPrices') === 'true';

    setMlClientId(storedMlClientId);
    setMlClientSecret(storedMlClientSecret);
    setMlUserId(storedMlUserId);
    setMlNickname(storedMlNickname);
    setMlAutoSyncStock(storedMlAutoSyncStock);
    setMlAutoSyncPrices(storedMlAutoSyncPrices);

    // Simulate loading Andreani config
    const storedAndreaniConfig = localStorage.getItem('andreaniConfig');
    if (storedAndreaniConfig) {
      setAndreaniConfig(JSON.parse(storedAndreaniConfig));
    }
  }, []);

  // MercadoLibre Handlers
  const handleMLSync = () => {
    setIsSyncingML(true);
    setTimeout(() => {
      setIsSyncingML(false);
      alert('Sincronización con MercadoLibre completada: 2 artículos actualizados, 0 errores.');
    }, 2000);
  };

  const handleConnectMercadoLibre = async () => {
    if (!mlClientId || !mlClientSecret) {
      alert('Por favor, ingrese el Client ID y Client Secret de MercadoLibre.');
      return;
    }

    setIsConnectingML(true);
    try {
      // Simulate OAuth flow initiation
      alert('Iniciando conexión con MercadoLibre. Serás redirigido para autorizar la aplicación.');
      // In a real app, you would redirect the user to MercadoLibre's OAuth endpoint:
      // window.location.href = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${mlClientId}&redirect_uri=${MERCADOLIBRE_REDIRECT_URI}`;
      
      // Simulate successful callback after authorization
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      
      setMlUserId('ML-USER-12345678');
      setMlNickname('FerreteriaNorteML');
      alert('¡Conexión con MercadoLibre establecida con éxito!');

      // Save to local storage (mock persistence)
      localStorage.setItem('mlClientId', mlClientId);
      localStorage.setItem('mlClientSecret', mlClientSecret);
      localStorage.setItem('mlUserId', 'ML-USER-12345678');
      localStorage.setItem('mlNickname', 'FerreteriaNorteML');
      localStorage.setItem('mlAutoSyncStock', String(mlAutoSyncStock));
      localStorage.setItem('mlAutoSyncPrices', String(mlAutoSyncPrices));

    } catch (error) {
      console.error('Error al conectar con MercadoLibre:', error);
      alert('No se pudo establecer la conexión con MercadoLibre. Verifique sus credenciales.');
    } finally {
      setIsConnectingML(false);
    }
  };

  const handleSaveMlSettings = () => {
    // Save to local storage (mock persistence)
    localStorage.setItem('mlClientId', mlClientId);
    localStorage.setItem('mlClientSecret', mlClientSecret); // Should not save plain secret, but for demo
    localStorage.setItem('mlAutoSyncStock', String(mlAutoSyncStock));
    localStorage.setItem('mlAutoSyncPrices', String(mlAutoSyncPrices));
    alert('Configuración de MercadoLibre guardada.');
  };

  // Andreani Handlers
  const handleConnectAndreani = async () => {
    const { clientId, clientSecret, accountNumber, branchCode } = andreaniConfig;
    if (!clientId || !clientSecret || !accountNumber || !branchCode) {
      alert('Por favor, complete todos los campos de credenciales de Andreani.');
      return;
    }

    setIsConnectingAndreani(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2500)); 

      const updatedAndreaniConfig: AndreaniConfig = {
        ...andreaniConfig,
        enabled: true,
        connected: true,
        nickname: 'AndreaniFERRO' 
      };

      setAndreaniConfig(updatedAndreaniConfig);
      alert('¡Conexión con Andreani establecida con éxito!');

      // Save to local storage (mock persistence)
      localStorage.setItem('andreaniConfig', JSON.stringify(updatedAndreaniConfig));

    } catch (error) {
      console.error('Error al conectar con Andreani:', error);
      alert('No se pudo establecer la conexión con Andreani. Verifique sus credenciales.');
    } finally {
      setIsConnectingAndreani(false);
    }
  };

  const handleSaveAndreaniSettings = () => {
    // Save to local storage (mock persistence)
    localStorage.setItem('andreaniConfig', JSON.stringify(andreaniConfig));
    alert('Configuración de Andreani guardada.');
  };

  const renderMLTab = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      {/* MercadoLibre Status Card */}
      <div className="bg-yellow-50 border border-yellow-200 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-yellow-400 rounded-3xl shadow-xl shadow-yellow-400/20">
            <Zap className="w-10 h-10 text-slate-900 fill-slate-900" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">MercadoLibre Sync</h3>
            <p className="text-slate-600 font-bold text-sm">Estado de conexión: <span className="text-green-600 uppercase tracking-widest ml-1">{mlUserId ? 'Vínculo Activo' : 'No Conectado'}</span></p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleMLSync}
            disabled={isSyncingML || !mlUserId} // Disable if not connected
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
          >
            {isSyncingML ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
            Sincronizar Stock y Precios
          </button>
        </div>
      </div>

      {/* MercadoLibre Configuration Section */}
      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500 text-white rounded-2xl shadow-lg shadow-yellow-500/20">
            <Key className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Configuración de API & Sincronización</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client ID</label>
            <input 
              type="text" 
              value={mlClientId}
              onChange={(e) => setMlClientId(e.target.value)}
              placeholder="Ingrese su Client ID de MercadoLibre" 
              className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Secret</label>
            <input 
              type="password" 
              value={mlClientSecret}
              onChange={(e) => setMlClientSecret(e.target.value)}
              placeholder="Ingrese su Client Secret" 
              className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Redirect URI (Pre-configurada)</label>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-600 font-medium text-sm">
            <Link2 className="w-4 h-4 text-slate-400" />
            <span className="flex-1 truncate">{MERCADOLIBRE_REDIRECT_URI}</span>
            <button 
              onClick={() => navigator.clipboard.writeText(MERCADOLIBRE_REDIRECT_URI)} 
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100"
              title="Copiar al portapapeles"
            >
              Copiar
            </button>
          </div>
          <p className="text-[10px] text-slate-400 italic mt-1">Debe registrar esta URI en su aplicación de desarrollador de MercadoLibre.</p>
        </div>
        
        <div className="flex justify-center pt-4">
          <button 
            onClick={handleConnectMercadoLibre}
            disabled={isConnectingML || !mlClientId || !mlClientSecret}
            className="bg-yellow-500 text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-yellow-400 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isConnectingML ? <Loader2 className="w-5 h-5" /> : <CloudIcon className="w-5 h-5" />}
            {isConnectingML ? 'Conectando...' : 'Conectar con MercadoLibre'}
          </button>
        </div>

        {mlUserId && (
          <div className="pt-8 border-t border-slate-100 space-y-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" /> Cuenta Vinculada
            </h4>
            <div className="grid grid-cols-2 gap-6 bg-green-50 rounded-2xl p-6 border border-green-100">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">User ID</p>
                <p className="font-bold text-green-900">{mlUserId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Nickname</p>
                <p className="font-bold text-green-900">{mlNickname}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" /> Opciones de Sincronización Automática
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-600">Auto-Sincronizar Stock</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={mlAutoSyncStock} 
                      onChange={(e) => setMlAutoSyncStock(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-600">Auto-Sincronizar Precios</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={mlAutoSyncPrices} 
                      onChange={(e) => setMlAutoSyncPrices(e.target.checked)} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleSaveMlSettings}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-yellow-500" /> Guardar Configuración
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );

  const renderAndreaniTab = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Integración de Envíos Andreani</h3>
        </div>

        {/* Andreani Status Card */}
        <div className={`p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 ${andreaniConfig.connected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-6">
            <div className={`p-5 rounded-3xl shadow-xl ${andreaniConfig.connected ? 'bg-green-400 text-slate-900 shadow-green-400/20' : 'bg-red-400 text-white shadow-red-400/20'}`}>
              <Plug className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Andreani</h3>
              <p className={`font-bold text-sm ${andreaniConfig.connected ? 'text-green-600' : 'text-red-600'}`}>Estado de conexión: <span className="uppercase tracking-widest ml-1">{andreaniConfig.connected ? `Activo (${andreaniConfig.nickname || 'Usuario Andreani'})` : 'No Conectado'}</span></p>
            </div>
          </div>
          {andreaniConfig.connected && (
            <button 
              // onClick={handleVerifyAndreaniConnection} // Implement a real verification
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3"
            >
              <RefreshCcw className="w-5 h-5" /> Verificar Conexión
            </button>
          )}
        </div>

        {/* Andreani Configuration Form */}
        <div className="pt-8 border-t border-slate-100 space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" /> Credenciales de Acceso
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client ID</label>
              <input 
                type="text" 
                value={andreaniConfig.clientId}
                onChange={(e) => setAndreaniConfig(prev => ({...prev, clientId: e.target.value}))}
                placeholder="Ingrese su Client ID de Andreani" 
                className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Secret</label>
              <input 
                type="password" 
                value={andreaniConfig.clientSecret}
                onChange={(e) => setAndreaniConfig(prev => ({...prev, clientSecret: e.target.value}))}
                placeholder="Ingrese su Client Secret" 
                className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Cuenta Andreani</label>
              <input 
                type="text" 
                value={andreaniConfig.accountNumber}
                onChange={(e) => setAndreaniConfig(prev => ({...prev, accountNumber: e.target.value}))}
                placeholder="Ej: 123456789" 
                className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código de Sucursal de Despacho</label>
              <input 
                type="text" 
                value={andreaniConfig.branchCode}
                onChange={(e) => setAndreaniConfig(prev => ({...prev, branchCode: e.target.value}))}
                placeholder="Ej: CABA001" 
                className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-center gap-4">
          <button 
            onClick={handleConnectAndreani}
            disabled={isConnectingAndreani || !andreaniConfig.clientId || !andreaniConfig.clientSecret || !andreaniConfig.accountNumber || !andreaniConfig.branchCode}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isConnectingAndreani ? <Loader2 className="w-5 h-5" /> : <Plug className="w-5 h-5" />}
            {isConnectingAndreani ? 'Conectando...' : 'Conectar con Andreani'}
          </button>
          <button 
            onClick={handleSaveAndreaniSettings}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3"
          >
            <Save className="w-4 h-4 text-blue-500" /> Guardar Configuración
          </button>
        </div>
      </section>
    </div>
  );


  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600 text-white rounded-[1.5rem] shadow-xl"><Plug className="w-6 h-6" /></div>
          <div><h1 className="text-2xl font-bold text-slate-800 tracking-tight">Integraciones Externas</h1><p className="text-slate-500 text-sm">Conecta FerroGest con tus servicios favoritos.</p></div>
        </div>
      </header>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        {[
          { id: 'mercadolibre', label: 'MercadoLibre', icon: Zap },
          { id: 'andreani', label: 'Andreani Envíos', icon: Truck },
          { id: 'other', label: 'Otras Conexiones', icon: Link2 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as IntegrationTab)} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><tab.icon className="w-4 h-4" />{tab.label}</button>
        ))}
      </div>

      <div className="py-2">
        {activeTab === 'mercadolibre' && renderMLTab()}
        {activeTab === 'andreani' && renderAndreaniTab()}
        {activeTab === 'other' && (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 text-center">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center justify-center gap-3">
                  <Link2 className="w-6 h-6 text-orange-600" /> Más Integraciones Pronto
                </h3>
                <p className="text-slate-500 text-sm max-w-lg mx-auto">Estamos trabajando para añadir más servicios como WhatsApp Business, sistemas de pago y APIs personalizadas. ¡Mantente atento a las actualizaciones!</p>
                <div className="flex justify-center gap-4 pt-4">
                    <button className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-orange-500 transition-all flex items-center gap-3">
                        <Star className="w-5 h-5" /> Sugerir Integración
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Integrations;
