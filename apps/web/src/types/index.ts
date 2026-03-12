export type CustomerRank = 'RANK_1' | 'RANK_2' | 'RANK_3' | 'RANK_4' | 'RANK_5' | 'RANK_6';
export type BillingType = 'ONE_TIME' | 'RECURRING_MONTHLY' | 'RECURRING_ANNUAL';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
export type FollowLogType = 'CALL' | 'LINE' | 'MEETING' | 'EMAIL' | 'LETTER' | 'OTHER';
export type ProspectStage = 'LEAD' | 'SEMINAR' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
export type ProductCategory = 'LIST_ACQUISITION' | 'INDIVIDUAL' | 'SEMINAR' | 'ONLINE_COURSE' | 'SUBSCRIPTION';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  acquisitionSource?: string;
  rank: CustomerRank;
  cumulativeSpend: number;
  lastPurchaseDate?: string;
  isDormant: boolean;
  daysSinceLastPurchase?: number;
  createdAt: string;
}

export interface Prospect {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  acquisitionSource?: string;
  stage: ProspectStage;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  priceJpy: number;
  category: ProductCategory;
  billingType: BillingType;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  customerId: string;
  productId?: string;
  amountJpy: number;
  billingType: BillingType;
  subscriptionStatus?: SubscriptionStatus;
  transactionDate: string;
  note?: string;
  product?: { id: string; name: string };
  customer?: { id: string; name: string; rank: CustomerRank };
}

export interface TransactionSummary {
  period: string;
  from: string;
  to: string;
  revenueJpy: number;
  expenseJpy: number;
  profitJpy: number;
  isProfit: boolean;
  transactionCount: number;
  productVolume: Record<string, { name: string; count: number; revenue: number }>;
  vsLastPeriod: number | null;
}

export interface FollowLog {
  id: string;
  customerId?: string;
  prospectId?: string;
  type: FollowLogType;
  logDate: string;
  notes?: string;
  outcome?: string;
  nextAction?: string;
  nextDueDate?: string;
}

export interface MarketingFunnelRecord {
  id: string;
  recordDate: string;
  campaignLabel?: string;
  atv?: number;
  epc?: number;
  cpc?: number;
  cpa?: number;
  cps?: number;
  maCps?: number;
  totalClicks?: number;
  totalRevenue?: number;
  totalAdSpend?: number;
  notes?: string;
}

export interface DashboardKpi {
  daily: {
    revenueJpy: number;
    expenseJpy: number;
    profitJpy: number;
    isProfit: boolean;
    newCustomers: number;
    existingCustomersHandled: number;
    repeatRate: number;
    churnRiskCount: number;
  };
  weekly: {
    cpa?: number | null;
    cps?: number | null;
    epc?: number | null;
    cpc?: number | null;
    atv?: number | null;
    referralCount: number;
    productVolume: Record<string, { productName: string; count: number; revenueJpy: number }>;
  };
  monthly: {
    revenueJpy: number;
    expenseJpy: number;
    profitJpy: number;
    isProfit: boolean;
    ltvAvg: number;
    maCps: number;
    subscriptionMrr: number;
    newCustomers: number;
    repeatCustomers: number;
    totalCustomers: number;
    newVsRepeat: { new: number; repeat: number };
  };
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  tenantName: string;
}
