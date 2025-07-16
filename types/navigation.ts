import { Order } from "./Order";
import { Product } from "./Product";

export type RootStackParamList = {
    Main: { screen?: string };
    Home: undefined;
    Products: undefined;
    Sales: undefined;
    AddProduct: {product?: Product};
    ProductDetails: { product: Product };
    RecentOrders: undefined;
    Tables: undefined;
    Orders: { tableNumber: number, existingOrder?: Order };
    Todays: undefined;
    Month: undefined;
    Year: undefined;
    AllTime: undefined;
    Week: undefined;
    Admin: undefined;
    Profile: undefined;
    EditProfile: undefined;
    TrialExpiredScreen: undefined;
    Profits: undefined;
    TodayProfit: undefined;
    WeekProfit: undefined;
    MonthProfit: undefined;
    YearProfit: undefined;
    SendBill: {order: Order};
    Bill: {order: Order};

};
