import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { getAllSales, deleteSingleSale } from '../../db/sales';
import { getAllProducts } from '../../db/product';
import { Sale } from '../../types/Sale';
import { Product } from '../../types/Product';
import { Ionicons } from '@expo/vector-icons';
import { generateSingleDaySalesPDF } from '../../components/PDFGenerator';
import * as Sharing from 'expo-sharing';
import { getProfile } from '../../db/profile';

type SoldProduct = {
  itemName: string;
  quantity: number;
  totalPrice: number;
  imageUri?: string;
};

const TodaySalesScreen = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTodayRevenue, setTotalTodayRevenue] = useState(0);
  const [soldProducts, setSoldProducts] = useState<SoldProduct[]>([]);
  const [showSoldProducts, setShowSoldProducts] = useState(false);
  const [restaurantName, setRestaurantName] = useState('')

    useEffect(() => {
    const fetchProfile = async () => {
      const profile = await getProfile();
      if (profile?.restaurantName) {
        setRestaurantName(profile.restaurantName);
      }
    };
    fetchProfile();
  }, []);

  const getStartOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  };

  const getEndOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  };

  useEffect(() => {
    const fetchTodaySales = async () => {
      try {
        setLoading(true);
        const [allSales, allProducts] = await Promise.all([getAllSales(), getAllProducts()]);

        const start = getStartOfToday().getTime();
        const end = getEndOfToday().getTime();

        const todaySales = allSales.filter(sale => {
          const ts = new Date(sale.timestamp).getTime();
          return ts >= start && ts <= end;
        });

        setSales(todaySales);

        const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.totalPrice, 0);
        setTotalTodayRevenue(totalRevenue);

        const productMap: Record<string, Product> = {};
        allProducts.forEach(p => {
          productMap[p.itemName] = p;
        });

        const countMap: Record<string, { quantity: number; totalPrice: number }> = {};

        todaySales.forEach(sale => {
          sale.items.forEach(item => {
            if (!countMap[item.itemName]) {
              countMap[item.itemName] = { quantity: 0, totalPrice: 0 };
            }
            countMap[item.itemName].quantity += item.quantity;
            const pricePerItem = productMap[item.itemName]?.price ?? item.price ?? 0;
            countMap[item.itemName].totalPrice += item.quantity * pricePerItem;
          });
        });

        const soldList: SoldProduct[] = Object.entries(countMap)
          .map(([itemName, data]) => ({
            itemName,
            quantity: data.quantity,
            totalPrice: data.totalPrice,
            imageUri: productMap[itemName]?.imageUri,
          }))
          .sort((a, b) => b.quantity - a.quantity); // 🔥 DESCENDING ORDER

        setSoldProducts(soldList);
      } catch (error) {
        console.error('Error loading today sales:', error);
        Alert.alert('Error', "Couldn't load today's sales");
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySales();
  }, []);

  const handleExportPDF = async () => {
    try {
      const fileUri = await generateSingleDaySalesPDF(sales, 'Today Sales',restaurantName);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to export sales PDF.');
    }
  };

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
              setTotalTodayRevenue(updated.reduce((sum, s) => sum + s.totalPrice, 0));
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

  const renderSoldProduct = ({ item }: { item: SoldProduct }) => (
    <View style={styles.soldProductCard}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#aaa', fontSize: 12 }}>No Image</Text>
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.mostSoldName}>{item.itemName}</Text>
        <Text style={styles.soldProductDetails}>
          Sold: {item.quantity} times | ₹{item.totalPrice.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <View style={styles.saleCard}>
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
          <Text style={styles.productPrice}>
            ₹{product.price * product.quantity}
          </Text>
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
        <Text style={{ marginTop: 10 }}>Loading today's sales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateTitle}>Today's Sales</Text>
        <TouchableOpacity onPress={handleExportPDF}>
          <Ionicons name="document-text" size={22} color="#007bff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => setShowSoldProducts(!showSoldProducts)}
        style={styles.toggleSoldBar}
      >
        <Text style={styles.toggleSoldText}>Sold Products</Text>
        <Ionicons
          name={showSoldProducts ? 'chevron-up' : 'chevron-down'}
          size={22}
          color="#007bff"
        />
      </TouchableOpacity>

      {showSoldProducts && (
        <FlatList
          data={soldProducts}
          keyExtractor={(item) => item.itemName}
          renderItem={renderSoldProduct}
          contentContainerStyle={styles.soldProductsList}
        />
      )}

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
        <Text style={styles.totalValue}>₹{totalTodayRevenue.toFixed(2)}</Text>
      </View>
    </View>
  );
};

export default TodaySalesScreen;


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 10,
    elevation: 4,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  toggleSoldBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 10,
  },
  toggleSoldText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007bff',
  },
  soldProductsList: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  soldProductCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  mostSoldName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  soldProductDetails: {
    color: '#007bff',
    fontWeight: '600',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  saleCard: {
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
    fontSize: 15,
    color: '#007bff',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '700',
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
});