import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTurnoverStatus, clearTurnover, addTurnover, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Loading from '@/components/Loading';
import { RefreshCw, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const UserTurnover = ({ userId }: { userId: string | number }) => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearReason, setClearReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [addType, setAddType] = useState('ADMIN_BONUS');

  const loadData = async () => {
    if (!userId) return;
    setAuthToken(token);
    setLoading(true);
    try {
      const res = await fetchTurnoverStatus(userId);
      setData(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleClear = async () => {
    setAuthToken(token);
    setActionLoading(true);
    try {
      await clearTurnover(userId, clearReason);
      toast.success('User turnover cleared successfully');
      setClearDialogOpen(false);
      setClearReason('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to clear turnover');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addAmount || isNaN(Number(addAmount))) {
      toast.error('Invalid amount');
      return;
    }
    setAuthToken(token);
    setActionLoading(true);
    try {
      await addTurnover({
        userId,
        amount: Number(addAmount),
        type: addType,
        sourceRef: 'ADMIN'
      });
      toast.success('Turnover added successfully');
      setAddDialogOpen(false);
      setAddAmount('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to add turnover');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-card border border-border p-4 rounded-md flex justify-center py-6">
        <Loading />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-card border border-border p-4 space-y-4 rounded-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            Turnover Status
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Withdrawable only when requirement is 0
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-7 text-[10px]">
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="h-7 text-[10px]">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setClearDialogOpen(true)} className="h-7 text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500/20">
            <Trash2 className="w-3 h-3 mr-1" /> Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 bg-secondary/30 rounded border border-border space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Requirement</div>
          <div className="text-lg font-bold text-foreground">₹{data.turnover_requirement?.toFixed(2) || 0}</div>
        </div>
        <div className="p-3 bg-secondary/30 rounded border border-border space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Completed</div>
          <div className="text-lg font-bold text-foreground">₹{data.total_turnover_completed?.toFixed(2) || 0}</div>
        </div>
        <div className="p-3 bg-secondary/30 rounded border border-border space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Progress</div>
          <div className="text-lg font-bold text-foreground">{data.progress || 0}%</div>
        </div>
        <div className="p-3 bg-secondary/30 rounded border border-border space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</div>
          <div className={`text-sm font-bold mt-1 inline-flex items-center px-2 py-0.5 rounded ${data.canWithdraw ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
            {data.canWithdraw ? 'Can Withdraw' : 'Cannot Withdraw'}
          </div>
        </div>
      </div>

      {data.batches && data.batches.length > 0 && (
        <div className="mt-4 border border-border rounded overflow-hidden">
          <div className="bg-secondary/50 px-3 py-2 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Active Turnover Batches
          </div>
          <div className="max-h-60 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Date</TableHead>
                  <TableHead className="text-[10px]">Type</TableHead>
                  <TableHead className="text-[10px] text-right">Amount</TableHead>
                  <TableHead className="text-[10px] text-center">Mult.</TableHead>
                  <TableHead className="text-[10px] text-right">Required</TableHead>
                  <TableHead className="text-[10px] text-right">Completed</TableHead>
                  <TableHead className="text-[10px] text-right">Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.batches.map((batch: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-[11px] p-2 whitespace-nowrap">{new Date(batch.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-[11px] p-2">{batch.type}</TableCell>
                    <TableCell className="text-[11px] p-2 text-right">₹{batch.amount}</TableCell>
                    <TableCell className="text-[11px] p-2 text-center">{batch.multiplier}x</TableCell>
                    <TableCell className="text-[11px] p-2 text-right">₹{batch.required}</TableCell>
                    <TableCell className="text-[11px] p-2 text-right text-muted-foreground">₹{batch.completed}</TableCell>
                    <TableCell className="text-[11px] p-2 text-right font-medium">₹{batch.remaining}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm text-red-500 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Clear Turnover
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Are you sure you want to completely clear the turnover requirement for this user? This will set their requirement to 0 and allow them to withdraw.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium">Reason (optional)</label>
              <Input
                value={clearReason}
                onChange={(e) => setClearReason(e.target.value)}
                placeholder="e.g., Customer service resolution"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setClearDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleClear} disabled={actionLoading}>
              {actionLoading && <Loading size={14} />}
              Confirm Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Add Turnover Requirement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Type</label>
              <select
                value={addType}
                onChange={(e) => setAddType(e.target.value)}
                className="w-full h-9 border border-input rounded-md bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ADMIN_BONUS">Admin Bonus</option>
                <option value="PROMOTION">Promotion</option>
                <option value="REFERRAL_BONUS">Referral Bonus</option>
                <option value="DEPOSIT">Deposit</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Base Amount (₹)</label>
              <Input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Enter base amount"
              />
              <p className="text-[10px] text-muted-foreground">The final requirement will depend on the multiplier for this type.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={actionLoading || !addAmount}>
              {actionLoading && <Loading size={14} />}
              Add Turnover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserTurnover;
