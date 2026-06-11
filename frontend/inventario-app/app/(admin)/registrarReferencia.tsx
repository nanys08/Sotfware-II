import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Snackbar } from "react-native-paper";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Icon from "react-native-vector-icons/Ionicons";
import { registrarReferencia } from "../../services/referenciaService";
import { useSnackbar } from "../../hooks/useSnackbar";

const PRIMARY = "#153cc7";
const BG = "#f0f4ff";

export default function RegistrarReferencia() {
  const router = useRouter();
  const [idReferencia, setIdReferencia] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;
  const snack = useSnackbar();

  const handleRegistrar = async () => {
    const id = idReferencia.trim().toUpperCase();
    const nom = nombre.trim();
    if (!id || !nom) {
      snack.show("Completa el ID y el nombre de la referencia.");
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoading(true);
      await registrarReferencia({ idReferencia: id, nombre: nom, activo: true });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      snack.show(error?.message || "No se pudo crear la referencia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }} activeOpacity={0.7}>
            <Icon name="arrow-back-outline" size={24} color={PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Nueva Referencia</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Info */}
        <View style={styles.infoBanner}>
          <Icon name="information-circle-outline" size={18} color={PRIMARY} />
          <Text style={styles.infoText}>El ID debe tener el formato RF seguido de números. Ej: RF01</Text>
        </View>

        {/* Formulario */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Datos de la referencia</Text>

          <Text style={styles.label}>ID de Referencia</Text>
          <View style={styles.inputWrapper}>
            <Icon name="barcode-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Ej: RF01"
              placeholderTextColor="#94a3b8"
              value={idReferencia}
              onChangeText={(t) => setIdReferencia(t.toUpperCase())}
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Nombre</Text>
          <View style={styles.inputWrapper}>
            <Icon name="text-outline" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Nombre descriptivo"
              placeholderTextColor="#94a3b8"
              value={nombre}
              onChangeText={setNombre}
              style={styles.input}
            />
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
                  <Icon name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Registrar referencia</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>

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
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#eef2ff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: "#153cc7", lineHeight: 18 },
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
