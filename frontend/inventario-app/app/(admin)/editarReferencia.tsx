import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Snackbar } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Icon from "react-native-vector-icons/Ionicons";
import { obtenerReferenciaPorId, editarReferencia } from "../../services/referenciaService";
import { useSnackbar } from "../../hooks/useSnackbar";

const PRIMARY = "#153cc7";
const BG = "#f0f4ff";

export default function EditarReferencia() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const idParam = Array.isArray(params.idReferencia) ? params.idReferencia[0] : (params.idReferencia as string | undefined);
  const [originalId] = useState<string | null>(idParam ?? null);

  const [idVisible, setIdVisible] = useState("");
  const [nombre, setNombre] = useState("");
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const snack = useSnackbar();

  useEffect(() => {
    const init = async () => {
      const data = await AsyncStorage.getItem("usuario");
      if (!data) { router.replace("/login"); return; }
      const user = JSON.parse(data);
      if (user.rol !== "ADMIN") { router.replace("/home"); return; }
      if (!originalId) { snack.show("ID no proporcionado"); router.back(); return; }
      try {
        setLoading(true);
        const ref = await obtenerReferenciaPorId(originalId);
        setIdVisible(ref.idReferencia ?? originalId);
        setNombre(ref.nombre ?? "");
        setActivo(Boolean(ref.activo));
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      } catch {
        snack.show("No se pudo cargar la referencia.");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [originalId]);

  const handleActualizar = async () => {
    const nom = nombre.trim();
    if (!nom) { snack.show("El nombre es obligatorio."); return; }
    if (!originalId) { snack.show("ID original no disponible."); return; }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSaving(true);
      await editarReferencia(originalId, { idReferencia: originalId, nombre: nom, activo });
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
        <Text style={{ marginTop: 12, color: "#94a3b8" }}>Cargando referencia...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }} activeOpacity={0.7}>
              <Icon name="arrow-back-outline" size={24} color={PRIMARY} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Editar Referencia</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* ID banner */}
          <View style={styles.idBanner}>
            <Icon name="barcode-outline" size={18} color={PRIMARY} />
            <Text style={styles.idText}>{idVisible}</Text>
            <View style={[styles.statusDot, { backgroundColor: activo ? "#059669" : "#94a3b8" }]} />
          </View>

          {/* Formulario */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Datos de la referencia</Text>

            <Text style={styles.label}>ID (no editable)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: "#f1f5f9" }]}>
              <Icon name="lock-closed-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, color: "#94a3b8", fontSize: 15 }}>{idVisible}</Text>
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Nombre</Text>
            <View style={styles.inputWrapper}>
              <Icon name="text-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Nombre de la referencia"
                placeholderTextColor="#94a3b8"
                value={nombre}
                onChangeText={setNombre}
                style={styles.input}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Estado</Text>
                <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  {activo ? "Referencia activa y disponible" : "Referencia desactivada"}
                </Text>
              </View>
              <Switch
                value={activo}
                onValueChange={(v) => { Haptics.selectionAsync(); setActivo(v); }}
                trackColor={{ false: "#e2e8f0", true: "#bfdbfe" }}
                thumbColor={activo ? PRIMARY : "#94a3b8"}
              />
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
  idBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eef2ff",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  idText: { flex: 1, fontSize: 15, fontWeight: "700", color: PRIMARY },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#153cc7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#94a3b8", marginBottom: 16, letterSpacing: 0.5, textTransform: "uppercase" },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputWrapper: {
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
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
