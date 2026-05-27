import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAdminLogs, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';
import { PageContainer, SearchHeader } from '@/components/PageContainer';

const AdminLogs = () => {
  const { token } = useAuth();
  const [level, setLevel] = useState<'info' | 'error' | ''>('');
  const [since, setSince] = useState('');
  const [limit, setLimit] = useState(200);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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

  const toggleExpand = (i: number) => {
    setExpandedIndex(expandedIndex === i ? null : i);
  };

  return (
    <PageContainer>
      <SearchHeader>
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap mr-[3px]">Level</label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as '' | 'info' | 'error')}
          className="w-[200px] h-[26px] rounded-md border border-input bg-background px-2.5 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All</option>
          <option value="info">Info</option>
          <option value="error">Error</option>
        </select>
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap mr-[3px] ml-[3px]">Since</label>
        <Input type="datetime-local" value={since} onChange={(e) => setSince(e.target.value)} className="w-[200px] h-[26px] text-xs" />
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap mr-[3px] ml-[3px]">Limit</label>
        <Input type="number" min={1} max={1000} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-[200px] h-[26px] text-xs" />
        <Button onClick={loadLogs} disabled={loading} className="h-[26px] px-2.5 rounded-[5px] gap-1 text-xs" style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}>
          {loading ? <Loading size={14} /> : <RefreshCw className="w-3.5 h-3.5" />}
          Apply
        </Button>
      </SearchHeader>

      <div className="relative rounded" style={{ height: 445, border: '1px solid hsl(var(--border))' }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Loading size={30} />
          </div>
        )}

        <div style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
          <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 900 }}>
            <colgroup>
              <col style={{ width: 40 }} />
              <col />
              <col style={{ width: 80 }} />
              <col />
              <col />
            </colgroup>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
              <tr style={{ height: 50 }}>
                {['', 'Time', 'Level', 'Message', 'Details'].map((label) => (
                  <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                    <div className="cell">{label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 50, color: 'hsl(var(--muted-foreground))' }}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      <span>No Data</span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log: any, i: number) => (
                  <tr key={i} style={{ height: 50 }}>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        <button onClick={() => toggleExpand(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--foreground))', padding: 0 }}>
                          {expandedIndex === i ? '▼' : '▶'}
                        </button>
                      </div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontSize: 11 }}>{new Date(log.createdAt || log.timestamp).toLocaleString()}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${
                          log.level === 'error' || log.level === 'ERROR' ? 'bg-destructive/20 text-destructive' :
                          log.level === 'warn' || log.level === 'WARN' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-primary/20 text-primary'
                        }`}>{log.level}</span>
                      </div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ textAlign: 'left' }}>{log.message}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ textAlign: 'left' }}>
                        {expandedIndex === i && log.stack && <pre style={{ fontSize: 10, whiteSpace: 'pre-wrap', margin: 0 }}>{log.stack}</pre>}
                        {expandedIndex === i && log.details && !log.stack && <pre style={{ fontSize: 10, whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(log.details, null, 2)}</pre>}
                        {expandedIndex !== i && <span style={{ color: 'hsl(var(--muted-foreground))' }}>-</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
};

export default AdminLogs;
