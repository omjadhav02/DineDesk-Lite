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
import {
  generateSingleDaySalesPDF,
  generateWeeklySalesPDF,
} from '../../components/PDFGenerator';
import * as Sharing from 'expo-sharing';

type DailySummary = {
  date: string;
  day: string;
  totalItems: number;
  totalOrders: number;
  totalRevenue: number;
  sales: Sale[];
};

const WeekSalesScreen = () => {
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [weeklySales, setWeeklySales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWeeklyRevenue, setTotalWeeklyRevenue] = useState(0);
  const [topProducts, setTopProducts] = useState<
    { itemName: string; quantity: number; imageUri?: string }[]
  >([]);

  const now = new Date();
  const weekLabel = `Week of ${now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })}`;

  const handleExportPDF = async () => {
    try {
      const fileUri = await generateWeeklySalesPDF(weeklySales, weekLabel);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to export weekly sales.');
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
    const fetchWeeklySales = async () => {
      try {
        setLoading(true);

        const [allSales, allProducts] = await Promise.all([
          getAllSales(),
          getAllProducts(),
        ]);

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const dailyMap: { [key: string]: DailySummary } = {};
        const filteredSales: Sale[] = [];
        let revenueSum = 0;

        allSales.forEach((sale) => {
          const dateObj = new Date(sale.timestamp);
          if (dateObj >= startOfWeek && dateObj <= today) {
            filteredSales.push(sale);

            const dateKey = dateObj.toDateString();
            const dateLabel = `${dateObj.getDate()} ${dateObj.toLocaleString('default', {
              month: 'long',
            })} ${dateObj.getFullYear()}`;
            const dayLabel = dateObj.toLocaleString('default', { weekday: 'long' });

            if (!dailyMap[dateKey]) {
              dailyMap[dateKey] = {
                date: dateLabel,
                day: dayLabel,
                totalItems: 0,
                totalOrders: 0,
                totalRevenue: 0,
                sales: [],
              };
            }

            dailyMap[dateKey].sales.push(sale);
            dailyMap[dateKey].totalOrders += 1;
            dailyMap[dateKey].totalItems += sale.totalItems;
            dailyMap[dateKey].totalRevenue += sale.totalPrice;
            revenueSum += sale.totalPrice;
          }
        });

        const sortedSummaries = Object.values(dailyMap).sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setWeeklySales(filteredSales);
        setDailySummaries(sortedSummaries);
        setTotalWeeklyRevenue(revenueSum);

        // ✅ Calculate top 3 most sold products
        const productMap: Record<string, Product> = {};
        allProducts.forEach((p) => (productMap[p.itemName] = p));

        const countMap: { [key: string]: number } = {};
        filteredSales.forEach((sale) => {
          sale.items.forEach((item) => {
            countMap[item.itemName] =
              (countMap[item.itemName] ?? 0) + item.quantity;
          });
        });

        const sortedTop = Object.entries(countMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([itemName, quantity]) => ({
            itemName,
            quantity,
            imageUri: productMap[itemName]?.imageUri,
          }));

        setTopProducts(sortedTop);
      } catch (error) {
        console.error('Error fetching weekly sales:', error);
        Alert.alert('Error', 'Failed to load weekly sales.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklySales();
  }, []);

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
      <Text style={styles.detail}>Items Sold : {item.totalItems}</Text>
      <Text style={styles.detail}>Orders : {item.totalOrders}</Text>
      <Text style={styles.detail}>Revenue : ₹{item.totalRevenue.toFixed(2)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading weekly sales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar-outline" size={24} color="#007bff" style={{ marginRight: 8 }} />
        <Text style={styles.monthText}>{weekLabel}</Text>
        <TouchableOpacity onPress={handleExportPDF} style={{ marginLeft: 'auto' }}>
          <Ionicons name="document-text" size={22} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* ✅ Top 3 Products Card */}
      {topProducts.length > 0 && (
        <View style={{ marginHorizontal: 16, marginBottom: 10 }}>
          {topProducts.map((prod, index) => (
            <View key={index} style={styles.mostSoldCard}>
              {prod.imageUri ? (
                <Image source={{ uri: prod.imageUri }} style={styles.productImage} />
              ) : (
                <View style={[styles.productImage, { justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#aaa', fontSize: 12 }}>No Image</Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.mostSoldTitle}>
                  🔥 {index === 0 ? 'Most Sold' : index === 1 ? '2nd Most' : '3rd Most'} This Week
                </Text>
                <Text style={styles.mostSoldName}>{prod.itemName}</Text>
                <Text style={styles.mostSoldQty}>Sold: {prod.quantity} times</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={dailySummaries}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No sales found for this week.</Text>
        }
      />

      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total Weekly Revenue</Text>
        <Text style={styles.totalValue}>₹{totalWeeklyRevenue.toFixed(2)}</Text>
      </View>
    </View>
  );
};

export default WeekSalesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 10,
    elevation: 4,
    flexDirection: 'row',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  date: {
    fontWeight: '700',
    fontSize: 15,
    color: '#007bff',
  },
  detail: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
    marginBottom: 4,
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
  mostSoldCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  mostSoldTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  mostSoldName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  mostSoldQty: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
    marginTop: 4,
  },
});
