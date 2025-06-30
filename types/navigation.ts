import { Product } from "./Product";

export type RootStackParamList = {
  Main: undefined;
  Home: undefined;
  Products: undefined;
  Sales: undefined;
  AddProduct: {product?: Product};
  ProductDetails: { product: Product }
   
};
