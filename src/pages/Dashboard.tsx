import { useEffect, useState, useCallback } from 'react';
import { Users, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDashboard, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';

const Dashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<{ totalUsers: number; totalDeposits: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setAuthToken(token);
    setLoading(true);
    fetchDashboard()
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

  useEffect(() => { load(); }, [load]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loading />
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers?.toLocaleString() ?? '—', icon: Users },
    { label: 'Total Deposits', value: stats?.totalDeposits != null ? `₹${stats.totalDeposits.toLocaleString()}` : '—', icon: Wallet },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <LastUpdated timestamp={updatedAt} onRefresh={load} loading={loading} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              <c.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
