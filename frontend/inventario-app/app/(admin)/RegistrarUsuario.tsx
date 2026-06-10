import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Icon from "react-native-vector-icons/Ionicons";
import { registrarUsuario } from "../../services/usuarioService";

const PRIMARY = "#153cc7";
const BG = "#f0f4ff";

const ROL_OPTIONS = [
  { label: "Técnico", value: "TECNICO", icon: "construct-outline", color: "#059669" },
  { label: "Admin", value: "ADMIN", icon: "shield-checkmark-outline", color: "#153cc7" },
];

export default function RegistrarUsuario() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rolNuevo, setRolNuevo] = useState("TECNICO");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const verificar = async () => {
      const data = await AsyncStorage.getItem("usuario");
      if (!data) { router.replace("/login"); return; }
      const user = JSON.parse(data);
      if (user.rol !== "ADMIN") { router.replace("/home"); return; }
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    };
    verificar();
  }, []);

  const handleRegistrar = async () => {
    if (!nombre || !cedula || !correo || !contrasena) {
      Alert.alert("Campos requeridos", "Por favor completa todos los campos.");
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);
      const response = await registrarUsuario({ nombre, cedula, correo, contrasena, rol: rolNuevo });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("¡Registrado!", `Usuario ${response.nombre} creado correctamente.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error?.response?.data || error?.message || "No se pudo registrar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }} activeOpacity={0.7}>
              <Icon name="arrow-back-outline" size={24} color={PRIMARY} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Nuevo Usuario</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Datos personales</Text>

            <FormField label="Nombre completo" icon="person-outline">
              <TextInput style={styles.input} placeholder="Nombre y apellido" placeholderTextColor="#94a3b8" value={nombre} onChangeText={setNombre} />
            </FormField>
            <FormField label="Cédula" icon="card-outline">
              <TextInput style={styles.input} placeholder="Número de cédula" placeholderTextColor="#94a3b8" value={cedula} onChangeText={setCedula} keyboardType="numeric" />
            </FormField>
            <FormField label="Correo electrónico" icon="mail-outline">
              <TextInput style={styles.input} placeholder="correo@ejemplo.com" placeholderTextColor="#94a3b8" value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" />
            </FormField>
            <FormField label="Contraseña" icon="lock-closed-outline">
              <View style={styles.passWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0, padding: 0, backgroundColor: "transparent" }]}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPass}
                  value={contrasena}
                  onChangeText={setContrasena}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingLeft: 8 }}>
                  <Icon name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </FormField>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Rol del usuario</Text>
            <View style={styles.rolRow}>
              {ROL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.rolCard, rolNuevo === opt.value && { borderColor: opt.color, backgroundColor: opt.color + "12" }]}
                  onPress={() => { Haptics.selectionAsync(); setRolNuevo(opt.value); }}
                  activeOpacity={0.8}
                >
                  <Icon name={opt.icon} size={28} color={rolNuevo === opt.value ? opt.color : "#94a3b8"} />
                  <Text style={[styles.rolCardText, rolNuevo === opt.value && { color: opt.color, fontWeight: "700" }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ marginHorizontal: 16 }}>
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                onPress={handleRegistrar}
                disabled={loading}
                onPressIn={() => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start()}
                onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="person-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Registrar usuario</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function FormField({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.row}>
        <Icon name={icon} size={18} color="#94a3b8" style={{ marginRight: 8 }} />
        {children}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e7f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
});

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
  input: {
    flex: 1,
    backgroundColor: "#f8fafc",
    fontSize: 15,
    color: "#0f172a",
  },
  passWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
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
});
