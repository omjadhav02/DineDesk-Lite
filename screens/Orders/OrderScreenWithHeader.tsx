import React from 'react';
import OrderScreen from './OrderScreen';
import { useOrderCount } from '../../context/OrderCountContext';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { getAllOrders } from '../../db/order';

const OrderScreenWithHeader = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { orderCount, setOrderCount } = useOrderCount();

  useFocusEffect(
    React.useCallback(() => {
      const fetchCount = async () => {
        const orders = await getAllOrders();
        setOrderCount(orders.length);
      };
      fetchCount();
    }, [])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('RecentOrders')}
          style={styles.container}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="receipt-outline" size={26} color="#007bff" />
            {orderCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{orderCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ),
    });
  }, [navigation, orderCount]);

  return <OrderScreen />;
};

export default OrderScreenWithHeader;

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
    padding: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#e74c3c',
    height: 18,
    width: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
