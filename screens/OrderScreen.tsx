import React from 'react'
import { Text, View, StyleSheet} from 'react-native'

function OrderScreen() {
  return (
    <View style={styles.container}>
      <Text>OrderScreen</Text>
    </View>

    
    
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OrderScreen;