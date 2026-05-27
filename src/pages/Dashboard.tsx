import { useEffect, useState, useCallback } from 'react';
import { Users, Wallet, ArrowUpCircle, ArrowDownCircle, Clock, Calendar as CalendarIcon, Filter, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDashboard, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageContainer, SearchHeader } from '@/components/PageContainer';

interface DashboardStats {
  status: string;
  period: string;
  overview: {
    totalUsers: number;
    newUsers: number;
  };
  deposits: {
    total: number;
    count: number;
    pendingCount: number;
  };
  withdrawals: {
    total: number;
    count: number;
    success: {
      count: number;
      total: number;
    };
    pending: {
      count: number;
      total: number;
    };
    failed: {
      count: number;
      total: number;
    };
    byStatus: Record<string, { count: number; total: number }>;
  };
}

const Dashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [period, setPeriod] = useState<'today' | 'month' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const load = useCallback((p?: string, d?: string) => {
    if (!token) return;
    setAuthToken(token);
    setLoading(true);
    
    const params: any = {};
    if (p && p !== 'custom') params.period = p;
    if (d) params.date = d;

    fetchDashboard(params)
      .then((res) => {
        setStats(res.data);
        setUpdatedAt(new Date());
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSearch = () => {
    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
    load(period, period === 'custom' ? dateStr : undefined);
  };

  if (loading && !stats) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-48">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  const overviewCards = [
    { label: 'Total Users', value: stats?.overview?.totalUsers?.toLocaleString() ?? '0', icon: Users, color: 'text-blue-500' },
    { label: 'New Users', value: stats?.overview?.newUsers?.toLocaleString() ?? '0', icon: Users, color: 'text-indigo-500' },
  ];

  const depositCards = [
    { label: 'Total Deposits', value: `₹${stats?.deposits?.total?.toLocaleString() ?? '0'}`, icon: ArrowUpCircle, color: 'text-green-500' },
    { label: 'Success Count', value: stats?.deposits?.count?.toLocaleString() ?? '0', icon: Clock, color: 'text-green-600' },
    { label: 'Pending Count', value: stats?.deposits?.pendingCount?.toLocaleString() ?? '0', icon: Clock, color: 'text-yellow-600' },
  ];

  const withdrawCards = [
    { label: 'Total Withdrawals', value: `₹${stats?.withdrawals?.total?.toLocaleString() ?? '0'}`, icon: ArrowDownCircle, color: 'text-red-500' },
    { label: 'Success', value: `₹${stats?.withdrawals?.success?.total?.toLocaleString() ?? '0'}`, icon: Clock, color: 'text-emerald-500' },
    { label: 'Pending/Audit', value: `₹${stats?.withdrawals?.pending?.total?.toLocaleString() ?? '0'}`, icon: Clock, color: 'text-amber-500' },
    { label: 'Failed', value: `₹${stats?.withdrawals?.failed?.total?.toLocaleString() ?? '0'}`, icon: Clock, color: 'text-rose-500' },
  ];

  return (
    <PageContainer>
      <SearchHeader>
        <div className="flex bg-secondary/30 p-1 rounded-md border border-border">
          <button
            onClick={() => setPeriod('today')}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-colors",
              period === 'today' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-colors",
              period === 'month' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            This Month
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded transition-colors",
              period === 'custom' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            By Date
          </button>
        </div>

        {period === 'custom' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-[26px] rounded-[5px] text-xs font-normal px-2.5",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={2024}
                toYear={2026}
              />
            </PopoverContent>
          </Popover>
        )}

        <Button 
          onClick={handleSearch} 
          disabled={loading}
          size="sm" 
          className="h-[26px] px-2.5 rounded-[5px] gap-1 text-xs"
          style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}
        >
          <Search className="w-4 h-4" />
          Search
        </Button>

        <LastUpdated 
          timestamp={updatedAt} 
          onRefresh={handleSearch} 
          loading={loading} 
          compact 
        />
      </SearchHeader>

      {!stats && !loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-card border border-border rounded-lg shadow-sm space-y-3">
          <div className="p-3 rounded-full bg-secondary">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">No data to display</p>
            <p className="text-xs text-muted-foreground">Click the search button to load dashboard statistics.</p>
          </div>
          <Button onClick={handleSearch} size="sm" variant="outline" className="h-8 text-xs">
            Search Now
          </Button>
        </div>
      ) : stats && (
        <>
          {/* Overview */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {overviewCards.map((c) => (
                <div key={c.label} className="bg-card border border-border p-3 rounded-lg hover:border-primary/30 transition-all shadow-sm group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{c.label}</span>
                    <div className={cn("p-1.5 rounded-md bg-secondary group-hover:bg-primary/10 transition-colors", c.color)}>
                      <c.icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-xl font-black text-foreground">{c.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Deposits Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-green-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                <ArrowUpCircle className="w-3.5 h-3.5" />
                Deposit Statistics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {depositCards.map((c) => (
                  <div key={c.label} className="bg-card border border-border p-3 rounded-lg hover:border-green-500/30 transition-all shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{c.label}</span>
                      <c.icon className={cn("w-3.5 h-3.5 opacity-70", c.color)} />
                    </div>
                    <p className="text-lg font-black text-foreground">{c.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Withdrawals Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                <ArrowDownCircle className="w-3.5 h-3.5" />
                Withdrawal Statistics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
                {withdrawCards.map((c) => (
                  <div key={c.label} className="bg-card border border-border p-3 rounded-lg hover:border-red-500/30 transition-all shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">{c.label}</span>
                      <c.icon className={cn("w-3.5 h-3.5 opacity-70", c.color)} />
                    </div>
                    <p className="text-base font-black text-foreground">{c.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Withdrawal Status Breakdown */}
          {stats?.withdrawals?.byStatus && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Withdrawal Status Breakdown</h3>
              {(() => {
                const breakdowns = Object.entries(stats.withdrawals.byStatus).map(([status, data]: [string, any]) => ({
                  _id: status,
                  status,
                  count: data.count,
                  totalAmount: data.total,
                }));
                return (
                  <div className="relative rounded" style={{ border: '1px solid hsl(var(--border))' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                        <colgroup>
                          <col />
                          <col style={{ width: 120 }} />
                          <col style={{ width: 150 }} />
                        </colgroup>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
                          <tr style={{ height: 50 }}>
                            <th style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                              <div className="cell">Status</div>
                            </th>
                            <th style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                              <div className="cell">Count</div>
                            </th>
                            <th style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                              <div className="cell">Total Amount</div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {breakdowns.length === 0 ? (
                            <tr>
                              <td colSpan={3} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 30, color: 'hsl(var(--muted-foreground))' }}>
                                <div className="flex flex-col items-center gap-2">
                                  <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                  <span>No Data</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            breakdowns.map((b: any, i: number) => (
                              <tr key={i} style={{ height: 50 }}>
                                <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                  <div className="cell">{b.status || b._id}</div>
                                </td>
                                <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                  <div className="cell">{b.count}</div>
                                </td>
                                <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                  <div className="cell">₹{Number(b.totalAmount || b.amount || 0).toLocaleString()}</div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default Dashboard;
