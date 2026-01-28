<<<<<<< HEAD
import React, { useState } from 'react';
import { Loader2, User, Lock, ShoppingBag, X, ArrowRight, Smartphone, ShieldCheck, Zap, Info } from 'lucide-react';
=======

import React, { useState } from 'react';
import { Loader2, User, Lock, ShoppingBag, X, ArrowRight, Users, Smartphone, ShieldCheck } from 'lucide-react';
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
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
<<<<<<< HEAD
          setError('Ingresa un correo electrónico válido.');
=======
          setError('El formato del usuario debe ser un correo electrónico válido.');
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
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
<<<<<<< HEAD
        setError('CUIT/DNI no encontrado. Contacte a la ferretería.');
=======
        setError('No encontramos ningún cliente con ese CUIT/DNI. Contacte a la ferretería.');
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
      }
    } catch (err: any) {
      setError('Error al validar cliente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
<<<<<<< HEAD
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
=======
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">FERRO-GEST</h1>
          <p className="text-slate-500 text-sm font-medium">Plataforma Inteligente de Gestión</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] gap-1">
          <button 
            onClick={() => { setLoginType('employee'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginType === 'employee' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
          >
            <ShieldCheck className="w-4 h-4" /> Personal
          </button>
          <button 
            onClick={() => { setLoginType('customer'); setError(null); }}
<<<<<<< HEAD
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${loginType === 'customer' ? 'bg-white text-slate-900 shadow-xl scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
=======
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginType === 'customer' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
          >
            <Smartphone className="w-4 h-4" /> Portal Clientes
          </button>
        </div>

        {error && (
<<<<<<< HEAD
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 border border-red-100 shadow-sm">
            <div className="bg-red-500 p-1 rounded-full"><X className="w-3 h-3 text-white" /></div>
            <span className="font-bold text-[10px] uppercase tracking-wider">{error}</span>
=======
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 animate-in shake duration-300 border border-red-100">
            <X className="w-5 h-5 text-red-600" />
            <span className="font-bold text-xs uppercase">{error}</span>
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
          </div>
        )}

        {loginType === 'employee' ? (
          <form onSubmit={handleEmployeeLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario / Email</label>
<<<<<<< HEAD
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors">
                  <User className="w-full h-full" />
                </div>
=======
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
<<<<<<< HEAD
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300"
=======
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800"
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
<<<<<<< HEAD
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-500 transition-colors">
                  <Lock className="w-full h-full" />
                </div>
=======
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
<<<<<<< HEAD
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300"
=======
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800"
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
<<<<<<< HEAD
              className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-900/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-orange-500" />}
=======
              className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
              ENTRAR AL ERP
            </button>
          </form>
        ) : (
<<<<<<< HEAD
          <form onSubmit={handleCustomerLogin} className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de CUIT o DNI</label>
              <div className="group relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-orange-300 group-focus-within:text-orange-600 transition-colors">
                  <Smartphone className="w-full h-full" />
                </div>
=======
          <form onSubmit={handleCustomerLogin} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CUIT o DNI del Cliente</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
                <input
                  type="text"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
<<<<<<< HEAD
                  className="w-full pl-14 pr-4 py-6 bg-orange-50 border-2 border-orange-100 rounded-[2rem] focus:border-orange-500 focus:ring-8 focus:ring-orange-500/5 outline-none font-black text-3xl text-orange-950 placeholder:text-orange-200 transition-all"
=======
                  className="w-full pl-12 pr-4 py-5 bg-orange-50 border border-orange-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-2xl text-orange-950 placeholder:text-orange-200"
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
                  placeholder="20-XXXXXXXX-X"
                  required
                />
              </div>
<<<<<<< HEAD
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide ml-2 flex items-center gap-2">
                {/* Added missing Info icon import above and usage here */}
                <Info className="w-3 h-3" /> Revisa tu última factura o ticket
              </p>
=======
              <p className="text-[10px] text-slate-400 font-medium ml-1">Ingresa el número tal como figura en tu factura.</p>
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
            </div>

            <button
              type="submit"
              disabled={isLoading}
<<<<<<< HEAD
              className="w-full py-6 bg-orange-600 hover:bg-orange-700 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-orange-600/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
=======
              className="w-full py-5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
              ACCEDER A MIS CUENTAS
            </button>
          </form>
        )}

<<<<<<< HEAD
        <div className="pt-8 border-t border-slate-200/50 text-center space-y-2">
           <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] leading-relaxed">
             FerroGest ERP v4.0 <span className="text-orange-500/50 mx-1">•</span> Business Core System
           </p>
           <p className="text-[8px] text-slate-300 font-bold uppercase">Sincronización en tiempo real activa</p>
=======
        <div className="pt-6 border-t border-slate-100 text-center">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
             FerroGest ERP v4.0 • Sistema de Gestión de Alto Rendimiento
           </p>
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
        </div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default LoginScreen;
=======
export default LoginScreen;
>>>>>>> bbad2f08247477f174e4da4b0cfbdb5500c5fb9b
