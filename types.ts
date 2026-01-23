
export type Role = 'admin' | 'vendedor' | 'contador' | 'deposito';

export interface PriceList {
  id: string;
  name: string;
  description: string;
  modifierType: 'margin' | 'percentage_over_base';
  value: number; 
  isBase: boolean;
}

export interface Client {
  id: string;
  name: string;
  cuit: string;
  whatsapp: string;
  email: string;
  specialDiscount: number;
  priceListId: string;
  authorizedPersons: string[];
  balance: number;
  accumulatedPoints?: number; 
  pointsEnabled?: boolean;
  lastMovement?: string;
  daysOverdue?: number;
}

export interface Supplier {
  id: string;
  name: string;
  cuit: string;
  discounts: number[];
  balance: number;
  phone?: string;
  email?: string;
  lastPurchase?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  supplierId?: string;
  costPrice: number;
  salePrice: number; 
  stock: number; 
  category: string;
  brand: string;
  reorderPoint?: number;
  targetStock?: number;
  packQuantity?: number;
  purchaseCurrency?: string;
  saleCurrency?: string;
  supplierProductCode?: string;
  minStock?: number;
  location?: string;
  imageUrl?: string;
  primaryUnit: 'unidad' | 'm2' | 'kg' | 'litro' | 'pie' | 'cm' | 'metro_lineal'; 
  saleUnit: 'unidad' | 'm2' | 'kg' | 'litro' | 'tabla' | 'caja' | 'barra' | 'metro_lineal' | 'pie' | 'cm';
  saleUnitConversionFactor?: number;
  isOnline?: boolean;
  onlinePriceAdjustment?: number;
  mlSync?: boolean;
  isFractionable?: boolean;
  unitName?: string;
  unitsPerParent?: number;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  manager: string;
  status: 'online' | 'offline';
  dailySales: number;
  staffCount: number;
  phone?: string;
  email?: string;
}

export interface PaymentDetail {
  id: string;
  method: 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia' | 'cheque' | 'echeq' | 'cuenta_corriente' | 'otro';
  amount: number;
  notes?: string;
  bank?: string;
  checkNumber?: string;
  dueDate?: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'ingreso' | 'egreso' | 'transferencia';
  category?: 'venta' | 'compra' | 'gasto' | 'sueldo' | 'impuesto' | 'ajuste';
  paymentDetails: PaymentDetail[]; 
  description: string;
  method?: string;
  auditStatus?: 'pendiente' | 'revisado' | 'auditado';
}

export interface Check {
  id: string;
  number: string;
  bank: string;
  amount: number;
  dueDate: string;
  type: 'fisico' | 'echeq';
  status: 'pendiente' | 'cobrado' | 'vencido';
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  dateCreated: string;
  dateDue?: string;
  items: OrderItem[];
  total: number;
  status: 'pendiente_preparacion' | 'listo_retiro' | 'en_camino' | 'entregado' | 'cancelado';
  notes?: string;
  isServiceOrder?: boolean;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  originalProduct: Product | null;
  selectedSaleUnit?: Product['saleUnit'];
  isService?: boolean;
  serviceDescription?: string;
}

export interface InstallmentPlan {
  id: string;
  clientId: string;
  clientName: string;
  totalAmount: number;
  downPayment: number;
  installmentsCount: number;
  amountPerInstallment: number;
  remainingAmount: number;
  payments: InstallmentPayment[];
  status: 'activo' | 'pagado' | 'mora' | 'cancelado';
  startDate: string;
  nextDueDate?: string;
  description: string;
}

export interface InstallmentPayment {
  id: string;
  date: string;
  amountPaid: number;
  paymentDetails: PaymentDetail[];
  notes?: string;
  method: string;
}

export interface InternalUser {
  id: string | number;
  name: string;
  email: string;
  role: string;
  status: string;
  branchName: string;
  modules: string[];
  salary: number;
  advances: { date: string; amount: number; }[];
  joiningDate: string;
}

export interface SalesZone {
  id: string;
  name: string;
  description?: string;
  assignedUserIds?: string[];
  assignedBranchIds?: string[];
}

export interface AndreaniConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  accountNumber: string;
  branchCode: string;
  connected: boolean;
  nickname?: string;
}

// Added missing interfaces for AI Extraction, Quotes and Remitos modules
export interface ExtractedQuoteItem {
  productName: string;
  quantity: number;
}

export interface QuoteItem {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  originalProduct: Product | null;
  unmatchedText?: string;
}

export interface RemitoItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  brand: string;
  selectedSaleUnit: Product['saleUnit'];
  originalPrimaryUnit: Product['primaryUnit'];
  originalSaleUnit: Product['saleUnit'];
  originalSaleUnitConversionFactor: number;
}

// *** NEW/UPDATED INTERFACES FOR REMITO/FACTURA RELATIONSHIP ***
export interface Remito {
  id: string;
  date: string;
  client: string;
  clientId: string; // Added client ID for easier linking
  itemsCount: number;
  itemsList: RemitoItem[];
  total: number;
  status: 'pendiente' | 'entregado' | 'cancelado' | 'facturado'; // Added 'facturado' status
  invoiceId?: string; // Link to the Sale (Invoice) document
}

export interface SaleItem { // Used in Sale document
  id: string; // Product ID
  sku: string;
  name: string;
  brand: string;
  price: number; // Sale price at the time of sale
  quantity: number;
  subtotal: number; // price * quantity
  isManual?: boolean;
  selectedSaleUnit?: Product['saleUnit'];
}

export interface Sale { // Represents a final invoice/ticket
  id: string;
  clientName: string;
  clientId: string | null;
  items: SaleItem[]; // Renamed from 'CartItem' to 'SaleItem' for clarity
  total: number;
  paymentDetails: PaymentDetail[];
  docType: 'ticket' | 'factura_a' | 'factura_b' | 'remito' | 'presupuesto'; // Changed 'remito' here means a direct remito-sale
  date: string;
  status: 'completado' | 'pendiente';
  seller: string;
  remitoIds?: string[]; // Links to associated Remito documents
}
