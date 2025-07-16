import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { insertProfile, getProfile } from '../../db/profile';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const ProfileScreen = () => {
  const navigation = useNavigation();

  const [adminName, setAdminName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [pin, setPin] = useState('');
  const [profileExists, setProfileExists] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      const result = await getProfile();
      if (result) {
        setProfileExists(true);
      }
    };
    checkProfile();
  }, []);

  const handleCreateProfile = async () => {
    if (!adminName || !pin || !restaurantName) {
      Alert.alert('All fields are required');
      return;
    }

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      Alert.alert('PIN must be a 4-digit number');
      return;
    }

    try {
      await insertProfile(adminName, restaurantName, pin);
      Toast.show({
        type: 'success',
        text1: 'Profile created!',
        position: 'top',
        visibilityTime: 2000,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('❌ Failed to create profile');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#e6f0ff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create Your Profile</Text>

          {profileExists ? (
            <Text style={styles.errorText}>
              A profile already exists. You must delete it before creating a new one.
            </Text>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Admin Name"
                placeholderTextColor="#999"
                value={adminName}
                onChangeText={setAdminName}
              />

              <TextInput
                style={styles.input}
                placeholder="Restaurant Name"
                placeholderTextColor="#999"
                value={restaurantName}
                onChangeText={setRestaurantName}
              />

              <TextInput
                style={styles.input}
                placeholder="4-digit PIN"
                keyboardType="number-pad"
                secureTextEntry
                placeholderTextColor="#999"
                value={pin}
                onChangeText={setPin}
                maxLength={4}
              />

              <TouchableOpacity style={styles.button} onPress={handleCreateProfile}>
                <Text style={styles.buttonText}>Create Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#007bff',
    marginBottom: 30,
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0056b3',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
});
