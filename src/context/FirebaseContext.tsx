import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Product, Client, Supplier, Transaction, PriceList, Branch, Order, 
  InstallmentPlan, InternalUser, SalesZone, Sale, Remito, Box, Brand, Category 
} from '../types';
import { db } from '../lib/firebase';
import { 
  collection, onSnapshot, addDoc, updateDoc, doc, 
  deleteDoc, query, orderBy, limit, startAfter, getDocs, setDoc
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
  sales: Sale[]; 
  remitos: Remito[]; 
  boxes: Box[];
  brands: Brand[];
  categories: Category[];
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
  addSale: (saleData: Omit<Sale, 'id'>) => Promise<string>; 
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
  importAllData: (data: Record<string, any[]>) => Promise<void>;
  deleteAllDocumentsInCollection: (collectionName: string) => Promise<void>; 
  addUser: (u: any) => Promise<void>;
  updateUser: (id: string, u: Partial<InternalUser>) => Promise<void>; 
  deleteUser: (id: string) => Promise<void>;
  addSalesZone: (sz: Omit<SalesZone, 'id'>) => Promise<void>;
  updateSalesZone: (id: string, sz: Partial<SalesZone>) => Promise<void>;
  deleteSalesZone: (id: string) => Promise<void>;
  addRemito: (r: Omit<Remito, 'id'>) => Promise<string>; 
  updateRemito: (id: string, r: Partial<Remito>) => Promise<void>; 
  deleteRemito: (id: string) => Promise<void>; 
  getRemitoById: (id: string) => Promise<Remito | null>;
  addBox: (b: Omit<Box, 'id'>) => Promise<void>;
  updateBox: (id: string, b: Partial<Box>) => Promise<void>;
  deleteBox: (id: string) => Promise<void>;
  addBrand: (b: Omit<Brand, 'id'>) => Promise<void>;
  updateBrand: (id: string, b: Partial<Brand>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  addCategory: (c: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, c: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
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
  const [sales, setSales] = useState<Sale[]>([]); 
  const [remitos, setRemitos] = useState<Remito[]>([]); 
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(collection(db, 'products'), (s) => setProducts(s.docs.map(d => ({id: d.id, ...d.data()} as Product)))),
      onSnapshot(collection(db, 'clients'), (s) => setClients(s.docs.map(d => ({id: d.id, ...d.data()} as Client)))),
      onSnapshot(collection(db, 'suppliers'), (s) => setSuppliers(s.docs.map(d => ({id: d.id, ...d.data()} as Supplier)))),
      onSnapshot(collection(db, 'priceLists'), (s) => setPriceLists(s.docs.map(d => ({id: d.id, ...d.data()} as PriceList)))),
      onSnapshot(collection(db, 'branches'), (s) => setBranches(s.docs.map(d => ({id: d.id, ...d.data()} as Branch)))),
      onSnapshot(collection(db, 'users'), (s) => setUsers(s.docs.map(d => ({id: d.id, ...d.data()} as InternalUser)))),
      onSnapshot(collection(db, 'salesZones'), (s) => setSalesZones(s.docs.map(d => ({id: d.id, ...d.data()} as SalesZone)))),
      onSnapshot(collection(db, 'sales'), (s) => setSales(s.docs.map(d => ({id: d.id, ...d.data()} as Sale)))), 
      onSnapshot(collection(db, 'remitos'), (s) => setRemitos(s.docs.map(d => ({id: d.id, ...d.data()} as Remito)))),
      onSnapshot(collection(db, 'boxes'), (s) => setBoxes(s.docs.map(d => ({id: d.id, ...d.data()} as Box)))),
      onSnapshot(collection(db, 'brands'), (s) => setBrands(s.docs.map(d => ({id: d.id, ...d.data()} as Brand)))),
      onSnapshot(collection(db, 'categories'), (s) => setCategories(s.docs.map(d => ({id: d.id, ...d.data()} as Category)))),
      onSnapshot(collection(db, 'transactions'), (s) => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()} as Transaction)))),
      onSnapshot(collection(db, 'orders'), (s) => setOrders(s.docs.map(d => ({id: d.id, ...d.data()} as Order)))),
      onSnapshot(collection(db, 'installmentPlans'), (s) => setInstallmentPlans(s.docs.map(d => ({id: d.id, ...d.data()} as InstallmentPlan)))),
    ];
    setLoading(false);
    return () => unsubscribers.forEach(u => u());
  }, []);

  const fetchProductsPaginatedAndFiltered = useCallback(async (options: any) => {
    let q = query(collection(db, 'products'), orderBy(options.orderByField || 'name', options.orderDirection || 'asc'));
    if (options.startAfterDoc) q = query(q, startAfter(options.startAfterDoc));
    q = query(q, limit(options.limit));
    const s = await getDocs(q);
    return { 
      products: s.docs.map(d => ({id: d.id, ...d.data()} as Product)), 
      lastVisible: s.docs[s.docs.length-1], 
      hasMore: s.docs.length === options.limit 
    };
  }, []);

  const getProductById = async (id: string) => products.find(p => p.id === id) || null;
  const addProduct = async (p: any) => { await addDoc(collection(db, 'products'), p); };
  const updateProduct = async (id: string, p: any) => { await updateDoc(doc(db, 'products', id), p); };
  const deleteProduct = async (id: string) => { await deleteDoc(doc(db, 'products', id)); };

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

  const addRemito = async (r: Omit<Remito, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'remitos'), r);
    return docRef.id;
  };
  const updateRemito = async (id: string, r: Partial<Remito>) => { await updateDoc(doc(db, 'remitos', id), r); };
  const deleteRemito = async (id: string) => { await deleteDoc(doc(db, 'remitos', id)); };
  const getRemitoById = async (id: string) => remitos.find(r => r.id === id) || null;

  const addBox = async (b: any) => { await addDoc(collection(db, 'boxes'), b); };
  const updateBox = async (id: string, b: any) => { await updateDoc(doc(db, 'boxes', id), b); };
  const deleteBox = async (id: string) => { await deleteDoc(doc(db, 'boxes', id)); };

  const addBrand = async (b: Omit<Brand, 'id'>) => { await addDoc(collection(db, 'brands'), b); };
  const updateBrand = async (id: string, b: Partial<Brand>) => { await updateDoc(doc(db, 'brands', id), b); };
  const deleteBrand = async (id: string) => { await deleteDoc(doc(db, 'brands', id)); };

  const addCategory = async (c: Omit<Category, 'id'>) => { await addDoc(collection(db, 'categories'), c); };
  const updateCategory = async (id: string, c: Partial<Category>) => { await updateDoc(doc(db, 'categories', id), c); };
  const deleteCategory = async (id: string) => { await deleteDoc(doc(db, 'categories', id)); };

  const exportAllData = async (cols: string[]) => {
    const res: any = {};
    for (const c of cols) {
      const s = await getDocs(collection(db, c));
      res[c] = s.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return res;
  };

  const importAllData = async (data: Record<string, any[]>) => {
    for (const [collectionName, documents] of Object.entries(data)) {
      await deleteAllDocumentsInCollection(collectionName);
      for (const docObj of documents) {
        const { id, ...dataWithoutId } = docObj;
        if (id) {
          await setDoc(doc(db, collectionName, id), dataWithoutId);
        } else {
          await addDoc(collection(db, collectionName), dataWithoutId);
        }
      }
    }
  };

  const deleteAllDocumentsInCollection = async (name: string) => {
    const s = await getDocs(collection(db, name));
    for (const d of s.docs) await deleteDoc(d.ref);
  };

  const value = useMemo(() => ({
    products, clients, suppliers, transactions, priceLists, branches, orders, installmentPlans, users, loading, error, salesZones, sales, remitos, boxes, brands, categories,
    fetchProductsPaginatedAndFiltered, getProductById, addProduct, updateProduct, deleteProduct,
    addSale, getSaleById, addClient, updateClient, deleteClient, addSupplier, updateSupplier, deleteSupplier,
    addPriceList, updatePriceList, deletePriceList, addBranch, updateBranch, deleteBranch,
    addOrder, updateOrder, deleteOrder, addInstallmentPlan, updateInstallmentPlan, deleteInstallmentPlan,
    addTransaction, exportAllData, importAllData, deleteAllDocumentsInCollection, addUser, updateUser, deleteUser, addSalesZone, updateSalesZone, deleteSalesZone,
    addRemito, updateRemito, deleteRemito, getRemitoById,
    addBox, updateBox, deleteBox, addBrand, updateBrand, deleteBrand, addCategory, updateCategory, deleteCategory
  }), [products, clients, suppliers, transactions, priceLists, branches, orders, installmentPlans, users, loading, error, salesZones, sales, remitos, boxes, brands, categories]);

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error("useFirebase debe usarse dentro de FirebaseProvider");
  return context;
};