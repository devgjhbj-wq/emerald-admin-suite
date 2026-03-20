import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithdrawals, fetchWithdrawalByOrder, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import LastUpdated from '@/components/LastUpdated';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const statusColor: Record<string, string> = {
  SUCCESS: 'bg-primary/20 text-primary',
  COMPLETED: 'bg-primary/20 text-primary',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  FAILED: 'bg-destructive/20 text-destructive',
  REJECTED: 'bg-destructive/20 text-destructive',
  REFUNDED: 'bg-blue-500/20 text-blue-400',
  EXPIRED: 'bg-muted text-muted-foreground',
};

const Withdrawals = () => {
  const { token } = useAuth();
  
  // Latest Withdrawals state
  const [latestData, setLatestData] = useState<any>(null);
  const [latestLoading, setLatestLoading] = useState(false);
  const [latestPage, setLatestPage] = useState(1);
  const [latestStatus, setLatestStatus] = useState('');
  const [latestDateFrom, setLatestDateFrom] = useState<Date>();
  const [latestDateTo, setLatestDateTo] = useState<Date>();
  const [latestUpdatedAt, setLatestUpdatedAt] = useState<Date | null>(null);

  // Search Withdrawals state
  const [searchData, setSearchData] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchUserId, setSearchUserId] = useState('');
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchUpdatedAt, setSearchUpdatedAt] = useState<Date | null>(null);
  const [lastSearchType, setLastSearchType] = useState<'user' | 'order' | null>(null);

  useEffect(() => {
    loadLatest(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLatest = async (p = 1) => {
    setAuthToken(token);
    setLatestLoading(true);
    try {
      const res = await fetchWithdrawals({
        status: latestStatus || undefined,
        dateFrom: latestDateFrom ? format(latestDateFrom, 'yyyy-MM-dd') : undefined,
        dateTo: latestDateTo ? format(latestDateTo, 'yyyy-MM-dd') : undefined,
        page: p,
      });
      setLatestData(res.data);
      setLatestPage(p);
      setLatestUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load latest withdrawals');
    } finally {
      setLatestLoading(false);
    }
  };

  const loadSearchByUser = async (p = 1) => {
    const q = searchUserId.trim();
    if (!q) return;
    setAuthToken(token);
    setSearchLoading(true);
    setLastSearchType('user');
    try {
      const res = await fetchWithdrawals({
        userId: q,
        page: p,
      });
      setSearchData(res.data);
      setSearchPage(p);
      setSearchUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load withdrawals by user');
      setSearchData(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadSearchByOrder = async () => {
    const q = searchOrderId.trim();
    if (!q) return;
    setAuthToken(token);
    setSearchLoading(true);
    setLastSearchType('order');
    try {
      const res = await fetchWithdrawalByOrder(q);
      if (res.data?.withdrawal) {
        setSearchData({ items: [res.data.withdrawal], total: 1, limit: 1, page: 1 });
      } else if (res.data?.items) {
        setSearchData(res.data);
      } else {
        setSearchData(res.data);
      }
      setSearchPage(1);
      setSearchUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load withdrawal order');
      setSearchData(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const renderTable = (data: any, page: number, totalPages: number, loadMoreFn: (p: number) => void, isPaginated: boolean) => {
    if (!data?.items?.length) return <div className="p-4 text-center text-muted-foreground text-sm border border-border bg-card">No withdrawals found.</div>;

    return (
      <>
        <div className="bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-2 text-muted-foreground font-medium">User ID</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Order ID</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Bal. After</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Bank Details</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Remark</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((d: any, i: number) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="p-2 text-foreground font-medium">{d.userId}</td>
                    <td className="p-2 text-foreground font-mono text-[10px]">{d.orderId}</td>
                    <td className="p-2 text-foreground">₹{d.amount?.toLocaleString()}</td>
                    <td className="p-2 text-foreground text-xs">{d.balanceAfter !== undefined ? `₹${d.balanceAfter.toLocaleString()}` : '-'}</td>
                    <td className="p-2 text-[10px]">
                      {d.bankDetails ? (
                        <div className="flex flex-col gap-1 w-max">
                          <div><span className="text-muted-foreground inline-block w-10">Holder:</span> <span className="font-medium text-foreground">{d.bankDetails.accountHolder}</span></div>
                          <div><span className="text-muted-foreground inline-block w-10">Bank:</span> <span className="text-foreground">{d.bankDetails.bankName}</span></div>
                          <div><span className="text-muted-foreground inline-block w-10">A/C:</span> <span className="text-foreground font-mono">{d.bankDetails.accountNumber}</span></div>
                          {d.bankDetails.bankCode && <div><span className="text-muted-foreground inline-block w-10">IFSC:</span> <span className="text-foreground font-mono">{d.bankDetails.bankCode}</span></div>}
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
                    <td className="p-2 text-muted-foreground text-[10px] max-w-[150px] truncate" title={d.remark}>{d.remark || '-'}</td>
                    <td className="p-2 text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isPaginated && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">Total: {data.total} — Page {page}/{totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadMoreFn(page - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadMoreFn(page + 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  const latestTotalPages = latestData?.total ? Math.ceil(latestData.total / (latestData.limit || 25)) : 0;
  const searchTotalPages = searchData?.total ? Math.ceil(searchData.total / (searchData.limit || 25)) : 0;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="search">Search Orders</TabsTrigger>
          <TabsTrigger value="latest">Latest Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-4 bg-card border border-border p-4">
              <div className="flex-1 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Search by Order ID</span>
                <SearchBar value={searchOrderId} onChange={setSearchOrderId} onSearch={loadSearchByOrder} placeholder="Ex: WD123456..." loading={searchLoading && lastSearchType === 'order'} />
              </div>
              <div className="flex items-center justify-center pt-5">
                <span className="text-muted-foreground text-xs px-2 uppercase font-medium">OR</span>
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Search by User ID</span>
                <SearchBar value={searchUserId} onChange={setSearchUserId} onSearch={() => loadSearchByUser(1)} placeholder="Ex: 123456" loading={searchLoading && lastSearchType === 'user'} />
              </div>
            </div>
            <div className="flex justify-end">
              <LastUpdated timestamp={searchUpdatedAt} onRefresh={() => lastSearchType === 'order' ? loadSearchByOrder() : loadSearchByUser(searchPage)} loading={searchLoading} />
            </div>
          </div>
          {searchData && renderTable(searchData, searchPage, searchTotalPages, loadSearchByUser, lastSearchType === 'user')}
        </TabsContent>

        <TabsContent value="latest" className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-card border border-border p-4">
              <select
                className="flex h-9 w-full sm:w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={latestStatus}
                onChange={(e) => setLatestStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FAILED">FAILED</option>
              </select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[150px] justify-start text-left font-normal",
                      !latestDateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {latestDateFrom ? format(latestDateFrom, "PPP") : <span>Start Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={latestDateFrom}
                    onSelect={setLatestDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-xs">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[150px] justify-start text-left font-normal",
                      !latestDateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {latestDateTo ? format(latestDateTo, "PPP") : <span>End Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={latestDateTo}
                    onSelect={setLatestDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={() => loadLatest(1)} disabled={latestLoading} className="w-full sm:w-auto">
                Filter
              </Button>
            </div>
            <div className="flex justify-end">
              <LastUpdated timestamp={latestUpdatedAt} onRefresh={() => loadLatest(latestPage)} loading={latestLoading} />
            </div>
          </div>
          {renderTable(latestData, latestPage, latestTotalPages, loadLatest, true)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Withdrawals;
