import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { loginUsuario } from '../../services/usuarioService';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSnackbar } from '../../hooks/useSnackbar';

const PRIMARY = '#153cc7';
const BG = '#f0f4ff';

export default function Login() {
  const [cedula, setCedula] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [bloqueado, setBloqueado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const snack = useSnackbar();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]).start();

      const verificarSesion = async () => {
        const usuarioGuardado = await AsyncStorage.getItem('usuario');
        if (usuarioGuardado) {
          const usuario = JSON.parse(usuarioGuardado);
          setBloqueado(true);
          router.replace({ pathname: '/home', params: { nombre: usuario.nombre, rol: usuario.rol } });
        } else {
          setBloqueado(false);
          setCedula('');
          setContrasena('');
        }
      };
      verificarSesion();
    }, [router])
  );

  const animBtn = (toValue: number) =>
    Animated.spring(btnScale, { toValue, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  const handleLogin = async () => {
    if (!cedula || !contrasena) {
      snack.show('Por favor ingresa tu cédula y contraseña.');
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);
      const usuario = await loginUsuario(cedula, contrasena);
      await AsyncStorage.setItem('usuario', JSON.stringify(usuario));
      setBloqueado(true);
      router.replace({ pathname: '/home', params: { nombre: usuario.nombre, rol: usuario.rol } });
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      snack.show(error?.response?.data || error?.message || 'Cédula o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header azul */}
        <View style={styles.header}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.iconCircle}>
              <Icon name="cube-outline" size={48} color="#fff" />
            </View>
            <Text style={styles.appName}>Inventario App</Text>
            <Text style={styles.appSub}>Sistema de gestión de repuestos</Text>
          </Animated.View>
        </View>

        <Snackbar
          visible={snack.visible}
          onDismiss={snack.hide}
          duration={3500}
          style={{ backgroundColor: '#1e293b' }}
          theme={{ colors: { inverseSurface: '#1e293b', inverseOnSurface: '#ffffff' } }}
        >
          {snack.message}
        </Snackbar>

        {/* Card de login */}
        <Animated.View
          style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Text style={styles.cardTitle}>Iniciar sesión</Text>

          <Text style={styles.label}>Cédula</Text>
          <View style={styles.inputWrapper}>
            <Icon name="card-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              placeholder="Número de cédula"
              placeholderTextColor="#94a3b8"
              value={cedula}
              onChangeText={setCedula}
              editable={!bloqueado && !loading}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputWrapper}>
            <Icon name="lock-closed-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPass}
              value={contrasena}
              onChangeText={setContrasena}
              editable={!bloqueado && !loading}
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingHorizontal: 10 }}>
              <Icon name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.btn, (bloqueado || loading) && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={bloqueado || loading}
              onPressIn={() => animBtn(0.96)}
              onPressOut={() => animBtn(1)}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="log-in-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.btnText}>Ingresar</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: BG },
  header: {
    backgroundColor: PRIMARY,
    paddingTop: 70,
    paddingBottom: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  appName: { color: '#fff', fontSize: 26, fontWeight: '800', textAlign: 'center' },
  appSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: -28,
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#1a3fbf',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e1e7f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#0f172a', fontSize: 15, height: '100%' },
  btn: {
    marginTop: 24,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
