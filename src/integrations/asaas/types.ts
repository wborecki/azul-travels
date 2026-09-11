/** Tipos do subconjunto da API do Asaas que a plataforma usa. */

export type AsaasBillingType = "UNDEFINED" | "BOLETO" | "CREDIT_CARD" | "PIX";

export type AsaasPaymentStatus =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "REFUNDED"
  | "RECEIVED_IN_CASH"
  | "REFUND_REQUESTED"
  | "REFUND_IN_PROGRESS"
  | "CHARGEBACK_REQUESTED"
  | "CHARGEBACK_DISPUTE"
  | "AWAITING_CHARGEBACK_REVERSAL"
  | "DUNNING_REQUESTED"
  | "DUNNING_RECEIVED"
  | "AWAITING_RISK_ANALYSIS";

export interface AsaasCustomerInput {
  name: string;
  cpfCnpj: string;
  email?: string;
  mobilePhone?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
}

export interface AsaasCustomer {
  object: "customer";
  id: string;
  name: string;
  cpfCnpj: string;
  email: string | null;
  mobilePhone: string | null;
  externalReference: string | null;
  deleted: boolean;
}

export interface AsaasSplit {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
}

export interface AsaasSplitResponse extends AsaasSplit {
  id: string;
  status?: string;
  refusalReason?: string | null;
}

export interface AsaasPaymentInput {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  split?: AsaasSplit[];
  callback?: {
    successUrl: string;
    autoRedirect?: boolean;
  };
}

export interface AsaasPayment {
  object: "payment";
  id: string;
  customer: string;
  billingType: AsaasBillingType;
  status: AsaasPaymentStatus;
  value: number;
  netValue: number | null;
  dueDate: string;
  originalDueDate: string | null;
  paymentDate: string | null;
  clientPaymentDate: string | null;
  confirmedDate: string | null;
  description: string | null;
  externalReference: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  transactionReceiptUrl: string | null;
  deleted: boolean;
  split?: AsaasSplitResponse[];
}

export interface AsaasDeleted {
  id: string;
  deleted: boolean;
}

/** Subconta (Etapa 4). `apiKey` só volta na criação e nunca é persistida por nós. */
export interface AsaasAccountInput {
  name: string;
  email: string;
  cpfCnpj: string;
  companyType?: string;
  birthDate?: string;
  mobilePhone: string;
  incomeValue: number;
  address: string;
  addressNumber: string;
  complement?: string;
  province: string;
  postalCode: string;
}

export interface AsaasAccount {
  object: "account";
  id: string;
  walletId: string;
  apiKey?: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

export interface AsaasList<T> {
  object: "list";
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
}

export interface AsaasWalletIdResponse {
  walletId: string;
}
