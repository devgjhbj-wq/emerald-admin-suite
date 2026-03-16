import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAgentCommissions, claimAgentCommission, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';

const AgentCommissions = () => {
  const { token } = useAuth();
  const [recUser, setRecUser] = useState('');
  const [claimFilter, setClaimFilter] = useState<'' | 'true' | 'false'>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [page, setPage] = useState(1);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadCommissions = async (p = 1) => {
    const q = recUser.trim();
    if (!q) return;
    setAuthToken(token);
    setLoading(true);
    try {
      const params: any = { page: p, limit: 50 };
      if (claimFilter !== '') params.claim = claimFilter === 'true';
      if (fromDate) params.from = new Date(fromDate).toISOString();
      if (toDate) params.to = new Date(toDate).toISOString();
      const res = await fetchAgentCommissions(q, params);
      setData(res.data);
      setPage(p);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    const q = recUser.trim();
    if (!q) return;
    setAuthToken(token);
    setClaiming(true);
    try {
      const res = await claimAgentCommission(Number(q));
      toast.success(`Claimed ₹${res.data.claimedAmount} (${res.data.claimedCount} records)`);
      loadCommissions(page);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to claim');
    } finally {
      setClaiming(false);
    }
  };

  const totalPages = data?.total ? Math.ceil(data.total / (data.limit || 50)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="bg-card border border-border p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <SearchBar value={recUser} onChange={setRecUser} onSearch={() => loadCommissions(1)} placeholder="Agent User ID" loading={loading} />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">Claim Status</label>
              <select
                value={claimFilter}
                onChange={(e) => setClaimFilter(e.target.value as '' | 'true' | 'false')}
                className="h-8 border border-input bg-background px-2 text-xs text-foreground"
              >
                <option value="">All</option>
                <option value="false">Unclaimed</option>
                <option value="true">Claimed</option>
              </select>
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">From</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-36" />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] text-muted-foreground">To</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-36" />
            </div>
            <Button variant="outline" size="sm" onClick={() => loadCommissions(1)} disabled={loading}>
              Apply Filters
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <LastUpdated timestamp={updatedAt} onRefresh={() => loadCommissions(page)} loading={loading} />
          {data?.items && (
            <Button variant="destructive" size="sm" onClick={handleClaim} disabled={claiming || !recUser.trim()}>
              {claiming ? <Loading size={14} /> : <DollarSign className="w-3.5 h-3.5" />}
              Claim All Unclaimed
            </Button>
          )}
        </div>
      </div>

      {data?.items && (
        <>
          <div className="bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-2 text-muted-foreground font-medium">From User</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Deposit Amt</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Commission</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Claimed</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c: any, i: number) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="p-2 text-foreground font-mono text-[10px]">{c.fromUser}</td>
                      <td className="p-2 text-foreground">₹{c.depositAmt?.toLocaleString()}</td>
                      <td className="p-2 text-primary font-medium">₹{c.amount?.toLocaleString()}</td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium ${c.claim ? 'bg-primary/20 text-primary' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {c.claim ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground">{new Date(c.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total: {data.total} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadCommissions(page - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadCommissions(page + 1)}>
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

export default AgentCommissions;
