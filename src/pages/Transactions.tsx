import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTransactions, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PageContainer, SearchHeader, Pagination } from '@/components/PageContainer';
import type { TransactionResponse } from '@/types/transaction';

const statusColor: Record<string, string> = {
  SUCCESS: 'bg-primary/20 text-primary',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  FAILED: 'bg-destructive/20 text-destructive',
};

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'DEPOSIT', label: 'DEPOSIT' },
  { value: 'WITHDRAW', label: 'WITHDRAW' },
  { value: 'WITHDRAW_REFUND', label: 'WITHDRAW_REFUND' },
  { value: 'BET', label: 'BET' },
  { value: 'WIN', label: 'WIN' },
  { value: 'REFUND', label: 'REFUND' },
  { value: 'BONUS', label: 'BONUS' },
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'SIGNUP_BONUS', label: 'SIGNUP_BONUS' },
  { value: 'FIRST_DEPOSIT_BONUS', label: 'FIRST_DEPOSIT_BONUS' },
  { value: 'GIFT_CODE', label: 'GIFT_CODE' },
  { value: 'AGENT_COMMISSION', label: 'AGENT_COMMISSION' },
  { value: 'gameIn', label: 'gameIn' },
  { value: 'gameOut', label: 'gameOut' },
];

const Transactions = () => {
  const { token } = useAuth();

  // Search state
  const [userId, setUserId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [type, setType] = useState('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  // Results state
  const [data, setData] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = async (p = 1) => {
    if (!userId.trim() && !orderId.trim() && !transactionId.trim()) {
      toast.error('Provide User ID, Order ID, or Transaction ID');
      return;
    }
    setAuthToken(token);
    setLoading(true);
    try {
      const filters: any = { page: p, limit: 25 };
      if (userId.trim()) filters.userId = userId.trim();
      if (orderId.trim()) filters.orderId = orderId.trim();
      if (transactionId.trim()) filters.transactionId = transactionId.trim();
      if (type) filters.type = type;
      if (dateFrom) filters.dateFrom = format(dateFrom, 'yyyy-MM-dd');
      if (dateTo) filters.dateTo = format(dateTo, 'yyyy-MM-dd');
      const res = await fetchTransactions(filters);
      setData(res.data);
      setPage(p);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => load(page);

  const handleReset = () => {
    setUserId('');
    setOrderId('');
    setTransactionId('');
    setType('');
    setDateFrom(undefined);
    setDateTo(undefined);
    setData(null);
    setPage(1);
  };

  const handleToday = () => {
    const today = new Date();
    setDateFrom(today);
    setDateTo(today);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  const renderTable = (d: TransactionResponse) => {
    const showEmpty = !d?.items?.length;

    return (
      <div className="relative rounded" style={{ height: 445, border: '1px solid hsl(var(--border))' }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Loading size={30} />
          </div>
        )}

        <div style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
          <table className="el-table" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 1250 }}>
            <colgroup>
              <col style={{ width: 95 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 180 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 150 }} />
            </colgroup>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
              <tr style={{ height: 50 }}>
                {['User ID', 'Order ID', 'Type', 'Amount', 'Charge', 'Balance After', 'Status', 'Remark', 'Created At', 'Updated At'].map((label) => (
                  <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                    <div className="cell">{label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showEmpty ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 50, color: 'hsl(var(--muted-foreground))', overflow: 'hidden' }}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      <span>No Data</span>
                    </div>
                  </td>
                </tr>
              ) : (
                d.items.map((d: any, i: number) => (
                  <tr key={i} style={{ height: 50 }}>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.userId}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontFamily: 'monospace', fontSize: 11 }}>{d.orderId || '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.type}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">₹{d.amount?.toLocaleString()}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ color: 'hsl(var(--destructive))' }}>{d.charge ? `₹${Number(d.charge).toFixed(2)}` : '—'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">₹{d.balanceAfter?.toLocaleString() ?? '—'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${
                          statusColor[d.status] || 'bg-muted text-muted-foreground'
                        }`}>{d.status}</span>
                      </div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontSize: 11 }}>{d.remark || '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontSize: 11 }}>{new Date(d.createdAt).toLocaleString()}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontSize: 11 }}>{d.updatedAt ? new Date(d.updatedAt).toLocaleString() : '—'}</div>
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
      <SearchHeader>
        <div className="form-grid w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">User ID</div>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="w-full h-[34px] text-sm px-2"
              onKeyDown={(e) => e.key === 'Enter' && load(1)}
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Order ID</div>
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order ID"
              className="w-full h-[34px] text-sm px-2"
              onKeyDown={(e) => e.key === 'Enter' && load(1)}
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Transaction ID</div>
            <Input
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="MongoDB ID"
              className="w-full h-[34px] text-sm px-2"
              onKeyDown={(e) => e.key === 'Enter' && load(1)}
            />
          </div>

          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Type</div>
            <select
              className="w-full h-[34px] rounded border border-input bg-background px-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
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
              onClick={() => load(1)}
              disabled={loading || (!userId.trim() && !orderId.trim() && !transactionId.trim())}
              size="sm"
              className="h-[34px] px-4 text-sm rounded-[5px] gap-1.5"
              style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}
            >
              {loading ? <Loading size={14} /> : null}
              Search
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="h-[34px] px-4 text-sm rounded-[5px]"
            >
              Reset
            </Button>
          </div>
        </div>
      </SearchHeader>

      <div className="flex items-center justify-between">
        {data && <div className="text-xs text-muted-foreground">Total: {data.total} transactions</div>}
        <LastUpdated timestamp={updatedAt} onRefresh={handleRefresh} loading={loading} compact />
      </div>

      {data?.items && (
        <>
          {renderTable(data)}
          <Pagination page={page} totalPages={totalPages} total={data.total} loading={loading} onPageChange={load} />
        </>
      )}
    </PageContainer>
  );
};

export default Transactions;
