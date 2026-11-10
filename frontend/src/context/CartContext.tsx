import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface CartItem {
  item_id: string;
  product_id: string;
  product_name: string;
  image_url?: string;
  category: string;
  brand?: string;
  unit_price: number;
  quantity: number;
  currency: string;
  line_total: number;
}

export interface CartData {
  items: CartItem[];
  item_count: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
}

interface CartContextType {
  cart: CartData | null;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    try {
      const res = await api.get('/api/cart');
      setCart(res.data);
    } catch {
      setCart(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('paypilot_token');
    if (token) {
      refreshCart();
    }
  }, []);

  const addToCart = async (productId: string, quantity: number = 1) => {
    setLoading(true);
    try {
      const res = await api.post('/api/cart/items', {
        product_id: productId,
        quantity: quantity,
      });
      setCart(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    setLoading(true);
    try {
      const res = await api.put(`/api/cart/items/${itemId}`, { quantity });
      setCart(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      const res = await api.delete(`/api/cart/items/${itemId}`);
      setCart(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, refreshCart, addToCart, updateQuantity, removeItem }}>
      {children}
    </CartContext.Provider>
  );
};

export { useCart } from './useCart';


