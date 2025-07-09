import { StyleSheet } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { useEffect, useState } from 'react';
import { createOrderTable, getAllOrders } from './db/order';
import { createProductTable } from './db/product';
import { OrderCountProvider, useOrderCount } from './context/OrderCountContext';
import Toast, { BaseToast } from 'react-native-toast-message';
import { createSalesTable } from './db/sales';
import { createProfileTable, deleteProfile } from './db/profile';

export default function App() {
  return (
    <OrderCountProviderWrapper />
  );
}

function OrderCountProviderWrapper() {
  const [isReady, setIsReady] = useState(false);

  const toastConfig ={
      success: (props: any) => (
        <BaseToast
          {...props}
          style={{
            borderLeftColor: '#28a745',
            height: 80, // ⬅️ taller
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}
          contentContainerStyle={{ 
            paddingHorizontal: 16 
          }}
          text1Style={{
            fontSize: 18, // ⬅️ bigger title
            fontWeight: 'bold',
          }}
          text2Style={{
            fontSize: 16, // ⬅️ bigger subtitle
          }}
        />
      )
    }

  return (

    <OrderCountProvider>
      <Initializer setIsReady={setIsReady} />
      {isReady && <AppNavigator />}
      <Toast config={toastConfig}/>
    </OrderCountProvider>
  );
}

function Initializer({ setIsReady }: { setIsReady: (ready: boolean) => void }) {
  const { setOrderCount } = useOrderCount();

  useEffect(() => {
    const setup = async () => {
      await createProfileTable();
      await createProductTable();
      await createOrderTable();
      await createSalesTable();

      const orders = await getAllOrders();
      setOrderCount(orders.length);

      setIsReady(true); // Only show app when initialized
    };
    setup();
  }, []);

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
