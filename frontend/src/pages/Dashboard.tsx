import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  CreditCard, TrendingUp, ShieldAlert, ShoppingBag, 
  ArrowUpRight, Clock, CheckCircle2, Bot, Sparkles, Tag,
  Zap, Star, ArrowRight, Smartphone, Laptop, Tv, Shirt,
  Watch, ShoppingCart, ChevronRight, Gift, Percent, Flame, Award
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/useCart';
import { Transaction, ExpenseAnalytics, FraudAlert, Product } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addedItem, setAddedItem] = useState<string | null>(null);

  // Dynamic hero promotional carousel banners
  const heroBanners = [
    {
      title: 'PayPilot AI Autonomous Big Sale',
      subtitle: 'Flat 18% GST rebate on UPI & PayPal verified checkouts with live fraud screening.',
      badge: 'LIMITED HACKATHON OFFER',
      cta: 'Explore Deals',
      link: '/products',
      bg: 'from-blue-900 via-indigo-900 to-slate-900',
      accent: 'text-amber-300'
    },
    {
      title: 'Flagship Smartphones & 5G Devices',
      subtitle: 'Apple iPhone 15, Samsung Galaxy S24 Ultra & OnePlus 12 with 0% interest EMI.',
      badge: 'FLIPKART & AMAZON VERIFIED',
      cta: 'Browse Mobiles',
      link: '/products?category=Mobiles%20and%20Smartphones',
      bg: 'from-slate-900 via-sky-950 to-blue-950',
      accent: 'text-cyan-300'
    },
    {
      title: 'Pro Developer Workstations & Laptops',
      subtitle: 'MacBook M2, ThinkPad & IdeaPad configured with instant PayPal Sandbox checkout.',
      badge: 'TOP BENCHMARKED SPECS',
      cta: 'View Laptops',
      link: '/products?category=Laptops%20and%20Computers',
      bg: 'from-violet-950 via-purple-900 to-slate-900',
      accent: 'text-fuchsia-300'
    }
  ];

  // Quick navigation categories with icons
  const categoryShortcuts = [
    { label: 'All Deals', icon: Flame, cat: 'All', color: 'from-amber-500 to-red-500' },
    { label: 'Mobiles', icon: Smartphone, cat: 'Mobiles and Smartphones', color: 'from-blue-500 to-indigo-600' },
    { label: 'Laptops', icon: Laptop, cat: 'Laptops and Computers', color: 'from-violet-500 to-purple-600' },
    { label: 'Televisions', icon: Tv, cat: 'Televisions', color: 'from-emerald-500 to-teal-600' },
    { label: 'Smartwatches', icon: Watch, cat: 'Smartwatches', color: 'from-pink-500 to-rose-600' },
    { label: 'Fashion', icon: Shirt, cat: 'Fashion – Men', color: 'from-orange-500 to-amber-600' },
    { label: 'Audio & ANC', icon: ShoppingBag, cat: 'Headphones and Earphones', color: 'from-cyan-500 to-blue-600' },
  ];

  // Auto-rotate hero banner every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aRes, tRes, fRes, pRes, cRes] = await Promise.all([
          api.get('/api/expenses/analytics'),
          api.get('/api/payments/transactions'),
          api.get('/api/fraud/alerts'),
          api.get('/api/products/search?limit=12'),
          api.get('/api/products/categories')
        ]);
        setAnalytics(aRes.data);
        setTransactions(tRes.data);
        setFraudAlerts(fRes.data);
        setFeaturedProducts(pRes.data.products || []);
        setCategories(cRes.data.categories || []);
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddToCart = async (prod: Product) => {
    await addToCart(prod.id);
    setAddedItem(prod.id);
    setTimeout(() => setAddedItem(null), 2500);
  };

  const filteredProducts = selectedDept === 'All' 
    ? featuredProducts 
    : featuredProducts.filter(p => p.category.toLowerCase().includes(selectedDept.toLowerCase()));

  return (
    <div className="space-y-8 pb-12">
      {/* 1. TOP DEPARTMENT NAVIGATION STRIP (Amazon / Flipkart Style) */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
            {categoryShortcuts.map((c) => {
              const Icon = c.icon;
              const isSelected = selectedDept === c.cat;
              return (
                <button
                  key={c.label}
                  onClick={() => setSelectedDept(c.cat)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm ring-2 ring-blue-500/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-tr ${c.color} flex items-center justify-center text-white shrink-0`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span>{c.label}</span>
                </button>
              );
            })}
            <Link
              to="/products"
              className="ml-auto text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0 px-2 py-1"
            >
              <span>All 28 Categories</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 2. DYNAMIC HERO CAROUSEL BANNER */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${heroBanners[activeSlide].bg} text-white p-8 md:p-12 shadow-xl border border-slate-700/50 transition-all duration-700`}>
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{heroBanners[activeSlide].badge}</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              {heroBanners[activeSlide].title}
            </h1>
            
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              {heroBanners[activeSlide].subtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(heroBanners[activeSlide].link)}
                className="bg-white text-slate-900 hover:bg-slate-100 font-extrabold px-6 py-3 rounded-xl text-sm transition shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <span>{heroBanners[activeSlide].cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <Link
                to="/assistant"
                className="bg-blue-600/80 hover:bg-blue-600 text-white font-semibold px-5 py-3 rounded-xl text-sm transition backdrop-blur-md border border-blue-400/30 flex items-center gap-2"
              >
                <Bot className="w-4 h-4 text-cyan-200" />
                <span>Ask AI Shopping Assistant</span>
              </Link>
            </div>
          </div>

          {/* Carousel Dot Indicators */}
          <div className="absolute bottom-4 right-8 z-20 flex items-center gap-2">
            {heroBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  activeSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* 3. VALUE PROPOSITION RIBBON */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Live Fraud Shield</h4>
              <p className="text-[11px] text-slate-500">ML velocity risk engine</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Instant UPI & QR</h4>
              <p className="text-[11px] text-slate-500">Dynamic zero-touch pay</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Gemini Flash AI</h4>
              <p className="text-[11px] text-slate-500">Autonomous buying agent</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Verified Retail</h4>
              <p className="text-[11px] text-slate-500">Amazon & Flipkart feeds</p>
            </div>
          </div>
        </div>

        {/* 4. TRENDING PRODUCTS SHOWCASE (Interactive Grid with Ratings & Add to Cart) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500 fill-red-500" />
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {selectedDept === 'All' ? 'Trending Deals & Verified Catalog' : `${selectedDept} Specials`}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time synchronized products with dynamic live pricing in INR.
              </p>
            </div>

            <Link
              to="/products"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition"
            >
              <span>View All Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white p-4 rounded-2xl border border-slate-200 animate-pulse space-y-3">
                  <div className="h-44 bg-slate-200 rounded-xl" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500';
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {prod.category.split(' ')[0]}
                    </div>
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{prod.rating}</span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-blue-600 truncate">
                        {prod.brand || prod.source}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1 group-hover:text-blue-600 transition" title={prod.name}>
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {prod.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Special Price</span>
                        <div className="text-base font-black text-slate-900">
                          ₹{prod.price.toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart(prod)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          addedItem === prod.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        }`}
                      >
                        {addedItem === prod.id ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>+ Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. FINANCIAL INTELLIGENCE & RECENT SETTLEMENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          {/* Spend Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Expense Intelligence</span>
              </span>
              <Link to="/expenses" className="text-xs font-semibold text-blue-600 hover:underline">
                View Breakdown
              </Link>
            </div>

            <div>
              <div className="text-xs text-slate-400">Total Settled Commerce Volume</div>
              <div className="text-3xl font-black text-slate-900 mt-1">
                ₹{(analytics?.total_spending || 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-emerald-600 font-bold">100% Verified</span>
                <span>across {analytics?.total_transactions || 0} completed orders</span>
              </div>
            </div>

            {/* Quick Category Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-700">Top Spend Categories</div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="bg-blue-600 h-full" style={{ width: '45%' }} />
                <div className="bg-indigo-500 h-full" style={{ width: '30%' }} />
                <div className="bg-emerald-500 h-full" style={{ width: '25%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Electronics (45%)</span>
                <span>Laptops (30%)</span>
                <span>Phones (25%)</span>
              </div>
            </div>
          </div>

          {/* Recent Orders Stream */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Recent PayPal & UPI Transactions</span>
              </span>
              <Link to="/orders" className="text-xs font-semibold text-blue-600 hover:underline">
                Track Orders
              </Link>
            </div>

            {transactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No orders yet. Ask the AI assistant or browse the catalog to place an order!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.slice(0, 4).map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{t.item_title}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{t.receipt_number}</span>
                        <span>•</span>
                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900 text-sm">₹{t.amount.toLocaleString()}</div>
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
