export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  avatar_url?: string;
  preferred_currency?: string;
  preferred_payment_method?: string;
  auth_provider?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  brand?: string;
  price: number;
  currency: string;
  specs: Record<string, string>;
  rating: number;
  review_count: number;
  source: string;
  in_stock: boolean;
  image_url: string;
}

export interface AgentStep {
  agent: string;
  action: string;
  status: string;
  details?: Record<string, any>;
}

export interface PurchaseCard {
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  requires_approval: boolean;
  status: string;
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  execution_timeline: AgentStep[];
  products: Product[];
  comparison?: {
    comparison_items: Array<{
      product_id: string;
      name: string;
      price: number;
      rating: number;
      ram: string;
      cpu: string;
      storage: string;
      value_score: number;
      summary: string;
    }>;
    recommended_product_id: string;
    recommendation_reason: string;
  };
  purchase_confirmation?: PurchaseCard;
}

export interface Transaction {
  id: string;
  user_id: string;
  purchase_order_id?: string;
  paypal_capture_id: string;
  paypal_order_id?: string;
  amount: number;
  currency: string;
  status: string;
  category: string;
  item_title: string;
  receipt_number: string;
  created_at: string;
}

export interface ExpenseAnalytics {
  total_spending: number;
  total_transactions: number;
  category_breakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthly_trend: Array<{
    month: string;
    spending: number;
  }>;
  ai_insights: string[];
}

export interface FraudAlert {
  id: string;
  risk_score: number;
  risk_level: string;
  trigger_reason: string;
  explanation: string;
  suggested_action: string;
  status: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string;
  notes?: string;
  created_at: string;
}

export interface UserAddress {
  id: string;
  full_name: string;
  phone_number: string;
  street: string;
  city: string;
  state: string;
  pin_code: string;
  country: string;
  is_default: boolean;
  delivery_instructions?: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_url?: string;
}

export interface PurchaseOrder {
  id: string;
  product_name: string;
  quantity: number;
  subtotal: number;
  discount_amount?: number;
  coupon_code?: string;
  tax_amount: number;
  shipping_fee: number;
  total_amount: number;
  currency: string;
  items?: OrderItem[];
  delivery_address?: UserAddress;
  order_status: string;
  payment_status: string;
  gateway_payment_id?: string;
  created_at: string;
  completed_at?: string;
}


