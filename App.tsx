import { StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { createOrderTable, getAllOrders } from './db/order';
import { createProductTable } from './db/product';
import { OrderCountProvider, useOrderCount } from './context/OrderCountContext';
import Toast, { BaseToast } from 'react-native-toast-message';
import { createSalesTable } from './db/sales';
import { createProfileTable } from './db/profile';
import { TrialManager } from './utils/TrailManager';
import AppNavigator from './navigation/AppNavigator'; // updated to take isAllowed and onActivate props

export default function App() {
  return <OrderCountProviderWrapper />;
}

type AppNavigatorProps = {
  isAllowed: boolean;
  onActivate: () => void;
};

function OrderCountProviderWrapper() {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  const toastConfig = {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: '#28a745',
          height: 80,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
        contentContainerStyle={{
          paddingHorizontal: 16,
        }}
        text1Style={{
          fontSize: 18,
          fontWeight: 'bold',
        }}
        text2Style={{
          fontSize: 16,
        }}
      />
    ),
  };

  return (
    <OrderCountProvider>
      <Initializer setIsAllowed={setIsAllowed} />
      {isAllowed !== null && (
        <AppNavigator
          isAllowed={isAllowed}
          onActivate={() => setIsAllowed(true)} // callback for activation from TrialExpiredScreen
        />
      )}
      <Toast config={toastConfig} />
    </OrderCountProvider>
  );
}

function Initializer({ setIsAllowed }: { setIsAllowed: (allowed: boolean) => void }) {
  const { setOrderCount } = useOrderCount();

  useEffect(() => {
    const setup = async () => {
      try {
        // await TrialManager.resetTrial() // Uncomment if you want to reset trial for testing
        await createProfileTable();
        await createProductTable();
        await createOrderTable();
        await createSalesTable();

        const orders = await getAllOrders();
        setOrderCount(orders.length);

        const allowed = await TrialManager.initAppCheck();
        console.log('Trial allowed?', allowed);
        setIsAllowed(allowed);
      } catch (error) {
        console.log('Error in Initializer:', error);
        setIsAllowed(false);
      }
    };

    setup();
  }, []);

  return null;
}

const styles = StyleSheet.create({
  // your styles here if needed
});
