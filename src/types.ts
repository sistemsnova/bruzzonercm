export type Role = 'admin' | 'vendedor' | 'contador' | 'deposito';

export interface PriceList {
  id: string;
  name: string;
  description: string;
  modifierType: 'margin' | 'percentage_over_base';
  value: number; 
  isBase: boolean;
}

export interface Box {
  id: string;
  name: string;
  balance: number;
  type: 'efectivo' | 'banco' | 'virtual' | 'cheques';
  status: 'abierta' | 'cerrada';
  lastClosed?: string;
  responsible?: string;
}

export interface Client {
  id: string;
  name: string;
  cuit: string;
  whatsapp?: string;
  phone?: string;
  email: string;
  specialDiscount: number;
  priceListId: string;
  authorizedPersons: string[];
  balance: number;
  accumulatedPoints?: number; 
  pointsEnabled?: boolean;
  lastMovement?: string;
  daysOverdue?: number;
  province?: string;
  locality?: string;
  address?: string;
  alias?: string;
  documentType?: 'CUIT' | 'DNI' | 'LE' | 'LC' | 'PAS' | 'otro';
  secondaryId?: string;
  ivaCondition?: string;
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
  supplierCode?: string;
  locality?: string;
  ivaCondition?: string;
  address?: string;
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
  primaryUnit: 'unidad' | 'm2' | 'kg' | 'litro' | 'pie' | 'cm' | 'metro_lineal' | 'tabla' | 'caja' | 'barra'; 
  saleUnit: 'unidad' | 'm2' | 'kg' | 'litro' | 'tabla' | 'caja' | 'barra' | 'metro_lineal' | 'pie' | 'cm';
  isFractionable?: boolean; 
  saleUnitConversionFactor?: number; 
  isOnline?: boolean;
  onlinePriceAdjustment?: number;
  mlSync?: boolean;
  ivaRate?: number;
  markup?: number;
  discount1?: number;
  discount2?: number;
  discount3?: number;
  supplierListPrice?: number;
  otherCode1?: string;
  otherCode2?: string;
  otherCode3?: string;
  barcode?: string;
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
  commissionRate?: number;
  commissionAmount?: number;
  netAmount: number;
  notes?: string;
  bank?: string;
  checkNumber?: string;
  dueDate?: string;
  targetBoxId?: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'ingreso' | 'egreso' | 'transferencia';
  boxId: string;
  category?: 'venta' | 'compra' | 'gasto' | 'sueldo' | 'impuesto' | 'ajuste';
  paymentDetails: PaymentDetail[]; 
  description: string;
  method?: string;
  auditStatus?: 'pendiente' | 'revisado' | 'auditado';
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

export interface EmployeeAdvance {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'adelanto' | 'bono' | 'descuento';
}

export interface InternalUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
  branchName: string;
  modules: string[];
  salary: number;
  advances: EmployeeAdvance[];
  joiningDate: string;
  password?: string;
}

export interface SalesZone {
  id: string;
  name: string;
  description?: string;
  assignedUserIds?: string[];
  assignedBranchIds?: string[];
}

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

export interface Quote {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  items: QuoteItem[];
  total: number;
  status: 'borrador' | 'enviado' | 'aceptado' | 'vencido';
  notes?: string;
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

export interface Remito {
  id: string;
  date: string;
  client: string;
  clientId: string; 
  itemsCount: number;
  itemsList: RemitoItem[];
  total: number;
  status: 'pendiente' | 'entregado' | 'cancelado' | 'facturado'; 
  invoiceId?: string; 
}

export interface SaleItem { 
  id: string; 
  sku: string;
  name: string;
  brand: string; 
  price: number; 
  quantity: number;
  subtotal: number; 
  isManual?: boolean;
  selectedSaleUnit?: Product['saleUnit'];
}

export interface Sale { 
  id: string;
  clientName: string;
  clientId: string | null;
  items: SaleItem[]; 
  total: number;
  paymentDetails: PaymentDetail[];
  docType: 'ticket' | 'factura_a' | 'factura_b' | 'remito' | 'presupuesto'; 
  date: string;
  status: 'completado' | 'pendiente';
  seller: string;
  remitoIds?: string[]; 
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
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

export interface SupplierAutomationConfig {
  supplierId: string;
  sourceType: 'manual' | 'web' | 'email';
  url?: string;
  emailSource?: string;
  enabled: boolean;
  lastRun?: string;
  lastRunStatus?: 'success' | 'error';
  lastRunMessage?: string;
}