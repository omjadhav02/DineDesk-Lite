// 📁 AdminScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getProfile } from '../../db/profile';
import { deleteAllProducts } from '../../db/product';
import { deleteAllOrders, resetOrderNumbers } from '../../db/order';
import { deleteAllSales } from '../../db/sales';

// Define profile type
type Profile = {
  adminName: string;
  restaurantName: string;
  pin: string;
};

type DeleteType = 'products' | 'orders' | 'sales' | 'edit' | null;

const AdminScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [deleteAction, setDeleteAction] = useState<DeleteType>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await getProfile();
        if (result) setProfile(result);
      } catch (error) {
        console.error('Failed to load profile', error);
      }
    };
    fetchProfile();
  }, []);

  const handleResetOrderNumbers = async () => {
    try {
      await resetOrderNumbers();
      Alert.alert('✅ Success', 'Orders deleted and order numbers reset.');
    } catch (error) {
      Alert.alert('❌ Failed', 'Could not reset order numbers');
    }
  };

  const handleRequestDelete = (type: DeleteType) => {
    setDeleteAction(type);
    setEnteredPin('');
    setPinModalVisible(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!profile) return;
    if (enteredPin !== profile.pin) {
      Alert.alert('Incorrect PIN', 'Please enter the correct 4-digit PIN');
      return;
    }

    try {
      switch (deleteAction) {
        case 'products':
          await deleteAllProducts();
          Alert.alert('✅ All products deleted');
          break;
        case 'orders':
          await deleteAllOrders();
          Alert.alert('✅ All orders deleted');
          break;
        case 'sales':
          await deleteAllSales();
          Alert.alert('✅ All sales deleted');
          break;
        case 'edit':
          setPinModalVisible(false);
          navigation.navigate('EditProfile' as never);
          return;
      }
    } catch (err) {
      Alert.alert('❌ Failed to perform action');
    } finally {
      if (deleteAction !== 'edit') {
        setPinModalVisible(false);
      }
      setDeleteAction(null);
      setEnteredPin('');
    }
  };

  const handleEditProfile = () => {
    handleRequestDelete('edit');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {profile && (
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.editIcon} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={20} color="#007bff" />
          </TouchableOpacity>
          <Text style={styles.profileLabel}>Admin Name</Text>
          <Text style={styles.profileValue}>{profile.adminName}</Text>
          <Text style={styles.profileLabel}>Restaurant Name</Text>
          <Text style={styles.profileValue}>{profile.restaurantName}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.actionButton} onPress={handleResetOrderNumbers}>
        <Ionicons name="refresh" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.buttonText}>Reset Order Numbers</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Danger Zone</Text>

      <TouchableOpacity
        style={[styles.actionButton, styles.deleteAction]}
        onPress={() => handleRequestDelete('products')}
      >
        <Ionicons name="trash" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.buttonText}>Delete All Products</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.deleteAction]}
        onPress={() => handleRequestDelete('orders')}
      >
        <Ionicons name="trash" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.buttonText}>Delete All Orders</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.deleteAction]}
        onPress={() => handleRequestDelete('sales')}
      >
        <Ionicons name="trash" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.buttonText}>Delete All Sales</Text>
      </TouchableOpacity>

      {/* PIN Modal */}
      <Modal visible={pinModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter 4-digit PIN</Text>
            <TextInput
              style={styles.pinInput}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={enteredPin}
              onChangeText={setEnteredPin}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDeleteConfirmed}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default AdminScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9fafd',
    flexGrow: 1,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    position: 'relative',
  },
  editIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#e6f0ff',
  },
  profileLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 12,
  },
  profileValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteAction: {
    backgroundColor: '#495057',
  },
  icon: {
    marginRight: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#ced4da',
    marginVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    width: '85%',
    padding: 24,
    borderRadius: 14,
    elevation: 8,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '80%',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    marginHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  confirmButton: {
    backgroundColor: '#007bff',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});