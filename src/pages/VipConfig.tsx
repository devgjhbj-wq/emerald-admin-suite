import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchVipConfig, updateVipConfig, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, Plus } from 'lucide-react';

interface VipLevel {
  name: string;
  minDeposit: number;
  dailyWithdrawLimit: number;
  monthlyCheckinBonus: number;
  upgradeReward: number;
}

const VipConfig = () => {
  const { token } = useAuth();
  const [levels, setLevels] = useState<VipLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadConfig = async () => {
    setAuthToken(token);
    setLoading(true);
    try {
      const res = await fetchVipConfig();
      setLevels(res.data.levels || []);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConfig(); }, []);

  const handleSave = async () => {
    setAuthToken(token);
    setSaving(true);
    try {
      const res = await updateVipConfig(levels);
      setLevels(res.data.levels);
      toast.success(res.data.msg || 'Config updated');
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update config');
    } finally {
      setSaving(false);
    }
  };

  const addLevel = () => {
    setLevels([...levels, { name: `VIP ${levels.length + 1}`, minDeposit: 0, dailyWithdrawLimit: 0, monthlyCheckinBonus: 0, upgradeReward: 0 }]);
  };

  const handleDelete = (index: number) => {
    setLevels(levels.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1.5">
      <div className="bg-card border border-border flex items-center justify-between\">
        <div>
          <h2 className="text-sm font-semibold text-foreground">VIP Configuration</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Configure VIP levels with deposit limits and bonuses</p>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={loadConfig} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={addLevel}>
            <Plus className="w-3.5 h-3.5" />
            Add Level
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loading />
        </div>
      ) : (
        <div className="relative rounded" style={{ height: 445, border: '1px solid hsl(var(--border))' }}>
          <div style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
            <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 900 }}>
              <colgroup>
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col style={{ width: 80 }} />
              </colgroup>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
                <tr style={{ height: 50 }}>
                  {['Level Name', 'Min Deposit', 'Max Deposit', 'Min Withdraw', 'Max Withdraw', 'Turnover', 'Action'].map((label) => (
                    <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                      <div className="cell">{label}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {levels.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 50, color: 'hsl(var(--muted-foreground))' }}>
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                        <span>No Data</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  levels.map((level: any, i: number) => (
                    <tr key={i} style={{ height: 50 }}>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell">{level.name || level.levelName}</div>
                      </td>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell">{level.minDeposit ? `₹${Number(level.minDeposit).toLocaleString()}` : '-'}</div>
                      </td>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell">{level.maxDeposit ? `₹${Number(level.maxDeposit).toLocaleString()}` : '-'}</div>
                      </td>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell">{level.minWithdraw ? `₹${Number(level.minWithdraw).toLocaleString()}` : '-'}</div>
                      </td>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell">{level.maxWithdraw ? `₹${Number(level.maxWithdraw).toLocaleString()}` : '-'}</div>
                      </td>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell">{level.turnover ? `₹${Number(level.turnover).toLocaleString()}` : level.minTurnover ? `₹${Number(level.minTurnover).toLocaleString()}` : '-'}</div>
                      </td>
                      <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                        <div className="cell">
                          <button onClick={() => handleDelete(i)} style={{ background: 'none', border: '1px solid hsl(var(--border))', borderRadius: 2, padding: '2px 6px', cursor: 'pointer', color: 'hsl(var(--destructive))', fontSize: 11, lineHeight: 1 }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end p-3 border-t border-border">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loading size={14} /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VipConfig;
