// screens/AllTimeSalesScreen.tsx
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
import { Sale, YearlySummary } from '../../types/Sale';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { generateAllTimeSalesPDF, generateYearlySalesPDF } from '../../components/PDFGenerator';
import { getProfile } from '../../db/profile';

const AllTimeSalesScreen = () => {
  const [yearlySummaries, setYearlySummaries] = useState<YearlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [allSales, setAllSales] = useState<Sale[]>([]);

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
 

  const handleExportAllTimePDF = async () => {
    try {
      const fileUri = await generateAllTimeSalesPDF(yearlySummaries,restaurantName);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to export all-time sales.');
    }
  };

  const handleExportYearPDF = async (year: number) => {
    const salesOfYear = allSales.filter(sale => new Date(sale.timestamp).getFullYear() === year);

    const monthlySummaryMap: { [key: string]: { totalItems: number; totalOrders: number; totalRevenue: number } } = {};

    for (const sale of salesOfYear) {
      const monthKey = new Date(sale.timestamp).toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });

      if (!monthlySummaryMap[monthKey]) {
        monthlySummaryMap[monthKey] = { totalItems: 0, totalOrders: 0, totalRevenue: 0 };
      }

      monthlySummaryMap[monthKey].totalItems += sale.totalItems;
      monthlySummaryMap[monthKey].totalOrders += 1;
      monthlySummaryMap[monthKey].totalRevenue += sale.totalPrice;
    }

    const monthlySummaries = Object.entries(monthlySummaryMap).map(([month, data]) => ({
      month,
      ...data,
    }));

    try {
      const fileUri = await generateYearlySalesPDF(monthlySummaries, year.toString(), restaurantName);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to export yearly PDF.');
    }
  };

  useEffect(() => {
    const fetchAllSales = async () => {
      try {
        setLoading(true);
        const sales = await getAllSales();
        setAllSales(sales);

        const yearMap: { [key: number]: YearlySummary } = {};
        let total = 0;

        sales.forEach(sale => {
          const year = new Date(sale.timestamp).getFullYear();

          if (!yearMap[year]) {
            yearMap[year] = {
              year,
              totalItems: 0,
              totalOrders: 0,
              totalRevenue: 0,
            };
          }

          yearMap[year].totalItems += sale.totalItems;
          yearMap[year].totalOrders += 1;
          yearMap[year].totalRevenue += sale.totalPrice;
          total += sale.totalPrice;
        });

        const sorted = Object.values(yearMap).sort((a, b) => a.year - b.year);
        setYearlySummaries(sorted);
        setTotalRevenue(total);
      } catch (error) {
        Alert.alert('Error', 'Failed to load all-time sales.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllSales();
  }, []);

  const renderItem = ({ item }: { item: YearlySummary }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{item.year}</Text>
        <TouchableOpacity onPress={() => handleExportYearPDF(item.year)}>
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
        <Text style={{ marginTop: 10 }}>Loading all-time sales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="infinite-outline" size={24} color="#007bff" style={{ marginRight: 8 }} />
        <Text style={styles.yearText}>All-Time Sales</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={handleExportAllTimePDF}>
          <Ionicons name="document-text-outline" size={22} color="#007bff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={yearlySummaries}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No sales found.</Text>}
      />

      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total Revenue</Text>
        <Text style={styles.totalValue}>₹{totalRevenue.toFixed(2)}</Text>
      </View>
    </View>
  );
};

export default AllTimeSalesScreen;

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
