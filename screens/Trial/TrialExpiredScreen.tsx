import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';
import { TrialManager } from '../../utils/TrailManager';

type Props = {
  onActivate: () => void;
};

export default function TrialExpiredScreen({ onActivate }: Props) {
  const [code, setCode] = useState('');

  const handleActivate = async () => {
    const correctCode = '30995614'; // 🔐 Set your secret code here

    if (code === correctCode) {
      await TrialManager.activateApp();
      onActivate(); // ✅ call the callback to reload the app
    } else {
      Alert.alert('Invalid Code', 'The activation code you entered is incorrect.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Trial Expired</Text>
      <Text style={styles.subtext}>Your trial has ended.</Text>
      <Text style={styles.subtext}>Please enter your activation code to continue:</Text>

      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="Enter code"
        keyboardType="numeric"
        style={styles.input}
        maxLength={8}
      />

      <Button title="Activate App" onPress={handleActivate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  heading: {
    fontSize: 24, fontWeight: 'bold', marginBottom: 16,
  },
  subtext: {
    fontSize: 16, textAlign: 'center', marginBottom: 12,
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
});
