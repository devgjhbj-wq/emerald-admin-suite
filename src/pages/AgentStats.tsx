import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAgentStats, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import LastUpdated from '@/components/LastUpdated';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AgentStats = () => {
  const { token } = useAuth();
  const [userId, setUserId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadStats = async (p = 1) => {
    const q = userId.trim();
    if (!q) return;
    setAuthToken(token);
    setLoading(true);
    try {
      const res = await fetchAgentStats(q, p);
      setData(res.data);
      setPage(p);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load agent stats');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = data?.totalInvitees ? Math.ceil(data.totalInvitees / (data.limit || 50)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-card border border-border p-4">
        <SearchBar value={userId} onChange={setUserId} onSearch={() => loadStats(1)} placeholder="Enter Agent User ID" loading={loading} />
        <LastUpdated timestamp={updatedAt} onRefresh={() => loadStats(page)} loading={loading} />
      </div>

      {data?.agent && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-card border border-border p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Agent Info</h3>
            <InfoRow label="User ID" value={data.agent.userId} />
            <InfoRow label="Mobile" value={data.agent.mobile} />
            <InfoRow label="Admin" value={data.agent.admin ? 'Yes' : 'No'} />
            <InfoRow label="Referred By" value={data.agent.referredBy ?? '—'} />
            <InfoRow label="Created" value={new Date(data.agent.createdAt).toLocaleString()} />
          </div>

          <div className="bg-card border border-border p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Inviter</h3>
            {data.inviter ? (
              <>
                <InfoRow label="User ID" value={data.inviter.userId} />
                <InfoRow label="Mobile" value={data.inviter.mobile} />
                <InfoRow label="Created" value={new Date(data.inviter.createdAt).toLocaleString()} />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No inviter found</p>
            )}
            <div className="pt-2 border-t border-border">
              <InfoRow label="Total Invitees" value={data.totalInvitees} />
            </div>
          </div>
        </div>
      )}

      {data?.invitees && data.invitees.length > 0 && (
        <>
          <div className="bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-2 text-muted-foreground font-medium">User ID</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Mobile</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Deposits</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Withdrawals</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invitees.map((inv: any, i: number) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="p-2 text-foreground font-mono text-[10px]">{inv.userId}</td>
                      <td className="p-2 text-muted-foreground">{inv.mobile || '—'}</td>
                      <td className="p-2 text-primary font-medium">₹{(inv.totals?.deposit ?? 0).toLocaleString()}</td>
                      <td className="p-2 text-destructive font-medium">₹{(inv.totals?.withdraw ?? 0).toLocaleString()}</td>
                      <td className="p-2 text-muted-foreground">{new Date(inv.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total: {data.totalInvitees} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadStats(page - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadStats(page + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <div className="flex justify-between items-center py-0.5 border-b border-border last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-medium text-foreground">{String(value ?? '—')}</span>
  </div>
);

export default AgentStats;
