""// screens/MonthlySalesScreen.tsx
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
import { Sale } from '../../types/Sale';
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

const MonthlySalesScreen = () => {
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [monthlySales, setMonthlySales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMonthlyRevenue, setTotalMonthlyRevenue] = useState(0);

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
        const allSales = await getAllSales();
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

            const dateKey = dateObj.toDateString();
            const dateLabel = `${dateObj.getDate()} ${dateObj.toLocaleString('default', {
              month: 'long',
            })} ${dateObj.getFullYear()}`;
            const dayLabel = dateObj.toLocaleString('default', { weekday: 'long' });

            if (!dayMap[dateKey]) {
              dayMap[dateKey] = {
                date: dateLabel,
                day: dayLabel,
                totalItems: 0,
                totalOrders: 0,
                totalRevenue: 0,
                sales: [],
              };
            }

            dayMap[dateKey].sales.push(sale);
            dayMap[dateKey].totalOrders += 1;
            dayMap[dateKey].totalItems += sale.totalItems;
            dayMap[dateKey].totalRevenue += sale.totalPrice;
            revenueSum += sale.totalPrice;
          }
        });

        const sortedSummaries = Object.values(dayMap).sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setMonthlySales(filteredSales);
        setDailySummaries(sortedSummaries);
        setTotalMonthlyRevenue(revenueSum);
      } catch (error) {
        console.error('Error fetching monthly sales:', error);
        Alert.alert('Error', 'Failed to load monthly sales.');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlySales();
  }, []);

  const renderItem = ({ item }: { item: DailySummary }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{`${item.date} | ${item.day}`}</Text>
        <TouchableOpacity onPress={() => handleDayExportPDF(item.sales, `${item.date} ${item.day}`)}>
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
        <Text style={{ marginTop: 10 }}>Loading monthly sales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔺 Month Heading */}
      <View style={styles.header}>
        <Ionicons name="calendar-outline" size={24} color="#007bff" style={{ marginRight: 8 }} />
        <Text style={styles.monthText}> {currentMonthLabel}</Text>
        <TouchableOpacity onPress={handleExportPDF} style={{ marginLeft: 'auto' }}>
          <Ionicons name="document-text" size={22} color="#007bff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={dailySummaries}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No sales found for this month.</Text>
        }
      />

      {/* 🔻 Bottom Tab */}
      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total Monthly Revenue</Text>
        <Text style={styles.totalValue}>₹{totalMonthlyRevenue.toFixed(2)}</Text>
      </View>
    </View>
  );
};

export default MonthlySalesScreen;

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
});
