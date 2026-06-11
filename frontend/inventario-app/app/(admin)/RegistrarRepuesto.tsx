import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Snackbar } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Icon from "react-native-vector-icons/Ionicons";
import { registrarRepuesto, obtenerReferenciasParaRepuesto } from "../../services/repuestoService";
import { useSnackbar } from "../../hooks/useSnackbar";

const PRIMARY = "#153cc7";
const BG = "#f0f4ff";

const CALIDAD_OPTIONS = [
  { label: "Nuevo", value: "NUEVO", icon: "star-outline" },
  { label: "De segunda", value: "DE_SEGUNDA", icon: "refresh-outline" },
];

const ESTADO_OPTIONS = [
  { label: "En bodega", value: "EN_BODEGA", color: PRIMARY },
  { label: "Para reparar", value: "PARA_REPARAR", color: "#d97706" },
  { label: "En reparación", value: "EN_REPARACION", color: "#7c3aed" },
];

export default function RegistrarRepuesto() {
  const router = useRouter();
  const [idRepuesto, setIdRepuesto] = useState("");
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [calidad, setCalidad] = useState("NUEVO");
  const [marca, setMarca] = useState("");
  const [estado, setEstado] = useState("EN_BODEGA");
  const [referencias, setReferencias] = useState<any[]>([]);
  const [idReferencia, setIdReferencia] = useState("");
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const snack = useSnackbar();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    obtenerReferenciasParaRepuesto()
      .then((data) => setReferencias(Array.isArray(data) ? data : []))
      .catch(() => snack.show("No se pudieron cargar las referencias."));
  }, []);

  const resetForm = () => {
    setIdRepuesto(""); setNombre(""); setCantidad(""); setCalidad("NUEVO");
    setMarca(""); setEstado("EN_BODEGA"); setIdReferencia("");
  };

  const handleGuardar = async () => {
    if (!idRepuesto.trim() || !nombre.trim() || !cantidad.trim() || !idReferencia || !marca.trim()) {
      snack.show("Completa todos los campos obligatorios.");
      return;
    }
    if (!idRepuesto.toUpperCase().startsWith("RE")) {
      snack.show('El ID del repuesto debe iniciar con "RE".');
      return;
    }
    const cantidadNum = Number(cantidad);
    if (isNaN(cantidadNum) || cantidadNum < 0) {
      snack.show("La cantidad debe ser un número válido.");
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);
      await registrarRepuesto(idReferencia, {
        idRepuesto: idRepuesto.trim().toUpperCase(),
        nombre: nombre.trim(),
        cantidad: cantidadNum,
        calidad,
        marca: marca.trim(),
        estado,
        imagen: null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
      router.back();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      snack.show(err.response?.data || err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.pageHeader}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }} activeOpacity={0.7}>
              <Icon name="arrow-back-outline" size={24} color={PRIMARY} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Registrar Repuesto</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Sección ID y Nombre */}
          <SectionCard title="Identificación">
            <FormField label="ID Repuesto" hint='Debe iniciar con "RE"'>
              <TextInput
                style={styles.input}
                placeholder="Ej: RE001"
                placeholderTextColor="#94a3b8"
                value={idRepuesto}
                onChangeText={(t) => setIdRepuesto(t.toUpperCase())}
                autoCapitalize="characters"
              />
            </FormField>
            <FormField label="Nombre">
              <TextInput
                style={styles.input}
                placeholder="Nombre del repuesto"
                placeholderTextColor="#94a3b8"
                value={nombre}
                onChangeText={setNombre}
              />
            </FormField>
            <FormField label="Marca">
              <TextInput
                style={styles.input}
                placeholder="Ej: Bosch, Samsung..."
                placeholderTextColor="#94a3b8"
                value={marca}
                onChangeText={setMarca}
              />
            </FormField>
            <FormField label="Cantidad">
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                value={cantidad}
                keyboardType="numeric"
                onChangeText={(t) => setCantidad(t.replace(/[^0-9]/g, ""))}
              />
            </FormField>
          </SectionCard>

          {/* Calidad */}
          <SectionCard title="Calidad">
            <View style={styles.chipsRow}>
              {CALIDAD_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, calidad === opt.value && styles.chipActive]}
                  onPress={() => { Haptics.selectionAsync(); setCalidad(opt.value); }}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={opt.icon}
                    size={16}
                    color={calidad === opt.value ? "#fff" : "#475569"}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.chipText, calidad === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SectionCard>

          {/* Estado */}
          <SectionCard title="Estado">
            <View style={styles.chipsRow}>
              {ESTADO_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.chip,
                    estado === opt.value && { backgroundColor: opt.color, borderColor: opt.color },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); setEstado(opt.value); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, estado === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SectionCard>

          {/* Referencia */}
          <SectionCard title="Referencia">
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={idReferencia}
                onValueChange={(v) => setIdReferencia(v)}
                style={{ height: 48, color: "#0f172a" }}
              >
                <Picker.Item label="Selecciona una referencia..." value="" color="#94a3b8" />
                {referencias.map((ref) => (
                  <Picker.Item
                    key={ref.idReferencia}
                    label={`${ref.idReferencia} · ${ref.nombre}`}
                    value={ref.idReferencia}
                  />
                ))}
              </Picker>
            </View>
          </SectionCard>

          {/* Botón */}
          <Animated.View style={{ transform: [{ scale: btnScale }], marginHorizontal: 16, marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.7 }]}
              onPress={handleGuardar}
              disabled={loading}
              onPressIn={() =>
                Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start()
              }
              onPressOut={() =>
                Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()
              }
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Guardar repuesto</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.card}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
        <Text style={sectionStyles.label}>{label}</Text>
        {hint && <Text style={sectionStyles.hint}> · {hint}</Text>}
      </View>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#153cc7",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  title: { fontSize: 13, fontWeight: "700", color: "#94a3b8", marginBottom: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  label: { fontSize: 13, fontWeight: "600", color: "#374151" },
  hint: { fontSize: 11, color: "#94a3b8" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
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
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e7f5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#0f172a",
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e1e7f5",
    backgroundColor: "#f8fafc",
  },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { fontSize: 13, color: "#475569", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  pickerWrapper: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e7f5",
    borderRadius: 12,
    overflow: "hidden",
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
});
