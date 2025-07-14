import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getProfile } from '../../db/profile';
import { TrialManager } from '../../utils/TrailManager';

const HomeScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [hasProfile, setHasProfile] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);


  const fetchProfile = async () => {
  setLoading(true);

  const profile = await getProfile();
  if (profile) {
    setHasProfile(true);
    setAdminName(profile.adminName);
  } else {
    setHasProfile(false);
    setAdminName('');
  }

  const minutes = await TrialManager.getTrialDaysLeft();
  setTrialDaysLeft(minutes);


  setLoading(false);
};


  useEffect(() => {
    if (hasProfile) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={() => navigation.navigate('Admin' as never)}>
            <Ionicons
              name="person-circle-outline"
              size={30}
              color="#007bff"
              style={{ marginRight: 16 }}
            />
          </TouchableOpacity>
        ),
        title: 'Home',
      });
    } else {
      navigation.setOptions({
        headerRight: () => null,
        title: 'Home',
      });
    }
  }, [navigation, hasProfile]);

  useEffect(() => {
    if (isFocused) {
      fetchProfile();
    }
  }, [isFocused]);

  const goToProfile = () => {
    navigation.navigate('Profile' as never);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!hasProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.noProfileMessage}>
            You don't have a profile set up yet.
          </Text>
          <Text style={styles.subGreeting}>
            Create a profile to manage your restaurant.
          </Text>
          <TouchableOpacity style={styles.profileButton} onPress={goToProfile}>
            <Text style={styles.profileButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.greeting}>Welcome back, {adminName} 👋</Text>
        <Text style={styles.subGreeting}>Your restaurant is in your hands now</Text>

        <View style={styles.grid}>
          <TouchableOpacity
            style={[styles.manageButton, { backgroundColor: '#f5f7ff' }]}
            onPress={() => navigation.navigate('Products' as never)}
          >
            <Ionicons name="pricetags" size={40} color="#007bff" />
            <Text style={styles.buttonLabel}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.manageButton, { backgroundColor: '#e7f9f1' }]}
            onPress={() => navigation.navigate('Sales' as never)}
          >
            <Ionicons name="bar-chart" size={40} color="#28a745" />
            <Text style={styles.buttonLabel}>Sales</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.manageButton, { backgroundColor: '#fff7e6' }]}
            onPress={() => navigation.navigate('RecentOrders' as never)}
          >
            <Ionicons name="clipboard" size={40} color="#ffa500" />
            <Text style={styles.buttonLabel}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.manageButton, { backgroundColor: '#ffe6e9' }]}
            onPress={() => navigation.navigate('Tables' as never)}
          >
            <Ionicons name="restaurant" size={40} color="#dc3545" />
            <Text style={styles.buttonLabel}>Tables</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.tip}>
          Tap the profile icon above to access Admin Panel and Settings
        </Text>

        {trialDaysLeft !== null && trialDaysLeft <= 7 && (
          <Text style={styles.trialMessage}>
            ⏳ Trial ends in {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'}
          </Text>
        )}



      </View>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6fc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007bff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subGreeting: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  noProfileMessage: {
    fontSize: 20,
    marginBottom: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  profileButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: '#0056b3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  profileButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  tip: {
    marginTop: 24,
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  manageButton: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  trialMessage: {
    fontSize: 16,
    color: '#dc3545',
    marginTop: 8,
    fontWeight: 'bold',
  },

});
