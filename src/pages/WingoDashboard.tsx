import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RefreshCw, Dices, Trophy, Target, List, Timer, Settings, X } from 'lucide-react';
import {
  fetchWingoCurrentRound,
  fetchWingoCurrentRoundBets,
  fetchWingoRoundStats,
  fetchWingoRounds,
  fetchWingoResultMode,
  setWingoResultMode,
  setAuthToken
} from '@/lib/api';
import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WingoRound {
  _id: string;
  issueNumber: string;
  startTime: number;
  endTime: number;
  result: { number: number | null; color: string | null; size: string | null };
  resultMode: string;
  status: 'open' | 'closed' | 'settled';
}

interface WingoStats {
  totalBets: number;
  totalBetAmount: number;
  uniqueUsers: number;
  breakdown: Record<string, number>;
}

interface WingoBet {
  _id: string;
  userId: string;
  mobile: string;
  orderNumber: string;
  betAmount: number;
  fee: number;
  selectType: string;
  status: string;
  result: any;
  createdAt: string;
}

interface WingoSettledRound {
  issueNumber: string;
  result: { number: number; color: string; size: string };
  resultMode: string;
  status: string;
  startTime: number;
  endTime: number;
  createdAt: string;
  stats: {
    totalBets: number;
    totalBetAmount: number;
    totalPayout: number;
    wonCount: number;
    lostCount: number;
  };
}

const WingoDashboard = () => {
  const { token } = useAuth();
  const [currentRound, setCurrentRound] = useState<WingoRound | null>(null);
  const [currentRoundStats, setCurrentRoundStats] = useState<WingoStats | null>(null);
  const [currentRoundBets, setCurrentRoundBets] = useState<WingoBet[]>([]);
  const [settledRounds, setSettledRounds] = useState<WingoSettledRound[]>([]);
  const [resultMode, setResultMode] = useState<'RANDOM' | 'MAX_PROFIT' | 'MAX_LOSS'>('RANDOM');
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('current');
  const [betsPage, setBetsPage] = useState(1);
  const [roundsPage, setRoundsPage] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [showBets, setShowBets] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedRoundStats, setSelectedRoundStats] = useState<any>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [loadingBets, setLoadingBets] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const loadCurrentRound = useCallback(async () => {
    if (!token) return;
    setAuthToken(token);
    try {
      const res = await fetchWingoCurrentRound();
      setCurrentRound(res.data.round);
      setCurrentRoundStats(res.data.stats);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const loadAllData = useCallback(async () => {
    if (!token) return;
    setAuthToken(token);
    setLoading(true);
    
    try {
      const [currentRes, modeRes] = await Promise.all([
        fetchWingoCurrentRound(),
        fetchWingoResultMode()
      ]);
      
      setCurrentRound(currentRes.data.round);
      setCurrentRoundStats(currentRes.data.stats);
      setResultMode(modeRes.data.mode);
      setUpdatedAt(new Date());
    } catch (err) {
      console.error(err);
      toast.error('Failed to load Wingo data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      loadCurrentRound();
    }, 2000);
    return () => clearInterval(interval);
  }, [loadAllData, loadCurrentRound]);

  useEffect(() => {
    if (!currentRound) return;

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((currentRound.endTime - now) / 1000));
      setCountdown(remaining);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [currentRound]);

  const handleSetMode = async (newMode: 'RANDOM' | 'MAX_PROFIT' | 'MAX_LOSS') => {
    try {
      await setWingoResultMode(newMode);
      setResultMode(newMode);
      toast.success('Result mode updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update result mode');
    }
  };

  const getNumberColor = (num: number | null) => {
    if (num === null) return 'text-gray-400';
    if (num === 0 || num === 5) return 'text-purple-500';
    if ([1, 3, 7, 9].includes(num)) return 'text-green-500';
    return 'text-red-500';
  };

  const getNumberBgColor = (num: number | null) => {
    if (num === null) return 'bg-gray-100';
    if (num === 0 || num === 5) return 'bg-purple-500';
    if ([1, 3, 7, 9].includes(num)) return 'bg-green-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="current" className="text-xs">
            Current Round
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            <List className="w-3.5 h-3.5 mr-1.5" />
            History
          </TabsTrigger>
          <TabsTrigger value="mode" className="text-xs">
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Mode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4 mt-4">
          {loading && !currentRound ? (
            <div className="flex items-center justify-center h-48">
              <Loading />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <Card className="lg:col-span-1">
                  <CardContent className="p-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-[11px] font-bold text-foreground flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          Current Round
                        </h3>
                        <p className="text-[8px] text-muted-foreground">
                          {currentRound?.issueNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-primary/10 px-1.5 py-1 rounded-lg">
                        <Timer className="w-3 h-3 text-primary" />
                        <span className="text-xs font-black text-primary">
                          {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="bg-secondary/20 p-1 rounded-lg">
                          <p className="text-[7px] text-muted-foreground uppercase">Mode</p>
                          <p className="text-[9px] font-bold">{currentRound?.resultMode}</p>
                        </div>
                        <div className="bg-secondary/20 p-1 rounded-lg">
                          <p className="text-[7px] text-muted-foreground uppercase">Status</p>
                          <Badge variant="outline" className="text-[8px] mt-0.5">
                            {currentRound?.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px]">
                          <span className="text-muted-foreground">Bets</span>
                          <span className="font-bold">{currentRoundStats?.totalBets}</span>
                        </div>
                        <div className="flex justify-between text-[8px]">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-bold">₹{currentRoundStats?.totalBetAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[8px]">
                          <span className="text-muted-foreground">Users</span>
                          <span className="font-bold">{currentRoundStats?.uniqueUsers}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                  <CardHeader className="pb-1.5">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Bet Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase">Colors</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {['red', 'green', 'violet'].map(color => (
                            <div key={color} className={`p-1.5 rounded-lg border text-center ${
                              color === 'red' ? 'border-red-500/30 bg-red-500/5' :
                              color === 'green' ? 'border-green-500/30 bg-green-500/5' :
                              'border-purple-500/30 bg-purple-500/5'
                            }`}>
                              <p className="text-[9px] text-muted-foreground capitalize">{color}</p>
                              <p className="text-sm font-bold">₹{(currentRoundStats?.breakdown?.[color] || 0).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase">Size</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {['big', 'small'].map(size => (
                            <div key={size} className="p-1.5 rounded-lg border border-border bg-secondary/10 text-center">
                              <p className="text-[9px] text-muted-foreground capitalize">{size}</p>
                              <p className="text-sm font-bold">₹{(currentRoundStats?.breakdown?.[size] || 0).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground uppercase">Numbers</p>
                      <div className="grid grid-cols-10 gap-1">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                          <div key={num} className={`p-1.5 rounded-lg border text-center ${getNumberBgColor(num)}/10 border-current/20`}>
                            <p className={`text-xs font-bold ${getNumberColor(num)}`}>{num}</p>
                            <p className="text-[8px] text-muted-foreground">₹{(currentRoundStats?.breakdown?.[String(num)] || 0).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <List className="w-4 h-4" />
                      Current Round Bets
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {!showBets ? (
                        <Button 
                          onClick={async () => {
                            setLoadingBets(true);
                            try {
                              const res = await fetchWingoCurrentRoundBets(betsPage, 50);
                              setCurrentRoundBets(res.data.items);
                              setShowBets(true);
                            } finally {
                              setLoadingBets(false);
                            }
                          }}
                          disabled={loading || loadingBets}
                          size="sm" 
                          className="h-7 text-[10px] gap-1"
                        >
                          {loadingBets ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            'Show'
                          )}
                        </Button>
                      ) : (
                        <Button 
                          onClick={async () => {
                            setLoadingBets(true);
                            try {
                              const res = await fetchWingoCurrentRoundBets(betsPage, 50);
                              setCurrentRoundBets(res.data.items);
                            } finally {
                              setLoadingBets(false);
                            }
                          }}
                          disabled={loading || loadingBets}
                          size="sm" 
                          className="h-7 text-[10px] gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingBets ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {showBets && (
                  <CardContent className="pt-0">
                    <div className="relative rounded" style={{ height: 445, border: '1px solid hsl(var(--border))' }}>
                      <div style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
                        <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 800 }}>
                          <colgroup>
                            <col />
                            <col />
                            <col />
                            <col />
                            <col />
                            <col />
                          </colgroup>
                          <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
                            <tr style={{ height: 50 }}>
                              {['User', 'Number', 'Amount', 'Side', 'Time', 'Payout'].map((label) => (
                                <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                                  <div className="cell">{label}</div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {currentRoundBets.length === 0 ? (
                              <tr>
                                <td colSpan={6} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 50, color: 'hsl(var(--muted-foreground))' }}>
                                  <div className="flex flex-col items-center gap-2">
                                    <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                    <span>No Data</span>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              currentRoundBets.map((bet: any, i: number) => (
                                <tr key={i} style={{ height: 50 }}>
                                  <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                    <div className="cell">{bet.userId || bet.user}</div>
                                  </td>
                                  <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                    <div className="cell">{bet.number}</div>
                                  </td>
                                  <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                    <div className="cell">{bet.amount ? `₹${Number(bet.amount).toLocaleString()}` : '-'}</div>
                                  </td>
                                  <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                    <div className="cell">{bet.side || '-'}</div>
                                  </td>
                                  <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                    <div className="cell" style={{ fontSize: 11 }}>{bet.createdAt ? new Date(bet.createdAt).toLocaleString() : '-'}</div>
                                  </td>
                                  <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                    <div className="cell">{bet.payout ? `₹${Number(bet.payout).toLocaleString()}` : '-'}</div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Settled Rounds
                </CardTitle>
                <div className="flex items-center gap-2">
                  {!showHistory ? (
                    <Button 
                      onClick={async () => {
                        setLoadingHistory(true);
                        try {
                          const res = await fetchWingoRounds(roundsPage, 25);
                          setSettledRounds(res.data.items);
                          setShowHistory(true);
                        } finally {
                          setLoadingHistory(false);
                        }
                      }}
                      disabled={loading || loadingHistory}
                      size="sm" 
                      className="h-7 text-[10px] gap-1"
                    >
                      {loadingHistory ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        'Show'
                      )}
                    </Button>
                  ) : (
                    <Button 
                      onClick={async () => {
                        setLoadingHistory(true);
                        try {
                          const res = await fetchWingoRounds(roundsPage, 25);
                          setSettledRounds(res.data.items);
                        } finally {
                          setLoadingHistory(false);
                        }
                      }}
                      disabled={loading || loadingHistory}
                      size="sm" 
                      className="h-7 text-[10px] gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
              {showHistory && (
                <CardContent className="pt-0">
                  <div className="relative rounded" style={{ height: 445, border: '1px solid hsl(var(--border))' }}>
                    <div style={{ height: '100%', overflowX: 'auto', overflowY: 'auto' }}>
                      <table className="el-table w-full" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 1050 }}>
                        <colgroup>
                          <col style={{ width: 120 }} />
                          <col style={{ width: 50 }} />
                          <col style={{ width: 90 }} />
                          <col style={{ width: 60 }} />
                          <col style={{ width: 110 }} />
                          <col style={{ width: 110 }} />
                          <col style={{ width: 130 }} />
                          <col style={{ width: 90 }} />
                          <col style={{ width: 80 }} />
                        </colgroup>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: 'hsl(var(--card))' }}>
                          <tr style={{ height: 50 }}>
                            {['Issue', 'Result', 'Mode', 'Bets', 'Turnover', 'Payout', 'Profit/Loss', 'Won/Lost', 'Action'].map((label) => (
                              <th key={label} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: '2px 0', fontWeight: 400, fontSize: 14 }}>
                                <div className="cell">{label}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {settledRounds.length === 0 ? (
                            <tr>
                              <td colSpan={9} style={{ textAlign: 'center', border: '1px solid hsl(var(--border))', padding: 50, color: 'hsl(var(--muted-foreground))' }}>
                                <div className="flex flex-col items-center gap-2">
                                  <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                  <span>No Data</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            settledRounds.map(round => (
                              <tr key={round.issueNumber} style={{ height: 50 }}>
                                <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                  <div className="cell" style={{ fontFamily: 'monospace', fontSize: 11 }}>{round.issueNumber}</div>
                                </td>
                                <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                  <div className="cell">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white ${getNumberBgColor(round.result.number)}`} style={{ margin: '0 auto' }}>
                                      {round.result.number}
                                    </div>
                                  </div>
                                </td>
                                <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                  <div className="cell" style={{ fontSize: 11 }}>{round.resultMode}</div>
                                </td>
                                <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                  <div className="cell" style={{ fontSize: 11 }}>{round.stats.totalBets}</div>
                                </td>
                                <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                  <div className="cell" style={{ fontSize: 11 }}>₹{round.stats.totalBetAmount.toLocaleString()}</div>
                                </td>
                                <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                  <div className="cell" style={{ fontSize: 11 }}>₹{round.stats.totalPayout.toLocaleString()}</div>
                                </td>
                                <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                  <div className="cell">
                                    <span style={{ fontSize: 11, fontWeight: 'bold', color: (round.stats.totalBetAmount - round.stats.totalPayout) >= 0 ? 'rgb(34,197,94)' : 'rgb(239,68,68)' }}>
                                      {(round.stats.totalBetAmount - round.stats.totalPayout) >= 0 ? '+' : ''}₹{(round.stats.totalBetAmount - round.stats.totalPayout).toLocaleString()}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                  <div className="cell">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11 }}>
                                      <span style={{ color: 'rgb(34,197,94)', fontWeight: 'bold' }}>{round.stats.wonCount}</span>
                                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>/</span>
                                      <span style={{ color: 'rgb(239,68,68)', fontWeight: 'bold' }}>{round.stats.lostCount}</span>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ border: '1px solid hsl(var(--border))', padding: '2px 0', textAlign: 'center' }}>
                                  <div className="cell">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      style={{ height: 24, padding: '0 8px', fontSize: 11, borderRadius: 2 }}
                                      onClick={async () => {
                                        setLoadingStats(true);
                                        try {
                                          if (token) {
                                            setAuthToken(token);
                                          }
                                          console.log('Fetching stats for issueNumber:', round.issueNumber);
                                          const res = await fetchWingoRoundStats(round.issueNumber);
                                          console.log('Round stats response:', res);
                                          setSelectedRoundStats(res.data);
                                          setStatsDialogOpen(true);
                                        } catch (err: any) {
                                          console.error('Error fetching round stats:', err);
                                          console.error('Error response:', err.response);
                                          toast.error('Failed to load round stats: ' + (err.response?.data?.msg || err.response?.data?.message || err.message));
                                        } finally {
                                          setLoadingStats(false);
                                        }
                                      }}
                                      disabled={loadingStats}
                                    >
                                      {loadingStats ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        'Stats'
                                      )}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              )}
          </Card>
        </TabsContent>

        <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader className="flex flex-row items-center justify-between pb-1">
              <div>
                <DialogTitle className="text-sm">Round Stats - {selectedRoundStats?.issue?.issueNumber}</DialogTitle>
                <DialogDescription className="text-[10px]">
                  Full statistics for this round
                </DialogDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-full"
                onClick={() => setStatsDialogOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </DialogHeader>
            {selectedRoundStats && (
              <div className="space-y-3 mt-1">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-secondary/20 p-2 rounded-lg">
                    <p className="text-[9px] text-muted-foreground uppercase">Total Bets</p>
                    <p className="text-sm font-bold">{selectedRoundStats.stats.totalBets}</p>
                  </div>
                  <div className="bg-secondary/20 p-2 rounded-lg">
                    <p className="text-[9px] text-muted-foreground uppercase">Users</p>
                    <p className="text-sm font-bold">{selectedRoundStats.stats.uniqueUsers}</p>
                  </div>
                  <div className="bg-secondary/20 p-2 rounded-lg">
                    <p className="text-[9px] text-muted-foreground uppercase">Turnover</p>
                    <p className="text-sm font-bold">₹{selectedRoundStats.stats.totalBetAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/20 p-2 rounded-lg">
                    <p className="text-[9px] text-muted-foreground uppercase">Payout</p>
                    <p className="text-sm font-bold">₹{selectedRoundStats.stats.totalPayout.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/20 p-2 rounded-lg">
                    <p className="text-[9px] text-muted-foreground uppercase">P/L</p>
                    <p className={`text-sm font-bold ${selectedRoundStats.stats.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedRoundStats.stats.profitLoss >= 0 ? '+' : ''}₹{selectedRoundStats.stats.profitLoss.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-secondary/20 p-2 rounded-lg">
                    <p className="text-[9px] text-muted-foreground uppercase">Won/Lost</p>
                    <p className="text-sm font-bold">
                      <span className="text-green-500">{selectedRoundStats.stats.wonCount}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-red-500">{selectedRoundStats.stats.lostCount}</span>
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase">Bet Breakdown</h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.entries(selectedRoundStats.stats.breakdown).map(([type, data]: any) => (
                      <div key={type} className="bg-secondary/10 p-1.5 rounded-md border border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-medium capitalize">{type}</span>
                          <div className="text-right">
                            <p className="text-[9px] font-bold">₹{data.amount.toLocaleString()}</p>
                            <p className="text-[8px] text-muted-foreground">{data.count}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <TabsContent value="mode" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Result Mode
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Current mode: <span className="font-bold text-foreground">{resultMode}</span>
                  </CardDescription>
                </div>
                <Button 
                  onClick={loadAllData} 
                  disabled={loading}
                  size="sm" 
                  className="h-8 text-xs gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Select Result Mode</p>
                  <Select 
                    value={resultMode} 
                    onValueChange={(v: any) => setResultMode(v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RANDOM">RANDOM - Pure random 0-9 (default)</SelectItem>
                      <SelectItem value="MAX_PROFIT">MAX_PROFIT - Minimize payout (house wins more)</SelectItem>
                      <SelectItem value="MAX_LOSS">MAX_LOSS - Maximize payout (house loses more)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={async () => {
                    await handleSetMode(resultMode);
                  }}
                  disabled={loading}
                  className="w-full h-9 text-xs"
                >
                  Apply Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WingoDashboard;
