import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { moveGameToWallet, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import Loading from '@/components/Loading';
import { ArrowRightLeft } from 'lucide-react';

const MoveGameBalance = () => {
  const { token } = useAuth();
  const [providerCode, setProviderCode] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Mode states
  const [singleUserId, setSingleUserId] = useState('');
  
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  
  const [userIdsText, setUserIdsText] = useState('');

  const [activeTab, setActiveTab] = useState('single');

  const handleMove = async () => {
    let payload: any = { providerCode };

    if (activeTab === 'single') {
      if (!singleUserId.trim()) return toast.error('Please enter a User ID');
      payload.userId = Number(singleUserId);
    } else if (activeTab === 'range') {
      if (!rangeStart.trim() || !rangeEnd.trim()) return toast.error('Please enter both start and end User IDs');
      payload.userId = Number(rangeStart);
      payload.userIdTo = Number(rangeEnd);
    } else if (activeTab === 'list') {
      if (!userIdsText.trim()) return toast.error('Please enter User IDs');
      const parsedIds = userIdsText.split(/[\s,]+/).filter(Boolean).map(Number);
      if (parsedIds.some(isNaN)) return toast.error('Invalid User IDs format');
      payload.userIds = parsedIds;
    }

    setAuthToken(token);
    setLoading(true);
    setResult(null);
    try {
      const res = await moveGameToWallet(payload);
      toast.success(res.data?.msg || 'Operation completed');
      setResult(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to move game balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto mt-4">
      <div className="bg-card border border-border p-6 space-y-6 rounded-lg">
        <div className="space-y-1 border-b border-border pb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            Move Game Balance to Wallet
          </h2>
          <p className="text-xs text-muted-foreground">
            Transfer game balance from providers (PG, JE, JD, TU) to wallet for multiple users.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single">Single User</TabsTrigger>
            <TabsTrigger value="range">User Range</TabsTrigger>
            <TabsTrigger value="list">List of Users</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Provider</label>
              <select
                value={providerCode}
                onChange={(e) => setProviderCode(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ALL">ALL Providers</option>
                <option value="JE">JE Only</option>
                <option value="JD">JD Only</option>
                <option value="PG">PG Only</option>
                <option value="TU">TU Only</option>
              </select>
            </div>

            <TabsContent value="single" className="space-y-1.5 m-0">
              <label className="text-xs font-medium">User ID</label>
              <Input 
                type="number"
                placeholder="e.g. 32545513"
                value={singleUserId}
                onChange={(e) => setSingleUserId(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="range" className="space-y-1.5 m-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Start User ID</label>
                  <Input 
                    type="number"
                    placeholder="e.g. 32545513"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">End User ID (inclusive)</label>
                  <Input 
                    type="number"
                    placeholder="e.g. 32545563"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-1.5 m-0">
              <label className="text-xs font-medium">User IDs (comma or space separated)</label>
              <Textarea 
                placeholder="e.g. 32545513, 32545514, 32545515"
                value={userIdsText}
                onChange={(e) => setUserIdsText(e.target.value)}
                className="min-h-[80px]"
              />
            </TabsContent>

            <Button 
              className="w-full mt-2" 
              onClick={handleMove} 
              disabled={loading}
            >
              {loading ? <Loading size={16} /> : null}
              {loading ? 'Processing...' : 'Transfer to Wallet'}
            </Button>
          </div>
        </Tabs>
      </div>

      {result && (
        <div className="bg-card border border-border p-4 space-y-4 rounded-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="border-b border-border pb-2 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-foreground">Transfer Result</h3>
            <span className="text-xs font-medium text-muted-foreground">{result.msg}</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary/20 p-3 rounded-md">
             <div className="space-y-1">
               <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</span>
               <p className="text-sm font-medium text-green-500">{result.status}</p>
             </div>
             <div className="space-y-1">
               <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Users Processed</span>
               <p className="text-sm font-medium text-foreground">{result.totalUsersProcessed}</p>
             </div>
             <div className="space-y-1 md:col-span-2">
               <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Amount Moved</span>
               <p className="text-sm font-bold text-primary">₹{result.totalAmountMoved?.toLocaleString()}</p>
             </div>
          </div>

          {result.users && result.users.length > 0 && (
            <div className="space-y-2 mt-2 max-h-96 overflow-y-auto pr-1">
              <h4 className="text-xs font-semibold text-muted-foreground sticky top-0 bg-card py-1">User Details</h4>
              {result.users.map((u: any, idx: number) => (
                <div key={idx} className={`p-3 text-xs border rounded-md ${u.success ? 'border-border' : 'border-red-500/50 bg-red-500/5'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-foreground">User ID: {u.userId}</span>
                    {u.success ? (
                       <span className="text-green-500 font-medium">+₹{u.moved?.toLocaleString()}</span>
                    ) : (
                       <span className="text-red-500 font-medium">Failed</span>
                    )}
                  </div>
                  
                  {!u.success && u.error && (
                    <p className="text-[10px] text-red-500 mb-2">{u.error}</p>
                  )}

                  {u.success && u.walletBalance !== undefined && (
                    <p className="text-[10px] text-muted-foreground mb-2">New Wallet Balance: <strong className="text-foreground">₹{u.walletBalance.toLocaleString()}</strong></p>
                  )}

                  {u.providers && u.providers.length > 0 && (
                    <div className="space-y-1 mt-2 bg-background p-2 rounded">
                      {u.providers.map((p: any, pIdx: number) => (
                         <div key={pIdx} className="flex justify-between items-center text-[10px]">
                            <span className="font-medium">{p.provider}</span>
                            {p.success ? (
                              <div className="text-right">
                                <span className={p.amount > 0 ? "text-green-400 font-medium" : "text-muted-foreground"}>
                                  ₹{p.amount}
                                </span>
                                {p.message && <span className="ml-2 text-muted-foreground/70">({p.message})</span>}
                              </div>
                            ) : (
                              <span className="text-red-400">{p.error || 'Failed'}</span>
                            )}
                         </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MoveGameBalance;
