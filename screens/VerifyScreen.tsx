import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  PhotoFile,
  CameraDevice,
} from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function VerifyScreen({ route, navigation }: any) {
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<CameraDevice | null>(null);
  const [usingFrontCamera, setUsingFrontCamera] = useState(true);
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
    if (hasPermission && devices.length > 0) {
      const desiredCamera = devices.find(
        device => device.position === (usingFrontCamera ? 'front' : 'back'),
      );
      if (desiredCamera) {
        setSelectedDevice(desiredCamera);
        console.log(`📷 Cámara ${usingFrontCamera ? 'frontal' : 'trasera'} seleccionada`);
      } else {
        console.log('❌ No se encontró la cámara solicitada');
      }
    }
  }, [hasPermission, devices, usingFrontCamera]);

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
      const photo: PhotoFile | undefined = await camera.current?.takePhoto({});
      if (!photo) throw new Error('No se pudo capturar la foto');
      console.log('📸 Foto capturada en:', photo.path);

      const imageData = await fetch(`file://${photo.path}`);
      const blob = await imageData.blob();

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result?.toString();
          if (result) {
            resolve(result.split(',')[1]);
          } else {
            reject('No se pudo leer la imagen');
          }
        };
        reader.onerror = () => reject('Error al leer la imagen');
        reader.readAsDataURL(blob);
      });

      setPreviewImage(`data:image/jpeg;base64,${base64}`);
      console.log('🧠 Imagen en base64 lista para enviar');

      if (!reference) {
        Alert.alert('⚠️ No hay imagen de referencia', 'Por favor captura una imagen de referencia primero.');
        return;
      }

      const response = await axios.post('http://192.168.100.41:5000/verify', {
        reference,
        live: base64,
      });

      console.log('📨 Respuesta del backend verified:', response.data);

      if (response.data.status === 'success') {
        if (!response.data.face_detected) {
          Alert.alert('❌ No se detectó rostro', 'Asegúrate de estar bien encuadrada y con buena iluminación.');
          return;
        }

        if (response.data.match) {
          Alert.alert('✅ Verificación exitosa', 'Tu rostro coincide con la referencia.', [
            { text: 'Continuar', onPress: () => navigation.navigate('Success') },
          ]);
        } else {
          Alert.alert('❌ Verificación fallida', 'Tu rostro no coincide con la referencia. Intenta nuevamente.');
          setVerificationFailed(true);
        }
      } else {
        Alert.alert('⚠️ Error en el backend', response.data.message || 'Intenta más tarde.');
      }
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
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={selectedDevice}
        isActive={true}
        photo={true}
      />

      <TouchableOpacity style={styles.captureButton} onPress={verifyIdentity}>
        <Text style={styles.buttonText}>Verificar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchButton}
        onPress={() => {
          setUsingFrontCamera(prev => !prev);
          setPreviewImage(null);
          setVerificationFailed(false);
        }}
      >
        <Text style={styles.switchText}>🔄</Text>
      </TouchableOpacity>

      {previewImage && (
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>🖼️ Imagen capturada:</Text>
          <Image
            source={{ uri: previewImage }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>
      )}

      {verificationFailed && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setVerificationFailed(false);
            setPreviewImage(null);
          }}
        >
          <Text style={styles.retryText}>🔁 Reintentar verificación</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  text: { color: 'white', fontSize: 16 },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#080808ff',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: { color: 'white', fontSize: 18 },
  switchButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    borderRadius: 16,
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
  retryButton: {
    marginTop: 20,
    backgroundColor: '#080808ff',
    padding: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
  },
});
