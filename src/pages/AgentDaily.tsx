import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAgentDaily, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import LastUpdated from '@/components/LastUpdated';
import { Input } from '@/components/ui/input';

const AgentDaily = () => {
  const { token } = useAuth();
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadDaily = async () => {
    const q = userId.trim();
    if (!q) return;
    setAuthToken(token);
    setLoading(true);
    try {
      const res = await fetchAgentDaily(q, date || undefined);
      setData(res.data);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load daily stats');
    } finally {
      setLoading(false);
    }
  };

  const LevelCard = ({ level, stats }: { level: string; stats: any }) => (
    <div className="bg-card border border-border p-3 space-y-2">
      <h4 className="text-xs font-semibold text-foreground">{level}</h4>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground text-[10px]">Deposit</p>
          <p className="font-medium text-foreground">₹{(stats?.deposit ?? 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px]">Commission</p>
          <p className="font-medium text-primary">₹{(stats?.commission ?? 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-[10px]">Count</p>
          <p className="font-medium text-foreground">{stats?.count ?? 0}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-2 bg-card border border-border p-4">
        <div className="flex-1">
          <SearchBar value={userId} onChange={setUserId} onSearch={loadDaily} placeholder="Enter Agent User ID" loading={loading} />
        </div>
        <div className="w-full sm:w-36">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" />
        </div>
        <LastUpdated timestamp={updatedAt} onRefresh={loadDaily} loading={loading} />
      </div>

      {data && (
        <div className="space-y-3">
          <div className="bg-card border border-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-foreground">User ID: {data.userId}</h3>
                <p className="text-[10px] text-muted-foreground">Date: {data.date}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <LevelCard level="Level 1 (Direct)" stats={data.level1} />
            <LevelCard level="Level 2" stats={data.level2} />
            <LevelCard level="Level 3" stats={data.level3} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDaily;
