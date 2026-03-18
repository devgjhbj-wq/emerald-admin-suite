import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { searchBetsByMember, syncBetRecords, setAuthToken } from '@/lib/api';
import { toast } from 'sonner';
import SearchBar from '@/components/SearchBar';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border p-4 rounded-md flex flex-wrap gap-3 items-end">
        <div className="space-y-1 w-full sm:w-48">
          <label className="text-xs font-medium text-muted-foreground">Member (Required)</label>
          <SearchBar 
            value={member} 
            onChange={setMember} 
            onSearch={() => handleSearch(1)} 
            placeholder="e.g., u123456" 
            loading={loading}
          />
        </div>
        <div className="space-y-1 w-full sm:w-32">
          <label className="text-xs font-medium text-muted-foreground">Site (Optional)</label>
          <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="e.g., JE" className="h-9" />
        </div>
        <div className="space-y-1 w-full sm:w-36">
          <label className="text-xs font-medium text-muted-foreground">Date From</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1 w-full sm:w-36">
          <label className="text-xs font-medium text-muted-foreground">Date To</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleSearch(1)} disabled={loading} className="h-9">
            <Search className="w-4 h-4 mr-2" /> Search
          </Button>
          <Button onClick={handleSync} disabled={syncing} variant="secondary" className="h-9">
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} /> Sync Bets
          </Button>
        </div>
      </div>

      {data && data.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard title="Total Bet" value={`₹${data.summary.totalBet?.toFixed(2)}`} />
          <SummaryCard title="Total Payout" value={`₹${data.summary.totalPayout?.toFixed(2)}`} />
          <SummaryCard title="Net PnL" value={`₹${data.summary.netPnl?.toFixed(2)}`} isPnl />
          <SummaryCard title="Total Turnover" value={`₹${data.summary.totalTurnover?.toFixed(2)}`} />
        </div>
      )}

      {data && (
        <div className="bg-card border border-border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Time</TableHead>
                  <TableHead>Ref No</TableHead>
                  <TableHead>Site/Product</TableHead>
                  <TableHead className="text-right">Bet</TableHead>
                  <TableHead className="text-right">Payout</TableHead>
                  <TableHead className="text-right">Turnover</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items?.map((item: any) => (
                  <TableRow key={item._id}>
                    <TableCell className="text-xs p-2 whitespace-nowrap">
                      {new Date(item.betTime).toLocaleString()}<br/>
                      <span className="text-muted-foreground">Settle: {new Date(item.settleTime).toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-xs p-2">{item.refNo}</TableCell>
                    <TableCell className="text-xs p-2">
                      <span className="font-semibold">{item.site}</span> / {item.product}
                      <br/><span className="text-muted-foreground">Game: {item.gameId}</span>
                    </TableCell>
                    <TableCell className="text-xs p-2 text-right">₹{item.bet}</TableCell>
                    <TableCell className="text-xs p-2 text-right text-muted-foreground">₹{item.payout}</TableCell>
                    <TableCell className="text-xs p-2 text-right">₹{item.turnover}</TableCell>
                    <TableCell className="text-xs p-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        item.status === 1 ? 'bg-green-500/20 text-green-400' :
                        item.status === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {item.status === 1 ? 'Valid' : item.status === 0 ? 'Running' : 'Invalid'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {data.items?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No bet records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Showing page {data.page} (Total: {data.total})
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleSearch(data.page - 1)} disabled={data.page === 1 || loading}>
                Previous
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleSearch(data.page + 1)} disabled={data.items?.length < data.limit || loading}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
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
