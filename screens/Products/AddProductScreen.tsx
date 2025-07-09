import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { insertProduct, updateProduct } from '../../db/product';
import { RootStackParamList } from '../../types/navigation';
import { Product } from '../../types/Product';

type AddProductRouteProp = RouteProp<RootStackParamList, 'AddProduct'>


const AddProductScreen = () => {
  const route = useRoute<AddProductRouteProp>();
  const editingProduct = route.params?.product;
  const navigation = useNavigation();

  const [itemName, setItemName] = useState(editingProduct?.itemName ||'');
  const [price, setPrice] = useState(editingProduct?.price?.toString() ||'');
  const [description, setDescription] = useState(editingProduct?.description ||'');
  const [imageUri, setImageUri] = useState<string | null>(editingProduct?.imageUri || null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const saveProduct = async () => {
    if (!itemName || !price) {
      Alert.alert('Error', 'Product name and price are required!');
      return;
    }
    const parsedPrice = parseFloat(price);

    const productData: Product = {
      itemName,
      price: parsedPrice,
      description,
      imageUri: imageUri ?? ''
    }
    try {
      if(editingProduct?.id){
        await updateProduct({...productData, id:editingProduct.id})
        // Alert.alert('Updated','Product updated succesfully!')
        
      }else{
        await insertProduct(productData);
        // Alert.alert('Success','Product added successfully!')
        
      }
      navigation.goBack();
    } catch (error) {
      console.error('Insert Error:', error);
      Alert.alert('Error', 'Something went wrong!');
    }
  };

  return (
    <KeyboardAvoidingView 
        behavior={Platform.OS === 'android'? 'padding': 'height'}
        style={{flex:1}}
    >
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Image</Text>
      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={styles.imagePlaceholder}>Tap to pick image</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Product Name</Text>
      <TextInput
        placeholder="Enter product name"
        value={itemName}
        onChangeText={setItemName}
        style={styles.input}
      />

      <Text style={styles.label}>Price (₹)</Text>
      <TextInput
        placeholder="Enter price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        style={[styles.input, { height: 80 }]}
      />

      <TouchableOpacity style={styles.button} onPress={saveProduct}>
        <Text style={styles.buttonText}>Save Product</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddProductScreen;

const PRIMARY_COLOR = '#007bff';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    marginTop: 12,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9ecef',
    height: 150,
    borderRadius: 10,
    marginBottom: 8,
  },
  imagePlaceholder: {
    color: '#6c757d',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  button: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    marginTop: 24,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
