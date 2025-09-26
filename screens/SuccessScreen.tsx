import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SuccessScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ Identidad verificada</Text>
      <Text style={styles.subtext}>Acceso autorizado</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
  text: { color: '#00D1B2', fontSize: 24, fontWeight: 'bold' },
  subtext: { color: 'white', fontSize: 16, marginTop: 10 },
});
