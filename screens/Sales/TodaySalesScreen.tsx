// TodaySalesScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllSales, deleteSingleSale } from '../../db/sales';
import { Sale } from '../../types/Sale';
import { generateTodaySalesPDF } from '../../components/PDFGenerator';
import * as Sharing from 'expo-sharing';

const TodaySalesScreen = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalToday, setTotalToday] = useState(0);

  useEffect(() => {
    const fetchTodaySales = async () => {
      try {
        setLoading(true);
        const allSales = await getAllSales();

        const today = new Date();
        const filtered = allSales.filter((sale) => {
          const saleDate = new Date(sale.timestamp);
          // console.log('Sale Timestamp:', sale.timestamp, '| Parsed:', saleDate);
          return (
            saleDate.getDate() === today.getDate() &&
            saleDate.getMonth() === today.getMonth() &&
            saleDate.getFullYear() === today.getFullYear()
          );
        });

        const total = filtered.reduce((sum, sale) => sum + sale.totalPrice, 0);

        setSales(filtered);
        setTotalToday(total);
      } catch (error) {
        console.error('Error fetching today sales:', error);
        Alert.alert('Error', 'Failed to load today\'s sales.');
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySales();
  }, []);

  const handleExportPDF = async () =>{
    try {
      const uri = await generateTodaySalesPDF(sales,totalToday);
      if(await Sharing.isAvailableAsync()){
        await Sharing.shareAsync(uri);
      }else{
        Alert.alert('PDF Saved','PDF saved at:\n'+uri)
      }
    } catch (error) {
      console.error('PDF Error:', error);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  }

  const handleDeleteSale = async (id: number) => {
    Alert.alert('Delete Sale', 'Are you sure you want to delete this sale?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSingleSale(id);
            setSales((prev) => {
              const updated = prev.filter((s) => s.id !== id);
              setTotalToday(updated.reduce((sum, s) => sum + s.totalPrice, 0));
              return updated;
            });
          } catch (error) {
            console.error('Error deleting sale:', error);
            Alert.alert('Error', 'Failed to delete the sale.');
          }
        },
      },
    ]);
  };

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.saleNumber}>🧾 Sale #{item.saleNumber ?? item.id}</Text>
      </View>

      {item.tableNumber != null && (
        <Text style={styles.tableNumber}>🍽️ Table #{item.tableNumber}</Text>
      )}

      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>

      {item.items.map((product, idx) => (
        <View key={idx} style={styles.row}>
          <Text style={styles.productName}>
            {idx + 1}. {product.itemName} × {product.quantity}
          </Text>
          <Text style={styles.productPrice}>₹{product.price * product.quantity}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Total Items: {item.totalItems}</Text>
        <Text style={styles.summaryText}>Total Price: ₹{item.totalPrice}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading today’s sales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRowWrap}>
        <Text style={styles.orderCount}>Total Orders: {sales.length}</Text>

        <TouchableOpacity onPress={handleExportPDF} style={styles.exportBtn}>
          <Text style={styles.exportBtnText}>Export PDF</Text>
        </TouchableOpacity>
      </View>



      <FlatList
        data={sales}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSaleItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No sales for today.</Text>
        }
      />

      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total Revenue</Text>
        <Text style={styles.totalValue}>₹{totalToday.toFixed(2)}</Text>
      </View>
    </View>
  );
};

export default TodaySalesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 10,
    elevation: 4,
  },
  orderCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  saleNumber: {
    fontWeight: '700',
    fontSize: 15,
    color: '#007bff',
  },
  tableNumber: {
    fontWeight: '600',
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  productName: {
    fontSize: 15,
    color: '#333',
    flexShrink: 1,
  },
  productPrice: {
    fontWeight: '600',
    fontSize: 15,
    color: '#111',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryText: {
    fontWeight: '600',
    fontSize: 15,
    color: '#222',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 10,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRowWrap: {
  backgroundColor: '#fff',
  paddingVertical: 14,
  paddingHorizontal: 20,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottomLeftRadius: 12,
  borderBottomRightRadius: 12,
  marginBottom: 10,
  elevation: 4,
},

exportBtn: {
  backgroundColor: '#007bff',
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 8,
},

exportBtnText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '600',
},

});