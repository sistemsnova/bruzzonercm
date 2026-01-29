import React, { useState } from 'react';
import { Loader2, User, Lock, ShoppingBag, X, ArrowRight, Smartphone, ShieldCheck, Zap, Info } from 'lucide-react';
import { Role, Client } from './types';
import { db } from './lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface LoginScreenProps {
  onLoginSuccess: (role: Role | 'customer', name: string, entityData?: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [loginType, setLoginType] = useState<'employee' | 'customer'>('employee');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cuit, setCuit] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MASTER_USER = 'admin';
  const MASTER_PASS = 'admin123';

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    try {
      if (trimmedUsername.toLowerCase() === MASTER_USER && trimmedPassword === MASTER_PASS) {
        onLoginSuccess('admin', 'Administrador Maestro');
        return; 
      }
      
      if (!trimmedUsername.includes('@') || !trimmedUsername.includes('.')) {
          setError('Ingresa un correo electrónico válido.');
          setIsLoading(false);
          return;
      }

      const usersRef = collection(db, 'users');
      const q = query(usersRef, 
        where('email', '==', trimmedUsername), 
        where('password', '==', trimmedPassword)
      );
      
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        onLoginSuccess(userData.role.toLowerCase() as Role, userData.name);
      } else {
        setError('Credenciales de empleado incorrectas.');
      }
    } catch (err: any) {
      setError(`Error de conexión: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const trimmedCuit = cuit.trim();
    if (!trimmedCuit) {
      setError('Por favor ingrese su CUIT o DNI.');
      setIsLoading(false);
      return;
    }

    try {
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('cuit', '==', trimmedCuit));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const clientData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Client;
        onLoginSuccess('customer', clientData.name, clientData);
      } else {
        setError('CUIT/DNI no encontrado. Contacte a la ferretería.');
      }
    } catch (err: any) {
      setError('Error al validar cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 md:p-6 relative overflow-hidden font-sans">
      {/* Background Mesh Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[30%] left-[40%] w-[20%] h-[20%] bg-white/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="glass-card p-8 md:p-12 rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-lg space-y-10 animate-in zoom-in duration-500 relative z-10 border border-white/10">
        <div className="text-center space-y-6">
          <div className="relative inline-block animate-float">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-[2.2rem] flex items-center justify-center mx-auto shadow-2xl shadow-orange-600/40 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <ShoppingBag className="w-12 h-12" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 text-orange-500 p-2 rounded-xl shadow-lg border border-white/10">
                <Zap className="w-5 h-5 fill-orange-500" />
            </div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic uppercase flex items-center justify-center gap-2">
              Sistems <span className="text-orange-600">Nova</span>
            </h1>
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] opacity-60">Plataforma Inteligente de Gestión</p>
          </div>
        </div>

        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl gap-1">
          <button 
            onClick={() => { setLoginType('employee'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${loginType === 'employee' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <ShieldCheck className="w-4 h-4" /> Personal
          </button>
          <button 
            onClick={() => { setLoginType('customer'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${loginType === 'customer' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Smartphone className="w-4 h-4" /> Portal Clientes
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 border border-red-100 shadow-sm">
            <div className="bg-red-500 p-1 rounded-full"><X className="w-3 h-3 text-white" /></div>
            <span className="font-bold text-[10px] uppercase tracking-wider">{error}</span>
          </div>
        )}

        {loginType === 'employee' ? (
          <form onSubmit={handleEmployeeLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario / Email</label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors">
                  <User className="w-full h-full" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors">
                  <Lock className="w-full h-full" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-900/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-orange-500" />}
              ENTRAR AL ERP
            </button>
          </form>
        ) : (
          <form onSubmit={handleCustomerLogin} className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de CUIT o DNI</label>
              <div className="group relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-orange-300 group-focus-within:text-orange-600 transition-colors">
                  <Smartphone className="w-full h-full" />
                </div>
                <input
                  type="text"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  className="w-full pl-14 pr-4 py-6 bg-orange-50 border-2 border-orange-100 rounded-[2rem] focus:border-orange-500 focus:ring-8 focus:ring-orange-500/5 outline-none font-black text-3xl text-orange-950 placeholder:text-orange-200 transition-all"
                  placeholder="20-XXXXXXXX-X"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide ml-2 flex items-center gap-2">
                {/* Added missing Info icon import above and usage here */}
                <Info className="w-3 h-3" /> Revisa tu última factura o ticket
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 bg-orange-600 hover:bg-orange-700 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-orange-600/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
              ACCEDER A MIS CUENTAS
            </button>
          </form>
        )}

        <div className="pt-8 border-t border-slate-200/50 text-center space-y-2">
           <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] leading-relaxed">
             FerroGest ERP v4.0 <span className="text-orange-500/50 mx-1">•</span> Business Core System
           </p>
           <p className="text-[8px] text-slate-300 font-bold uppercase">Sincronización en tiempo real activa</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;