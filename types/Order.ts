export type Order = {
  id: number;
  items: any[]; // parsed JSON array
  totalItems: number;
  totalPrice: number;
  timestamp: string;
  orderNumber: number;
  tableNumber: number; // assigned table
};
