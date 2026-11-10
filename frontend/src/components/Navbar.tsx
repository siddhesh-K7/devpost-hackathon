import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { 
  Bot, ShoppingBag, ShieldAlert, PieChart, 
  FileText, CreditCard, LayoutDashboard, LogOut, ShoppingCart, 
  Package, Menu, X, ChevronDown, CheckCircle2, Wallet, Plus,
  Sun, Moon
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      api.get('/api/wallet')
        .then(res => setWalletBalance(res.data.balance || 0))
        .catch(() => setWalletBalance(null));
    }
  }, [user, location.pathname]);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/assistant', label: 'AI Shopping Assistant', icon: Bot, isSpecial: true },
    { to: '/products', label: 'Products', icon: ShoppingBag },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, count: cart?.item_count || 0 },
    { to: '/orders', label: 'My Orders', icon: Package },
    { to: '/expenses', label: 'Expense Analytics', icon: PieChart },
    { to: '/fraud', label: 'Fraud Shield', icon: ShieldAlert },
    { to: '/invoices', label: 'Invoices', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white transition">
            <CreditCard className="w-4 h-4" />
          </div>
          <span className="flex items-center gap-1.5">
            <span>PayPilot</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-400/30">
              AI
            </span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        {user && (
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : link.isSpecial
                      ? 'text-blue-300 bg-blue-950/40 border border-blue-800/50 hover:bg-blue-900/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.count !== undefined && link.count > 0 && (
                    <span className="bg-amber-400 text-slate-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                      {link.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* User Profile / Auth Area */}
        <div className="flex items-center gap-3">
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2.5">
              {/* Dynamic AI Wallet Badge / Icon */}
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 transition group"
                title="PayPilot Autonomous AI Wallet - Click to view in Profile"
              >
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none">Wallet</div>
                  <div className="text-xs font-bold text-white mt-0.5 leading-none">
                    {walletBalance !== null ? `₹${walletBalance.toLocaleString()}` : '₹50,000'}
                  </div>
                </div>
              </Link>

              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
                title="View & Edit Profile"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white line-clamp-1">{user.full_name}</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Profile</span>
                  </div>
                </div>
              </Link>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 transition border border-slate-800 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && user && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
                {link.count !== undefined && link.count > 0 && (
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                    {link.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
