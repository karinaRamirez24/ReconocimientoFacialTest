import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, useCameraDevices, PhotoFile, CameraDevice } from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function ReferenceScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<CameraDevice | null>(null);
  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();

  useEffect(() => {
    const requestPermission = async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
      console.log('📷 Permiso de cámara:', status);
    };
    requestPermission();
  }, []);

  useEffect(() => {
    const allDevices = Object.values(devices).filter(Boolean) as CameraDevice[];
    console.log('📋 Cámaras detectadas:', allDevices);
    if (allDevices.length > 0) {
      setSelectedDevice(allDevices[0]);
    }
  }, [devices]);

  const captureReference = async () => {
    try {
      console.log('🟢 Botón de captura presionado');
      const photo: PhotoFile | undefined = await camera.current?.takePhoto({});
      if (!photo) throw new Error('No se pudo capturar la foto');
      console.log('📸 Foto capturada en:', photo.path);

      const imageData = await fetch(`file://${photo.path}`);
      const blob = await imageData.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = reader.result?.toString().split(',')[1];
        console.log('🧠 Imagen convertida a base64');

        console.log('📨 Enviando imagen al backend para validación facial...');
        const response = await axios.post('http://192.168.100.41:5000/validate-face', {
          image: base64,
        });

        console.log('📨 Respuesta del backend:', response.data);

        if (response.data.status === 'success' && response.data.face_detected) {
          console.log('✅ Rostro detectado, guardando referencia y navegando');
          await AsyncStorage.setItem('referenceImage', base64 || '');
          navigation.navigate('Verify', { reference: base64 });
        } else {
          console.log('❌ No se detectó rostro en la imagen');
          Alert.alert('❌ No se detectó un rostro en la imagen capturada');
        }
      };

      reader.readAsDataURL(blob);
    } catch (error: any) {
      console.log('❌ Error al capturar referencia:', error.message);
      Alert.alert('Error', error.message);
    }
  };

  if (!hasPermission || !selectedDevice) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>📷 Cargando cámara...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera ref={camera} style={StyleSheet.absoluteFill} device={selectedDevice} isActive={true} photo={true} />
      <TouchableOpacity style={styles.captureButton} onPress={captureReference}>
        <Text style={styles.buttonText}>📸 Capturar referencia</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
  text: { color: 'white', fontSize: 16 },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: { color: 'white', fontSize: 18 },
});
