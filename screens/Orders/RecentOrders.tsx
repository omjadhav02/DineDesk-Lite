import React, { useState, useCallback } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { Order } from '../../types/Order';
import { getAllOrders, deleteSingleOrder, deleteAllOrders } from '../../db/order';
import { useOrderCount } from '../../context/OrderCountContext';
import { insertSale } from '../../db/sales';
import Toast from 'react-native-toast-message';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';


type RecentOrdersNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RecentOrders'
>;


const RecentOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { setOrderCount } = useOrderCount();

  const navigation = useNavigation<RecentOrdersNavigationProp>();

  // Load orders only when screen is focused
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchOrders = async () => {
        const data = await getAllOrders();
        if (isActive) {
          setOrders(data);
          setOrderCount(data.length);
        }
      };

      fetchOrders();

      return () => {
        isActive = false; // cleanup flag
      };
    }, [setOrderCount])
  );

  const handleDeleteOrder = useCallback(
    (id: number) => {
      Alert.alert('Delete Order', 'Are you sure you want to delete this order?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSingleOrder(id);
            // Optimistically update UI without re-fetching
            setOrders((prev) => {
              const updated = prev.filter(order => order.id !== id);
              setOrderCount(updated.length);
              return updated;
            });
          },
        },
      ]);
    },
    [setOrderCount]
  );

  const handleSaveOrder = async (order: Order) => {
    try {
      await insertSale(order);
      await deleteSingleOrder(order.id);
      setOrders((prev) => {
        const updated = prev.filter(o => o.id !== order.id);
        setOrderCount(updated.length);
        return updated;
      });
      Toast.show({
        type: 'success',
        text1: `Order #${order.orderNumber} saved to sales!`,
        position: 'top',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity onPress={() => navigation.navigate('Bill' ,{order:item})}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>🧾 Order #{item.orderNumber}</Text>

          {/* <TouchableOpacity onPress={() => handleDeleteOrder(item.id)}>
            <Ionicons name="trash-outline" size={22} color="#d11a2a" />
          </TouchableOpacity> */}
        </View>

        <View style={styles.tableBadgeContainer}>
          <Text style={styles.tableBadgeText}>🍽 Table #{item.tableNumber ?? 'N/A'}</Text>
        </View>

        {item.items.map((product, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.itemLeft}>
              {index + 1}. {product.itemName} × {product.quantity}
            </Text>
            <Text style={styles.itemRight}>₹{product.price * product.quantity}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLeft}>Total Items: {item.totalItems}</Text>
          <Text style={styles.summaryRight}>Total Price: ₹{item.totalPrice}</Text>
        </View>

        {/* <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.saveBtn, { marginRight: 10 }]}
            onPress={() => handleSaveOrder(item)}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => navigation.navigate('SendBill' ,{order: item})}
          >
            <Text style={styles.saveBtnText}>Send Bill</Text>
          </TouchableOpacity>
        </View> */}

      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No recent orders yet.</Text>}
      />
    </View>
  );
};

export default RecentOrders;

// 🎨 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  tableBadgeContainer: {
    backgroundColor: '#007f5f',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 10,
  },
  tableBadgeText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  itemLeft: {
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
  itemRight: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLeft: {
    fontWeight: '500',
    color: '#333',
    fontSize: 14,
  },
  summaryRight: {
    fontWeight: '600',
    color: '#000',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: '#007f5f',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sendBillBtn: {
    alignSelf: 'flex-end',
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 6,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: 'gray',
    fontSize: 16,
  },
});

