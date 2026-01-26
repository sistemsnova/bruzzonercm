
import React, { useState } from 'react';
import { Loader2, User, Lock, ShoppingBag, X, ArrowRight, Users, Smartphone, ShieldCheck } from 'lucide-react';
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
        setError('El formato del usuario debe ser un correo electrónico válido.');
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
        setError('No encontramos ningún cliente con ese CUIT/DNI. Contacte a la ferretería.');
      }
    } catch (err: any) {
      setError('Error al validar cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl w-full max-w-md space-y-8 animate-in zoom-in duration-300 relative z-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-orange-600 text-white rounded-[2.2rem] flex items-center justify-center mx-auto shadow-2xl shadow-orange-600/40 rotate-3">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">Sistems Nova</h1>
          <p className="text-slate-500 text-sm font-medium">Plataforma Inteligente de Gestión</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] gap-1">
          <button
            onClick={() => { setLoginType('employee'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginType === 'employee' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <ShieldCheck className="w-4 h-4" /> Personal
          </button>
          <button
            onClick={() => { setLoginType('customer'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginType === 'customer' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Smartphone className="w-4 h-4" /> Portal Clientes
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 animate-in shake duration-300 border border-red-100">
            <X className="w-5 h-5 text-red-600" />
            <span className="font-bold text-xs uppercase">{error}</span>
          </div>
        )}

        {loginType === 'employee' ? (
          <form onSubmit={handleEmployeeLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario / Email</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              ENTRAR AL ERP
            </button>
          </form>
        ) : (
          <form onSubmit={handleCustomerLogin} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CUIT o DNI del Cliente</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  className="w-full pl-12 pr-4 py-5 bg-orange-50 border border-orange-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-2xl text-orange-950 placeholder:text-orange-200"
                  placeholder="20-XXXXXXXX-X"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium ml-1">Ingresa el número tal como figura en tu factura.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
              ACCEDER A MIS CUENTAS
            </button>
          </form>
        )}

        <div className="pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            FerroGest ERP v4.0 • Sistema de Gestión de Alto Rendimiento
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
