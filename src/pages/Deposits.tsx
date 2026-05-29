import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDeposits, approveDeposit, fetchDepositConfig, updateDepositConfig, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DepositResponse, DepositItem, DepositFilters } from '@/types/deposit';
import { PageContainer, SearchHeader, Pagination } from '@/components/PageContainer';

const statusColor: Record<string, string> = {
  SUCCESS: 'bg-primary/20 text-primary',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  FAILED: 'bg-destructive/20 text-destructive',
  REFUNDED: 'bg-blue-500/20 text-blue-400',
  EXPIRED: 'bg-muted text-muted-foreground',
};

const Deposits = () => {
  const { token } = useAuth();
  
  // Search state
  const [userId, setUserId] = useState('');
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  
  // Results state
  const [results, setResults] = useState<DepositResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Tab state
  const [tab, setTab] = useState<'orders' | 'config'>('orders');

  // Config state
  const [config, setConfig] = useState<any[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [editConfig, setEditConfig] = useState<Record<string, { isActive: boolean; minAmount: number; maxAmount: number; exchangeRate: number }>>({});

  const loadConfig = useCallback(async () => {
    setAuthToken(token);
    setConfigLoading(true);
    try {
      const res = await fetchDepositConfig();
      const data = res.data?.data || [];
      setConfig(data);
      const edits: Record<string, any> = {};
      data.forEach((ch: any) => {
        edits[ch.channel] = { isActive: ch.isActive, minAmount: ch.minAmount, maxAmount: ch.maxAmount, exchangeRate: ch.exchangeRate ?? 1 };
      });
      setEditConfig(edits);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load config');
    } finally {
      setConfigLoading(false);
    }
  }, [token]);

  const handleSaveConfig = async (channel: string) => {
    setAuthToken(token);
    setConfigSaving(true);
    try {
      const data = editConfig[channel];
      const payload: Record<string, any> = {};
      if (data.isActive !== config.find((c: any) => c.channel === channel)?.isActive) payload.isActive = data.isActive;
      if (data.minAmount !== config.find((c: any) => c.channel === channel)?.minAmount) payload.minAmount = data.minAmount;
      if (data.maxAmount !== config.find((c: any) => c.channel === channel)?.maxAmount) payload.maxAmount = data.maxAmount;
      if (data.exchangeRate !== config.find((c: any) => c.channel === channel)?.exchangeRate) payload.exchangeRate = data.exchangeRate;
      const res = await updateDepositConfig(channel, payload);
      setConfig(prev => prev.map(c => c.channel === channel ? res.data?.data : c));
      toast.success('Channel updated');
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update channel');
    } finally {
      setConfigSaving(false);
    }
  };

  useEffect(() => {
    if (tab === 'config') loadConfig();
  }, [tab]);

  const handleApprove = async (orderIdToApprove: string) => {
    setAuthToken(token);
    setApprovingId(orderIdToApprove);
    try {
      const res = await approveDeposit(orderIdToApprove);
      toast.success(res.data.msg || 'Deposit approved');
      if (results?.items) {
        const updatedItems = results.items.map((d) => 
          d.orderId === orderIdToApprove ? { ...d, status: 'SUCCESS' as const } : d
        );
        setResults({ ...results, items: updatedItems });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string } }; message?: string };
      toast.error(error.response?.data?.msg || error.message || 'Failed to approve deposit');
    } finally {
      setApprovingId(null);
    }
  };

  const handleSearch = useCallback(async (p = 1) => {
    setLoading(true);
    setAuthToken(token);
    try {
      const filters: DepositFilters = {
        page: p,
        limit: 50,
      };
      const q = userId.trim();
      if (q) filters.userId = q;
      const mob = phone.trim();
      const oid = orderId.trim();
      if (q) filters.userId = q;
      if (mob) filters.mobile = mob;
      if (oid) filters.orderId = oid;
      if (status && status !== 'all') filters.status = status;
      if (dateFrom) filters.dateFrom = format(dateFrom, 'yyyy-MM-dd');
      if (dateTo) filters.dateTo = format(dateTo, 'yyyy-MM-dd');

      const response = await fetchDeposits(filters);
      setResults(response.data);
      setPage(p);
      setPageInput(p.toString());
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [token, userId, phone, orderId, status, dateFrom, dateTo]);

  const handleSearchClick = async (p = 1) => {
    const q = userId.trim();
    const mob = phone.trim();
    const oid = orderId.trim();
    if (!q && !mob && !oid && !status && !dateFrom && !dateTo) {
      toast.error('Select at least one filter');
      return;
    }
    await handleSearch(p);
  };

  const handlePageGo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const p = parseInt(pageInput);
      if (!isNaN(p) && p > 0 && p <= totalPages) {
        handleSearch(p);
      } else {
        toast.error(`Invalid page number. Please enter between 1 and ${totalPages}`);
      }
    }
  };

  const handleReset = () => {
    setUserId('');
    setPhone('');
    setOrderId('');
    setStatus('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setResults(null);
    setPage(1);
  };

  const totalPages = results?.total ? Math.ceil(results.total / (results.limit || 50)) : 0;

  const handleToday = () => {
    const today = new Date();
    setDateFrom(today);
    setDateTo(today);
  };

  const renderTable = (data: DepositResponse) => {
    const showEmpty = !data?.items?.length;

    return (
      <div className="relative rounded" style={{ height: 445, border: '1px solid hsl(var(--border))' }}>
        <style>{`
          .el-table {
            font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
            font-size: 14px;
            line-height: 1.15;
            color: hsl(var(--foreground));
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .el-table tbody { font-size: 12px; }
          .el-table tbody tr { transition: background-color 0.25s ease; }
          .el-table tbody tr:hover { background-color: hsl(var(--accent) / 0.12); }
          .el-table .cell {
            box-sizing: border-box;
            padding: 0 5px;
          }
        `}</style>

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Loading size={30} />
          </div>
        )}

        <div style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
          <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 1250 }}>
            <colgroup>
              <col style={{ width: 95 }} />
              <col style={{ width: 150 }} />
              <col />
              <col style={{ width: 100 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 120 }} />
              <col />
              <col />
              <col style={{ width: 80 }} />
            </colgroup>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
              <tr style={{ height: 50 }}>
                {['User ID', 'Order No.', 'Amount', 'Recvd Amt', 'Currency', 'Status', 'Channel', 'Gateway No.', 'Note', 'Created At', 'Updated At', 'Action'].map((label) => (
                  <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                    <div className="cell">{label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showEmpty ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 50, color: 'hsl(var(--muted-foreground))' }}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      <span>No Data</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((d: DepositItem, i: number) => (
                  <tr key={i} style={{ height: 50 }}>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.userId}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{d.orderId}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">₹{d.amount?.toLocaleString()}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.receivedAmount != null ? `₹${d.receivedAmount.toLocaleString()}` : '—'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.currency || 'INR'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${statusColor[d.status] || 'bg-muted text-muted-foreground'}`}>{d.status}</span>
                      </div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.channelName}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{d.gatewayOrderNo}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.note || '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{new Date(d.createdAt).toLocaleString()}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.updatedAt ? new Date(d.updatedAt).toLocaleString() : '—'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        {d.status === 'PENDING' ? (
                          <button
                            onClick={() => handleApprove(d.orderId)}
                            disabled={approvingId === d.orderId}
                            style={{
                              background: approvingId === d.orderId ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--primary))',
                              color: 'hsl(var(--primary-foreground))',
                              border: 'none',
                              borderRadius: 2,
                              padding: '4px 8px',
                              fontSize: 12,
                              cursor: approvingId === d.orderId ? 'not-allowed' : 'pointer',
                              lineHeight: 1,
                            }}
                          >
                            {approvingId === d.orderId ? 'Loading...' : 'Approve'}
                          </button>
                        ) : (
                          <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 12 }}>—</span>
                        )}
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
        <div className="form-grid w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-0.5">User ID</div>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="w-full h-[26px] text-xs px-1.5"
            />
          </div>

          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-0.5">Phone</div>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className="w-full h-[26px] text-xs px-1.5"
            />
          </div>

          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-0.5">Order ID</div>
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID"
              className="w-full h-[26px] text-xs px-1.5"
            />
          </div>

          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-0.5">Status</div>
            <select
              className="w-full h-[26px] rounded border border-input bg-background px-1.5 text-xs"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-0.5">From</div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-xs h-[26px] px-2 rounded-[5px]"
                >
                  <CalendarIcon className="mr-1 h-3 w-3" />
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
            <div className="text-[11px] text-muted-foreground font-medium mb-0.5">To</div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-xs h-[26px] px-2 rounded-[5px]"
                >
                  <CalendarIcon className="mr-1 h-3 w-3" />
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
              className="h-[26px] px-2.5 text-xs rounded-[5px]"
              style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}
            >
              Today
            </Button>
          </div>

          <div className="flex items-end gap-2">
            <Button
               onClick={() => handleSearchClick(1)}
              disabled={loading}
              size="sm"
              className="h-[26px] px-2.5 text-xs rounded-[5px]"
              style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}
            >
              {loading ? <Loading size={10} /> : null}
              Search
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="h-[26px] px-2.5 text-xs rounded-[5px]"
            >
              Reset
            </Button>
          </div>
        </div>
      </SearchHeader>

      {results && (
        <>
          {renderTable(results)}
          <Pagination page={page} totalPages={totalPages} total={results.total} loading={loading} onPageChange={(p) => handleSearch(p)} />
        </>
      )}
      </>
      )}

      {tab === 'config' && (
        <div className="bg-card border border-border p-4 rounded-lg space-y-4">
          <h3 className="text-sm font-semibold">Deposit Channel Configuration</h3>
          {configLoading ? (
            <div className="flex justify-center py-8"><Loading size={20} /></div>
          ) : (
            <div className="space-y-4">
              {config.map((ch: any) => (
                <div key={ch.channel} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold text-foreground uppercase">{ch.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">({ch.channel})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{ch.description}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Active</label>
                      <div className="flex bg-secondary/30 p-0.5 rounded-md border border-border h-[26px] w-fit mt-0.5">
                        <button
                          onClick={() => setEditConfig(prev => ({
                            ...prev,
                            [ch.channel]: { ...prev[ch.channel], isActive: true }
                          }))}
                          className={`px-2.5 text-[11px] font-medium rounded transition-colors h-full ${
                            editConfig[ch.channel]?.isActive
                              ? 'bg-[rgb(32,143,255)] text-white shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Enabled
                        </button>
                        <button
                          onClick={() => setEditConfig(prev => ({
                            ...prev,
                            [ch.channel]: { ...prev[ch.channel], isActive: false }
                          }))}
                          className={`px-2.5 text-[11px] font-medium rounded transition-colors h-full ${
                            !editConfig[ch.channel]?.isActive
                              ? 'bg-[rgb(32,143,255)] text-white shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Disabled
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Min Amount</label>
                      <input
                        type="number"
                        className="flex h-7 w-full rounded border border-input bg-background px-2 py-0.5 text-xs mt-0.5"
                        value={editConfig[ch.channel]?.minAmount ?? ''}
                        onChange={(e) => setEditConfig(prev => ({
                          ...prev,
                          [ch.channel]: { ...prev[ch.channel], minAmount: Number(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Max Amount</label>
                      <input
                        type="number"
                        className="flex h-7 w-full rounded border border-input bg-background px-2 py-0.5 text-xs mt-0.5"
                        value={editConfig[ch.channel]?.maxAmount ?? ''}
                        onChange={(e) => setEditConfig(prev => ({
                          ...prev,
                          [ch.channel]: { ...prev[ch.channel], maxAmount: Number(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Exchange Rate</label>
                      <input
                        type="number"
                        step="0.01"
                        className="flex h-7 w-full rounded border border-input bg-background px-2 py-0.5 text-xs mt-0.5"
                        value={editConfig[ch.channel]?.exchangeRate ?? 1}
                        onChange={(e) => setEditConfig(prev => ({
                          ...prev,
                          [ch.channel]: { ...prev[ch.channel], exchangeRate: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSaveConfig(ch.channel)}
                    disabled={configSaving}
                    size="sm"
                    className="h-7 text-xs"
                  >
                    {configSaving && <Loading size={12} className="mr-1" />}
                    Save
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default Deposits;
