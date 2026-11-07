export interface Factory {
  id: number;
  name: string;
  city: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  fleetbase_place_id?: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  category: string;
  phone: string;
  email?: string;
  city: string;
  distance_km: number;
  rating: number;
  fleetbase_vendor_id?: string;
  payment_terms: string;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  factory_id: number;
  sku: string;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  reorder_quantity: number;
  unit: string;
  current_unit_cost: number;
  reorder_triggered: boolean;
  updated_at: string;
}

export interface Quote {
  id: number;
  supplier_id: number;
  item_name: string;
  sku_match?: string;
  raw_message?: string;
  extracted_price: number;
  quantity: number;
  unit: string;
  delivery_terms: string;
  freight_cost_est: number;
  landed_cost_unit: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  ai_confidence: number;
  lead_time_days: number;
  notes?: string;
  created_at: string;
  supplier?: Supplier;
}

export interface DashboardStats {
  total_inventory_items: number;
  low_stock_alerts_count: number;
  pending_quotes_count: number;
  active_suppliers_count: number;
  estimated_inventory_value_inr: number;
  projected_syndicate_savings_inr: number;
  fleetbase_connection_status: string;
}

export interface LandedCostEstimate {
  raw_material_total: number;
  distance_km: number;
  freight_rate_per_km: number;
  total_freight: number;
  landed_cost_total: number;
  landed_cost_per_unit: number;
  suggested_selling_price: number;
  net_margin_amount: number;
  margin_percentage: number;
  fleetbase_routing_source: string;
}

