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
export const fetchDashboard = () => api.get('/api/admin/dashboard');

// User search
export const searchUser = (userId: string) => api.get(`/api/admin/user?userId=${userId}`);

// Change User Status
export const updateUserStatus = (userId: number, status: 'active' | 'suspended' | 'inactive', remark?: string) =>
  api.patch('/api/admin/user', { userId, status, remark });

// Override User Bank
export const overrideUserBank = (userId: number, bankName: string, bankCode: string, accountNumber: string, accountHolder: string) =>
  api.put('/api/admin/user/bind-bank', { userId, bankName, bankCode, accountNumber, accountHolder });

// Transactions
export const fetchTransactions = (userId: string, page = 1, limit = 25) =>
  api.get(`/api/admin/transactions?userId=${userId}&page=${page}&limit=${limit}`);

// Deposits
export const fetchDepositsByUser = (userId: string, page = 1, limit = 25) =>
  api.get(`/api/admin/deposits?userId=${userId}&page=${page}&limit=${limit}`);

export const fetchDepositByOrder = (orderId: string) =>
  api.get(`/api/admin/deposits?orderId=${orderId}`);

// Approve Deposit
export const approveDeposit = (orderId: string) =>
  api.post('/api/admin/deposits/approve', { orderId });

// Withdrawals
export const fetchWithdrawalsByUser = (userId: string, page = 1, limit = 25) =>
  api.get(`/api/admin/withdrawals?userId=${userId}&page=${page}&limit=${limit}`);

export const fetchWithdrawalByOrder = (orderId: string) =>
  api.get(`/api/admin/withdrawals/${orderId}`);

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
