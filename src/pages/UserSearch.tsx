import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { searchUser, updateUserStatus, overrideUserBank, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import LastUpdated from '@/components/LastUpdated';
import Loading from '@/components/Loading';
import UserTurnover from '@/components/UserTurnover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShieldAlert, Smartphone, Globe, Fingerprint, Banknote } from 'lucide-react';

const UserSearch = () => {
  const { token } = useAuth();
  const [userId, setUserId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'inactive'>('active');
  const [statusRemark, setStatusRemark] = useState('');
  
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  const handleSearch = async () => {
    if (!userId.trim()) return;
    setAuthToken(token);
    setLoading(true);
    setResult(null);
    try {
      const res = await searchUser(userId.trim());
      setResult(res.data);
      setUpdatedAt(new Date());
      setBankName('');
      setBankCode('');
      setAccountNumber('');
      setAccountHolder('');
    } catch (err: any) {
      toast.error(err.response?.data?.msg || err.response?.data?.message || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!user?.userId) return;
    setAuthToken(token);
    setStatusLoading(true);
    try {
      const res = await updateUserStatus(user.userId, newStatus, statusRemark);
      toast.success(res.data.msg || 'Status updated');
      setStatusDialogOpen(false);
      setStatusRemark('');
      handleSearch();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleBankOverride = async () => {
    if (!user?.userId) return;
    setAuthToken(token);
    setBankLoading(true);
    try {
      const res = await overrideUserBank(user.userId, bankName, bankCode, accountNumber, accountHolder);
      toast.success(res.data.msg || 'Bank updated');
      setBankDialogOpen(false);
      handleSearch();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update bank');
    } finally {
      setBankLoading(false);
    }
  };

  const { user, account, deviceRisk } = result || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-card border border-border p-4">
        <SearchBar value={userId} onChange={setUserId} onSearch={handleSearch} placeholder="Enter User ID" loading={loading} />
        <LastUpdated timestamp={updatedAt} onRefresh={handleSearch} loading={loading} />
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {user && (
            <div className="bg-card border border-border p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">User Profile</h3>
              <InfoRow label="User ID" value={user.userId} />
              <InfoRow label="Mobile" value={user.mobile} />
              <InfoRow label="Admin" value={user.admin ? 'Yes' : 'No'} />
              <InfoRow label="Created" value={new Date(user.createdAt).toLocaleString()} />
              <InfoRow label="Updated" value={new Date(user.updatedAt).toLocaleString()} />
            </div>
          )}
          {account && (
            <div className="bg-card border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Account</h3>
                <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(true)}>
                  Change Status
                </Button>
              </div>
              <InfoRow label="Balance" value={`₹${account.balance?.toLocaleString()}`} />
              <InfoRow label="Currency" value={account.currency} />
              <InfoRow 
                label="Status" 
                value={
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium ${
                    account.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    account.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {account.status}
                  </span>
                } 
              />
              {account.statusRemark && <InfoRow label="Remark" value={account.statusRemark} />}
              <InfoRow label="VIP Level" value={account.vipLevel || '—'} />
              <InfoRow label="Withdraw Daily Limit" value={`₹${account.withdrawDailyLimit?.toLocaleString()}`} />
              <InfoRow label="Created" value={new Date(account.createdAt).toLocaleString()} />
            </div>
          )}
        </div>
      )}

      {user?.userId && (
        <UserTurnover userId={user.userId} />
      )}

      {account?.bindAccount && (
        <div className="bg-card border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Banknote className="w-4 h-4" />
              Bound Bank Account
            </h3>
            <Button variant="outline" size="sm" onClick={() => {
              const b = account.bindAccount;
              setBankName(b.bankName || '');
              setBankCode(b.bankCode || '');
              setAccountNumber(b.accountNumber || '');
              setAccountHolder(b.accountHolder || '');
              setBankDialogOpen(true);
            }}>
              Override Bank
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <InfoRow label="Bank Name" value={account.bindAccount.bankName} />
            <InfoRow label="IFSC Code" value={account.bindAccount.bankCode} />
            <InfoRow label="Account Number" value={account.bindAccount.accountNumber} />
            <InfoRow label="Holder Name" value={account.bindAccount.accountHolder} />
            <InfoRow label="Bound At" value={account.bindAccount.boundAt ? new Date(account.bindAccount.boundAt).toLocaleString() : '—'} />
          </div>
        </div>
      )}

      {deviceRisk && (
        <div className="bg-card border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Device Risk Assessment
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs font-medium ${
                deviceRisk.flagged 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {deviceRisk.flagged ? 'Flagged' : 'Safe'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Risk: {deviceRisk.latestRisk}/100 (Max: {deviceRisk.maxRisk})
              </span>
            </div>
          </div>

          {deviceRisk.signals && deviceRisk.signals.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {deviceRisk.signals.map((signal: string, i: number) => (
                <span key={i} className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px]">
                  {signal}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-secondary/30 p-3 space-y-1.5">
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Device Info
              </h4>
              <InfoRow label="Device ID" value={deviceRisk.latest?.deviceId || '—'} />
              <InfoRow label="Ad ID" value={deviceRisk.latest?.adId || '—'} />
              <InfoRow label="Fingerprint" value={deviceRisk.latest?.fingerprint || '—'} />
              <InfoRow label="Platform" value={deviceRisk.latest?.platform || '—'} />
              <InfoRow label="Browser" value={deviceRisk.latest?.browser || '—'} />
              <InfoRow label="OS" value={deviceRisk.latest?.os || '—'} />
              <InfoRow label="Resolution" value={deviceRisk.latest?.screenResolution || '—'} />
              <InfoRow label="Memory" value={deviceRisk.latest?.deviceMemory ? `${deviceRisk.latest.deviceMemory}GB` : '—'} />
            </div>

            <div className="bg-secondary/30 p-3 space-y-1.5">
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Network Info
              </h4>
              <InfoRow label="IP" value={deviceRisk.latest?.ip || '—'} />
              <InfoRow label="Country" value={deviceRisk.latest?.ipCountry || '—'} />
              <InfoRow label="City" value={deviceRisk.latest?.ipCity || '—'} />
              <InfoRow label="ISP" value={deviceRisk.latest?.isp || '—'} />
              <InfoRow label="ASN" value={deviceRisk.latest?.asn || '—'} />
              <InfoRow label="Proxy" value={deviceRisk.latest?.proxy ? 'Yes' : 'No'} />
              <InfoRow label="VPN" value={deviceRisk.latest?.vpnDetected ? 'Yes' : 'No'} />
            </div>

            <div className="bg-secondary/30 p-3 space-y-1.5">
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5" /> Payment & Stats
              </h4>
              <InfoRow label="Payment Hash" value={deviceRisk.latest?.paymentMethodHash || '—'} />
              <InfoRow label="Last Seen" value={deviceRisk.latest?.at ? new Date(deviceRisk.latest.at).toLocaleString() : '—'} />
              <InfoRow label="Total Logs" value={deviceRisk.totalLogs || 0} />
            </div>
          </div>
        </div>
      )}

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Change User Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full h-8 border border-input bg-background px-2 text-xs"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive (Ban)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Remark (optional)</label>
              <Input
                value={statusRemark}
                onChange={(e) => setStatusRemark(e.target.value)}
                placeholder="Reason for status change..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleStatusChange} disabled={statusLoading}>
              {statusLoading && <Loading size={14} />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Override Bank Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Bank Name</label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g., HDFC" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">IFSC Code</label>
              <Input value={bankCode} onChange={(e) => setBankCode(e.target.value)} placeholder="e.g., HDFC0001234" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Account Number</label>
              <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g., XXXXXX4321" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Account Holder</label>
              <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="e.g., Rahul" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBankDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleBankOverride} disabled={bankLoading || !bankName || !bankCode || !accountNumber || !accountHolder}>
              {bankLoading && <Loading size={14} />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <div className="flex justify-between items-center py-0.5 border-b border-border last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-medium text-foreground">{String(value ?? '—')}</span>
  </div>
);

export default UserSearch;
