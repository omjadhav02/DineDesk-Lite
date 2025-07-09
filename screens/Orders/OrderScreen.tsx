import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import {
  insertOrder,
  getAllOrders,
  updateOrderById,
} from '../../db/order';
import { getAllProducts } from '../../db/product';
import { useSelectedItems } from '../../context/SelectedItemsContext';
import { useOrderCount } from '../../context/OrderCountContext';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import ProductCard from '../../components/ProductCard';
import { Order } from '../../types/Order';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Orders'>;
type RouteProps = RouteProp<RootStackParamList, 'Orders'>;

const THROTTLE_DELAY = 100;

const OrderScreen = () => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);

  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const tableNumber = route.params?.tableNumber ?? null;

  const { selectedItems, setSelectedItems } = useSelectedItems();
  const { setOrderCount } = useOrderCount();
  const lastUpdateRef = useRef<number>(0);

  useFocusEffect(
    useCallback(() => {
      if (!tableNumber) {
        Alert.alert('Table Required', 'Please select a table before placing order', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Tables'),
          },
        ]);
        return;
      }

      const fetchData = async () => {
        const productsData = await getAllProducts();
        const allOrders = await getAllOrders();
        const order = allOrders.find(o => o.tableNumber === tableNumber);
        setExistingOrder(order ?? null);

        const withQuantity = productsData.map((p: any) => {
          const existing = order?.items.find(i => i.id === p.id);
          return { ...p, quantity: existing?.quantity || 0 };
        });

        setProducts(withQuantity);
        setSelectedItems(withQuantity);
      };

      fetchData();
    }, [tableNumber])
  );

  const handleQuantityChange = useCallback((id: number, delta: number) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_DELAY) return;
    lastUpdateRef.current = now;

    setProducts((prev) => {
      const updated = prev.map((product) =>
        product.id === id
          ? { ...product, quantity: Math.max(0, product.quantity + delta) }
          : product
      );
      setSelectedItems(updated);
      return updated;
    });
  }, [setSelectedItems]);

  const orderedItems = async () => {
    const ordered = products.filter((p) => p.quantity > 0);
    if (ordered.length === 0) return;

    const orderData = {
      items: ordered,
      totalItems: ordered.reduce((sum, p) => sum + p.quantity, 0),
      totalPrice: ordered.reduce((sum, p) => sum + p.price * p.quantity, 0),
      tableNumber,
    };

    try {
      if (existingOrder) {
        await updateOrderById({
          ...orderData,
          id: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          timestamp: new Date().toISOString(),
        });
      } else {
        await insertOrder(orderData);
      }

      const cleared = products.map((p) => ({ ...p, quantity: 0 }));
      setProducts(cleared);
      setSelectedItems(cleared);

      const updatedOrders = await getAllOrders();
      setOrderCount(updatedOrders.length);

      Toast.show({
        type: 'success',
        text1: 'Order updated!',
        position: 'top',
        visibilityTime: 2000,
      });

      navigation.navigate('Main', { screen: 'Tables' });
    } catch (error) {
      console.error('❌ Order error:', error);
    }
  };

  const filteredProducts = useMemo(
    () => products.filter((p) => p.itemName.toLowerCase().includes(search.toLowerCase())),
    [search, products]
  );

  const totalItems = useMemo(() => products.reduce((sum, p) => sum + p.quantity, 0), [products]);
  const totalPrice = useMemo(() => products.reduce((sum, p) => sum + p.quantity * p.price, 0), [products]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <ProductCard item={item} onChange={(delta) => handleQuantityChange(item.id, delta)} />
    ),
    [handleQuantityChange]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.tableText}>🪑 Table #{tableNumber}</Text>
      <TextInput
        placeholder="🔍 Search Products..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchBar}
      />
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
      {totalItems > 0 && (
        <View style={styles.bottomCard}>
          <Text style={styles.bottomText}>{totalItems} Items</Text>
          <Text style={styles.bottomText}>₹{totalPrice}</Text>
          <TouchableOpacity style={styles.placeOrderButton} onPress={orderedItems}>
            <Text style={styles.placeOrderText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default OrderScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, backgroundColor: '#f5f5f5' 
  },
  tableText: { 
    fontSize: 20, fontWeight: 'bold', color: 'black', paddingHorizontal: 16, paddingTop: 12 
  },
  searchBar: { 
    margin: 16, padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, backgroundColor: '#fff' 
  },
  list: { 
    paddingHorizontal: 12, paddingBottom: 100 
  },
  bottomCard: {
    position: 'absolute', 
    bottom: 16, 
    left: 12, 
    right: 12,
    backgroundColor: '#ffffff', 
    borderRadius: 20,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 6,
    elevation: 10, 
    borderWidth: 1, 
    borderColor: '#ddd',
  },
  bottomText: { 
    fontSize: 16, fontWeight: '600', color: '#333' 
  },
  placeOrderButton: { 
    backgroundColor: '#28a745', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 
  },
  placeOrderText: { 
    color: '#fff', fontWeight: '700', fontSize: 15 
  },
});