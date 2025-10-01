import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Camera, useCameraDevices, PhotoFile, CameraDevice } from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function ReferenceScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<CameraDevice | null>(null);
  const [usingFrontCamera, setUsingFrontCamera] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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
    if (hasPermission && devices.length > 0) {
      const desiredCamera = devices.find((device) => device.position === (usingFrontCamera ? 'front' : 'back'));
      if (desiredCamera) {
        setSelectedDevice(desiredCamera);
        console.log(`📷 Cámara ${usingFrontCamera ? 'frontal' : 'trasera'} seleccionada`);
      } else {
        console.log('❌ No se encontró la cámara solicitada');
      }
    }
  }, [hasPermission, devices, usingFrontCamera]);

  const captureAndValidate = async () => {
  try {
    const photo: PhotoFile | undefined = await camera.current?.takePhoto({});
    if (!photo) throw new Error('No se pudo capturar la foto');
    console.log('📸 Foto capturada en:', photo.path);

    const imageData = await fetch(`file://${photo.path}`);
    const blob = await imageData.blob();
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64 = reader.result?.toString().split(',')[1];
      setPreviewImage(reader.result?.toString() || null);
      console.log('🧠 Imagen en base64 lista para enviar');

      const response = await axios.post('http://192.168.100.41:5000/validate-face', {
        image: base64,
      });

      console.log('📨 Respuesta del backend:', response.data);

      if (response.data.status === 'success' && response.data.face_detected) {
        await AsyncStorage.setItem('referenceImage', base64 || '');
        Alert.alert('✅ Rostro detectado', 'Pasando a verificación...', [
          { text: 'Continuar', onPress: () => navigation.navigate('Verify', { reference: base64 }) }
        ]);
      } else {
        Alert.alert('❌ No se detectó rostro', 'Intenta capturar la imagen nuevamente.');
        setPreviewImage(null); // Limpia la imagen previa
      }
    };

    reader.readAsDataURL(blob);
  } catch (error: any) {
    console.log('❌ Error en validación:', error.message);
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

      <TouchableOpacity style={styles.captureButton} onPress={captureAndValidate}>
        <Text style={styles.buttonText}>Capturar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchButton} onPress={() => {
        setUsingFrontCamera(prev => !prev);
        setPreviewImage(null);
      }}>
        <Text style={styles.switchText}>🔄</Text>
      </TouchableOpacity>

      {previewImage && (
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>Imagen capturada:</Text>
          <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
        </View>
      )}
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
    backgroundColor: '#000000',
    padding: 15,
    borderRadius: 10,
    borderColor: 'white',
  },
  buttonText: { color: 'white', fontSize: 18 },
  switchButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    borderRadius: 12,
  },
  switchText: { color: 'white', fontSize: 14 },
  previewBox: {
    marginTop: 20,
    alignItems: 'center',
  },
  previewText: {
    color: 'white',
    marginBottom: 8,
  },
  previewImage: {
    width: '90%',
    height: 200,
    borderRadius: 10,
  },
});
