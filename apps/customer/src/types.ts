import { Address, Cart, Product, ShoppingOrder, Store } from '@delivery/shared';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Stores: undefined;
  StoreDetails: { slug: string };
  Products: { storeSlug?: string; storeId?: string; title: string };
  ProductDetails: { id: string };
  Cart: undefined;
  Addresses: undefined;
  Checkout: undefined;
  CourierRequest: undefined;
  Orders: undefined;
  OrderDetails: { type: 'SHOPPING' | 'COURIER'; id: string };
  Profile: undefined;
};
