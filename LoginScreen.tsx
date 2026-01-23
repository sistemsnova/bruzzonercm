
import React, { useState } from 'react';
import { Loader2, User, Lock, ShoppingBag, X, ArrowRight } from 'lucide-react';
import { Role } from './types';
import { db } from './lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface LoginScreenProps {
  onLoginSuccess: (role: Role, name: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MASTER_USER = 'admin';
  const MASTER_PASS = 'admin123';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Verificar contra el Maestro
      if (username.toLowerCase() === MASTER_USER && password === MASTER_PASS) {
        onLoginSuccess('admin', 'Administrador Maestro');
        return;
      }

      // 2. Verificar en la base de datos de usuarios internos
      const usersRef = collection(db, 'users');
      const q = query(usersRef, 
        where('email', '==', username), 
        where('password', '==', password)
      );
      
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        onLoginSuccess(userData.role.toLowerCase() as Role, userData.name);
      } else {
        setError('Usuario o contraseña incorrectos.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al conectar con la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md space-y-8 animate-in zoom-in duration-300">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-orange-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-orange-600/30">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">FerroGest ERP</h1>
          <p className="text-slate-500 text-sm font-medium">Ingresa a tu plataforma de gestión.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 animate-in shake duration-300">
            <X className="w-5 h-5 text-red-600" />
            <span className="font-bold text-xs uppercase">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario / Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800"
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
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-slate-800"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            {isLoading ? 'VERIFICANDO...' : 'ENTRAR AL SISTEMA'}
          </button>
        </form>

        <div className="pt-6 border-t border-slate-100">
           <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest leading-relaxed">
             Si olvidaste tus credenciales, consulta con el Administrador Maestro de la ferretería.
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
