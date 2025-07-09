export type Sale = {
  id: number;
  saleNumber: number | null;
  orderNumber: number | null; // 👈 add this
  items: {
    itemName: string;
    price: number;
    quantity: number;
  }[];
  totalItems: number;
  totalPrice: number;
  timestamp: string;
  tableNumber?: number | null;
};

export type MonthlySummary = {
  month: string; // e.g., "January 2025"
  totalItems: number;
  totalOrders: number;
  totalRevenue: number;
};

export type YearlySummary = {
  year: number;
  totalItems: number;
  totalOrders: number;
  totalRevenue: number;
};

export type WeeklySummary = {
  week: number;
  totalItems: number;
  totalOrders: number;
  totalRevenue: number;
};

