// screens/YearSalesScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { getAllSales } from '../../db/sales';
import { Sale, MonthlySummary } from '../../types/Sale';
import { Ionicons } from '@expo/vector-icons';
import { generateYearlySalesPDF, generateMonthlySalesPDF } from '../../components/PDFGenerator';
import * as Sharing from 'expo-sharing';

const YearSalesScreen = () => {
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalYearlyRevenue, setTotalYearlyRevenue] = useState(0);

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
        const sales: Sale[] = await getAllSales();
        setAllSales(sales);

        const monthMap: { [key: string]: MonthlySummary } = {};
        let revenueSum = 0;

        sales.forEach((sale) => {
          const date = new Date(sale.timestamp);
          const year = date.getFullYear();

          if (year === currentYear) {
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
          }
        });

        const sortedSummaries = Object.values(monthMap).sort(
          (a, b) => new Date(a.month).getMonth() - new Date(b.month).getMonth()
        );

        setMonthlySummaries(sortedSummaries);
        setTotalYearlyRevenue(revenueSum);
      } catch (error) {
        console.error('Error fetching yearly sales:', error);
        Alert.alert('Error', 'Failed to load yearly sales.');
      } finally {
        setLoading(false);
      }
    };

    fetchYearlySales();
  }, []);

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
  yearText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
});
