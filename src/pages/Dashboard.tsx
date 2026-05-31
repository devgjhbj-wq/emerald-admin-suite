import { useState, useCallback } from 'react';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDashboard, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import LastUpdated from '@/components/LastUpdated';
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
    chargeTotal: number;
    count: number;
    success: { count: number; total: number; chargeTotal: number };
    pending: { count: number; total: number; chargeTotal: number };
    failed: { count: number; total: number; chargeTotal: number };
    byStatus: Record<string, { count: number; total: number }>;
  };
  agentCommission: {
    total: number;
    count: number;
  };
}

const SectionCard = ({ title, children }: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
    <div className="px-4 py-2.5 border-b border-border">
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

const FormField = ({ label, value, sub }: { label: string; value: any; sub?: string }) => (
  <div>
    <label className="text-[11px] text-muted-foreground block mb-1">{label}</label>
    <div className="text-xs font-bold text-foreground">
      {value}
      {sub && <span className="text-[10px] text-muted-foreground ml-1.5">{sub}</span>}
    </div>
  </div>
);

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
      .then((res) => { setStats(res.data); setUpdatedAt(new Date()); })
      .catch((err) => { console.error(err); toast.error('Failed to load dashboard'); })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSearch = () => {
    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
    load(period, period === 'custom' ? dateStr : undefined);
  };

  return (
    <PageContainer>
      <SearchHeader>
        <div className="form-grid w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div>
            <div className="text-xs text-muted-foreground font-medium mb-1">Period</div>
            <div className="flex bg-secondary/30 p-0.5 rounded-md border border-border h-[34px] w-fit">
              <button onClick={() => setPeriod('today')} className={cn("px-3 text-sm font-medium rounded transition-colors h-full", period === 'today' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Today</button>
              <button onClick={() => setPeriod('month')} className={cn("px-3 text-sm font-medium rounded transition-colors h-full", period === 'month' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>This Month</button>
              <button onClick={() => setPeriod('custom')} className={cn("px-3 text-sm font-medium rounded transition-colors h-full", period === 'custom' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>By Date</button>
            </div>
          </div>
          {period === 'custom' && (
            <div>
              <div className="text-xs text-muted-foreground font-medium mb-1">Date</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-[34px] rounded-[5px] text-sm font-normal px-3 w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus captionLayout="dropdown-buttons" fromYear={2024} toYear={2026} />
                </PopoverContent>
              </Popover>
            </div>
          )}
          <div className="flex items-end gap-3">
            <Button onClick={handleSearch} disabled={loading} size="sm" className="h-[34px] px-4 rounded-[5px] gap-1.5 text-sm" style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}>
              <Search className="w-4 h-4" /> Search
            </Button>
            <LastUpdated timestamp={updatedAt} onRefresh={handleSearch} loading={loading} compact />
          </div>
        </div>
      </SearchHeader>

      {!stats && loading ? (
        <div className="flex items-center justify-center h-48"><span className="text-xs text-muted-foreground">Loading..</span></div>
      ) : !stats ? (
        <div className="flex items-center justify-center h-48"><span className="text-xs text-muted-foreground">No data</span></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Overview Card */}
          <SectionCard title="Overview">
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <FormField label="Total Users" value={(stats?.overview?.totalUsers ?? 0).toLocaleString()} />
              <FormField label="New Users" value={(stats?.overview?.newUsers ?? 0).toLocaleString()} sub={`in ${stats?.period === 'all' ? 'all time' : stats?.period}`} />
            </div>
          </SectionCard>

          {/* Deposits Card */}
          <SectionCard title="Deposits">
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <FormField label="Total Success Deposit Amount" value={`₹${(stats?.deposits?.total ?? 0).toLocaleString()}`} />
              <FormField label="Number of Success Order" value={(stats?.deposits?.count ?? 0).toLocaleString()} />
              <FormField label="Number of Pending Orders" value={(stats?.deposits?.pendingCount ?? 0).toLocaleString()} />
            </div>
          </SectionCard>

          {/* Withdrawals Card */}
          <SectionCard title="Withdrawals">
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <FormField label="Total Withdrawal Amount (All Statuses)" value={`₹${(stats?.withdrawals?.total ?? 0).toLocaleString()}`} />
              <FormField label="Total Charges (All Orders)" value={`₹${(stats?.withdrawals?.chargeTotal ?? 0).toLocaleString()}`} sub={`${(stats?.withdrawals?.count ?? 0).toLocaleString()} orders`} />
              <FormField label="Successful Withdrawals" value={`₹${(stats?.withdrawals?.success?.total ?? 0).toLocaleString()}`} sub={`${(stats?.withdrawals?.success?.count ?? 0).toLocaleString()} orders`} />
              <FormField label="Pending + Auditing" value={`₹${(stats?.withdrawals?.pending?.total ?? 0).toLocaleString()}`} sub={`${(stats?.withdrawals?.pending?.count ?? 0).toLocaleString()} orders`} />
              <FormField label="Failed Withdrawals" value={`₹${(stats?.withdrawals?.failed?.total ?? 0).toLocaleString()}`} sub={`${(stats?.withdrawals?.failed?.count ?? 0).toLocaleString()} orders`} />
              <FormField label="Order Cancelled by Admin" value={(stats?.withdrawals?.byStatus?.CANCELLED?.count ?? 0) > 0 ? `₹${(stats.withdrawals.byStatus.CANCELLED.total ?? 0).toLocaleString()}` : '—'} sub={(stats?.withdrawals?.byStatus?.CANCELLED?.count ?? 0) > 0 ? `${stats.withdrawals.byStatus.CANCELLED.count.toLocaleString()} orders` : undefined} />
            </div>
          </SectionCard>

          {/* Agent Commission Card */}
          <SectionCard title="Agent Commission">
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <FormField label="Total Agent Commission Amount" value={stats?.agentCommission ? `₹${stats.agentCommission.total.toLocaleString()}` : '—'} />
              <FormField label="Commission Transactions" value={stats?.agentCommission ? stats.agentCommission.count.toLocaleString() : '—'} />
            </div>
          </SectionCard>
        </div>
      )}
    </PageContainer>
  );
};

export default Dashboard;
