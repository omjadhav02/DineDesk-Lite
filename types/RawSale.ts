export interface RawSale {
  id: number;
  saleNumber: number;
  items: string; // JSON string
  totalItems: number;
  totalPrice: number;
  timestamp: string;
  tableNumber: number | null;
}
