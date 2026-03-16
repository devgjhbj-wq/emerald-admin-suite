import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import logo from '@/assets/logo.png';
import bglogo from '@/assets/bgLogo.png';

const LoginPage = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('https://backend-ledger-0ra6.onrender.com/api/auth/login', {
        mobile,
        password,
      });

      const data = res.data;
      const token = data.token || data.jwt || data.accessToken;
      const user = data.user || data;

      if (!user.admin) {
        toast.error('Access denied: Admins only');
        return;
      }

      if (token || data.status === 'success') {
        toast.success('Login successful!');
        const userData = { ...user, token: token || '' };
        login(userData);
        navigate('/dashboard', { replace: true });
      } else {
        toast.error(data?.msg || data?.message || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error(error);
      const errData = error.response?.data;
      if (errData) {
        const parts = [errData.msg, errData.message, errData.error, errData.detail].filter(Boolean);
        toast.error(parts.length > 0 ? parts.join(' — ') : 'Login failed');
      } else {
        toast.error(error.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: `url(${bglogo})` }}
    >
      <div className="absolute inset-0" />

      <div className="relative z-10 w-full max-w-sm">
        <Card className="bg-card/60 backdrop-blur-xl border-border p-6 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="Logo" className="w-12 h-12 mb-3" />
            <h1 className="text-lg font-bold text-foreground tracking-tight">Admin Login</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Management Panel Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Mobile Number</Label>
              <Input
                type="tel"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                className="bg-secondary/50 text-foreground placeholder:text-muted-foreground border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-secondary/50 text-foreground placeholder:text-muted-foreground border-border pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-xs font-semibold"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <p className="text-center text-muted-foreground/60 text-[10px] mt-4">
            If you encounter any issues, please contact{' '}
            <a
              href="https://t.me/support"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Telegram Support
            </a>.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
