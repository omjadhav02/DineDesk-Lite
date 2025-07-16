import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Order } from '../../types/Order';
import { insertSale } from '../../db/sales';
import { deleteSingleOrder } from '../../db/order';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { getProfile } from '../../db/profile';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Bill'>;


const Bill = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Bill'>>();
  const { order } = route.params;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [restaurantName, setRestaurantName] = useState('Your Restaurant Name');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profile = await getProfile();
        if (profile?.restaurantName) {
          setRestaurantName(profile.restaurantName);
        }
      } catch (error) {
        console.warn('Failed to load profile:', error);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      await insertSale(order);
      await deleteSingleOrder(order.id);
      Toast.show({
        type: 'success',
        text1: `Order #${order.orderNumber} saved to sales!`,
        position: 'top',
        visibilityTime: 2000,
      });
      navigation.goBack();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Order', 'Are you sure you want to delete this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSingleOrder(order.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const formatBillMessage = () => {
    const line = '------------------------------\n';
    const equalLine = '==============================\n';
    const simpleLine = '______________________________\n';
    const date = new Date();
    const dateStr = date.toLocaleDateString('en-GB'); // dd/mm/yyyy
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    let message = '```';
    message += equalLine;
    message += `${restaurantName}\n`;
    message += 'Order Receipt\n';
    message += equalLine + '\n';
    message += `Date : ${dateStr}   Time : ${timeStr}\n`;
    message += `Table: ${order.tableNumber ?? 'N/A'}           Order #: ${order.orderNumber}\n`;
    message += line;
    message += 'No  Item              Qty   Price\n';
    message += line;

    order.items.forEach((item, i) => {
      const name = item.itemName.length > 16 ? item.itemName.slice(0, 16) : item.itemName.padEnd(16, ' ');
      const qty = `${item.quantity}`.padEnd(5, ' ');
      const price = `₹${item.price * item.quantity}`;
      message += `${(i + 1).toString().padEnd(3, ' ')} ${name} ${qty} ${price}\n`;
    });

    message += line;
    message += `Total Items   : ${order.totalItems}\n`;
    message += `\n*TOTAL AMOUNT  : ₹${order.totalPrice}*\n`;
    message += equalLine;
    message += 'Thank you for choosing us!  \n';
    message += 'We hope to serve you again 🙏\n';
    message += equalLine;
    message += '```';

    return encodeURIComponent(message);
  };

  const sendWhatsApp = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit WhatsApp number.');
      return;
    }
    const formattedNumber = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
    const message = formatBillMessage();
    const url = `https://wa.me/${formattedNumber}?text=${message}`;
    return Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open WhatsApp.'));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>🧾 Order #{order.orderNumber}</Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Orders' ,
                      {
                        tableNumber: order.           
                        tableNumber ?? 0,
                        existingOrder: order,
                      }
                    )}
                  >
                    <Ionicons name="create-outline" size={20} color="#007bff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete}>
                    <Ionicons name="trash" size={20} color="#d11a2a" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.table}>🍽 Table #{order.tableNumber ?? 'N/A'}</Text>

              {order.items.map((item, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.itemLeft}>
                    {i + 1}. {item.itemName} × {item.quantity}
                  </Text>
                  <Text style={styles.itemRight}>₹{item.price * item.quantity}</Text>
                </View>
              ))}

              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLeft}>Total Items: {order.totalItems}</Text>
                <Text style={styles.summaryRight}>Total Price: ₹{order.totalPrice}</Text>
              </View>

              <TouchableOpacity style={styles.fullSaveBtn} onPress={handleSave}>
                <Text style={styles.sendText}>Save Order</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Customer WhatsApp Number:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543210"
              keyboardType="number-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
            />

            <TouchableOpacity style={styles.sendBtn} onPress={sendWhatsApp}>
              <Text style={styles.sendText}>Send Bill</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Bill;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
  },
  table: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007f5f',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemLeft: {
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
  itemRight: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLeft: {
    fontWeight: '600',
    color: '#333',
    fontSize: 15,
  },
  summaryRight: {
    fontWeight: '700',
    color: '#000',
    fontSize: 17,
  },
  fullSaveBtn: {
    backgroundColor: '#007f5f',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sendBtn: {
    backgroundColor: '#007f5f',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 14,
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
