import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Product } from '../types';
import { useCart } from '../context/useCart';
import { 
  Star, Search, ArrowRight, Filter, 
  ShoppingCart, CheckCircle2, ChevronRight, Layers,
  SlidersHorizontal, Sparkles, Tag, ShieldCheck, Zap
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [search, setSearch] = useState('');
  const [priceMax, setPriceMax] = useState<number>(200000);
  const [loading, setLoading] = useState(true);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/api/products/categories');
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = { sort_by: sortBy };
      if (search) params.q = search;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedBrand) params.brand = selectedBrand;
      if (priceMax < 200000) params.max_price = priceMax;
      
      const res = await api.get('/api/products/search', { params });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Error fetching products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedBrand, sortBy, priceMax]);

  const handleAddToCart = async (prod: Product) => {
    await addToCart(prod.id);
    setAddedItem(prod.id);
    setTimeout(() => setAddedItem(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. TOP HEADER & SEARCH HERO */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 relative">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium">
            <span>28 Retail Categories</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Explore Verified Products
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Discover {products.length}+ synchronized items across Amazon and Flipkart catalogs with instant PayPal Sandbox checkout.
          </p>

          {/* Search bar inside hero */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchProducts();
            }}
            className="pt-2 flex items-center gap-2 max-w-lg"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search iPhone, MacBook, Sony ANC, Vacuum, Shoes..."
                className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl text-sm transition shadow-md cursor-pointer shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. MAIN LAYOUT: FILTERS & PRODUCT RESULTS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6 h-fit sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Catalog Filters</span>
            </span>
            {(selectedCategory || selectedBrand || search || priceMax < 200000) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedBrand('');
                  setSearch('');
                  setPriceMax(200000);
                }}
                className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Department Categories List */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Departments ({categories.length})
            </label>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === '' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Departments
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition truncate cursor-pointer ${
                    selectedCategory === cat ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title={cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Featured Brands
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['Apple', 'Samsung', 'Sony', 'OnePlus', 'LG', 'Lenovo', 'Philips', 'Nike', 'boAt', 'Dyson'].map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(selectedBrand === b ? '' : b)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
                    selectedBrand === b
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <span>Max Budget</span>
              <span className="text-blue-600 font-extrabold">₹{priceMax.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="200000"
              step="5000"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>₹1,000</span>
              <span>₹2,00,000+</span>
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Sort Sequence
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="rating">Top Customer Ratings (Highest first)</option>
              <option value="popularity">Popularity (Most Reviewed)</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Right Products Feed Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
            <div>
              Showing <span className="font-bold text-slate-900">{products.length}</span> verified results
              {selectedCategory && <span> in <span className="text-blue-600 font-semibold">{selectedCategory}</span></span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live MongoDB Catalog</span>
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs text-slate-400 font-medium">Fetching real-time inventory from MongoDB...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-900 text-base">No Products Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No items match your active filters. Try broadening your budget or clearing the category filter.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedBrand('');
                  setSearch('');
                  setPriceMax(200000);
                }}
                className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="group bg-white rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  {/* Product Image Box */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500';
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {prod.category.split(' ')[0]}
                    </div>
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{prod.rating}</span>
                      <span className="text-slate-400 text-[10px]">({prod.review_count})</span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                        <span>{prod.brand || 'Verified Retail'}</span>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">In Stock</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1 group-hover:text-blue-600 transition" title={prod.name}>
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {prod.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">PayPilot Price</span>
                        <div className="text-lg font-black text-slate-900">
                          ₹{prod.price.toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart(prod)}
                        className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                          addedItem === prod.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {addedItem === prod.id ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
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
      </div>
    </div>
  );
};
