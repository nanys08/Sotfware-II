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
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Icon from "react-native-vector-icons/Ionicons";
import { actualizarUsuario, obtenerUsuarioPorId } from "../../services/usuarioService";
import { useSnackbar } from "../../hooks/useSnackbar";

const PRIMARY = "#153cc7";
const BG = "#f0f4ff";

const ROL_OPTIONS = [
  { label: "Técnico", value: "TECNICO", icon: "construct-outline", color: "#059669" },
  { label: "Admin",   value: "ADMIN",   icon: "shield-checkmark-outline", color: "#153cc7" },
];

export default function EditarUsuarioAdmin() {
  const router = useRouter();
  const { idUsuario } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rol, setRol] = useState("TECNICO");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const snack = useSnackbar();

  useEffect(() => {
    const init = async () => {
      const data = await AsyncStorage.getItem("usuario");
      if (!data) { router.replace("/login"); return; }
      const user = JSON.parse(data);
      if (user.rol !== "ADMIN") { router.replace("/home"); return; }

      const id = Array.isArray(idUsuario) ? parseInt(idUsuario[0]) : parseInt(idUsuario as string);
      if (isNaN(id)) { snack.show("ID inválido"); router.back(); return; }

      try {
        const data2 = await obtenerUsuarioPorId(id);
        setNombre(data2.nombre);
        setCedula(data2.cedula?.toString());
        setCorreo(data2.correo);
        setRol(data2.rol ?? "TECNICO");
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      } catch {
        snack.show("No se pudo cargar el usuario.");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [idUsuario]);

  const handleActualizar = async () => {
    if (!nombre || !correo || !rol) {
      snack.show("Nombre, correo y rol son obligatorios.");
      return;
    }
    const id = Array.isArray(idUsuario) ? parseInt(idUsuario[0]) : parseInt(idUsuario as string);
    if (isNaN(id)) { snack.show("ID inválido"); return; }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSaving(true);
      const datos: Record<string, any> = { nombre, cedula, correo, rol: rol.toUpperCase() };
      if (contrasena.trim()) datos.contrasena = contrasena;
      await actualizarUsuario(id, datos);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = error?.response?.data ?? error?.message ?? "No se pudo actualizar.";
      snack.show(String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG }}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={{ marginTop: 12, color: "#94a3b8" }}>Cargando usuario...</Text>
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
            <Text style={styles.pageTitle}>Editar Usuario</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Datos personales</Text>

            <Text style={styles.label}>Cédula (no editable)</Text>
            <View style={[styles.inputRow, { backgroundColor: "#f1f5f9" }]}>
              <Icon name="lock-closed-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, color: "#94a3b8", fontSize: 15 }}>{cedula}</Text>
            </View>

            <Text style={[styles.label, { marginTop: 14 }]}>Nombre completo</Text>
            <View style={styles.inputRow}>
              <Icon name="person-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#94a3b8" value={nombre} onChangeText={setNombre} />
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

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Rol del usuario</Text>
            <View style={styles.rolRow}>
              {ROL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.rolCard, rol === opt.value && { borderColor: opt.color, backgroundColor: opt.color + "12" }]}
                  onPress={() => { Haptics.selectionAsync(); setRol(opt.value); }}
                  activeOpacity={0.8}
                >
                  <Icon name={opt.icon} size={28} color={rol === opt.value ? opt.color : "#94a3b8"} />
                  <Text style={[styles.rolCardText, rol === opt.value && { color: opt.color, fontWeight: "700" }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ marginHorizontal: 16, gap: 10 }}>
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleActualizar}
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
    marginBottom: 16,
    elevation: 2,
  },
  pageTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
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
  rolRow: { flexDirection: "row", gap: 12 },
  rolCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#e1e7f5",
    backgroundColor: "#f8fafc",
    gap: 6,
  },
  rolCardText: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
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
