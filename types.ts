
export type Language = 'BS' | 'EN';
export type UserRole = 'USER' | 'SUPER_ADMIN';
export type TenantStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export enum DocType {
  INVOICE = 'INVOICE',
  OFFER = 'OFFER',
  CALCULATION = 'CALCULATION',
  PURCHASE_ORDER = 'PURCHASE_ORDER'
}

export type VATCategory = 17 | 0 | 'EXEMPT';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'APPROVE' | 'REJECT' | 'CLONE' | 'CONVERT';

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  tenantId: string;
  action: AuditAction;
  resource: string;
  details: string;
}

export type PaymentMethod = 'Virman' | 'Gotovina' | 'Kartica';
export type PaymentStatus = 'PLAĆENO' | 'NEPLAĆENO' | 'DJELIMIČNO';

export interface SecurityPolicy {
  sessionTimeoutMinutes: number;
  requireTwoFactor: boolean;
  auditLogEnabled: boolean;
  maxLoginAttempts: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  role: UserRole;
  tenantId: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
}

export interface Company {
  name: string;
  address: string;
  city: string;
  zip: string;
  jib: string;
  pdvNumber?: string;
  bankAccounts: BankAccount[];
  email: string;
  phone: string;
  logo?: string;
  defaultPlaceOfIssue: string;
  defaultLanguage: Language;
}

export interface Tenant {
  id: string;
  company: Company;
  createdAt: string;
  status: TenantStatus;
  securityPolicy: SecurityPolicy;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  shortName?: string;
  address: string;
  city: string;
  zip?: string;
  municipality?: string;
  canton?: string;
  country?: string;
  jib: string;
  pdvNumber?: string;
  email?: string;
  phone?: string;
  web?: string;
  bankAccount?: string;
  contactPerson?: string;
}

export interface InventoryItem {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  quantity: number;
  vatRate: number;
}

export interface DocItem {
  id: string;
  inventoryItemId?: string;
  code?: string;
  description: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  discount: number;
  vatRate: number; // 17, 0, or 0 (exempt)
  vatCategory?: VATCategory;
}

export interface ERPDocument {
  id: string;
  tenantId: string;
  createdBy: string;
  type: DocType;
  number: string;
  dateCreated: string;
  dateDue: string;
  dateDelivery: string;
  taxPeriod?: string; // e.g. "2024-05"
  placeOfIssue: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  fiscalNumber?: string;
  client: Client;
  items: DocItem[];
  note?: string;
  language: Language;
  currency: string;
  isDualLanguage?: boolean;
}

export interface CalculationDoc extends ERPDocument {
  supplierInvoiceNumber: string;
  transportCosts: number;
  customsCosts: number;
  otherCosts: number;
}
