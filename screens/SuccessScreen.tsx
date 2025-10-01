import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function SuccessScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ Verificación Exitosa</Text>
      <Text style={styles.details}>Tu identidad ha sido confirmada correctamente.</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Facial Recognition')}>
        <Text style={styles.buttonText}>🏠 Volver al inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F5E9' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32', marginBottom: 20 },
  details: { fontSize: 16, color: '#4CAF50', textAlign: 'center', marginHorizontal: 30 },
  button: {
    marginTop: 30,
    backgroundColor: '#388E3C',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontSize: 16 },
});
