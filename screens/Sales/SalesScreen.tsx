import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAllSales } from '../../db/sales';
import { Sale } from '../../types/Sale';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Graph from '../../components/Graph';

const SalesScreen = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenues, setRevenues] = useState({
    today: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const calculateRevenue = useCallback((salesData: Sale[]) => {
    const now = new Date();

    let todayTotal = 0;
    let weeklyTotal = 0;
    let monthlyTotal = 0;
    let yearlyTotal = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6); // Include today

    salesData.forEach(sale => {
      const saleDate = new Date(sale.timestamp);

      if (saleDate.toDateString() === now.toDateString()) {
        todayTotal += sale.totalPrice;
      }

      if (saleDate >= sevenDaysAgo && saleDate <= now) {
        weeklyTotal += sale.totalPrice;
      }

      if (
        saleDate.getFullYear() === now.getFullYear() &&
        saleDate.getMonth() === now.getMonth()
      ) {
        monthlyTotal += sale.totalPrice;
      }

      if (saleDate.getFullYear() === now.getFullYear()) {
        yearlyTotal += sale.totalPrice;
      }
    });

    setRevenues({
      today: todayTotal,
      weekly: weeklyTotal,
      monthly: monthlyTotal,
      yearly: yearlyTotal,
    });
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    const data = await getAllSales();
    setSales(data);
    calculateRevenue(data);
    setLoading(false);
  };

  const prepareLast7DaysData = (): { labels: string[]; data: number[] } => {
    const map = new Map<string, number>();
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      map.set(label, 0);
    }

    sales.forEach(sale => {
      const date = new Date(sale.timestamp);
      const key = `${date.getDate()}/${date.getMonth() + 1}`;
      if (map.has(key)) {
        map.set(key, map.get(key)! + sale.totalPrice);
      }
    });

    const labels = Array.from(map.keys());
    const data = Array.from(map.values());
    return { labels, data };
  };

  useEffect(() => {
    fetchSales();
  }, [calculateRevenue]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Loading sales data...</Text>
      </View>
    );
  }

  const graphData = prepareLast7DaysData();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Sales Summary</Text>

        <View style={styles.revenueRow}>
          <TouchableOpacity
            style={styles.revenueBox}
            onPress={() => navigation.navigate('Todays')}
          >
            <Text style={styles.revenueLabel}>Today</Text>
            <Text style={styles.revenueValue}>₹{revenues.today.toFixed(2)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.revenueBox}
            onPress={() => navigation.navigate('Week')}
          >
            <Text style={styles.revenueLabel}>This Week</Text>
            <Text style={styles.revenueValue}>₹{revenues.weekly.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.revenueRow}>
          <TouchableOpacity
            style={styles.revenueBox}
            onPress={() => navigation.navigate('Month')}
          >
            <Text style={styles.revenueLabel}>This Month</Text>
            <Text style={styles.revenueValue}>₹{revenues.monthly.toFixed(2)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.revenueBox}
            onPress={() => navigation.navigate('Year')}
          >
            <Text style={styles.revenueLabel}>This Year</Text>
            <Text style={styles.revenueValue}>₹{revenues.yearly.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Graph
        title="Last 7 Days Sales"
        labels={graphData.labels}
        data={graphData.data}
      />
    </ScrollView>
  );
};

export default SalesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#007bff',
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  revenueBox: {
    flex: 1,
    backgroundColor: '#e6f0ff',
    marginHorizontal: 6,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 14,
    color: '#0056b3',
    marginBottom: 4,
    fontWeight: '600',
  },
  revenueValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003366',
  },
});
