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
    Orders: { tableNumber: number };
    Todays: undefined;
    Month: undefined;
    Year: undefined;
    AllTime: undefined;
    Week: undefined;
    Admin: undefined;
    Profile: undefined;
    EditProfile: undefined;

};
