import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { getProfile, updateProfile } from '../../db/profile';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const EditProfile = () => {
  const navigation = useNavigation();
  const [adminName, setAdminName] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const result = await getProfile();
      if (result) {
        setAdminName(result.adminName);
        setPin(result.pin);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    if (!adminName || !pin) {
      Alert.alert('All fields are required');
      return;
    }

    const pinRegex = /^\d{4}$/;

    if (!pinRegex.test(pin)) {
      Alert.alert('PIN must be a 4-digit number');
      return;
    }

    try {
      await updateProfile(adminName, pin);
      Toast.show({
        type: 'success',
        text1: 'Profile updated successfully!',
        position: 'top',
        visibilityTime: 2000,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Failed to update profile');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Edit Profile</Text>

        <TextInput
          style={styles.input}
          placeholder="Admin Name"
          value={adminName}
          onChangeText={setAdminName}
        />

        <TextInput
          style={styles.input}
          placeholder="4-digit PIN"
          keyboardType="number-pad"
          value={pin}
          onChangeText={setPin}
          maxLength={4}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#e6f0ff',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007bff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f4f8ff',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#c6d2f0',
    color: '#222',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
