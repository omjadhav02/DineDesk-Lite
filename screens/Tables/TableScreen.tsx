import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import {
  createTableTable,
  insertTable,
  getAllTables,
  deleteSingleTable,
} from '../../db/table';
import { getAllOrders } from '../../db/order';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Order } from '../../types/Order';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Orders' | 'Bill'>;

const TableScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [tables, setTables] = useState<{ id: number; tableNumber: number }[]>([]);
  const [tableOrders, setTableOrders] = useState<Record<number, Order>>({});

  useEffect(() => {
    const init = async () => {
      await createTableTable();
      const data = await getAllTables();
      setTables(data);
      await updateOrderMap();
    };
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      updateOrderMap();
    }, [])
  );

  const updateOrderMap = async () => {
    const orders = await getAllOrders();
    const orderMap: Record<number, Order> = {};
    orders.forEach((order) => {
      if (order.tableNumber != null) {
        orderMap[order.tableNumber] = order;
      }
    });
    setTableOrders(orderMap);
  };

  const addTable = async () => {
    try {
      const existingTables = await getAllTables();
      const usedNumbers = existingTables.map(t => t.tableNumber).sort((a, b) => a - b);

      let newTableNumber = 1;
      for (let i = 1; i <= usedNumbers.length; i++) {
        if (!usedNumbers.includes(i)) {
          newTableNumber = i;
          break;
        }
        if (i === usedNumbers.length) {
          newTableNumber = usedNumbers.length + 1;
        }
      }

      await insertTable(newTableNumber);
      const updated = await getAllTables();
      setTables(updated);
    } catch (e) {
      Alert.alert('Failed', 'Table number already exists');
    }
  };

  const removeTable = useCallback((id: number) => {
    Alert.alert('Delete Table', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSingleTable(id);
          const updated = await getAllTables();
          setTables(updated);
        },
      },
    ]);
  }, []);

  const navigateToOrder = useCallback((tableNumber: number) => {
    const order = tableOrders[tableNumber];
    if (order) {
      navigation.navigate('Bill', { order });
    } else {
      navigation.navigate('Orders', { tableNumber });
    }
  }, [tableOrders]);

  const renderItem = useCallback(({ item }: { item: { id: number; tableNumber: number } }) => {
    const order = tableOrders[item.tableNumber];
    const isOccupied = order != null;
    const totalPrice = order?.totalPrice ?? 0;

    return (
      <TouchableOpacity
        style={[styles.card, isOccupied && styles.cardOccupied]}
        onPress={() => navigateToOrder(item.tableNumber)}
        onLongPress={() => removeTable(item.id)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.tableNumber}</Text>
        </View>
        <Text style={styles.cardLabel}>Table</Text>
        {isOccupied && (
          <Text style={styles.priceLabel}>₹{totalPrice}</Text>
        )}
      </TouchableOpacity>
    );
  }, [tableOrders]);

  return (
    <View style={styles.container}>
      <FlatList
        data={tables}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tables added yet.</Text>
        }
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={7}
      />

      <TouchableOpacity style={styles.fab} onPress={addTable}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default TableScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    margin: 8,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardOccupied: {
    backgroundColor: '#ffe5e5',
  },
  avatar: {
    width: 60,
    height: 60,
    backgroundColor: '#007bff',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 2,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceLabel: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#d11a2a',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: 'gray',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#28a745',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
