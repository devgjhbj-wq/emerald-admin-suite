
export interface DepositItem {
  userId: number | string;
  orderId: string;
  amount: number;
  receivedAmount?: number;
  currency?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'EXPIRED';
  channelName: string;
  gatewayOrderNo?: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DepositResponse {
  items: DepositItem[];
  total: number;
  limit: number;
  page: number;
  status?: string;
}

export interface DepositFilters {
  page: number;
  limit: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  mobile?: string;
  orderId?: string;
}
