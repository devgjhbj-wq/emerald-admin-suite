import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTurnoverConfig, updateTurnoverConfig, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Save } from 'lucide-react';

const TurnoverConfig = () => {
  const { token } = useAuth();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const loadData = async () => {
    setAuthToken(token);
    setLoading(true);
    try {
      const res = await fetchTurnoverConfig();
      setConfigs(res.data.configs || []);
    } catch (err: any) {
      toast.error('Failed to load turnover config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleSave = async (config: any) => {
    setAuthToken(token);
    setSaving(config.type);
    try {
      await updateTurnoverConfig({
        type: config.type,
        multiplier: Number(config.multiplier),
        active: config.active,
        description: config.description
      });
      toast.success(`${config.type} config updated`);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || `Failed to update ${config.type}`);
    } finally {
      setSaving(null);
    }
  };

  const updateField = (index: number, field: string, value: any) => {
    const newConfigs = [...configs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setConfigs(newConfigs);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Turnover Requirements</h2>
          <p className="text-xs text-muted-foreground">Configure turnover multipliers for various transactions.</p>
        </div>
        <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((config, i) => (
          <div key={config.type} className="bg-card border border-border p-4 rounded-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                {config.type}
              </h3>
              <Switch
                checked={config.active}
                onCheckedChange={(val) => updateField(i, 'active', val)}
              />
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Multiplier (x)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={config.multiplier}
                  onChange={(e) => updateField(i, 'multiplier', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Input
                  value={config.description || ''}
                  onChange={(e) => updateField(i, 'description', e.target.value)}
                  className="h-8 text-sm"
                  placeholder="E.g., Deposit requires 2x turnover"
                />
              </div>
            </div>
            <Button
              className="w-full h-8 text-xs"
              onClick={() => handleSave(config)}
              disabled={saving === config.type}
            >
              <Save className="w-3.5 h-3.5 mr-2" />
              {saving === config.type ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        ))}
        {configs.length === 0 && !loading && (
          <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
            No turnover configurations found.
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnoverConfig;
