import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import HomeScreen from "../screens/HomeScreen";
import ProductScreen from "../screens/ProductScreen";
import OrderScreen from "../screens/OrderScreen";
import SalesScreen from "../screens/SalesScreen";
import AddProductScreen from "../screens/AddProductScreen";
import ProductDetails from "../screens/ProductDetails";

import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { deleteAllProducts } from "../db/db";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home': iconName = 'home'; break;
            case 'Products': iconName = 'pricetags'; break;
            case 'Orders': iconName = 'restaurant'; break;
            case 'Sales': iconName = 'bar-chart'; break;
            default: iconName = 'alert'; break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Products"
        component={ProductScreen}
        options={({ navigation }) => ({
          headerRight: () => (
            <View style={styles.headerButtonContainer}>
              {/* Add Product Button */}
              <TouchableOpacity
                onPress={() => navigation.navigate("AddProduct")}
                style={styles.addButton}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>

              {/* Delete All Products Button */}
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Delete All Products",
                    "Are you sure you want to delete all products?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete All",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            await deleteAllProducts();
                          } catch (error) {
                            console.error("Failed to delete all products", error);
                          }
                        },
                      },
                    ]
                  );
                }}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-bin" size={24} color= '#e74c3c' />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Tab.Screen name="Orders" component={OrderScreen} />
      <Tab.Screen name="Sales" component={SalesScreen} />
    </Tab.Navigator>
  );
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="AddProduct" component={AddProductScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetails} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  addButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
