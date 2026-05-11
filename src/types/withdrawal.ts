export interface BankDetails {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  bankCode?: string;
  ifsc?: string;
}

export interface WithdrawalItem {
  userId: number | string;
  orderId: string;
  amount: number;
  charge?: number;
  balanceAfter?: number;
  bankDetails?: BankDetails;
  status: 'PENDING' | 'AUDITING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  channelName: string;
  gatewayOrderNo?: string;
  remark?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WithdrawalResponse {
  items: WithdrawalItem[];
  total: number;
  limit: number;
  page: number;
  status?: string;
}

export interface WithdrawalFilters {
  page: number;
  limit: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  orderId?: string;
}
