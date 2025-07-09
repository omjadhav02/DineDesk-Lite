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
import { useFocusEffect } from '@react-navigation/native';

import { Order } from '../../types/Order';
import { getAllOrders, deleteSingleOrder, deleteAllOrders } from '../../db/order';
import { useOrderCount } from '../../context/OrderCountContext';
import { insertSale } from '../../db/sales';
import Toast from 'react-native-toast-message';

const RecentOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { setOrderCount } = useOrderCount();

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
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🧾 Order #{item.orderNumber}</Text>

        <TouchableOpacity onPress={() => handleDeleteOrder(item.id)}>
          <Ionicons name="trash-outline" size={22} color="#d11a2a" />
        </TouchableOpacity>
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

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={() => handleSaveOrder(item)}
      >
        <Text style={styles.saveBtnText}>Save</Text>
      </TouchableOpacity>
    </View>
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
  },
  list: {
    padding: 16,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 6,
    color: '#000',
  },
  tableBadgeContainer: {
    backgroundColor: '#007f5f',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  tableBadgeText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemLeft: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  itemRight: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLeft: {
    fontWeight: '600',
    color: '#333',
    fontSize: 16,
  },
  summaryRight: {
    fontWeight: '600',
    color: '#000',
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#007f5f',
    paddingVertical: 8,
    paddingHorizontal: 35,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
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
