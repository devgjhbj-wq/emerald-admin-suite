import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDepositsByUser, fetchDepositByOrder, approveDeposit, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const statusColor: Record<string, string> = {
  SUCCESS: 'bg-primary/20 text-primary',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  FAILED: 'bg-destructive/20 text-destructive',
  REFUNDED: 'bg-blue-500/20 text-blue-400',
  EXPIRED: 'bg-muted text-muted-foreground',
};

const Deposits = () => {
  const { token } = useAuth();
  const [userId, setUserId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastSearchType, setLastSearchType] = useState<'user' | 'order'>('user');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (orderIdToApprove: string) => {
    setAuthToken(token);
    setApprovingId(orderIdToApprove);
    try {
      const res = await approveDeposit(orderIdToApprove);
      toast.success(res.data.msg || 'Deposit approved');
      if (data?.items) {
        setData({
          ...data,
          items: data.items.map((d: any) =>
            d.orderId === orderIdToApprove ? { ...d, status: 'SUCCESS' } : d
          ),
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to approve deposit');
    } finally {
      setApprovingId(null);
    }
  };

  const loadByUser = async (p = 1) => {
    const q = userId.trim();
    if (!q) return;
    setAuthToken(token);
    setLoading(true);
    setLastSearchType('user');
    try {
      const res = await fetchDepositsByUser(q, p);
      setData(res.data);
      setPage(p);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  const loadByOrder = async () => {
    const q = orderId.trim();
    if (!q) return;
    setAuthToken(token);
    setLoading(true);
    setLastSearchType('order');
    try {
      const res = await fetchDepositByOrder(q);
      setData(res.data);
      setPage(1);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (lastSearchType === 'order') loadByOrder();
    else loadByUser(page);
  };

  const totalPages = data?.total ? Math.ceil(data.total / (data.limit || 25)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-card border border-border p-4">
          <SearchBar value={userId} onChange={setUserId} onSearch={() => loadByUser(1)} placeholder="Search by User ID" loading={loading} />
          <SearchBar value={orderId} onChange={setOrderId} onSearch={loadByOrder} placeholder="Search by Order ID (MER...)" loading={loading} />
        </div>
        <div className="flex justify-end">
          <LastUpdated timestamp={updatedAt} onRefresh={handleRefresh} loading={loading} />
        </div>
      </div>

      {data?.items && (
        <>
          <div className="bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-2 text-muted-foreground font-medium">Order ID</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Amount</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Channel</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Date</th>
                    {data.items.some((d: any) => d.updatedAt) && <th className="text-left p-2 text-muted-foreground font-medium">Updated At</th>}
                    <th className="text-left p-2 text-muted-foreground font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((d: any, i: number) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="p-2 text-foreground font-mono text-[10px]">{d.orderId}</td>
                      <td className="p-2 text-foreground">₹{d.amount?.toLocaleString()}</td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium ${statusColor[d.status] || 'bg-muted text-muted-foreground'}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground">{d.channelName || '—'}</td>
                      <td className="p-2 text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</td>
                      {data.items.some((d: any) => d.updatedAt) && <td className="p-2 text-muted-foreground">{d.updatedAt ? new Date(d.updatedAt).toLocaleString() : '—'}</td>}
                      <td className="p-2">
                        {d.status !== 'SUCCESS' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-primary border-primary/30 hover:bg-primary/10"
                            disabled={approvingId === d.orderId}
                            onClick={() => handleApprove(d.orderId)}
                          >
                            {approvingId === d.orderId ? (
                              <Loading size={14} />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            Approve
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {lastSearchType === 'user' && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total: {data.total} — Page {page}/{totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadByUser(page - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadByUser(page + 1)}>
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

export default Deposits;
