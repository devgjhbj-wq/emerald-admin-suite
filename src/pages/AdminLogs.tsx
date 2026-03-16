import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAdminLogs, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

const AdminLogs = () => {
  const { token } = useAuth();
  const [level, setLevel] = useState<'info' | 'error' | ''>('');
  const [since, setSince] = useState('');
  const [limit, setLimit] = useState(200);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadLogs = async () => {
    setAuthToken(token);
    setLoading(true);
    try {
      const params: any = {};
      if (level) params.level = level;
      if (since) params.since = since;
      if (limit) params.limit = limit;
      const res = await fetchAdminLogs(params);
      setLogs(res.data.entries || []);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const toggleExpand = (ts: string) => {
    setExpandedId(expandedId === ts ? null : ts);
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleString();

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-0.5">
            <label className="text-[10px] text-muted-foreground">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as '' | 'info' | 'error')}
              className="h-8 border border-input bg-background px-2 text-xs text-foreground"
            >
              <option value="">All</option>
              <option value="info">Info</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] text-muted-foreground">Since</label>
            <Input type="datetime-local" value={since} onChange={(e) => setSince(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] text-muted-foreground">Limit</label>
            <Input type="number" min={1} max={1000} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-20" />
          </div>
          <Button onClick={loadLogs} disabled={loading} variant="outline" size="sm">
            {loading ? <Loading size={14} /> : <RefreshCw className="w-3.5 h-3.5" />}
            Apply
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-secondary/50">
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium w-8"></th>
                <th className="text-left p-2 text-muted-foreground font-medium">Time</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Level</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Message</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    {loading ? 'Loading...' : 'No logs found'}
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => {
                  const logKey = log.ts + i;
                  const isExpanded = expandedId === logKey;
                  return (
                    <>
                      <tr
                        key={logKey}
                        className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(logKey)}
                      >
                        <td className="p-2">
                          {log.stack ? (
                            isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                          ) : null}
                        </td>
                        <td className="p-2 text-muted-foreground text-[10px]">{formatTime(log.ts)}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium ${
                            log.level === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {log.level}
                          </span>
                        </td>
                        <td className="p-2 text-foreground font-mono text-[10px]">{log.message}</td>
                        <td className="p-2 text-muted-foreground text-[10px]">
                          {log.meta?.method} {log.meta?.path} {log.meta?.status && `(${log.meta.status})`}
                        </td>
                      </tr>
                      {isExpanded && log.stack && (
                        <tr className="bg-destructive/5">
                          <td colSpan={5} className="p-2">
                            <pre className="text-[10px] text-destructive font-mono whitespace-pre-wrap bg-black/50 p-2">
                              {log.stack}
                            </pre>
                          </td>
                        </tr>
                      )}
                      {isExpanded && log.meta && !log.stack && (
                        <tr className="bg-secondary/20">
                          <td colSpan={5} className="p-2">
                            <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap">
                              {JSON.stringify(log.meta, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {logs.length} entries
      </div>
    </div>
  );
};

export default AdminLogs;
