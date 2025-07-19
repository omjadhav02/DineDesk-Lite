import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProductCard = React.memo(
  ({ item, onChange }: { item: any; onChange: (delta: number) => void }) => {
    return (
      <View style={styles.card}>
        <Image
          source={
            item.imageUri && item.imageUri.trim() !== ''
              ? { uri: item.imageUri }
              : require('../assets/no-image.png') // change path if needed
          }
          style={styles.image}
        />

        <Text style={styles.name}>{item.itemName}</Text>
        <Text style={styles.price}>₹{item.price}</Text>

        {item.quantity === 0 ? (
          <TouchableOpacity onPress={() => onChange(1)} style={styles.addInitialButton}>
            <Text style={styles.addInitialText}>ADD</Text>
            <Ionicons name="add" size={16} color="#007bff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyContainer}>
            <TouchableOpacity onPress={() => onChange(-1)} style={styles.filledButton}>
              <Ionicons name="remove" size={18} style={styles.filledIcon} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity onPress={() => onChange(1)} style={styles.filledButton}>
              <Ionicons name="add" size={18} style={styles.filledIcon} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
);

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  price: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
    height: 42,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  filledButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  filledIcon: {
    color: '#fff',
  },
  qtyText: {
    minWidth: 32,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 17,
    color: '#fff',
  },
  addInitialButton: {
    borderWidth: 1,
    borderColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    height: 42,
    width: '100%',
  },
  addInitialText: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 15,
    marginRight: 6,
  },
});