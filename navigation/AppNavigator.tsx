import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  NavigationContainer,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/Home/HomeScreen";
import ProductScreen from "../screens/Products/ProductScreen";
import OrderScreenWithHeader from "../screens/Orders/OrderScreenWithHeader";
import SalesScreen from "../screens/Sales/SalesScreen";
import AddProductScreen from "../screens/Products/AddProductScreen";
import ProductDetails from "../screens/Products/ProductDetails";
import RecentOrders from "../screens/Orders/RecentOrders";
import TableScreen from "../screens/Tables/TableScreen";
import WeekSalesScreen from "../screens/Sales/WeekSalesScreen";

import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../types/navigation";
import { getAllOrders } from "../db/order";
import { OrderCountProvider, useOrderCount } from "../context/OrderCountContext";
import { SelectedItemsProvider } from "../context/SelectedItemsContext";
import TodaySalesScreen from "../screens/Sales/TodaySalesScreen";
import MonthSalesScreen from "../screens/Sales/MonthSalesScreen";
import YearSalesScreen from "../screens/Sales/YearSalesScreen";
import AllTimesSalesScreen from "../screens/Sales/AllTimesSalesScreen";
import AdminScreen from "../screens/Home/AdminScreen";
import ProfileScreen from "../screens/Home/ProfileScreen";
import EditProfile from "../screens/Home/EditProfile";
import TrialExpiredScreen from "../screens/Trial/TrialExpiredScreen";
import TodayProfitScreen from "../screens/Profits/TodayProfitScreen";
import WeekProfitScreen from "../screens/Profits/WeekProfitScreen";
import MonthProfitScreen from "../screens/Profits/MonthProfitScreen";
import YearProfitScreen from "../screens/Profits/YearProfitScreen";
// import SendBill from "../screens/Orders/SendBill";
// import OrderBill from "../screens/Orders/Bill";
import Bill from "../screens/Orders/Bill";

type AppNavigatorProps = {
  isAllowed: boolean;
  onActivate: () => void;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const BottomTabNavigator = () => {
  const { orderCount } = useOrderCount();

  const getTabColor = (routeName: string) => {
    switch (routeName) {
      case 'Home': return '#007bff';
      case 'Products': return '#007bff';
      case 'Tables': return '#dc3545';
      case 'RecentOrders': return '#ffa500';
      case 'Sales': return '#28a745';
      default: return '#007bff';
    }
  };

  return (
    <Tab.Navigator
      key={orderCount}
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case 'Home': iconName = 'home'; break;
            case 'Products': iconName = 'pricetags'; break;
            case 'Tables': iconName = 'restaurant'; break;
            case 'RecentOrders': iconName = 'clipboard'; break;
            case 'Sales': iconName = 'bar-chart'; break;
            default: iconName = 'alert'; break;
          }
          return (
            <View style={{ width: 28, height: 28 }}>
              <Ionicons name={iconName} size={size} color={color} />
              {route.name === 'RecentOrders' && orderCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{orderCount}</Text>
                </View>
              )}
            </View>
          );
        },
        tabBarActiveTintColor: getTabColor(route.name),
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Products" component={ProductScreen} />
      <Tab.Screen name="Tables" component={TableScreen} />
      <Tab.Screen name="RecentOrders" component={RecentOrders} />
      <Tab.Screen name="Sales" component={SalesScreen} />
    </Tab.Navigator>
  );
};

function OrderInitializer() {
  const { setOrderCount } = useOrderCount();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const orders = await getAllOrders();
      setOrderCount(orders.length);
      setReady(true);
    };
    fetch();
  }, []);

  if (!ready) return null;

  return (
    <NavigationContainer key="ready">
      <SelectedItemsProvider>
        <Stack.Navigator>
          <Stack.Screen
            name="Main"
            component={BottomTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="AddProduct" component={AddProductScreen} />
          <Stack.Screen name="ProductDetails" component={ProductDetails} />
          <Stack.Screen name="Orders" component={OrderScreenWithHeader} />
          <Stack.Screen name="RecentOrders" component={RecentOrders} />
          <Stack.Screen name="Todays" component={TodaySalesScreen} />
          <Stack.Screen name="Month" component={MonthSalesScreen} />
          <Stack.Screen name="Year" component={YearSalesScreen} />
          <Stack.Screen name="AllTime" component={AllTimesSalesScreen} />
          <Stack.Screen name="Week" component={WeekSalesScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="Profits" component={ProfileScreen} />
          <Stack.Screen name="TodayProfit" component={TodayProfitScreen} />
          <Stack.Screen name="WeekProfit" component={WeekProfitScreen} />
          <Stack.Screen name="MonthProfit" component={MonthProfitScreen} />
          <Stack.Screen name="YearProfit" component={YearProfitScreen} />
          <Stack.Screen name="Bill" component={Bill} />
        </Stack.Navigator>
      </SelectedItemsProvider>
    </NavigationContainer>
  );
}

export default function AppNavigator({ isAllowed, onActivate }: AppNavigatorProps) {
  return (
    <OrderCountProvider>
      {!isAllowed ? (
        <NavigationContainer>
          <SelectedItemsProvider>
            <Stack.Navigator>
              <Stack.Screen name="TrialExpiredScreen" options={{ headerShown: false }}>
                {() => <TrialExpiredScreen onActivate={onActivate} />}
              </Stack.Screen>
            </Stack.Navigator>
          </SelectedItemsProvider>
        </NavigationContainer>
      ) : (
        <OrderInitializer />
      )}
    </OrderCountProvider>
  );
}

const styles = StyleSheet.create({
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#e74c3c',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 10,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
