import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { searchBetsByMember, syncBetRecords, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search } from 'lucide-react';
import { PageContainer, SearchHeader, Pagination } from '@/components/PageContainer';

const GameBets = () => {
  const { token } = useAuth();
  const [member, setMember] = useState('');
  const [site, setSite] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(1);

  const handleSearch = async (pageNum = 1) => {
    if (!member.trim()) {
      toast.error("Member username is required");
      return;
    }
    setAuthToken(token);
    setLoading(true);
    try {
      const res = await searchBetsByMember(member.trim(), {
        page: pageNum,
        limit: 50,
        site: site || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      });
      setData(res.data);
      setPage(pageNum);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to fetch bets');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setAuthToken(token);
    setSyncing(true);
    try {
      const res = await syncBetRecords();
      toast.success(`Sync Complete: Added ${res.data.inserted}, Updated ${res.data.updated}`);
      if (member) handleSearch(1);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to sync bets');
    } finally {
      setSyncing(false);
    }
  };

  const statusColor: Record<string, string> = {
    win: 'bg-green-500/20 text-green-400',
    loss: 'bg-red-500/20 text-red-400',
    refund: 'bg-yellow-500/20 text-yellow-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
  };

  const renderTable = (data: any) => {
    const showEmpty = !data?.items?.length;

    return (
      <div className="relative rounded" style={{ height: 445, border: '1px solid hsl(var(--border))' }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <Loading size={30} />
          </div>
        )}

        <div style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
          <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 1050 }}>
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
              <tr style={{ height: 50 }}>
                {['Time', 'Game', 'Member', 'Content', 'Bet Amount', 'Valid Bet', 'Payout', 'Status'].map((label) => (
                  <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                    <div className="cell">{label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showEmpty ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 50, color: 'hsl(var(--muted-foreground))' }}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      <span>No Data</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((d: any, i: number) => (
                  <tr key={i} style={{ height: 50 }}>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ fontSize: 11 }}>{new Date(d.time || d.createdAt).toLocaleString()}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.game}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.member || d.userId}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.content}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.betAmount ? `₹${Number(d.betAmount).toLocaleString()}` : '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">{d.validBet ? `₹${Number(d.validBet).toLocaleString()}` : '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell" style={{ color: d.payout > 0 ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{d.payout ? `₹${Number(d.payout).toLocaleString()}` : '-'}</div>
                    </td>
                    <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                      <div className="cell">
                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm ${statusColor[d.status] || 'bg-muted text-muted-foreground'}`}>{d.status}</span>
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
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Member</label>
        <SearchBar 
          value={member} 
          onChange={setMember} 
          onSearch={() => handleSearch(1)} 
          placeholder="e.g., u123456" 
          loading={loading}
          storageKey="game_bets_member_search"
          maxHistory={10}
        />
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Site</label>
        <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="e.g., JE" className="w-[200px] h-[26px] text-xs" />
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">From</label>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[200px] h-[26px] text-xs" />
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">To</label>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[200px] h-[26px] text-xs" />
        <Button onClick={() => handleSearch(1)} disabled={loading} className="h-[26px] px-2.5 rounded-[5px] gap-1 text-xs" style={{ backgroundColor: 'rgb(32,143,255)', color: '#fff' }}>
          <Search className="w-3.5 h-3.5" /> Search
        </Button>
        <Button onClick={handleSync} disabled={syncing} variant="secondary" className="h-8 gap-1 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync Bets
        </Button>
      </SearchHeader>

      {data && data.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard title="Total Bet" value={`₹${data.summary.totalBet?.toFixed(2)}`} />
          <SummaryCard title="Total Payout" value={`₹${data.summary.totalPayout?.toFixed(2)}`} />
          <SummaryCard title="Net PnL" value={`₹${data.summary.netPnl?.toFixed(2)}`} isPnl />
          <SummaryCard title="Total Turnover" value={`₹${data.summary.totalTurnover?.toFixed(2)}`} />
        </div>
      )}

      {data && renderTable(data)}
      {data && (
        <Pagination page={data.page} totalPages={Math.ceil(data.total / data.limit)} total={data.total} loading={loading} onPageChange={handleSearch} />
      )}
    </PageContainer>
  );
};

const SummaryCard = ({ title, value, isPnl = false }: { title: string, value: string | number, isPnl?: boolean }) => {
  const isPositive = isPnl && Number(String(value).replace(/[^0-9.-]+/g, "")) >= 0;
  const isNegative = isPnl && Number(String(value).replace(/[^0-9.-]+/g, "")) < 0;
  
  return (
    <div className="bg-card border border-border p-4 rounded-md space-y-1">
      <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
      <div className={`text-xl font-bold ${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
};

export default GameBets;
