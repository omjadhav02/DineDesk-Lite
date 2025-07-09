import React, { createContext, useContext, useState } from 'react';

type OrderCountContextType = {
  orderCount: number;
  setOrderCount: React.Dispatch<React.SetStateAction<number>>;
};

const OrderCountContext = createContext<OrderCountContextType | undefined>(undefined);

export const OrderCountProvider = ({ children }: { children: React.ReactNode }) => {
  const [orderCount, setOrderCount] = useState(0);

  return (
    <OrderCountContext.Provider value={{ orderCount, setOrderCount }}>
      {children}
    </OrderCountContext.Provider>
  );
};

export const useOrderCount = () => {
  const context = useContext(OrderCountContext);
  if (!context) {
    throw new Error('useOrderCount must be used within an OrderCountProvider');
  }
  return context;
};
