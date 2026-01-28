import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, Search, Plus, Trash2,
    CreditCard, Banknote, CheckCircle2,
    Receipt, Calculator, X
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Product } from '../types';

interface CartItem extends Product {
    quantity: number;
}

export const Sales: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Cargar productos de Firebase
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const q = query(collection(db, 'products'));
                const querySnapshot = await getDocs(q);
                const items = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Product[];
                setProducts(items);
            } catch (e) {
                console.error("Error cargando productos", e);
            }
        };
        fetchProducts();
    }, []);

    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleFinishSale = async () => {
        if (cart.length === 0) return;
        setIsProcessing(true);
        try {
            await addDoc(collection(db, 'sales'), {
                items: cart,
                total,
                paymentMethod,
                date: serverTimestamp(),
            });
            setCart([]);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Error al registrar venta:", error);
            alert("Hubo un error al procesar la venta.");
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.includes(searchTerm)
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full animate-in fade-in duration-500">

            {/* SECCIÓN IZQUIERDA: BUSCADOR Y CATÁLOGO */}
            <div className="flex-1 space-y-6">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex flex-col justify-between hover:border-orange-500 transition-all group shadow-sm">
                            <div className="mb-4">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{product.code}</p>
                                <h3 className="font-bold text-slate-800 leading-tight">{product.name}</h3>
                                <p className="text-2xl font-black text-slate-900 mt-2">${product.price.toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => addToCart(product)}
                                className="w-full py-3 bg-slate-50 group-hover:bg-orange-600 group-hover:text-white rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs"
                            >
                                <Plus size={16} /> AGREGAR
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECCIÓN DERECHA: CARRITO (Estilo Pro Slate-900) */}
            <div className="w-full lg:w-[400px] flex flex-col">
                <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl flex-1 flex flex-col min-h-[600px]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <ShoppingCart className="text-orange-500" />
                            <h2 className="text-xl font-black tracking-tighter uppercase">Carrito</h2>
                        </div>
                        <span className="bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black">{cart.length} ITEMS</span>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                                <Calculator size={64} className="mb-4" />
                                <p className="font-black uppercase tracking-widest text-xs">Esperando Venta...</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30 flex justify-between items-center group">
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold truncate">{item.name}</p>
                                        <p className="text-[10px] text-slate-500 font-bold">{item.quantity} x ${item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-black text-orange-400 text-sm">${(item.price * item.quantity).toLocaleString()}</p>
                                        <button onClick={() => removeFromCart(item.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-800 space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Neto</p>
                                <p className="text-4xl font-black text-white">${total.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-2xl">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] transition-all ${paymentMethod === 'cash' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500'}`}
                            >
                                <Banknote size={14} /> EFECTIVO
                            </button>
                            <button
                                onClick={() => setPaymentMethod('card')}
                                className={`py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] transition-all ${paymentMethod === 'card' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500'}`}
                            >
                                <CreditCard size={14} /> TARJETA
                            </button>
                        </div>

                        <button
                            disabled={cart.length === 0 || isProcessing}
                            onClick={handleFinishSale}
                            className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'PROCESANDO...' : 'CONFIRMAR VENTA'}
                            {!isProcessing && <Receipt size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* NOTIFICACIÓN DE ÉXITO */}
            {showSuccess && (
                <div className="fixed bottom-10 right-10 bg-green-600 text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-500 border-2 border-green-400">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="font-black uppercase text-sm tracking-widest leading-none">Venta Exitosa</p>
                        <p className="text-[10px] font-bold opacity-80 mt-1 text-green-100 uppercase">Stock actualizado en tiempo real</p>
                    </div>
                    <button onClick={() => setShowSuccess(false)} className="ml-4 opacity-40 hover:opacity-100 transition-opacity">
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};