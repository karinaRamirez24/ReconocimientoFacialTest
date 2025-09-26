import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCameraDevices, CameraDevice, Camera } from 'react-native-vision-camera';

export default function CameraDebugScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const devices = useCameraDevices();

  useEffect(() => {
    const requestPermission = async () => {
      const status = await Camera.requestCameraPermission();
      console.log('📷 Permiso de cámara:', status);
      setHasPermission(status === 'granted');
    };
    requestPermission();
  }, []);

  const allDevices = Object.values(devices).filter(Boolean) as CameraDevice[];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔍 Diagnóstico de cámara</Text>
      <Text style={styles.text}>Permiso: {hasPermission ? '✅ autorizado' : '❌ denegado'}</Text>
      <Text style={styles.text}>Dispositivos detectados: {allDevices.length}</Text>
      {allDevices.map((device, index) => (
        <View key={index} style={styles.deviceBox}>
          <Text style={styles.deviceText}>ID: {device.id}</Text>
          <Text style={styles.deviceText}>Posición: {device.position}</Text>
          <Text style={styles.deviceText}>Nombre: {device.name ?? 'sin nombre'}</Text>
        </View>
      ))}
      {allDevices.length === 0 && (
        <Text style={styles.warning}>⚠️ No se detectó ninguna cámara</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#111', flexGrow: 1 },
  title: { color: '#00E676', fontSize: 20, marginBottom: 10 },
  text: { color: 'white', fontSize: 16, marginBottom: 6 },
  deviceBox: { backgroundColor: '#222', padding: 10, marginVertical: 8, borderRadius: 8 },
  deviceText: { color: '#ccc', fontSize: 14 },
  warning: { color: '#FF6F00', marginTop: 20, fontSize: 16 },
});
