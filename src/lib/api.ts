import axios from 'axios';
import type { TransactionFilters } from '@/types/transaction';

const BASE_URL = 'https://backend-ledger-0ra6.onrender.com';

export const api = axios.create({ baseURL: BASE_URL });

// Redirect to login on 401/403 access denied
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.msg || '';
    if (status === 401 || (status === 403 && msg.includes('Access denied'))) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Dashboard
export const fetchDashboard = (params?: { period?: string; date?: string }) => {
  const query = new URLSearchParams();
  if (params?.period) query.set('period', params.period);
  if (params?.date) query.set('date', params.date);
  const url = `/api/admin/dashboard${query.toString() ? `?${query.toString()}` : ''}`;
  return api.get(url);
};

// User search
export const searchUser = (userId: string) => api.get(`/api/admin/user?userId=${userId}`);

// Change User Status
export const updateUserStatus = (userId: number, status: 'active' | 'suspended' | 'ban' | 'banned' | 'inactive', remark?: string) =>
  api.patch('/api/admin/user', { userId, status, remark });

// Update User Payment (BANK, UPI, UPAY)
export const updateUserPayment = (userId: number, type: 'BANK' | 'UPI' | 'UPAY', data: Record<string, any>) =>
  api.put('/api/admin/user/payments', { userId, type, ...data });

// Search users by IP
export const searchUsersByIp = (ip: string) => api.get(`/api/admin/users-by-ip?ip=${ip}`);

// View user payment methods (single doc)
export const fetchUserPaymentMethods = (userId: number) => api.get(`/api/admin/user/payment-methods?userId=${userId}`);

// Partially update a payment method document by ID
export const updateUserPaymentMethodById = (id: string, data: Record<string, any>) =>
  api.put(`/api/admin/user/payment-methods/${id}`, data);

// Transactions
/**
 * Fetch transaction ledger entries with filters
 * At least one of userId, orderId, or transactionId is required.
 * @param params Optional filters
 */
export const fetchTransactions = (params?: TransactionFilters) => {
  const query = new URLSearchParams();
  if (params?.userId) query.set('userId', params.userId);
  if (params?.orderId) query.set('orderId', params.orderId);
  if (params?.transactionId) query.set('transactionId', params.transactionId);
  if (params?.type) query.set('type', params.type);
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params?.dateTo) query.set('dateTo', params.dateTo);
  const page = params?.page || 1;
  const limit = Math.min(params?.limit || 25, 100);
  query.set('page', String(page));
  query.set('limit', String(limit));
  return api.get(`/api/admin/transactions?${query.toString()}`);
};

// Deposits
/**
 * Fetch deposit orders with filters
 * @param params Optional parameters: userId, status, dateFrom, dateTo, page, limit
 * Status options: PENDING, SUCCESS, FAILED, REFUNDED, EXPIRED
 * Default limit: 50, Max limit: 100
 */
export const fetchDeposits = (params?: { userId?: string; mobile?: string; status?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number; orderId?: string }) => {
  const query = new URLSearchParams();
  if (params?.userId) query.set('userId', params.userId);
  if (params?.mobile) query.set('mobile', params.mobile);
  if (params?.orderId) query.set('orderId', params.orderId);
  if (params?.status) query.set('status', params.status);
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params?.dateTo) query.set('dateTo', params.dateTo);
  const page = params?.page || 1;
  const limit = Math.min(params?.limit || 50, 100);
  query.set('page', String(page));
  query.set('limit', String(limit));
  return api.get(`/api/admin/deposits?${query.toString()}`);
};

/**
 * Fetch deposit by Order ID
 * @param orderId Deposit order ID
 */
export const fetchDepositByOrder = (orderId: string) => {
  if (!orderId || orderId.trim().length === 0) {
    return Promise.reject(new Error('Order ID is required'));
  }
  return api.get(`/api/admin/deposits?orderId=${orderId}`);
};

/**
 * Approve a deposit order
 * @param orderId Deposit order ID to approve
 */
export const approveDeposit = (orderId: string) => {
  if (!orderId || orderId.trim().length === 0) {
    return Promise.reject(new Error('Order ID is required'));
  }
  return api.post('/api/admin/deposits/approve', { orderId });
};

export const fetchDepositConfig = () => api.get('/api/admin/deposit-config');

export const updateDepositConfig = (channel: string, data: { isActive?: boolean; minAmount?: number; maxAmount?: number; name?: string; description?: string; sortOrder?: number }) =>
  api.put(`/api/admin/deposit-config/${channel}`, data);

// Withdrawals
/**
 * Fetch withdrawal orders with filters
 * @param params Optional parameters: userId, status, dateFrom, dateTo, page, limit
 * Status options: PENDING, AUDITING, SUCCESS, FAILED, CANCELLED
 * Default limit: 50, Max limit: 100
 */
export const fetchWithdrawals = (params?: { userId?: string; status?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.userId) query.set('userId', params.userId);
  if (params?.status) query.set('status', params.status);
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom); // YYYY-MM-DD format
  if (params?.dateTo) query.set('dateTo', params.dateTo); // YYYY-MM-DD format
  const page = params?.page || 1;
  const limit = Math.min(params?.limit || 50, 100); // Default 50, Max 100
  query.set('page', String(page));
  query.set('limit', String(limit));
  const url = `/api/admin/withdrawals?${query.toString()}`;
  return api.get(url);
};

/**
 * Fetch a single withdrawal order by Order ID
 * @param orderId The withdrawal order ID
 */
export const fetchWithdrawalByOrder = (orderId: string) => {
  if (!orderId || orderId.trim().length === 0) {
    return Promise.reject(new Error('Order ID is required'));
  }
  return api.get(`/api/admin/withdrawals?orderId=${orderId}`);
};

/**
 * Approve a withdrawal order
 * @param orderId The withdrawal order ID to approve
 * @param chargeFrom Who bears the charge — "user" or "platform"
 */
export const approveWithdrawal = (orderId: string, chargeFrom: 'user' | 'platform' = 'user') => {
  if (!orderId || orderId.trim().length === 0) {
    return Promise.reject(new Error('Order ID is required'));
  }
  return api.post('/api/admin/withdrawals/approve', { orderId, chargeFrom });
};

/**
 * Cancel a withdrawal order (PENDING or AUDITING) and refund to wallet
 * @param orderId The withdrawal order ID to cancel
 * @param note Optional cancellation reason
 */
export const cancelWithdrawal = (orderId: string, note?: string) => {
  if (!orderId || orderId.trim().length === 0) {
    return Promise.reject(new Error('Order ID is required'));
  }
  return api.post('/api/admin/withdrawals/cancel', { orderId, note });
};

/**
 * Fetch withdrawal configuration
 */
export const fetchWithdrawalConfig = () => api.get('/api/admin/withdrawal-config');

/**
 * Update withdrawal configuration (partial update)
 * @param data Fields to update: perDayLimit, limits
 */
export const updateWithdrawalConfig = (data: { perDayLimit?: number; limits?: Record<string, { min?: number; max?: number }> }) =>
  api.put('/api/admin/withdrawal-config', data);

// Agency
export const fetchAgentStats = (userId: string, page = 1, limit = 50) =>
  api.get(`/api/admin/agent-stats?userId=${userId}&page=${page}&limit=${limit}`);

export const fetchAgencyConfigs = () => api.get('/api/agency/configs');

export const updateAgencyConfigLevel = (level: number, data: { minMembers?: number; minBets?: number; minDeposit?: number; l1Rate?: number; l2Rate?: number; l3Rate?: number }) =>
  api.put(`/api/agency/configs/${level}`, data);

export const seedAgencyConfigs = () => api.post('/api/agency/configs/seed');

export const fetchAgentLevel = (userId: string) => api.get(`/api/agency/admin/level?userId=${userId}`);

export const fetchAgencyDaily = (userId: string, date?: string) => {
  const params = new URLSearchParams({ userId });
  if (date) params.set('date', date);
  return api.get(`/api/agency/admin/daily?${params.toString()}`);
};

export const fetchAgentTeam = (agentId: string, toDate: string, params?: { fromDate?: string; tier?: number; page?: number; limit?: number }) => {
  const query = new URLSearchParams({ agentId, toDate });
  if (params?.fromDate) query.set('fromDate', params.fromDate);
  if (params?.tier) query.set('tier', String(params.tier));
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return api.get(`/api/agency/admin/team?${query.toString()}`);
};

export const runMidnightBatch = () => api.post('/api/agency/admin/run-midnight');

// Admin Logs
export const fetchAdminLogs = (params?: { level?: 'info' | 'error'; since?: string; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.level) query.set('level', params.level);
  if (params?.since) query.set('since', params.since);
  if (params?.limit) query.set('limit', String(params.limit));
  return api.get(`/api/admin/logs?${query.toString()}`);
};

// VIP Config
export const fetchVipConfig = () => api.get('/api/admin/vip-config');
export const updateVipConfig = (levels: any[]) => api.put('/api/admin/vip-config', { levels });

// Game - Bet Records
export const createBetRecord = (data: { userId: number; amount: number; product?: string; gameId?: string; site?: string; status?: number }) =>
  api.post('/api/admin/bet-record', data);

export const createDetailedBetRecord = (data: {
  member: string;
  site: string;
  product?: string;
  gameId?: string;
  refNo?: string;
  betTime?: string;
  settleTime?: string;
  bet: number;
  payout?: number;
  status?: number;
  userId?: number;
}) => api.post('/api/game/create-bet', data);

export const searchBetsByMember = (member: string, params?: { page?: number; limit?: number; site?: string; status?: number; dateFrom?: string; dateTo?: string }) => {
  const query = new URLSearchParams({ member });
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.site) query.set('site', params.site);
  if (params?.status !== undefined) query.set('status', String(params.status));
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params?.dateTo) query.set('dateTo', params.dateTo);
  return api.get(`/api/game/all-bets?${query.toString()}`);
};

export const syncBetRecords = () => api.post('/api/game/sync-bets');

export const moveGameToWallet = (data: { userId?: number; userIdTo?: number; userIds?: number[]; providerCode?: string }) =>
  api.post('/api/admin/move-game-to-wallet', data);

// Turnover Management
export const fetchTurnoverConfig = () => api.get('/api/admin/turnover-config');

export const updateTurnoverConfig = (data: { type: string; multiplier: number; active: boolean; description?: string }) =>
  api.put('/api/admin/turnover-config', data);

export const fetchTurnoverStatus = (userId: string | number) =>
  api.get(`/api/admin/turnover-status?userId=${userId}`);

export const clearTurnover = (userId: number | string, reason?: string) =>
  api.post('/api/admin/turnover/clear', { userId, reason });

export const addTurnover = (data: { userId: number | string; amount: number; type: string; sourceRef?: string }) =>
  api.post('/api/admin/turnover/add', data);

// Gift Code System
export interface GiftCodeCreateData {
  code?: string;
  rewardAmount: number;
  turnoverMultiplier?: number;
  maxRedemptions: number;
  expiryDate: string;
  minDepositToday?: number;
  isActive?: boolean;
  description?: string;
  codeLength?: number;
}

export const createGiftCode = (data: GiftCodeCreateData) =>
  api.post('/api/admin/gift-codes', data);

export const fetchGiftCodes = (params?: { page?: number; limit?: number; isActive?: boolean; search?: string }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params?.search) query.set('search', params.search);
  return api.get(`/api/admin/gift-codes?${query.toString()}`);
};

export const fetchGiftCodeByCode = (code: string) =>
  api.get(`/api/admin/gift-codes/${code}`);

export const updateGiftCode = (code: string, data: Partial<GiftCodeCreateData>) =>
  api.put(`/api/admin/gift-codes/${code}`, data);

export const toggleGiftCode = (code: string, isActive: boolean) =>
  api.patch(`/api/admin/gift-codes/${code}/toggle`, { isActive });

export const deleteGiftCode = (code: string) =>
  api.delete(`/api/admin/gift-codes/${code}`);

export const fetchGiftCodeRedemptions = (code: string, page = 1, limit = 25) =>
  api.get(`/api/admin/gift-codes/${code}/redemptions?page=${page}&limit=${limit}`);

// Additional helper functions for search optimization
export const searchUserByMobile = (mobile: string) => 
  api.get(`/api/admin/user?mobile=${mobile}`);

// Utility function to validate numeric inputs
export const validateUserId = (userId: string | number): boolean => {
  const num = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  return !isNaN(num) && num > 0;
};

// Utility function to validate order IDs
export const validateOrderId = (orderId: string): boolean => {
  return orderId && orderId.trim().length > 0;
};

// Wingo Admin APIs
export const fetchWingoCurrentRound = () => api.get('/api/wingo/admin/current-round');
export const fetchWingoCurrentRoundBets = (page = 1, limit = 50) => 
  api.get(`/api/wingo/admin/current-round/bets?page=${page}&limit=${limit}`);
export const fetchWingoRoundStats = (issueNumber: string) => 
  api.get(`/api/wingo/admin/round-stats/${issueNumber}`);
export const fetchWingoRounds = (page = 1, limit = 25) => 
  api.get(`/api/wingo/admin/rounds?page=${page}&limit=${limit}`);
export const fetchWingoResultMode = () => api.get('/api/wingo/admin/result-mode');
export const setWingoResultMode = (mode: 'RANDOM' | 'MAX_PROFIT' | 'MAX_LOSS') => 
  api.post('/api/wingo/admin/result-mode', { mode });

// Error handler utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.msg) {
    return error.response.data.msg;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An error occurred. Please try again.';
};
