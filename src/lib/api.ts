import axios from 'axios';

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
export const updateUserStatus = (userId: number, status: 'active' | 'suspended' | 'inactive', remark?: string) =>
  api.patch('/api/admin/user', { userId, status, remark });

// Override User Bank
export const overrideUserBank = (userId: number, bankName: string, bankCode: string, accountNumber: string, accountHolder: string) =>
  api.put('/api/admin/user/bind-bank', { userId, bankName, bankCode, accountNumber, accountHolder });

// Transactions
/**
 * Fetch user transactions (paginated)
 * @param userId User ID
 * @param page Page number (default: 1)
 * @param limit Items per page (default: 25, max: 100)
 */
export const fetchTransactions = (userId: string, page = 1, limit = 25) => {
  if (!userId || userId.trim().length === 0) {
    return Promise.reject(new Error('User ID is required'));
  }
  const validatedLimit = Math.min(limit, 100); // Max 100
  return api.get(`/api/admin/transactions?userId=${userId}&page=${page}&limit=${validatedLimit}`);
};

// Deposits
/**
 * Fetch deposits by User ID
 * @param userId User ID
 * @param page Page number (default: 1)
 * @param limit Items per page (default: 25, max: 100)
 */
export const fetchDepositsByUser = (userId: string, page = 1, limit = 25) => {
  if (!userId || userId.trim().length === 0) {
    return Promise.reject(new Error('User ID is required'));
  }
  const validatedLimit = Math.min(limit, 100); // Max 100
  return api.get(`/api/admin/deposits?userId=${userId}&page=${page}&limit=${validatedLimit}`);
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
 */
export const approveWithdrawal = (orderId: string) => {
  if (!orderId || orderId.trim().length === 0) {
    return Promise.reject(new Error('Order ID is required'));
  }
  return api.post('/api/admin/withdrawals/approve', { orderId });
};

// Agent Stats
export const fetchAgentStats = (userId: string, page = 1, limit = 50) =>
  api.get(`/api/admin/agent-stats?userId=${userId}&page=${page}&limit=${limit}`);

// Agent Config
export const fetchAgentConfig = () => api.get('/api/admin/agent-config');
export const updateAgentConfig = (comRates: number[]) =>
  api.put('/api/admin/agent-config', { comRates });

// Agent Daily
export const fetchAgentDaily = (userId: string, date?: string) => {
  const params = new URLSearchParams({ userId });
  if (date) params.set('date', date);
  return api.get(`/api/admin/agent-daily?${params.toString()}`);
};

// Agent Commissions (admin)
export const fetchAgentCommissions = (
  recUser: string,
  params?: { claim?: boolean; from?: string; to?: string; page?: number; limit?: number }
) => {
  const query = new URLSearchParams({ recUser });
  if (params?.claim !== undefined) query.set('claim', String(params.claim));
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return api.get(`/api/admin/agent/commissions?${query.toString()}`);
};

export const claimAgentCommission = (recUser: number, upTo?: string) =>
  api.post('/api/admin/agent/commissions/claim', { recUser, upTo });

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

// Additional helper functions for search optimization
export const searchUserByMobile = (mobile: string) => 
  api.get(`/api/admin/user?mobile=${mobile}`);

export const searchAgentStats = (agentId: string, page = 1, limit = 50) =>
  api.get(`/api/admin/agent-stats?userId=${agentId}&page=${page}&limit=${limit}`);

// Utility function to validate numeric inputs
export const validateUserId = (userId: string | number): boolean => {
  const num = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  return !isNaN(num) && num > 0;
};

// Utility function to validate order IDs
export const validateOrderId = (orderId: string): boolean => {
  return orderId && orderId.trim().length > 0;
};

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
