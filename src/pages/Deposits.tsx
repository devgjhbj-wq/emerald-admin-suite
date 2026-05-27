
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDeposits, approveDeposit, setAuthToken } from '@/lib/api';
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
  const [status, setStatus] = useState('');
  const [createdDate, setCreatedDate] = useState<Date>();
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  
  // Results state
  const [results, setResults] = useState<DepositResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

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
  }, [token, userId, status, dateFrom, dateTo]);

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
    setStatus('');
    setCreatedDate(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
    setResults(null);
    setPage(1);
  };

  const totalPages = results?.total ? Math.ceil(results.total / (results.limit || 50)) : 0;

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
          <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 1050 }}>
            <colgroup>
              <col style={{ width: 95 }} />
              <col style={{ width: 150 }} />
              <col />
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
                {['User ID', 'Order No.', 'Amount', 'Status', 'Channel', 'Gateway No.', 'Note', 'Created At', 'Updated At', 'Action'].map((label) => (
                  <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                    <div className="cell">{label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showEmpty ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 50, color: 'hsl(var(--muted-foreground))' }}>
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
      <SearchHeader>
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap mr-[3px]">User ID</label>
        <Input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User ID"
          className="w-[180px] h-[26px] text-xs px-1.5"
        />
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap mr-[3px] ml-[3px]">Phone</label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          className="w-[180px] h-[26px] text-xs px-1.5"
        />
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap mr-[3px] ml-[3px]">Status</label>
        <select
          className="w-[180px] h-[26px] rounded border border-input bg-background px-1.5 text-xs"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap mr-[3px] ml-[3px]">Created</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[216px] justify-start text-left font-normal text-xs h-[26px] px-2 rounded-[5px]",
                !createdDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              {createdDate ? format(createdDate, "MMM dd, yyyy") : "Created Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={createdDate}
              onSelect={setCreatedDate}
              initialFocus
              captionLayout="dropdown-buttons"
              fromYear={2024}
              toYear={2026}
            />
          </PopoverContent>
        </Popover>
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap mr-[3px] ml-[3px]">Date Range</label>
        <div className="flex items-center gap-[3px]">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[156px] justify-start text-left font-normal text-xs h-[26px] px-2 rounded-[5px]",
                  !dateFrom && "text-muted-foreground"
                )}
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
          <span className="text-muted-foreground text-xs">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[156px] justify-start text-left font-normal text-xs h-[26px] px-2 rounded-[5px]",
                  !dateTo && "text-muted-foreground"
                )}
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
        <Button
          onClick={() => handleSearch(1)}
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
      </SearchHeader>

      {results && (
        <>
          {renderTable(results)}
          <Pagination page={page} totalPages={totalPages} total={results.total} loading={loading} onPageChange={(p) => handleSearch(p)} />
        </>
      )}
    </PageContainer>
  );
};

export default Deposits;
