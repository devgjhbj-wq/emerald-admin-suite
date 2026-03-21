import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithdrawals, fetchWithdrawalByOrder, approveWithdrawal, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { WithdrawalResponse, WithdrawalItem, WithdrawalFilters } from '@/types/withdrawal';

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
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  
  // Results state
  const [results, setResults] = useState<WithdrawalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastSearchType, setLastSearchType] = useState<'user' | 'order' | 'global'>('global');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (orderIdToApprove: string) => {
    setAuthToken(token);
    setApprovingId(orderIdToApprove);
    try {
      const res = await approveWithdrawal(orderIdToApprove);
      toast.success(res.data.msg || 'Withdrawal approved');
      if (results?.items) {
        const updatedItems = results.items.map((d) => 
          d.orderId === orderIdToApprove ? { ...d, status: 'AUDITING' as const } : d
        );
        setResults({ ...results, items: updatedItems });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string } }; message?: string };
      toast.error(error.response?.data?.msg || error.message || 'Failed to approve withdrawal');
    } finally {
      setApprovingId(null);
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
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to perform Global Search');
    } finally {
      setLoading(false);
    }
  }, [token, status, dateFrom, dateTo]);

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

  const totalPages = results?.total ? Math.ceil(results.total / (results.limit || 50)) : 0;

  const renderTable = (data: WithdrawalResponse) => {
    if (!data?.items?.length) {
      return (
        <div className="p-8 text-center text-muted-foreground text-sm border border-border bg-card rounded-lg">
          No withdrawals found.
        </div>
      );
    }

    return (
      <div className="bg-card border border-border overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-2 text-muted-foreground font-medium">User ID</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Order ID</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Amount</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Bank Details</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Remark</th>
                <th className="text-left p-2 text-muted-foreground font-medium whitespace-nowrap">Created At</th>
                <th className="text-left p-2 text-muted-foreground font-medium whitespace-nowrap">Updated At</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((d: WithdrawalItem, i: number) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="p-2 text-foreground font-medium">{d.userId}</td>
                  <td className="p-2 text-foreground font-mono text-[10px]">{d.orderId}</td>
                  <td className="p-2 text-foreground">₹{d.amount?.toLocaleString()}</td>
                  <td className="p-2 text-[10px]">
                    {d.bankDetails ? (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-max">
                        <div className="flex gap-1.5"><span className="text-muted-foreground font-medium w-7">A/C:</span><span className="text-foreground font-mono">{d.bankDetails.accountNumber}</span></div>
                        <div className="flex gap-1.5"><span className="text-muted-foreground font-medium w-7">IFSC:</span><span className="text-foreground font-mono">{d.bankDetails.ifsc || d.bankDetails.bankCode || '-'}</span></div>
                        <div className="flex gap-1.5"><span className="text-muted-foreground font-medium w-7">Name:</span><span className="text-foreground">{d.bankDetails.accountHolder}</span></div>
                        <div className="flex gap-1.5"><span className="text-muted-foreground font-medium w-7">Bank:</span><span className="text-foreground truncate max-w-[120px]" title={d.bankDetails.bankName}>{d.bankDetails.bankName}</span></div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-2">
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${statusColor[d.status] || 'bg-muted text-muted-foreground'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-2 text-muted-foreground text-[10px] max-w-[120px] truncate" title={d.remark}>{d.remark || '-'}</td>
                  <td className="p-2 text-muted-foreground text-[10px] whitespace-nowrap">{new Date(d.createdAt).toLocaleString()}</td>
                  <td className="p-2 text-muted-foreground text-[10px] whitespace-nowrap">
                    {d.updatedAt ? new Date(d.updatedAt).toLocaleString() : '—'}
                  </td>
                  <td className="p-2">
                    {d.status === 'PENDING' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-primary border-primary/30 hover:bg-primary/10"
                        disabled={approvingId === d.orderId}
                        onClick={() => handleApprove(d.orderId)}
                      >
                        {approvingId === d.orderId ? (
                          <Loading size={14} />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        )}
                        Approve
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Search & Filter Bar */}
      <div className="bg-card border border-border p-3 rounded-lg shadow-sm space-y-3">
        {/* Row 1: ID Searches */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-medium text-muted-foreground uppercase mb-1 block">User ID Search</label>
            <div className="flex gap-1.5">
              <div className="flex-1">
                <SearchBar 
                  value={userId} 
                  onChange={setUserId} 
                  onSearch={() => loadByUserId(1)} 
                  placeholder="Ex: 123456"
                  loading={loading && lastSearchType === 'user'}
                  storageKey="withdrawal_user_search"
                  maxHistory={5}
                  hideButton={true}
                />
              </div>
              <Button 
                onClick={() => loadByUserId(1)} 
                disabled={loading} 
                size="sm"
                className="h-7 px-3 text-xs"
              >
                Search
              </Button>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-medium text-muted-foreground uppercase mb-1 block">Order ID Search</label>
            <div className="flex gap-1.5">
              <div className="flex-1">
                <SearchBar 
                  value={orderId} 
                  onChange={setOrderId} 
                  onSearch={loadByOrderId} 
                  placeholder="Ex: WD..."
                  loading={loading && lastSearchType === 'order'}
                  storageKey="withdrawal_order_search"
                  maxHistory={5}
                  hideButton={true}
                />
              </div>
              <Button 
                onClick={loadByOrderId} 
                disabled={loading} 
                size="sm"
                className="h-7 px-3 text-xs"
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Row 2: Global Filters */}
        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-border/50">
          <div className="w-[140px]">
            <label className="text-[10px] font-medium text-muted-foreground uppercase mb-1 block">Status</label>
            <select
              className="flex h-7 w-full rounded border border-input bg-background px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase mb-0.5 block">Date Range</label>
            <div className="flex items-center gap-1.5">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[150px] justify-start text-left font-normal text-[11px] h-7 px-2",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3 w-3" />
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
              <span className="text-muted-foreground text-[10px]">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[150px] justify-start text-left font-normal text-[11px] h-7 px-2",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3 w-3" />
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
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => loadGlobalSearch(1)} 
              disabled={loading} 
              size="sm"
              className="h-7 px-4 text-xs font-semibold"
            >
              {loading && lastSearchType === 'global' ? <Loading size={12} className="mr-1" /> : null}
              Global Search
            </Button>
            <Button 
              onClick={handleClear} 
              variant="outline" 
              size="sm"
              className="h-7 px-3 text-xs"
            >
              Reset
            </Button>
            <div className="ml-1 border-l border-border pl-2 flex items-center h-7">
              <LastUpdated 
                timestamp={updatedAt} 
                onRefresh={handleRefresh} 
                loading={loading} 
                compact 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {results && (
        <div className="space-y-3">
          {renderTable(results)}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-card border border-border p-2 rounded-lg">
              <span className="text-[10px] text-muted-foreground font-medium">
                Showing {results.items.length} of {results.total} results • Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    const nextPage = page - 1;
                    if (lastSearchType === 'user') loadByUserId(nextPage);
                    else if (lastSearchType === 'global') loadGlobalSearch(nextPage);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs font-medium px-2 h-7 flex items-center bg-secondary/50 rounded">
                  {page}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={page >= totalPages || loading}
                  onClick={() => {
                    const nextPage = page + 1;
                    if (lastSearchType === 'user') loadByUserId(nextPage);
                    else if (lastSearchType === 'global') loadGlobalSearch(nextPage);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Withdrawals;
