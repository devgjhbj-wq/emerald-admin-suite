import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchGiftCodes, 
  createGiftCode, 
  toggleGiftCode, 
  deleteGiftCode, 
  fetchGiftCodeRedemptions,
  setAuthToken,
  GiftCodeCreateData
} from '@/lib/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import LastUpdated from '@/components/LastUpdated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Gift, 
  Plus, 
  Search, 
  Trash2, 
  Power, 
  PowerOff, 
  Users, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info,
  Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageContainer, SearchHeader, Pagination } from '@/components/PageContainer';

interface GiftCode {
  _id: string;
  code: string;
  rewardAmount: number;
  turnoverMultiplier: number;
  maxRedemptions: number;
  usedCount: number;
  expiryDate: string;
  minDepositToday: number;
  isActive: boolean;
  description: string;
  createdAt?: string;
}

interface Redemption {
  _id: string;
  code: string;
  userId: number;
  rewardAmount: number;
  turnoverAdded: number;
  createdAt: string;
}

const GiftCodes = () => {
  const { token } = useAuth();
  
  // List state
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  
  // Create state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [formData, setFormData] = useState<GiftCodeCreateData>({
    code: '',
    rewardAmount: 0,
    turnoverMultiplier: 1,
    maxRedemptions: 100,
    expiryDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
    minDepositToday: 0,
    isActive: true,
    description: '',
    codeLength: 12
  });
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  // Redemptions state
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionPage, setRedemptionPage] = useState(1);
  const [redemptionTotal, setRedemptionTotal] = useState(0);
  const [redemptionLoading, setRedemptionLoading] = useState(false);
  const [isRedemptionsOpen, setIsRedemptionsOpen] = useState(false);

  const loadCodes = useCallback(async (p = 1) => {
    setLoading(true);
    setAuthToken(token);
    try {
      const params: any = { page: p, limit };
      if (search) params.search = search;
      if (isActiveFilter !== 'all') params.isActive = isActiveFilter === 'active';
      
      const res = await fetchGiftCodes(params);
      setCodes(res.data.items);
      setTotal(res.data.total);
      setPage(p);
      setUpdatedAt(new Date());
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to fetch gift codes');
    } finally {
      setLoading(false);
    }
  }, [token, search, isActiveFilter, limit]);

  useEffect(() => {
    loadCodes(1);
  }, [loadCodes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setAuthToken(token);
    try {
      const data = { ...formData };
      if (expiryDate) data.expiryDate = expiryDate.toISOString();
      
      if (isEditMode && editingCode) {
        // Only include non-code fields for update
        const { code, codeLength, isActive, ...updateData } = data;
        await updateGiftCode(editingCode, updateData);
        toast.success('Gift code updated successfully');
      } else {
        if (!data.code) delete data.code;
        await createGiftCode(data);
        toast.success('Gift code created successfully');
      }
      
      setIsCreateOpen(false);
      loadCodes(page);
      // Reset form
      setFormData({
        code: '',
        rewardAmount: 0,
        turnoverMultiplier: 1,
        maxRedemptions: 100,
        expiryDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        minDepositToday: 0,
        isActive: true,
        description: '',
        codeLength: 12
      });
      setIsEditMode(false);
      setEditingCode(null);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || `Failed to ${isEditMode ? 'update' : 'create'} gift code`);
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (code: GiftCode) => {
    setFormData({
      code: code.code,
      rewardAmount: code.rewardAmount,
      turnoverMultiplier: code.turnoverMultiplier,
      maxRedemptions: code.maxRedemptions,
      expiryDate: code.expiryDate,
      minDepositToday: code.minDepositToday,
      isActive: code.isActive,
      description: code.description,
      codeLength: 12
    });
    setExpiryDate(new Date(code.expiryDate));
    setIsEditMode(true);
    setEditingCode(code.code);
    setIsCreateOpen(true);
  };

  const handleToggle = async (code: string, currentStatus: boolean) => {
    setAuthToken(token);
    try {
      await toggleGiftCode(code, !currentStatus);
      toast.success(`Gift code ${!currentStatus ? 'enabled' : 'disabled'}`);
      setCodes(codes.map(c => c.code === code ? { ...c, isActive: !currentStatus } : c));
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to toggle status');
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to delete gift code ${code}? This will also delete all redemption records.`)) return;
    setAuthToken(token);
    try {
      await deleteGiftCode(code);
      toast.success('Gift code deleted');
      loadCodes(page);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to delete gift code');
    }
  };

  const loadRedemptions = async (code: string, p = 1) => {
    setRedemptionLoading(true);
    setAuthToken(token);
    try {
      const res = await fetchGiftCodeRedemptions(code, p, 10);
      setRedemptions(res.data.items);
      setRedemptionTotal(res.data.total);
      setRedemptionPage(p);
      setSelectedCode(code);
      setIsRedemptionsOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to fetch redemptions');
    } finally {
      setRedemptionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const redemptionTotalPages = Math.ceil(redemptionTotal / 10);

  const renderTable = () => {
    const showEmpty = codes.length === 0 && !loading;

    return (
      <div className="relative rounded" style={{ height: 445, border: '1px solid hsl(var(--border))' }}>
        {loading && codes.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Loading size={30} />
          </div>
        )}

        <div style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
          <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 1050 }}>
            <colgroup>
              <col />
              <col style={{ width: 80 }} />
              <col />
              <col />
              <col />
              <col />
              <col style={{ width: 90 }} />
              <col />
              <col style={{ width: 100 }} />
            </colgroup>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
              <tr style={{ height: 50 }}>
                {['Code', 'Type', 'Amount / Min', 'Max', 'Used / Total', 'Expires', 'Status', 'Created', 'Actions'].map((label) => (
                  <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                    <div className="cell">{label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showEmpty ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 50, color: 'hsl(var(--muted-foreground))' }}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      <span>No Data</span>
                    </div>
                  </td>
                </tr>
              ) : (
                codes.map((code: any) => (
                  <tr key={code._id || code.id} style={{ height: 50 }}>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontFamily: 'monospace', fontSize: 11 }}>{code.code}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${
                          code.type === 'BONUS' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>{code.type}</span>
                      </div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{code.amount ? `₹${Number(code.amount).toLocaleString()}` : '-'} / {code.minAmount ? `₹${Number(code.minAmount).toLocaleString()}` : '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{code.maxAmount ? `₹${Number(code.maxAmount).toLocaleString()}` : '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          <span>{code.usedCount || 0}/{code.totalCount || 0}</span>
                          <div style={{ width: 60, height: 4, background: 'hsl(var(--secondary))', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(((code.usedCount || 0) / (code.totalCount || 1)) * 100, 100)}%`, height: '100%', background: 'hsl(var(--primary))', borderRadius: 2 }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontSize: 11 }}>{code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          code.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>{code.active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontSize: 11 }}>{code.createdAt ? new Date(code.createdAt).toLocaleDateString() : '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button onClick={() => handleToggle(code._id || code.id, code.active)} style={{ background: 'none', border: '1px solid hsl(var(--border))', borderRadius: 2, padding: '2px 4px', cursor: 'pointer', color: code.active ? 'hsl(var(--destructive))' : 'hsl(var(--primary))', fontSize: 11, lineHeight: 1 }}>
                            {code.active ? 'Off' : 'On'}
                          </button>
                          <button onClick={() => handleDelete(code._id || code.id)} style={{ background: 'none', border: '1px solid hsl(var(--border))', borderRadius: 2, padding: '2px 4px', cursor: 'pointer', color: 'hsl(var(--destructive))', fontSize: 11, lineHeight: 1 }}>
                            Del
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <PageContainer>
      <SearchHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search code..."
            className="w-[200px] pl-9 h-[26px] text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadCodes(1)}
          />
        </div>
        <select
          className="w-[200px] h-[26px] rounded-md border border-input bg-background px-2.5 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={isActiveFilter}
          onChange={(e) => setIsActiveFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Button size="sm" onClick={() => loadCodes(1)} disabled={loading} className="h-[26px] px-2.5 rounded-[5px] gap-1 text-xs" style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}>
          {loading ? <Loading size={12} /> : <Search className="w-3.5 h-3.5" />}
          Search
        </Button>
        <LastUpdated timestamp={updatedAt} onRefresh={() => loadCodes(page)} loading={loading} compact />
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setIsEditMode(false);
              setEditingCode(null);
              setFormData({
                code: '',
                rewardAmount: 0,
                turnoverMultiplier: 1,
                maxRedemptions: 100,
                expiryDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
                minDepositToday: 0,
                isActive: true,
                description: '',
                codeLength: 12
              });
              setExpiryDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-[26px] rounded-[5px] gap-1 text-xs font-bold">
                <Plus className="w-3.5 h-3.5" />
                Create Gift Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Edit Gift Code' : 'Create New Gift Code'}</DialogTitle>
                <DialogDescription>
                  {isEditMode ? 'Update gift code settings. Code itself cannot be changed.' : 'Create a reward code for users. Leave code empty to auto-generate.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Custom Code (Optional)</label>
                    <Input 
                      placeholder="e.g. WELCOME100" 
                      className="text-xs uppercase"
                      disabled={isEditMode}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Auto Length</label>
                    <Input 
                      type="number"
                      placeholder="12" 
                      className="text-xs"
                      disabled={!!formData.code || isEditMode}
                      value={formData.codeLength}
                      onChange={(e) => setFormData({ ...formData, codeLength: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Reward Amount (₹)</label>
                    <Input 
                      type="number"
                      required
                      className="text-xs font-bold"
                      value={formData.rewardAmount}
                      onChange={(e) => setFormData({ ...formData, rewardAmount: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Turnover Mult.</label>
                    <Input 
                      type="number"
                      step="0.1"
                      className="text-xs"
                      value={formData.turnoverMultiplier}
                      onChange={(e) => setFormData({ ...formData, turnoverMultiplier: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Max Redemptions</label>
                    <Input 
                      type="number"
                      required
                      className="text-xs"
                      value={formData.maxRedemptions}
                      onChange={(e) => setFormData({ ...formData, maxRedemptions: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Min Deposit Today</label>
                    <Input 
                      type="number"
                      className="text-xs"
                      value={formData.minDepositToday}
                      onChange={(e) => setFormData({ ...formData, minDepositToday: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Expiry Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-9 text-xs",
                          !expiryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expiryDate}
                        onSelect={setExpiryDate}
                        initialFocus
                        fromYear={2026}
                        toYear={2030}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Description (Admin Reference)</label>
                  <Input 
                    placeholder="e.g. New User Bonus" 
                    className="text-xs"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={createLoading}>
                    {createLoading ? <Loading size={14} className="mr-2" /> : isEditMode ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {isEditMode ? 'Update Code' : 'Create Code'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
      </SearchHeader>

      {renderTable()}

      <Pagination page={page} totalPages={totalPages} total={total} loading={loading} onPageChange={loadCodes} />

      {/* Redemptions Dialog */}
      <Dialog open={isRedemptionsOpen} onOpenChange={setIsRedemptionsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Redemptions for <span className="text-primary font-mono">{selectedCode}</span>
            </DialogTitle>
            <DialogDescription>
              List of users who have used this gift code.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto px-6 py-2">
            {redemptionLoading ? (
              <div className="h-48 flex items-center justify-center"><Loading /></div>
            ) : redemptions.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                <Info className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No redemptions yet.</p>
              </div>
            ) : (
              <table className="el-table w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ height: 40 }}>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid hsl(var(--border))', padding: '8px 12px', fontWeight: 600, fontSize: 12 }}>User ID</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid hsl(var(--border))', padding: '8px 12px', fontWeight: 600, fontSize: 12 }}>Reward</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid hsl(var(--border))', padding: '8px 12px', fontWeight: 600, fontSize: 12 }}>Turnover Added</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid hsl(var(--border))', padding: '8px 12px', fontWeight: 600, fontSize: 12 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((r) => (
                    <tr key={r._id}>
                      <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700 }}>{r.userId}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 900 }}>₹{r.rewardAmount.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>₹{r.turnoverAdded.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>
                        {format(new Date(r.createdAt), "MMM dd, yyyy HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {redemptionTotalPages > 1 && (
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={redemptionPage <= 1 || redemptionLoading}
                onClick={() => loadRedemptions(selectedCode!, redemptionPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={redemptionPage >= redemptionTotalPages || redemptionLoading}
                onClick={() => loadRedemptions(selectedCode!, redemptionPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="p-4 bg-secondary/10 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsRedemptionsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default GiftCodes;
