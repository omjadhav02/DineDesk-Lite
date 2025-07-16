import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import {
  Text,
  View,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { RootStackParamList } from '../../types/navigation';
import { Feather } from '@expo/vector-icons';
import { deleteProduct, getProductById } from '../../db/product';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';

type ProductDetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetails'>;

const ProductDetails = () => {
  const route = useRoute<ProductDetailsRouteProp>();
  const { product: initialProduct } = route.params;
  const navigation = useNavigation<NavigationProp>();
  const [product, setProduct] = useState(initialProduct);

  useFocusEffect(
    useCallback(() => {
      const loadProduct = async () => {
        if(initialProduct.id != null){
          const updated = await getProductById(initialProduct.id);
          if (updated) {
            setProduct(updated);
          }
        }
        
      };
      loadProduct();
    }, [initialProduct.id])
  );

  const handleDelete = () => {
    Alert.alert('Delete', `Are you sure you want to delete "${product.itemName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(product);
            navigation.goBack();
          } catch (error) {
            console.error('Failed to delete: ', error);
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    navigation.navigate('AddProduct', { product });
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: product.imageUri }} style={styles.image} />
        <Text style={styles.title}>{product.itemName}</Text>
        <Text style={styles.price}>₹{product.price}</Text>
        {product.description ? (
          <Text style={styles.description}>{product.description}</Text>
        ) : (
          <Text style={styles.noDescription}>No description provided.</Text>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
          <Feather name="trash-2" size={20} color="#fff" />
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEdit}>
          <Feather name="edit-2" size={20} color="#fff" />
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProductDetails;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: '#008080',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    textAlign: 'center',
  },
  noDescription: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  button: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});