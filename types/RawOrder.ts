export type RawOrder = {
  id: number;
  items: string; // stored as JSON string in DB
  totalItems: number;
  totalPrice: number;
  timestamp: string;
  orderNumber: number;
  tableNumber: number; // stored directly
};
