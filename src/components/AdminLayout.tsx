import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Wallet,
  UserCheck,
  Settings,
  Menu,
  X,
  LogOut,
  FileText,
  Crown,
  Pencil,
  Gamepad2,
  RefreshCcw,
  ArrowRightLeft,
  Gift,
  Dices,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import TagsView from "@/components/TagsView";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import Logo from "@/assets/logo.png";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "User Search", url: "/dashboard/users", icon: Users },
  { title: "Transactions", url: "/dashboard/transactions", icon: Receipt },
  { title: "Deposits", url: "/dashboard/deposits", icon: Wallet },
  { title: "Withdrawals", url: "/dashboard/withdrawals", icon: Wallet },
  { title: "Gift Codes", url: "/dashboard/gift-codes", icon: Gift },
  { title: "Agency", url: "/dashboard/agency", icon: UserCheck },
  { title: "VIP Config", url: "/dashboard/vip-config", icon: Crown },
  { title: "Turnover Config", url: "/dashboard/turnover-config", icon: RefreshCcw },
  { title: "Admin Logs", url: "/dashboard/logs", icon: FileText },
  { title: "Create Bet", url: "/dashboard/create-bet", icon: Pencil },
  { title: "Game Bets", url: "/dashboard/game-bets", icon: Gamepad2 },
  { title: "Move Game Bal", url: "/dashboard/move-game", icon: ArrowRightLeft },
  { title: "Wingo", url: "/dashboard/wingo", icon: Dices },
];

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const pageTitle = location.pathname === "/dashboard"
    ? "Dashboard"
    : navItems.find((n) => n.url === location.pathname)?.title || location.pathname.split("/").pop();

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .fade-transform-enter {
          animation: fadeTransformIn 0.5s ease both;
        }
        @keyframes fadeTransformIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .pro-table {
          table-layout: fixed;
          width: 100%;
          max-width: 100%;
          border-collapse: collapse;
        }
        .pro-table th,
        .pro-table td {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          border: 1px solid hsl(var(--border));
          padding: 8px 10px;
          text-align: left;
          font-size: 13px;
          color: hsl(var(--foreground));
        }
        .pro-table thead {
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .pro-table thead tr {
          background: hsl(var(--secondary) / 0.3);
        }
        .pro-table thead tr th {
          font-weight: 700;
          font-size: 13px;
          color: hsl(var(--foreground));
        }
        .pro-table tbody tr {
          transition: background-color 0.25s ease;
        }
        .pro-table tbody tr:hover {
          background: hsl(var(--secondary) / 0.15);
        }
        .el-table {
          table-layout: fixed;
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          line-height: 1.15;
          color: hsl(var(--foreground));
        }
        .el-table tbody { font-size: 12px; }
        .el-table tbody tr { transition: background-color 0.25s ease; }
        .el-table tbody tr:hover { background-color: hsl(var(--accent) / 0.12); }
        .el-table .cell { box-sizing: border-box; padding: 0 5px; }
      `}</style>
      
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 h-full z-[1001] flex-col border-r border-border bg-card transition-all duration-300 hidden lg:flex",
          sidebarCollapsed ? "w-12" : "w-[150px]"
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-[39px] z-20 bg-card border border-border rounded-full p-0.5 shadow-sm hover:bg-secondary transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRightIcon className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeftIcon className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Logo Header */}
        <div className="h-9 flex items-center justify-center bg-[rgb(32,143,255)] text-white overflow-hidden flex-shrink-0">
          {sidebarCollapsed ? (
            <img src={Logo} alt="Logo" className="w-4 h-4 object-contain brightness-0 invert" />
          ) : (
            <span className="text-[11px] font-bold tracking-wide">Customer Service System</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-0">
          <nav className="flex flex-col gap-0">
            {navItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/dashboard"}
                className={cn(
                  "flex items-center h-9 px-2.5 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors text-xs font-medium",
                  sidebarCollapsed && "justify-center px-0"
                )}
                activeClassName="!text-[#208fff] !bg-[#208fff]/10"
                onClick={() => setMobileOpen(false)}
                title={sidebarCollapsed ? item.title : undefined}
              >
                <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="ml-2 truncate">{item.title}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t border-border">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center h-9 w-full px-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-xs font-medium",
              sidebarCollapsed && "justify-center px-0"
            )}
            title={sidebarCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="ml-2">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-48 bg-card border-r border-border flex flex-col transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-9 flex items-center justify-between px-2.5 bg-[rgb(32,143,255)] text-white flex-shrink-0">
          <span className="text-[11px] font-bold tracking-wide">Customer Service System</span>
          <button onClick={() => setMobileOpen(false)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar py-0">
          <nav className="flex flex-col gap-0">
            {navItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/dashboard"}
                className="flex items-center h-9 px-2.5 text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors text-xs font-medium"
                activeClassName="!text-[#208fff] !bg-[#208fff]/10"
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="ml-2 truncate">{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center h-9 w-full px-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="ml-2">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", sidebarCollapsed ? "lg:ml-12" : "lg:ml-[150px]")}>
        <header className="h-10 border-b border-border bg-card flex items-center justify-between px-3 lg:px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xs font-semibold text-foreground">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground hidden sm:block">ID: {user?.userId || user?.id}</span>
            <div className="w-5 h-5 bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-[9px] font-bold">A</span>
            </div>
          </div>
        </header>

        <TagsView />

        <main className="flex-1 overflow-auto no-scrollbar">
          <div key={location.pathname} className="fade-transform-enter p-2 lg:p-3">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
