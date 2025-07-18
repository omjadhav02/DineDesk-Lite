import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Product } from '../../types/Product';
import { getAllProducts } from '../../db/product';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Products'>;

function ProductScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<NavigationProp>();

  // Fetch product list from DB
  const fetchProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('❌ Error loading products:', error);
    }
  };

  // Load once on mount
  useEffect(() => {
    const init = async () => {
      await fetchProducts();
      setLoading(false);
    };
    init();
  }, []);

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  // Header right button setup
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AddProduct' as never)}
          style={{ marginRight: 30 }}
        >
          <Ionicons name="add-circle-outline" size={26} color="#007bff" />
        </TouchableOpacity>
      ),
      title: 'Products',
    });
  }, [navigation]);

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity onPress={() => navigation.navigate('ProductDetails', { product: item })}>
      <View style={styles.card}>
        <View style={styles.infoContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.itemName}</Text>
            <Text style={styles.price}>₹{item.price}</Text>
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
          </View>
          <Image
            source={
              item.imageUri && item.imageUri.trim() !== ''
                ? { uri: item.imageUri }
                : require('../../assets/no-image.png') // <- Add this line
            }
            style={styles.image}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No products yet.</Text>}
      />
    </View>
  );
}

export default ProductScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },

  card: {
    backgroundColor: '#fff',
    padding: 14,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  price: {
    fontSize: 16,
    color: '#007bff',
    marginTop: 4,
  },

  description: {
    marginTop: 4,
    color: '#555',
  },

  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: 'gray',
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  textContainer: {
    flex: 1,
    marginRight: 10,
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },

  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderText: {
    fontSize: 12,
    color: '#888',
  },

});
