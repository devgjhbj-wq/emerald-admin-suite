import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTransactions, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import LastUpdated from '@/components/LastUpdated';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Transactions = () => {
  const { token } = useAuth();
  const [userId, setUserId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = async (p = 1) => {
    const q = userId.trim();
    if (!q) {
      toast.error('User ID is required');
      return;
    }
    // Validate numeric user ID
    if (isNaN(Number(q))) {
      toast.error('User ID must be a number');
      return;
    }
    setAuthToken(token);
    setLoading(true);
    try {
      const res = await fetchTransactions(q, p);
      setData(res.data);
      setPage(p);
      setUpdatedAt(new Date());
    } catch (err: any) {
      const errorMsg = err.response?.data?.msg || 'Failed to load transactions';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border p-6 rounded-lg shadow-sm mb-4">
        <div className="w-full sm:w-auto">
          <SearchBar 
            value={userId} 
            onChange={setUserId} 
            onSearch={() => load(1)} 
            placeholder="Enter User ID" 
            loading={loading}
            storageKey="transaction_user_search"
            maxHistory={10}
          />
        </div>
        <LastUpdated timestamp={updatedAt} onRefresh={() => load(page)} loading={loading} />
      </div>

      {data?.items && (
        <>
          <div className="bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-2 text-muted-foreground font-medium">User ID</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Type</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Amount</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Balance After</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Order ID</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Remark</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((t: any, i: number) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="p-2 text-foreground font-medium">{t.userId}</td>
                      <td className="p-2 text-foreground font-medium">{t.type}</td>
                      <td className="p-2 text-foreground">₹{t.amount?.toLocaleString()}</td>
                      <td className="p-2 text-foreground">₹{t.balanceAfter?.toLocaleString()}</td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium ${
                          t.status === 'SUCCESS' ? 'bg-primary/20 text-primary' :
                          t.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground font-mono text-[9px]">{t.orderId || '—'}</td>
                      <td className="p-2 text-muted-foreground">{t.remark || '—'}</td>
                      <td className="p-2 text-muted-foreground whitespace-nowrap">{new Date(t.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total: {data.total} — Page {page}/{totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Transactions;
