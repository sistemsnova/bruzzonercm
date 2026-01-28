
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { Product, Client, Supplier, Transaction, PriceList, Branch, Order, InstallmentPlan, InternalUser, PaymentDetail, SalesZone, Sale, Remito } from '../types';
import { db } from '../lib/firebase';
import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  deleteDoc, query, orderBy, limit, startAfter, where, getDocs
} from 'firebase/firestore';

interface FirebaseContextType {
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  transactions: Transaction[];
  priceLists: PriceList[];
  branches: Branch[];
  orders: Order[];
  installmentPlans: InstallmentPlan[];
  users: InternalUser[];
  salesZones: SalesZone[];
  sales: Sale[]; // Exposed sales collection
  remitos: Remito[]; // Exposed remitos collection

  loading: boolean;
  error: string | null;

  fetchProductsPaginatedAndFiltered: (options: {
    limit: number;
    startAfterDoc?: any;
    searchTerm?: string;
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
  }) => Promise<{ products: Product[], lastVisible: any, hasMore: boolean }>;
  getProductById: (id: string) => Promise<Product | null>;
  addProduct: (p: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addSale: (saleData: Omit<Sale, 'id'>) => Promise<string>; // Now returns ID of the created sale
  getSaleById: (id: string) => Promise<Sale | null>;

  addClient: (c: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: string, c: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addSupplier: (s: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, s: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  addPriceList: (pl: Omit<PriceList, 'id'>) => Promise<void>;
  updatePriceList: (id: string, pl: Partial<PriceList>) => Promise<void>;
  deletePriceList: (id: string) => Promise<void>;
  addBranch: (b: Omit<Branch, 'id'>) => Promise<void>;
  updateBranch: (id: string, b: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  addOrder: (o: Omit<Order, 'id'>) => Promise<void>;
  updateOrder: (id: string, o: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addInstallmentPlan: (ip: Omit<InstallmentPlan, 'id'>) => Promise<void>;
  updateInstallmentPlan: (id: string, ip: Partial<InstallmentPlan>) => Promise<void>;
  deleteInstallmentPlan: (id: string) => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  exportAllData: (collectionNames: string[]) => Promise<Record<string, any[]>>;
  deleteAllDocumentsInCollection: (collectionName: string) => Promise<void>;
  addUser: (u: any) => Promise<void>;
  updateUser: (id: string, u: Partial<InternalUser>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addSalesZone: (sz: Omit<SalesZone, 'id'>) => Promise<void>;
  updateSalesZone: (id: string, sz: Partial<SalesZone>) => Promise<void>;
  deleteSalesZone: (id: string) => Promise<void>;

  addRemito: (r: Omit<Remito, 'id'>) => Promise<string>; // Add new remito, returns ID
  updateRemito: (id: string, r: Partial<Remito>) => Promise<void>; // Update existing remito
  deleteRemito: (id: string) => Promise<void>; // Delete remito
  getRemitoById: (id: string) => Promise<Remito | null>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);
  const [salesZones, setSalesZones] = useState<SalesZone[]>([]);
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [sales, setSales] = useState<Sale[]>([]); // New state for sales
  const [remitos, setRemitos] = useState<Remito[]>([]); // New state for remitos

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(collection(db, 'products'), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product)))),
      onSnapshot(collection(db, 'clients'), (s) => setClients(s.docs.map(d => ({ id: d.id, ...d.data() } as Client)))),
      onSnapshot(collection(db, 'suppliers'), (s) => setSuppliers(s.docs.map(d => ({ id: d.id, ...d.data() } as Supplier)))),
      onSnapshot(collection(db, 'priceLists'), (s) => setPriceLists(s.docs.map(d => ({ id: d.id, ...d.data() } as PriceList)))),
      onSnapshot(collection(db, 'branches'), (s) => setBranches(s.docs.map(d => ({ id: d.id, ...d.data() } as Branch)))),
      onSnapshot(collection(db, 'users'), (s) => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() } as InternalUser)))),
      onSnapshot(collection(db, 'salesZones'), (s) => setSalesZones(s.docs.map(d => ({ id: d.id, ...d.data() } as SalesZone)))),
      onSnapshot(collection(db, 'sales'), (s) => setSales(s.docs.map(d => ({ id: d.id, ...d.data() } as Sale)))), // New listener for sales
      onSnapshot(collection(db, 'remitos'), (s) => setRemitos(s.docs.map(d => ({ id: d.id, ...d.data() } as Remito)))), // New listener for remitos
    ];
    setLoading(false);
    return () => unsubscribers.forEach(u => u());
  }, []);

  const fetchProductsPaginatedAndFiltered = useCallback(async (options: any) => {
    let q = query(collection(db, 'products'), orderBy(options.orderByField || 'name', options.orderDirection || 'asc'));
    if (options.startAfterDoc) q = query(q, startAfter(options.startAfterDoc));
    q = query(q, limit(options.limit));
    const s = await getDocs(q);
    const fetched = s.docs.map(d => ({ id: d.id, ...d.data() } as Product));
    return { products: fetched, lastVisible: s.docs[s.docs.length - 1], hasMore: s.docs.length === options.limit };
  }, []);

  const getProductById = async (id: string) => products.find(p => p.id === id) || null;
  const addProduct = async (p: any) => { await addDoc(collection(db, 'products'), p); };
  const updateProduct = async (id: string, p: any) => { await updateDoc(doc(db, 'products', id), p); };
  const deleteProduct = async (id: string) => { await deleteDoc(doc(db, 'products', id)); };

  // Updated addSale to return the ID
  const addSale = async (data: Omit<Sale, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'sales'), data);
    return docRef.id;
  };
  const getSaleById = async (id: string) => sales.find(s => s.id === id) || null;

  const addClient = async (c: any) => { await addDoc(collection(db, 'clients'), c); };
  const updateClient = async (id: string, c: any) => { await updateDoc(doc(db, 'clients', id), c); };
  const deleteClient = async (id: string) => { await deleteDoc(doc(db, 'clients', id)); };

  const addSupplier = async (s: any) => { await addDoc(collection(db, 'suppliers'), s); };
  const updateSupplier = async (id: string, s: any) => { await updateDoc(doc(db, 'suppliers', id), s); };
  const deleteSupplier = async (id: string) => { await deleteDoc(doc(db, 'suppliers', id)); };

  const addPriceList = async (pl: any) => { await addDoc(collection(db, 'priceLists'), pl); };
  const updatePriceList = async (id: string, pl: any) => { await updateDoc(doc(db, 'priceLists', id), pl); };
  const deletePriceList = async (id: string) => { await deleteDoc(doc(db, 'priceLists', id)); };

  const addBranch = async (b: any) => { await addDoc(collection(db, 'branches'), b); };
  const updateBranch = async (id: string, b: any) => { await updateDoc(doc(db, 'branches', id), b); };
  const deleteBranch = async (id: string) => { await deleteDoc(doc(db, 'branches', id)); };

  const addOrder = async (o: any) => { await addDoc(collection(db, 'orders'), o); };
  const updateOrder = async (id: string, o: any) => { await updateDoc(doc(db, 'orders', id), o); };
  const deleteOrder = async (id: string) => { await deleteDoc(doc(db, 'orders', id)); };

  const addInstallmentPlan = async (ip: any) => { await addDoc(collection(db, 'installmentPlans'), ip); };
  const updateInstallmentPlan = async (id: string, ip: any) => { await updateDoc(doc(db, 'installmentPlans', id), ip); };
  const deleteInstallmentPlan = async (id: string) => { await deleteDoc(doc(db, 'installmentPlans', id)); };

  const addTransaction = async (t: any) => { await addDoc(collection(db, 'transactions'), t); };

  const addUser = async (u: any) => { await addDoc(collection(db, 'users'), u); };
  const updateUser = async (id: string, u: any) => { await updateDoc(doc(db, 'users', id), u); };
  const deleteUser = async (id: string) => { await deleteDoc(doc(db, 'users', id)); };

  const addSalesZone = async (sz: any) => { await addDoc(collection(db, 'salesZones'), sz); };
  const updateSalesZone = async (id: string, sz: any) => { await updateDoc(doc(db, 'salesZones', id), sz); };
  const deleteSalesZone = async (id: string) => { await deleteDoc(doc(db, 'salesZones', id)); };

  // New Remito functions
  const addRemito = async (r: Omit<Remito, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'remitos'), r);
    return docRef.id;
  };
  const updateRemito = async (id: string, r: Partial<Remito>) => { await updateDoc(doc(db, 'remitos', id), r); };
  const deleteRemito = async (id: string) => { await deleteDoc(doc(db, 'remitos', id)); };
  const getRemitoById = async (id: string) => remitos.find(r => r.id === id) || null;

  const exportAllData = async (cols: string[]) => {
    const res: any = {};
    for (const c of cols) {
      const s = await getDocs(collection(db, c));
      res[c] = s.docs.map(d => d.data());
    }
    return res;
  };

  const deleteAllDocumentsInCollection = async (name: string) => {
    const s = await getDocs(collection(db, name));
    for (const d of s.docs) await deleteDoc(d.ref);
  };

  const value = useMemo(() => ({
    products, clients, suppliers, transactions, priceLists, branches, orders, installmentPlans, users, loading, error, salesZones, sales, remitos,
    fetchProductsPaginatedAndFiltered, getProductById, addProduct, updateProduct, deleteProduct,
    addSale, getSaleById, addClient, updateClient, deleteClient, addSupplier, updateSupplier, deleteSupplier,
    addPriceList, updatePriceList, deletePriceList, addBranch, updateBranch, deleteBranch,
    addOrder, updateOrder, deleteOrder, addInstallmentPlan, updateInstallmentPlan, deleteInstallmentPlan,
    addTransaction, exportAllData, deleteAllDocumentsInCollection, addUser, updateUser, deleteUser, addSalesZone, updateSalesZone, deleteSalesZone,
    addRemito, updateRemito, deleteRemito, getRemitoById
  }), [products, clients, suppliers, transactions, priceLists, branches, orders, installmentPlans, users, loading, error, salesZones, sales, remitos]);

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error("useFirebase debe usarse dentro de FirebaseProvider");
  return context;
};