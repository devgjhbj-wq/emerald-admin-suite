export interface TransactionItem {
  userId: number | string;
  type: string;
  amount: number;
  charge?: number;
  balanceAfter?: number;
  status: string;
  orderId?: string;
  remark?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TransactionResponse {
  items: TransactionItem[];
  total: number;
  limit: number;
  page: number;
  filter?: Record<string, any>;
  status?: string;
}

export interface TransactionFilters {
  userId?: string;
  orderId?: string;
  transactionId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
