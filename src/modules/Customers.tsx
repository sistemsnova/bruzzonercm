import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Trash2, Phone, Mail, MapPin, X, UserCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const Customers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para el nuevo cliente
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    dni: ''
  });

  // 1. Cargar clientes de Firebase
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'customers'));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(items);
    } catch (error) {
      console.error("Error cargando clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // 2. Guardar cliente nuevo
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'customers'), {
        ...newCustomer,
        balance: 0, // Saldo inicial en 0
        createdAt: new Date().toISOString()
      });
      setNewCustomer({ name: '', phone: '', email: '', address: '', dni: '' });
      setShowModal(false);
      fetchCustomers();
    } catch (error) {
      alert("Error al guardar cliente");
    }
  };

  // 3. Eliminar cliente
  const handleDelete = async (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar este cliente?")) {
      await deleteDoc(doc(db, 'customers', id));
      fetchCustomers();
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.dni.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Clientes</h1>
          <p className="text-slate-500 font-medium italic">Base de datos y cuentas corrientes.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o DNI..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre y DNI</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-20 text-slate-400 font-bold">Cargando clientes...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-20 text-slate-400 font-bold italic">No se encontraron clientes.</td></tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-800">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-black">{c.dni}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-2"><Phone size={12} className="text-orange-500" /> {c.phone}</span>
                        <span className="flex items-center gap-2"><Mail size={12} className="text-orange-500" /> {c.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${c.balance <= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {c.balance <= 0 ? 'AL DÍA' : `DEBE $${c.balance}`}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button 
                        onClick={() => handleDelete(c.id)}
                        className="p-2 text-slate-200 hover:text-red-500 transition-colors"
                       >
                        <Trash2 size={18} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PARA AGREGAR CLIENTE */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                  <UserCheck size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nuevo Cliente</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre Completo</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  placeholder="Ej: Juan Pérez"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">DNI / CUIT</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                    placeholder="20-30..."
                    value={newCustomer.dni}
                    onChange={(e) => setNewCustomer({...newCustomer, dni: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Teléfono</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                    placeholder="11..."
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  placeholder="juan@correo.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                />
              </div>
              <div className="space-y-1 pb-4">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Dirección</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                    placeholder="Calle 123, Ciudad"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-orange-600/30 hover:bg-orange-700 transition-all">
                Registrar Cliente
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;