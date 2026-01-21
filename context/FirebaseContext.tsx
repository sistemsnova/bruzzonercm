
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
// Fix: Added SalesZone to the imports from types
import { Product, Client, Supplier, Transaction, PriceList, Branch, Order, InstallmentPlan, InternalUser, PaymentDetail, SalesZone } from '../types';

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
  addSale: (saleData: { items: any[]; total: number; paymentDetails: PaymentDetail[]; docType: string; remitoIds?: string[]; seller: string; date: string; clientId: string | null; clientName: string; }) => Promise<void>;
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
  updateUser: (id: string, u: Partial<InternalUser>) => Promise<void>; 
  addSalesZone: (sz: Omit<SalesZone, 'id'>) => Promise<void>;
  updateSalesZone: (id: string, sz: Partial<SalesZone>) => Promise<void>;
  deleteSalesZone: (id: string) => Promise<void>;
  salesZones: SalesZone[];
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// --- MOCK DATA SEED ---
const initialProducts: Product[] = [
  { id: 'p1', sku: 'MART-001', name: 'Martillo Stanley 20oz', brand: 'Stanley', category: 'Herramientas', costPrice: 4500, salePrice: 5500, stock: 15, primaryUnit: 'unidad', saleUnit: 'unidad', imageUrl: 'https://images.unsplash.com/photo-1581147036324-c17da42e2602?auto=format&fit=crop&q=80&w=150' },
  { id: 'p2', sku: 'TAL-650', name: 'Taladro Bosch GSB 650', brand: 'Bosch', category: 'Herramientas', costPrice: 15000, salePrice: 18500, stock: 8, primaryUnit: 'unidad', saleUnit: 'unidad', imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=150' },
  { id: 'p3', sku: 'PINT-BLANCA', name: 'Pintura Látex Blanca 4L', brand: 'Alba', category: 'Pinturas', costPrice: 3000, salePrice: 4200, stock: 20, primaryUnit: 'litro', saleUnit: 'litro' },
];

const initialClients: Client[] = [
  { id: 'c1', name: 'Juan Perez S.R.L.', cuit: '20-33445566-7', whatsapp: '5491155551234', email: 'contacto@juanperez.com', specialDiscount: 5, priceListId: 'pl2', authorizedPersons: ['Maria Lopez'], balance: -15000, accumulatedPoints: 120, pointsEnabled: true, lastMovement: new Date().toISOString(), daysOverdue: 10 },
  { id: 'c2', name: 'Constructora del Centro', cuit: '30-11223344-9', whatsapp: '5491144445678', email: 'info@cdc.com.ar', specialDiscount: 10, priceListId: 'pl3', authorizedPersons: ['Pedro Garcia'], balance: 2500, accumulatedPoints: 0, pointsEnabled: false },
];

const initialSuppliers: Supplier[] = [
  { id: 's1', name: 'Sinteplast S.A.', cuit: '30-50001234-5', discounts: [10, 5], balance: -150200, phone: '5491133339876', email: 'ventas@sinteplast.com.ar', lastPurchase: new Date().toISOString() },
];

const initialPriceLists: PriceList[] = [
  { id: 'pl1', name: 'Público General', description: 'Lista de precios para clientes minoristas.', modifierType: 'margin', value: 30, isBase: true },
  { id: 'pl2', name: 'Mayorista A', description: 'Descuentos especiales para compras de volumen.', modifierType: 'margin', value: 20, isBase: false },
];

const initialBranches: Branch[] = [
  { id: 'b1', name: 'Sucursal Central', address: 'Av. Corrientes 1000', manager: 'Gerente A', status: 'online', dailySales: 100000, staffCount: 10, phone: '111111111', email: 'central@ferrogest.com'},
];

const initialUsers: InternalUser[] = [
  { id: 'mock-admin-uid-123', name: 'Administrador Demo', email: 'admin@ferrogest.com', role: 'Administrador', status: 'Activo', branchName: 'Sucursal Central', modules: ['sales', 'inventory', 'cashier', 'purchases', 'finance', 'ecommerce', 'reports', 'settings', 'branches', 'clients', 'suppliers', 'purchase-orders', 'stock-adjustment', 'bulk-modification', 'integrations', 'quotes', 'orders', 'installments', 'sales-zones'], salary: 800000, advances: [], joiningDate: '2022-01-01' },
];

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>(initialPriceLists);
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [orders, setOrders] = useState<Order[]>([]);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);
  const [salesZones, setSalesZones] = useState<SalesZone[]>([]);
  const [users, setUsers] = useState<InternalUser[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulateAsync = async (callback: () => void, delay = 300) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, delay));
    try {
      callback();
      setError(null);
    } catch (e: any) {
      setError(e.message || "A mock error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsPaginatedAndFiltered = useCallback(async (options: any) => {
    let filtered = products.filter(p => 
      options.searchTerm ? p.name.toLowerCase().includes(options.searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(options.searchTerm.toLowerCase()) : true
    );
    
    const startIndex = options.startAfterDoc ? filtered.indexOf(options.startAfterDoc) + 1 : 0;
    const paginated = filtered.slice(startIndex, startIndex + options.limit);
    
    return {
      products: paginated,
      lastVisible: paginated[paginated.length - 1] || null,
      hasMore: filtered.length > startIndex + paginated.length
    };
  }, [products]);

  const getProductById = useCallback(async (id: string) => {
    return products.find(p => p.id === id) || null;
  }, [products]);

  const addProduct = async (p: Omit<Product, 'id'>) => simulateAsync(() => {
    setProducts(prev => [...prev, { ...p, id: `p${Date.now()}` } as Product]);
  });

  const updateProduct = async (id: string, p: Partial<Product>) => simulateAsync(() => {
    setProducts(prev => prev.map(prod => prod.id === id ? { ...prod, ...p } : prod));
  });

  const deleteProduct = async (id: string) => simulateAsync(() => {
    setProducts(prev => prev.filter(prod => prod.id !== id));
  });

  const addSale = async (saleData: any) => simulateAsync(() => {
    // Si no es presupuesto, genera transacción
    if (saleData.docType !== 'presupuesto') {
      const newTransaction: Transaction = {
        id: `t${Date.now()}`,
        date: new Date().toISOString(),
        amount: saleData.total,
        type: 'ingreso',
        paymentDetails: saleData.paymentDetails,
        description: `${saleData.docType.toUpperCase()} a ${saleData.clientName} de ${saleData.items.length} items.`,
      };
      setTransactions(prev => [...prev, newTransaction]);
      
      // Descontar Stock solo si es Venta o Remito
      setProducts(prev => prev.map(product => {
        const soldItem = saleData.items.find((item: any) => (item.id === product.id || item.productId === product.id) && !item.isManual);
        if (soldItem) {
          return { ...product, stock: Math.max(0, product.stock - soldItem.quantity) };
        }
        return product;
      }));

      // Actualizar Saldo Cliente si pagó con Cuenta Corriente
      const ccPayment = saleData.paymentDetails.find((pd: any) => pd.method === 'cuenta_corriente');
      if (ccPayment && saleData.clientId) {
        setClients(prev => prev.map(c => c.id === saleData.clientId ? { ...c, balance: c.balance - ccPayment.amount, lastMovement: new Date().toISOString() } : c));
      }
    }
  });

  const addClient = async (c: Omit<Client, 'id'>) => simulateAsync(() => {
    setClients(prev => [...prev, { ...c, id: `c${Date.now()}`, balance: 0, accumulatedPoints: 0 } as Client]);
  });

  const updateClient = async (id: string, c: Partial<Client>) => simulateAsync(() => {
    setClients(prev => prev.map(cli => cli.id === id ? { ...cli, ...c } : cli));
  });

  const deleteClient = async (id: string) => simulateAsync(() => {
    setClients(prev => prev.filter(cli => cli.id !== id));
  });

  const addSupplier = async (s: Omit<Supplier, 'id'>) => simulateAsync(() => {
    setSuppliers(prev => [...prev, { ...s, id: `s${Date.now()}`, balance: 0 } as Supplier]);
  });

  const updateSupplier = async (id: string, s: Partial<Supplier>) => simulateAsync(() => {
    setSuppliers(prev => prev.map(sup => sup.id === id ? { ...sup, ...s } : sup));
  });

  const deleteSupplier = async (id: string) => simulateAsync(() => {
    setSuppliers(prev => prev.filter(sup => sup.id !== id));
  });

  const addTransaction = async (t: Omit<Transaction, 'id'>) => simulateAsync(() => {
    setTransactions(prev => [...prev, { ...t, id: `t${Date.now()}` } as Transaction]);
  });

  const addPriceList = async (pl: Omit<PriceList, 'id'>) => simulateAsync(() => {
    setPriceLists(prev => [...prev, { ...pl, id: `pl${Date.now()}` } as PriceList]);
  });

  const updatePriceList = async (id: string, pl: Partial<PriceList>) => simulateAsync(() => {
    setPriceLists(prev => prev.map(p => p.id === id ? { ...p, ...pl } : p));
  });

  const deletePriceList = async (id: string) => simulateAsync(() => {
    setPriceLists(prev => prev.filter(p => p.id !== id));
  });

  const addBranch = async (b: Omit<Branch, 'id'>) => simulateAsync(() => {
    setBranches(prev => [...prev, { ...b, id: `b${Date.now()}`, dailySales: 0, staffCount: 0 } as Branch]);
  });

  const updateBranch = async (id: string, b: Partial<Branch>) => simulateAsync(() => {
    setBranches(prev => prev.map(br => br.id === id ? { ...br, ...b } : br));
  });

  const deleteBranch = async (id: string) => simulateAsync(() => {
    setBranches(prev => prev.filter(br => br.id !== id));
  });

  const addOrder = async (o: Omit<Order, 'id'>) => simulateAsync(() => {
    setOrders(prev => [...prev, { ...o, id: `ord${Date.now()}` } as Order]);
  });

  const updateOrder = async (id: string, o: Partial<Order>) => simulateAsync(() => {
    setOrders(prev => prev.map(ord => ord.id === id ? { ...ord, ...o } : ord));
  });

  const deleteOrder = async (id: string) => simulateAsync(() => {
    setOrders(prev => prev.filter(ord => ord.id !== id));
  });

  const addInstallmentPlan = async (ip: Omit<InstallmentPlan, 'id'>) => simulateAsync(() => {
    setInstallmentPlans(prev => [...prev, { ...ip, id: `plan${Date.now()}` } as InstallmentPlan]);
  });

  const updateInstallmentPlan = async (id: string, ip: Partial<InstallmentPlan>) => simulateAsync(() => {
    setInstallmentPlans(prev => prev.map(p => p.id === id ? { ...p, ...ip } : p));
  });

  const deleteInstallmentPlan = async (id: string) => simulateAsync(() => {
    setInstallmentPlans(prev => prev.filter(p => p.id !== id));
  });

  const addSalesZone = async (sz: Omit<SalesZone, 'id'>) => simulateAsync(() => {
    setSalesZones(prev => [...prev, { ...sz, id: `sz${Date.now()}` } as SalesZone]);
  });

  const updateSalesZone = async (id: string, sz: Partial<SalesZone>) => simulateAsync(() => {
    setSalesZones(prev => prev.map(zone => zone.id === id ? { ...zone, ...sz } : zone));
  });

  const deleteSalesZone = async (id: string) => simulateAsync(() => {
    setSalesZones(prev => prev.filter(zone => zone.id !== id));
  });

  const exportAllData = async () => ({
    products, clients, suppliers, transactions, priceLists, branches, orders, installmentPlans, users, salesZones
  });

  const deleteAllDocumentsInCollection = async (name: string) => {
    console.log("Mock: Deleting collection", name);
  };

  const updateUser = async (id: string, u: Partial<InternalUser>) => simulateAsync(() => {
    setUsers(prev => prev.map(usr => usr.id === id ? { ...usr, ...u } : usr));
  });

  const value = useMemo(() => ({
    products, clients, suppliers, transactions, priceLists, branches, orders, installmentPlans, users, loading, error, salesZones,
    fetchProductsPaginatedAndFiltered, getProductById, addProduct, updateProduct, deleteProduct,
    addSale, addClient, updateClient, deleteClient, addSupplier, updateSupplier, deleteSupplier,
    addPriceList, updatePriceList, deletePriceList, addBranch, updateBranch, deleteBranch,
    addOrder, updateOrder, deleteOrder, addInstallmentPlan, updateInstallmentPlan, deleteInstallmentPlan,
    addTransaction, exportAllData, deleteAllDocumentsInCollection, updateUser, addSalesZone, updateSalesZone, deleteSalesZone
  }), [products, clients, suppliers, transactions, priceLists, branches, orders, installmentPlans, users, loading, error, salesZones, fetchProductsPaginatedAndFiltered, getProductById]);

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error("useFirebase debe usarse dentro de FirebaseProvider");
  return context;
};