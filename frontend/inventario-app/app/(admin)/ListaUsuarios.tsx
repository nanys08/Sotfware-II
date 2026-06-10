import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Icon from "react-native-vector-icons/Ionicons";
import { obtenerUsuarios, cambiarEstadoUsuario } from "../../services/usuarioService";

const PRIMARY = "#153cc7";
const BG = "#f0f4ff";

const ROL_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  ADMIN:   { color: "#153cc7", bg: "#eef2ff", icon: "shield-checkmark-outline" },
  TECNICO: { color: "#059669", bg: "#dcfce7", icon: "construct-outline" },
};

function UsuarioCard({ item, index, onEditar, onToggle, loadingId }: any) {
  const anim = useRef(new Animated.Value(0)).current;
  const rolCfg = ROL_CONFIG[item.rol] ?? { color: "#6b7280", bg: "#f3f4f6", icon: "person-outline" };

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: Math.min(index, 8) * 65,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }}
    >
      <View style={styles.card}>
        <View style={[styles.avatarCircle, { backgroundColor: rolCfg.bg }]}>
          <Icon name={rolCfg.icon} size={24} color={rolCfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{item.nombre}</Text>
          <Text style={styles.cardCedula}>Cédula: {item.cedula}</Text>
          <View style={styles.tagsRow}>
            <View style={[styles.rolTag, { backgroundColor: rolCfg.bg }]}>
              <Text style={[styles.rolTagText, { color: rolCfg.color }]}>{item.rol}</Text>
            </View>
            <View style={[styles.statusTag, item.activo ? styles.statusActive : styles.statusInactive]}>
              <View style={[styles.statusDot, { backgroundColor: item.activo ? "#059669" : "#94a3b8" }]} />
              <Text style={[styles.statusText, { color: item.activo ? "#059669" : "#6b7280" }]}>
                {item.activo ? "Activo" : "Inactivo"}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: PRIMARY }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEditar(); }}
            activeOpacity={0.8}
          >
            <Icon name="pencil" size={15} color="#fff" />
          </TouchableOpacity>
          {loadingId === item.idUsuario ? (
            <View style={[styles.actionBtn, { backgroundColor: "#f1f5f9" }]}>
              <ActivityIndicator size="small" color={PRIMARY} />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: item.activo ? "#fee2e2" : "#dcfce7" }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onToggle(); }}
              activeOpacity={0.8}
            >
              <Icon
                name={item.activo ? "pause-outline" : "play-outline"}
                size={15}
                color={item.activo ? "#dc2626" : "#059669"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default function ListaUsuarios() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingId, setLoadingId] = useState<any>(null);

  useEffect(() => { verificar(); }, []);

  const verificar = async () => {
    const data = await AsyncStorage.getItem("usuario");
    if (!data) { router.replace("/login"); return; }
    const user = JSON.parse(data);
    if (user.rol !== "ADMIN") { router.replace("/home"); return; }
    cargar();
  };

  const cargar = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true); else setRefreshing(true);
      const lista = await obtenerUsuarios();
      setUsuarios(
        Array.isArray(lista)
          ? lista.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }))
          : []
      );
    } catch {
      Alert.alert("Error", "No se pudo cargar la lista de usuarios.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleEstado = async (usuario: any) => {
    const accion = usuario.activo ? "desactivar" : "activar";
    Alert.alert("Confirmar", `¿Seguro que deseas ${accion} a ${usuario.nombre}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          setLoadingId(usuario.idUsuario);
          setUsuarios((prev) =>
            prev.map((u) => (u.idUsuario === usuario.idUsuario ? { ...u, activo: !usuario.activo } : u))
          );
          try {
            await cambiarEstadoUsuario(usuario.idUsuario, !usuario.activo);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            setUsuarios((prev) =>
              prev.map((u) => (u.idUsuario === usuario.idUsuario ? { ...u, activo: usuario.activo } : u))
            );
            Alert.alert("Error", "No se pudo cambiar el estado del usuario.");
          } finally {
            setLoadingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }} activeOpacity={0.7}>
          <Icon name="arrow-back-outline" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usuarios</Text>
        <TouchableOpacity
          onPress={() => router.push("/(admin)/RegistrarUsuario")}
          style={styles.addBtn}
          activeOpacity={0.85}
        >
          <Icon name="person-add-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {!loading && (
        <Text style={styles.contador}>{usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""}</Text>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={{ marginTop: 12, color: "#94a3b8" }}>Cargando usuarios...</Text>
        </View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item.idUsuario.toString()}
          onRefresh={() => cargar(true)}
          refreshing={refreshing}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <UsuarioCard
              item={item}
              index={index}
              loadingId={loadingId}
              onEditar={() =>
                router.push({ pathname: "/(admin)/EditarUsuarioAdmin", params: { idUsuario: item.idUsuario } })
              }
              onToggle={() => toggleEstado(item)}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Icon name="people-outline" size={56} color="#c7d2fe" />
              <Text style={styles.emptyTitle}>Sin usuarios</Text>
              <Text style={styles.emptySub}>No hay usuarios registrados</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e7f5",
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: PRIMARY, justifyContent: "center", alignItems: "center" },
  contador: { paddingHorizontal: 20, paddingVertical: 8, fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    elevation: 2,
    shadowColor: "#153cc7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardName: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  cardCedula: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  tagsRow: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  rolTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  rolTagText: { fontSize: 11, fontWeight: "700" },
  statusTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 4 },
  statusActive: { backgroundColor: "#dcfce7" },
  statusInactive: { backgroundColor: "#f1f5f9" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },
  actions: { justifyContent: "center", alignItems: "center", gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#374151", marginTop: 16 },
  emptySub: { fontSize: 13, color: "#94a3b8", textAlign: "center", marginTop: 6 },
});
