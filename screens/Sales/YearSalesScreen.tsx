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
import { Sale, MonthlySummary } from '../../types/Sale';
import { Product } from '../../types/Product';
import { Ionicons } from '@expo/vector-icons';
import { generateYearlySalesPDF, generateMonthlySalesPDF } from '../../components/PDFGenerator';
import * as Sharing from 'expo-sharing';

type SoldProduct = {
  itemName: string;
  quantity: number;
  totalPrice: number;
  imageUri?: string;
};

const YearSalesScreen = () => {
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalYearlyRevenue, setTotalYearlyRevenue] = useState(0);
  const [soldProducts, setSoldProducts] = useState<SoldProduct[]>([]);
  const [showSoldProducts, setShowSoldProducts] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();

  const handleExportPDF = async () => {
    try {
      const fileUri = await generateYearlySalesPDF(monthlySummaries, currentYear);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to export yearly sales.');
    }
  };

  const handleMonthPDF = async (monthLabel: string) => {
    const salesOfMonth = allSales.filter((s) => {
      const saleDate = new Date(s.timestamp);
      const saleMonthYear = saleDate.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });
      return saleMonthYear === monthLabel;
    });

    try {
      const fileUri = await generateMonthlySalesPDF(salesOfMonth, monthLabel);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to export monthly sales.');
    }
  };

  useEffect(() => {
    const fetchYearlySales = async () => {
      try {
        setLoading(true);
        const [sales, products] = await Promise.all([getAllSales(), getAllProducts()]);
        setAllSales(sales);

        const monthMap: { [key: string]: MonthlySummary } = {};
        let revenueSum = 0;

        const productMap: Record<string, Product> = {};
        products.forEach(p => (productMap[p.itemName] = p));

        const countMap: Record<string, { quantity: number; totalPrice: number }> = {};

        sales.forEach((sale) => {
          const date = new Date(sale.timestamp);
          if (date.getFullYear() === currentYear) {
            const monthKey = date.toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            });

            if (!monthMap[monthKey]) {
              monthMap[monthKey] = {
                month: monthKey,
                totalItems: 0,
                totalOrders: 0,
                totalRevenue: 0,
              };
            }

            monthMap[monthKey].totalOrders += 1;
            monthMap[monthKey].totalItems += sale.totalItems;
            monthMap[monthKey].totalRevenue += sale.totalPrice;
            revenueSum += sale.totalPrice;

            sale.items.forEach(item => {
              if (!countMap[item.itemName]) {
                countMap[item.itemName] = { quantity: 0, totalPrice: 0 };
              }
              countMap[item.itemName].quantity += item.quantity;
              const pricePerItem = productMap[item.itemName]?.price ?? item.price ?? 0;
              countMap[item.itemName].totalPrice += item.quantity * pricePerItem;
            });
          }
        });

        const soldList: SoldProduct[] = Object.entries(countMap)
          .sort((a, b) => b[1].quantity - a[1].quantity)
          .map(([itemName, data]) => ({
            itemName,
            quantity: data.quantity,
            totalPrice: data.totalPrice,
            imageUri: productMap[itemName]?.imageUri,
          }));

        setMonthlySummaries(
          Object.values(monthMap).sort(
            (a, b) => new Date(a.month).getMonth() - new Date(b.month).getMonth()
          )
        );
        setTotalYearlyRevenue(revenueSum);
        setSoldProducts(soldList);
      } catch (error) {
        console.error('Error fetching yearly sales:', error);
        Alert.alert('Error', 'Failed to load yearly sales.');
      } finally {
        setLoading(false);
      }
    };

    fetchYearlySales();
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

  const renderItem = ({ item }: { item: MonthlySummary }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{item.month}</Text>
        <TouchableOpacity onPress={() => handleMonthPDF(item.month)}>
          <Ionicons name="document-text-outline" size={20} color="#007bff" />
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
        <Text style={{ marginTop: 10 }}>Loading yearly sales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calendar-outline" size={24} color="#007bff" style={{ marginRight: 8 }} />
        <Text style={styles.yearText}>{currentYear}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={handleExportPDF}>
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
        data={monthlySummaries}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No sales found for this year.</Text>
        }
      />

      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total Yearly Revenue</Text>
        <Text style={styles.totalValue}>₹{totalYearlyRevenue.toFixed(2)}</Text>
      </View>
    </View>
  );
};

export default YearSalesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
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
  yearText: {
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
