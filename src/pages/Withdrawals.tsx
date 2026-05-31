import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithdrawals, fetchWithdrawalByOrder, approveWithdrawal, cancelWithdrawal, fetchWithdrawalConfig, updateWithdrawalConfig, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, XCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import type { WithdrawalResponse, WithdrawalItem, WithdrawalConfig, WithdrawalFilters } from '@/types/withdrawal';
import { PageContainer, SearchHeader, Pagination } from '@/components/PageContainer';

const statusColor: Record<string, string> = {
  SUCCESS: 'bg-primary/20 text-primary',
  AUDITING: 'bg-blue-500/20 text-blue-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  FAILED: 'bg-destructive/20 text-destructive',
  CANCELLED: 'bg-muted text-muted-foreground',
};

const Withdrawals = () => {
  const { token } = useAuth();
  
  // Search state
  const [userId, setUserId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState('');
  const [chargeFrom, setChargeFrom] = useState<'user' | 'platform'>('user');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  
  // Results state
  const [results, setResults] = useState<WithdrawalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [lastSearchType, setLastSearchType] = useState<'user' | 'order' | 'global'>('global');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Tab state
  const [tab, setTab] = useState<'orders' | 'config'>('orders');

  // Config state
  const [config, setConfig] = useState<WithdrawalConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [editPerDayLimit, setEditPerDayLimit] = useState(3);
  const [editLimits, setEditLimits] = useState({ BANK: { min: 110, max: 50000 }, UPI: { min: 300, max: 15000 }, UPAY: { min: 300, max: 50000 } });

  const loadConfig = useCallback(async () => {
    setAuthToken(token);
    setConfigLoading(true);
    try {
      const res = await fetchWithdrawalConfig();
      const data = res.data?.data;
      if (data) {
        setConfig(data);
        setEditPerDayLimit(data.perDayLimit);
        setEditLimits({
          BANK: { min: data.limits.BANK.min, max: data.limits.BANK.max },
          UPI: { min: data.limits.UPI.min, max: data.limits.UPI.max },
          UPAY: { min: data.limits.UPAY.min, max: data.limits.UPAY.max },
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load config');
    } finally {
      setConfigLoading(false);
    }
  }, [token]);

  const handleSaveConfig = async () => {
    setAuthToken(token);
    setConfigSaving(true);
    try {
      const payload: Record<string, any> = {};
      if (editPerDayLimit !== config?.perDayLimit) payload.perDayLimit = editPerDayLimit;
      const changedLimits: Record<string, { min?: number; max?: number }> = {};
      for (const method of ['BANK', 'UPI', 'UPAY'] as const) {
        const lim: { min?: number; max?: number } = {};
        if (editLimits[method].min !== config?.limits[method].min) lim.min = editLimits[method].min;
        if (editLimits[method].max !== config?.limits[method].max) lim.max = editLimits[method].max;
        if (Object.keys(lim).length) changedLimits[method] = lim;
      }
      if (Object.keys(changedLimits).length) payload.limits = changedLimits;
      const res = await updateWithdrawalConfig(payload);
      setConfig(res.data?.data || res.data);
      toast.success('Config updated');
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update config');
    } finally {
      setConfigSaving(false);
    }
  };

  useEffect(() => {
    if (tab === 'config') loadConfig();
  }, [tab, loadConfig]);

  const handleApprove = async (orderIdToApprove: string) => {
    setAuthToken(token);
    setApprovingId(orderIdToApprove);
    try {
      const res = await approveWithdrawal(orderIdToApprove, chargeFrom);
      toast.success(res.data.msg || 'Withdrawal approved');
      if (results?.items) {
        const updatedItems = results.items.map((d) => 
          d.orderId === orderIdToApprove ? { ...d, status: 'AUDITING' as const } : d
        );
        setResults({ ...results, items: updatedItems });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string; gatewayError?: string } }; message?: string };
      toast.error(error.response?.data?.gatewayError || error.response?.data?.msg || error.message || 'Failed to approve withdrawal');
    } finally {
      setApprovingId(null);
    }
  };

  const handleCancel = async (item: WithdrawalItem) => {
    const note = window.prompt(`Reason for cancelling withdrawal ${item.orderId} (₹${item.amount?.toLocaleString()}):`, '');
    if (note === null) return;
    setAuthToken(token);
    setCancellingId(item.orderId);
    try {
      const res = await cancelWithdrawal(item.orderId, note || undefined);
      toast.success(res.data.msg || 'Withdrawal cancelled');
      if (results?.items) {
        const updatedItems = results.items.map((d) =>
          d.orderId === item.orderId ? { ...d, status: 'CANCELLED' as const } : d
        );
        setResults({ ...results, items: updatedItems });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string } }; message?: string };
      toast.error(error.response?.data?.msg || error.message || 'Failed to cancel withdrawal');
    } finally {
      setCancellingId(null);
    }
  };

  const loadByUserId = useCallback(async (p = 1) => {
    const q = userId.trim();
    if (!q) {
      toast.error('Enter User ID');
      return;
    }
    if (isNaN(Number(q))) {
      toast.error('User ID must be numeric');
      return;
    }
    setLoading(true);
    setAuthToken(token);
    setLastSearchType('user');
    try {
      const response = await fetchWithdrawals({
        userId: q,
        page: p,
        limit: 50,
      });
      setResults(response.data);
      setPage(p);
      setPageInput(p.toString());
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to fetch user withdrawals');
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  const loadByOrderId = useCallback(async () => {
    const q = orderId.trim();
    if (!q) {
      toast.error('Enter Order ID');
      return;
    }
    setLoading(true);
    setAuthToken(token);
    setLastSearchType('order');
    try {
      const response = await fetchWithdrawalByOrder(q);
      if (response.data?.items && Array.isArray(response.data.items)) {
        setResults({
          items: response.data.items,
          total: response.data.items.length,
          limit: 1,
          page: 1,
          status: response.data.status
        });
        setPage(1);
        setPageInput('1');
      } else {
        setResults(null);
        toast.error('Order not found');
      }
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  }, [token, orderId]);

  const loadGlobalSearch = useCallback(async (p = 1) => {
    if (!dateFrom || !dateTo) {
      toast.error('Please select both From and To dates for Global Search');
      return;
    }
    setLoading(true);
    setAuthToken(token);
    setLastSearchType('global');
    try {
      const filters: WithdrawalFilters = {
        page: p,
        limit: 50,
      };
      if (status && status !== 'all') filters.status = status;
      if (dateFrom) filters.dateFrom = format(dateFrom, 'yyyy-MM-dd');
      if (dateTo) filters.dateTo = format(dateTo, 'yyyy-MM-dd');

      const response = await fetchWithdrawals(filters);
      setResults(response.data);
      setPage(p);
      setPageInput(p.toString());
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to perform Global Search');
    } finally {
      setLoading(false);
    }
  }, [token, status, dateFrom, dateTo]);

  const handlePageGo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const p = parseInt(pageInput);
      if (!isNaN(p) && p > 0 && p <= totalPages) {
        if (lastSearchType === 'user') loadByUserId(p);
        else if (lastSearchType === 'global') loadGlobalSearch(p);
      } else {
        toast.error(`Invalid page number. Please enter between 1 and ${totalPages}`);
      }
    }
  };

  const handleRefresh = () => {
    if (lastSearchType === 'user') loadByUserId(page);
    else if (lastSearchType === 'order') loadByOrderId();
    else loadGlobalSearch(page);
  };

  const handleClear = () => {
    setUserId('');
    setOrderId('');
    setStatus('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setResults(null);
    setPage(1);
  };

  const handleToday = () => {
    const today = new Date();
    setDateFrom(today);
    setDateTo(today);
  };

  const totalPages = results?.total ? Math.ceil(results.total / (results.limit || 50)) : 0;

  const renderTable = (data: WithdrawalResponse) => {
    const showEmpty = !data?.items?.length;

    return (
      <div className="relative rounded" style={{ height: 445, border: '1px solid hsl(var(--border))' }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Loading size={30} />
          </div>
        )}

        <div style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
          <table className="el-table" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 1770 }}>
            <colgroup>
              <col style={{ width: 95 }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 250 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 90 }} />
            </colgroup>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
              <tr style={{ height: 50 }}>
                {['User ID', 'Order ID', 'Amount', 'Currency', 'Charge', 'Pay Method', 'Payment Details', 'Channel', 'Gateway No.', 'Status', 'Note', 'Created At', 'Updated At', 'Action'].map((label) => (
                  <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                    <div className="cell">{label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showEmpty ? (
                <tr>
                  <td colSpan={14} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 50, color: 'hsl(var(--muted-foreground))', overflow: 'hidden' }}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      <span>No Data</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((d: WithdrawalItem, i: number) => (
                  <tr key={i} style={{ height: 50 }}>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.userId}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: 11 }}>{d.orderId}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">₹{d.amount?.toLocaleString()}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.currency || 'INR'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ color: 'hsl(var(--destructive))' }}>{d.charge ? `₹${Number(d.charge).toFixed(2)}` : '—'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        {d.paymentMethod ? (
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${
                            d.paymentMethod === 'UPI' ? 'bg-green-500/20 text-green-400' :
                            d.paymentMethod === 'BANK' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {d.paymentMethod}
                          </span>
                        ) : (
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>-</span>
                        )}
                      </div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontSize: 11, textAlign: 'left' }}>
                        {d.paymentMethod === 'UPI' && d.paymentDetails?.upiId ? (
                          <div style={{ lineHeight: 1.4 }}>
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>UPI: </span>
                            <span style={{ fontFamily: 'monospace' }}>{d.paymentDetails.upiId}</span>
                            <br />
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>Name: </span>
                            <span>{d.paymentDetails.holderName}</span>
                          </div>
                        ) : d.paymentMethod === 'UPAY' && d.paymentDetails?.rplId ? (
                          <div style={{ lineHeight: 1.4 }}>
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>RPL: </span>
                            <span style={{ fontFamily: 'monospace' }}>{d.paymentDetails.rplId}</span>
                            <br />
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>Name: </span>
                            <span>{d.paymentDetails.holderName}</span>
                          </div>
                        ) : d.paymentMethod === 'BANK' && d.paymentDetails?.accountNo ? (
                          <div style={{ lineHeight: 1.4 }}>
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>A/C: </span>
                            <span style={{ fontFamily: 'monospace' }}>{d.paymentDetails.accountNo}</span>
                            <br />
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>IFSC: </span>
                            <span style={{ fontFamily: 'monospace' }}>{d.paymentDetails.ifsc || '-'}</span>
                            <br />
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>Name: </span>
                            <span>{d.paymentDetails.holderName}</span>
                          </div>
                        ) : d.bankDetails ? (
                          <div style={{ lineHeight: 1.4 }}>
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>A/C: </span>
                            <span style={{ fontFamily: 'monospace' }}>{d.bankDetails.accountNumber}</span>
                            <br />
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>IFSC: </span>
                            <span style={{ fontFamily: 'monospace' }}>{d.bankDetails.ifsc || d.bankDetails.bankCode || '-'}</span>
                            <br />
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>Name: </span>
                            <span>{d.bankDetails.accountHolder}</span>
                            <br />
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>Bank: </span>
                            <span>{d.bankDetails.bankName}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>-</span>
                        )}
                      </div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.channelName}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontFamily: 'monospace', fontSize: 11 }}>{d.gatewayOrderNo || '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${statusColor[d.status] || 'bg-muted text-muted-foreground'}`}>
                          {d.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.note || d.remark || '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontSize: 11 }}>{new Date(d.createdAt).toLocaleString()}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontSize: 11 }}>{d.updatedAt ? new Date(d.updatedAt).toLocaleString() : '—'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          {d.status === 'PENDING' && (
                            <button
                              onClick={() => handleApprove(d.orderId)}
                              disabled={!!approvingId || !!cancellingId}
                              style={{
                                background: approvingId === d.orderId ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--primary))',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 2,
                                padding: '4px 6px',
                                fontSize: 11,
                                cursor: (!!approvingId || !!cancellingId) ? 'not-allowed' : 'pointer',
                                lineHeight: 1,
                                opacity: (!!approvingId || !!cancellingId) ? 0.6 : 1,
                              }}
                            >
                              {approvingId === d.orderId ? '...' : '✓'}
                            </button>
                          )}
                          {(d.status === 'PENDING' || d.status === 'AUDITING') && (
                            <button
                              onClick={() => handleCancel(d)}
                              disabled={!!approvingId || !!cancellingId}
                              style={{
                                background: (!!approvingId || !!cancellingId) ? 'hsl(var(--destructive) / 0.5)' : 'hsl(var(--destructive))',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 2,
                                padding: '4px 6px',
                                fontSize: 11,
                                cursor: (!!approvingId || !!cancellingId) ? 'not-allowed' : 'pointer',
                                lineHeight: 1,
                                opacity: (!!approvingId || !!cancellingId) ? 0.6 : 1,
                              }}
                            >
                              {cancellingId === d.orderId ? '...' : '✕'}
                            </button>
                          )}
                          {d.status !== 'PENDING' && d.status !== 'AUDITING' && (
                            <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 11 }}>—</span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <PageContainer>
      {/* Tab Bar */}
      <div className="flex items-center gap-0 bg-card border border-border rounded px-1" style={{ height: 34 }}>
        {(['orders', 'config'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-2 text-xs font-medium rounded transition-all capitalize ${
              tab === t
                ? 'bg-[rgb(32,143,255)] text-white border border-[rgb(32,143,255)]'
                : 'text-muted-foreground border border-transparent hover:text-foreground hover:border-border'
            }`}
            style={{ height: 26, lineHeight: '26px', marginRight: 5 }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
      <>
      <SearchHeader>
        <div className="form-grid w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">User ID</div>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="w-full h-[34px] text-sm px-2"
              onKeyDown={(e) => e.key === 'Enter' && loadByUserId(1)}
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Order ID</div>
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID"
              className="w-full h-[34px] text-sm px-2"
              onKeyDown={(e) => e.key === 'Enter' && loadByOrderId()}
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Status</div>
            <select
              className="w-full h-[34px] rounded border border-input bg-background px-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="AUDITING">AUDITING</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Charge</div>
            <select
              className="w-full h-[34px] rounded border border-input bg-background px-2 text-sm"
              value={chargeFrom}
              onChange={(e) => setChargeFrom(e.target.value as 'user' | 'platform')}
            >
              <option value="user">User</option>
              <option value="platform">Platform</option>
            </select>
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">From</div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-sm h-[34px] px-3 rounded-[5px]"
                >
                  <CalendarIcon className="mr-1.5 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={2024}
                  toYear={2026}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">To</div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-sm h-[34px] px-3 rounded-[5px]"
                >
                  <CalendarIcon className="mr-1.5 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM dd, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={2024}
                  toYear={2026}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleToday}
              size="sm"
              className="h-[34px] px-3 text-sm rounded-[5px]"
              style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}
            >
              Today
            </Button>
          </div>

          <div className="flex items-end gap-3">
            <Button
              onClick={() => loadGlobalSearch(1)}
              disabled={loading}
              size="sm"
              className="h-[34px] px-4 text-sm rounded-[5px] gap-1.5"
              style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}
            >
              {loading && lastSearchType === 'global' ? <Loading size={14} /> : null}
              Search
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              className="h-[34px] px-4 text-sm rounded-[5px]"
            >
              Reset
            </Button>
          </div>
        </div>
      </SearchHeader>

      {results && (
        <>
          {renderTable(results)}
          <Pagination page={page} totalPages={totalPages} total={results.total} loading={loading} onPageChange={(p) => {
            if (lastSearchType === 'user') loadByUserId(p);
            else if (lastSearchType === 'global') loadGlobalSearch(p);
          }} />
        </>
      )}
      </>
      )}

      {tab === 'config' && (
        <div className="bg-card border border-border p-4 rounded-lg space-y-4">
          <h3 className="text-sm font-semibold">Withdrawal Configuration</h3>
          {configLoading ? (
            <div className="flex justify-center py-8"><Loading size={20} /></div>
          ) : (
            <div className="space-y-4">
              <div className="w-[140px]">
                <label className="text-[10px] font-medium text-muted-foreground uppercase mb-1 block">Per Day Limit</label>
                <input
                  type="number"
                  className="flex h-7 w-full rounded border border-input bg-background px-2 py-0.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={editPerDayLimit}
                  onChange={(e) => setEditPerDayLimit(Number(e.target.value))}
                  min={1}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {(['BANK', 'UPI', 'UPAY'] as const).map((method) => (
                  <div key={method} className="border border-border rounded p-3 space-y-2">
                    <span className="text-xs font-semibold text-foreground">{method}</span>
                    <div className="flex ga">
                      <div className="flex-1">
                        <label className="text-[10px] text-muted-foreground">Min</label>
                        <input
                          type="number"
                          className="flex h-7 w-full rounded border border-input bg-background px-2 py-0.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={editLimits[method].min}
                          onChange={(e) => setEditLimits({ ...editLimits, [method]: { ...editLimits[method], min: Number(e.target.value) } })}
                          min={0}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-muted-foreground">Max</label>
                        <input
                          type="number"
                          className="flex h-7 w-full rounded border border-input bg-background px-2 py-0.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={editLimits[method].max}
                          onChange={(e) => setEditLimits({ ...editLimits, [method]: { ...editLimits[method], max: Number(e.target.value) } })}
                          min={0}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex ga">
                <Button onClick={handleSaveConfig} disabled={configSaving} size="sm" className="h-7 text-xs">
                  {configSaving && <Loading size={12} className="mr-1" />}
                  Save Config
                </Button>
                <Button onClick={loadConfig} variant="outline" size="sm" className="h-7 text-xs" disabled={configLoading}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default Withdrawals;
