import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Snackbar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Icon from "react-native-vector-icons/Ionicons";
import { actualizarUsuario } from "../../services/usuarioService";
import { useSnackbar } from "../../hooks/useSnackbar";

const PRIMARY = "#153cc7";
const BG = "#f0f4ff";

export default function EditarUsuario() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cedula, setCedula] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const snack = useSnackbar();

  useEffect(() => {
    const cargar = async () => {
      const data = await AsyncStorage.getItem("usuario");
      if (!data) { router.replace("/login"); return; }
      const user = JSON.parse(data);
      setUsuario(user);
      setNombre(user.nombre ?? "");
      setCorreo(user.correo ?? "");
      setCedula(user.cedula ?? "");
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    };
    cargar();
  }, []);

  const handleGuardar = async () => {
    if (!nombre || !correo) {
      snack.show("Nombre y correo son obligatorios.");
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSaving(true);
      const datos: any = { ...usuario, nombre, correo };
      if (contrasena.trim()) datos.contrasena = contrasena;
      const response = await actualizarUsuario(usuario.idUsuario, datos);
      await AsyncStorage.setItem("usuario", JSON.stringify(response));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/home");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      snack.show(err?.response?.data || err?.message || "No se pudo actualizar la información.");
    } finally {
      setSaving(false);
    }
  };

  if (!usuario) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }} activeOpacity={0.7}>
              <Icon name="arrow-back-outline" size={24} color={PRIMARY} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Editar Perfil</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Icon name="person" size={40} color={PRIMARY} />
            </View>
            <Text style={styles.avatarName}>{usuario.nombre}</Text>
            <View style={styles.rolPill}>
              <Text style={styles.rolPillText}>{usuario.rol}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Información de cuenta</Text>

            <Text style={styles.label}>Cédula (no editable)</Text>
            <View style={[styles.inputRow, { backgroundColor: "#f1f5f9" }]}>
              <Icon name="lock-closed-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, color: "#94a3b8", fontSize: 15 }}>{cedula}</Text>
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Nombre</Text>
            <View style={styles.inputRow}>
              <Icon name="person-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#94a3b8" value={nombre} onChangeText={setNombre} />
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Correo electrónico</Text>
            <View style={styles.inputRow}>
              <Icon name="mail-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholder="correo@ejemplo.com" placeholderTextColor="#94a3b8" value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Nueva contraseña (opcional)</Text>
            <View style={styles.inputRow}>
              <Icon name="lock-closed-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Dejar en blanco para no cambiar"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPass}
                value={contrasena}
                onChangeText={setContrasena}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Icon name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginHorizontal: 16, gap: 10 }}>
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleGuardar}
                disabled={saving}
                onPressIn={() => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start()}
                onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()}
                activeOpacity={0.9}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Guardar cambios</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      <Snackbar
        visible={snack.visible}
        onDismiss={snack.hide}
        duration={3500}
        style={{ backgroundColor: '#1e293b' }}
        theme={{ colors: { inverseSurface: '#1e293b', inverseOnSurface: '#ffffff' } }}
      >
        {snack.message}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e7f5",
    marginBottom: 0,
    elevation: 2,
  },
  pageTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  avatarSection: { alignItems: "center", paddingVertical: 24, backgroundColor: "#fff", marginBottom: 16 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarName: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  rolPill: {
    marginTop: 6,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  rolPillText: { color: PRIMARY, fontSize: 12, fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#153cc7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#94a3b8", marginBottom: 16, letterSpacing: 0.5, textTransform: "uppercase" },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e7f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  input: { flex: 1, color: "#0f172a", fontSize: 15 },
  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    height: 54,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelBtn: { backgroundColor: "#f1f5f9", borderRadius: 16, height: 48, justifyContent: "center", alignItems: "center" },
  cancelBtnText: { color: "#475569", fontSize: 15, fontWeight: "600" },
});
