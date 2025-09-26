import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { Camera, useCameraDevices, PhotoFile, CameraDevice } from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function VerifyScreen({ route, navigation }: any) {
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<CameraDevice | null>(null);
  const [reference, setReference] = useState<string | null>(route.params?.reference || null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [verificationFailed, setVerificationFailed] = useState(false);
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

  useEffect(() => {
    const loadReference = async () => {
      if (!reference) {
        const stored = await AsyncStorage.getItem('referenceImage');
        console.log('📁 Referencia cargada desde almacenamiento:', stored?.slice(0, 30));
        if (stored) setReference(stored);
      } else {
        console.log('📁 Referencia recibida por props:', reference?.slice(0, 30));
      }
    };
    loadReference();
  }, []);

  const verifyIdentity = async () => {
    try {
      console.log('📸 Iniciando captura...');
      const photo: PhotoFile | undefined = await camera.current?.takePhoto({});
      if (!photo) throw new Error('No se pudo capturar la foto');
      console.log('📸 Foto capturada en:', photo.path);

      const imageData = await fetch(`file://${photo.path}`);
      const blob = await imageData.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const live = reader.result?.toString().split(',')[1];
        setPreviewImage(reader.result?.toString() || null);
        console.log('🧠 Imagen en base64 lista para enviar');

        const response = await axios.post('http://192.168.100.41:5000/verify', {
          reference,
          live,
        });

        console.log('📨 Respuesta del backend:', response.data);

        if (response.data.status === 'success') {
          if (!response.data.face_detected) {
            Alert.alert('❌ No se detectó un rostro en la imagen capturada');
            return;
          }

          if (response.data.match) {
            console.log('✅ Rostro coincide, navegando a Success');
            navigation.navigate('Success');
          } else {
            console.log('❌ Rostro no coincide');
            setVerificationFailed(true);
            Alert.alert('❌ Rostro no coincide');
          }
        } else {
          Alert.alert('⚠️ Error en el backend:', response.data.message);
        }
      };

      reader.readAsDataURL(blob);
    } catch (error: any) {
      console.log('❌ Error en verificación:', error.message);
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
      <TouchableOpacity style={styles.captureButton} onPress={verifyIdentity}>
        <Text style={styles.buttonText}>🔐 Verificar identidad</Text>
      </TouchableOpacity>

      {previewImage && (
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>🖼️ Imagen capturada:</Text>
          <Image source={{ uri: previewImage }} style={styles.previewImage} resizeMode="contain" />
        </View>
      )}

      {verificationFailed && (
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          setVerificationFailed(false);
          setPreviewImage(null);
        }}>
          <Text style={styles.retryText}>🔁 Reintentar verificación</Text>
        </TouchableOpacity>
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
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: { color: 'white', fontSize: 18 },
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
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0b5014ff',
    padding: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
  },
});
