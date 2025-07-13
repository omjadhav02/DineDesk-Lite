import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { getAllSales } from '../../db/sales';
import { getAllProducts } from '../../db/product';
import { Sale } from '../../types/Sale';
import { Product } from '../../types/Product';
import { Ionicons } from '@expo/vector-icons';
import { generateMonthlySalesPDF, generateSingleDaySalesPDF } from '../../components/PDFGenerator';
import * as Sharing from 'expo-sharing';

type DailySummary = {
  date: string;
  day: string;
  totalItems: number;
  totalOrders: number;
  totalRevenue: number;
  sales: Sale[];
};

type SoldProduct = {
  itemName: string;
  quantity: number;
  totalPrice: number;
  imageUri?: string;
};

const MonthlySalesScreen = () => {
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [monthlySales, setMonthlySales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMonthlyRevenue, setTotalMonthlyRevenue] = useState(0);
  const [soldProducts, setSoldProducts] = useState<SoldProduct[]>([]);
  const [showSoldProducts, setShowSoldProducts] = useState(false);

  const now = new Date();
  const currentMonthLabel = now.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const handleExportPDF = async () => {
    try {
      const fileUri = await generateMonthlySalesPDF(monthlySales, currentMonthLabel);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to export monthly sales.');
    }
  };

  const handleDayExportPDF = async (sales: Sale[], label: string) => {
    try {
      const fileUri = await generateSingleDaySalesPDF(sales, label);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to export daily sales.');
    }
  };

  useEffect(() => {
    const fetchMonthlySales = async () => {
      try {
        setLoading(true);
        const [allSales, allProducts] = await Promise.all([
          getAllSales(),
          getAllProducts(),
        ]);

        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const dayMap: { [key: string]: DailySummary } = {};
        const filteredSales: Sale[] = [];
        let revenueSum = 0;

        allSales.forEach((sale) => {
          const dateObj = new Date(sale.timestamp);
          if (
            dateObj.getMonth() === currentMonth &&
            dateObj.getFullYear() === currentYear
          ) {
            filteredSales.push(sale);
            const key = dateObj.toDateString();
            const label_date = `${dateObj.getDate()} ${dateObj.toLocaleString('default', {
              month: 'long',
            })} ${dateObj.getFullYear()}`;
            const label_day = dateObj.toLocaleString('default', { weekday: 'long' });

            if (!dayMap[key]) {
              dayMap[key] = {
                date: label_date,
                day: label_day,
                totalItems: 0,
                totalOrders: 0,
                totalRevenue: 0,
                sales: [],
              };
            }

            dayMap[key].sales.push(sale);
            dayMap[key].totalOrders += 1;
            dayMap[key].totalItems += sale.totalItems;
            dayMap[key].totalRevenue += sale.totalPrice;
            revenueSum += sale.totalPrice;
          }
        });

        setMonthlySales(filteredSales);
        setDailySummaries(
          Object.values(dayMap).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        );
        setTotalMonthlyRevenue(revenueSum);

        // Calculate sold products data (quantity + total revenue) for ALL sold products
        const productMap: Record<string, Product> = {};
        allProducts.forEach((p) => (productMap[p.itemName] = p));

        const countMap: Record<string, { quantity: number; totalPrice: number }> = {};
        filteredSales.forEach((sale) => {
          sale.items.forEach((item) => {
            if (!countMap[item.itemName]) {
              countMap[item.itemName] = { quantity: 0, totalPrice: 0 };
            }
            countMap[item.itemName].quantity += item.quantity;
            const pricePerItem = productMap[item.itemName]?.price ?? item.price ?? 0;
            countMap[item.itemName].totalPrice += item.quantity * pricePerItem;
          });
        });

        const soldList: SoldProduct[] = Object.entries(countMap)
          .sort((a, b) => b[1].quantity - a[1].quantity)
          .map(([itemName, data]) => ({
            itemName,
            quantity: data.quantity,
            totalPrice: data.totalPrice,
            imageUri: productMap[itemName]?.imageUri,
          }));

        setSoldProducts(soldList);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load monthly sales.');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlySales();
  }, []);

  const renderSoldProduct = ({ item }: { item: SoldProduct }) => (
    <View style={styles.soldProductCard}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.noImage]}>
          <Text style={styles.noImageText}>No Image</Text>
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

  const renderItem = ({ item }: { item: DailySummary }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{`${item.date} | ${item.day}`}</Text>
        <TouchableOpacity
          onPress={() =>
            handleDayExportPDF(item.sales, `${item.date} ${item.day}`)
          }
        >
          <Ionicons name="document-text-outline" size={18} color="#007bff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.detail}>Items Sold: {item.totalItems}</Text>
      <Text style={styles.detail}>Orders: {item.totalOrders}</Text>
      <Text style={styles.detail}>Revenue: ₹{item.totalRevenue.toFixed(2)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading monthly sales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name="calendar-outline"
          size={24}
          color="#007bff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.monthText}>{currentMonthLabel}</Text>
        <TouchableOpacity onPress={handleExportPDF} style={{ marginLeft: 'auto' }}>
          <Ionicons name="document-text" size={22} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Sold Products Toggle */}
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

      {/* Sold Products List */}
      {showSoldProducts && (
        <FlatList
          data={soldProducts}
          keyExtractor={(item) => item.itemName}
          renderItem={renderSoldProduct}
          contentContainerStyle={styles.soldProductsList}
        />
      )}

      <FlatList
        data={dailySummaries}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No sales found for this month.</Text>
        }
      />

      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total Monthly Revenue</Text>
        <Text style={styles.totalValue}>₹{totalMonthlyRevenue.toFixed(2)}</Text>
      </View>
    </View>
  );
};

export default MonthlySalesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    backgroundColor: '#fff',
    padding: 14,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  monthText: { fontSize: 18, fontWeight: '700', color: '#333' },
  listContent: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  date: { fontWeight: '700', fontSize: 15, color: '#007bff' },
  detail: { fontSize: 15, fontWeight: '500', color: '#222', marginBottom: 4 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  totalBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#007bff',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 10,
    alignItems: 'center',
  },
  totalLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  totalValue: { color: '#fff', fontSize: 18, fontWeight: '700' },

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
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#aaa',
    fontSize: 12,
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
});
