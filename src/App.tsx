import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import UserSearch from "./pages/UserSearch";
import Transactions from "./pages/Transactions";
import Deposits from "./pages/Deposits";
import Withdrawals from "./pages/Withdrawals";
import AgentStats from "./pages/AgentStats";
import AgentConfig from "./pages/AgentConfig";
import AgentCommissions from "./pages/AgentCommissions";
import AgentDaily from "./pages/AgentDaily";
import AdminLogs from "./pages/AdminLogs";
import VipConfig from "./pages/VipConfig";
import CreateBet from "./pages/CreateBet";
import TurnoverConfig from "./pages/TurnoverConfig";
import GameBets from "./pages/GameBets";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UserSearch />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="deposits" element={<Deposits />} />
              <Route path="withdrawals" element={<Withdrawals />} />
              <Route path="agent-stats" element={<AgentStats />} />
              <Route path="agent-daily" element={<AgentDaily />} />
              <Route path="commissions" element={<AgentCommissions />} />
              <Route path="agent-config" element={<AgentConfig />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="vip-config" element={<VipConfig />} />
              <Route path="turnover-config" element={<TurnoverConfig />} />
              <Route path="create-bet" element={<CreateBet />} />
              <Route path="game-bets" element={<GameBets />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
