import { useEffect, useState, useCallback } from 'react';
import { Users, Wallet, ArrowUpCircle, ArrowDownCircle, Percent, Clock, Calendar as CalendarIcon, Filter } from 'lucide-react';
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
  agentCommission: {
    total: number;
    count: number;
  };
}

const Dashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => { 
    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
    load(period, period === 'custom' ? dateStr : undefined); 
  }, [load, period, selectedDate]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loading />
      </div>
    );
  }

  const overviewCards = [
    { label: 'Total Users', value: stats?.overview?.totalUsers?.toLocaleString() ?? '0', icon: Users, color: 'text-blue-500' },
    { label: 'New Users', value: stats?.overview?.newUsers?.toLocaleString() ?? '0', icon: Users, color: 'text-indigo-500' },
    { label: 'Commission', value: `₹${stats?.agentCommission?.total?.toLocaleString() ?? '0'}`, icon: Percent, color: 'text-orange-500' },
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
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card border border-border p-3 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
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
                    "h-8 text-[11px] font-normal px-3",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
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
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            <Filter className="w-3 h-3" />
            <span>Mode: {period === 'custom' ? 'Date Filter' : period}</span>
          </div>
          <LastUpdated 
            timestamp={updatedAt} 
            onRefresh={() => load(period, period === 'custom' && selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined)} 
            loading={loading} 
            compact 
          />
        </div>
      </div>

      {/* Overview */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Overview & Commissions</h3>
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
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-secondary/30 border-b border-border">
                  <th className="px-4 py-2 font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 font-bold text-muted-foreground uppercase tracking-wider text-right">Count</th>
                  <th className="px-4 py-2 font-bold text-muted-foreground uppercase tracking-wider text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {Object.entries(stats.withdrawals.byStatus).map(([status, data]) => (
                  <tr key={status} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full font-bold text-[9px] uppercase",
                        status === 'SUCCESS' ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                        status === 'PENDING' ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                        status === 'AUDITING' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                        "bg-red-500/10 text-red-500 border border-red-500/20"
                      )}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">{data.count.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right font-black">₹{data.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
