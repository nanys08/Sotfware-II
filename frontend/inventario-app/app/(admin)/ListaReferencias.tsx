import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { Snackbar } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Icon from "react-native-vector-icons/Ionicons";
import { obtenerReferenciasActivas, obtenerReferenciasInactivas, actualizarReferencia } from "../../services/referenciaService";
import { useSnackbar } from "../../hooks/useSnackbar";

const PRIMARY = "#153cc7";
const BG = "#f0f4ff";

function RefCard({ item, index, onEditar, onToggle, loadingId }: any) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: Math.min(index, 8) * 65,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const isActive = item.activo;
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }}
    >
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: isActive ? PRIMARY : "#94a3b8" }]} />
        <View style={styles.cardIcon}>
          <Icon name="albums-outline" size={26} color={isActive ? PRIMARY : "#94a3b8"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{item.nombre}</Text>
          <Text style={styles.cardId}>ID: {item.idReferencia}</Text>
          <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
            <View style={[styles.dot, { backgroundColor: isActive ? "#059669" : "#94a3b8" }]} />
            <Text style={[styles.badgeText, { color: isActive ? "#059669" : "#6b7280" }]}>
              {isActive ? "Activa" : "Inactiva"}
            </Text>
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
          {loadingId === item.idReferencia ? (
            <View style={[styles.actionBtn, { backgroundColor: "#f1f5f9" }]}>
              <ActivityIndicator size="small" color={PRIMARY} />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isActive ? "#fee2e2" : "#dcfce7" }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onToggle(); }}
              activeOpacity={0.8}
            >
              <Icon name={isActive ? "pause-outline" : "play-outline"} size={15} color={isActive ? "#dc2626" : "#059669"} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default function ListaReferencias() {
  const router = useRouter();
  const [referencias, setReferencias] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [mostrarActivas, setMostrarActivas] = useState(true);
  const tabAnim = useRef(new Animated.Value(0)).current;
  const snack = useSnackbar();

  useEffect(() => { verificar(); }, []);
  useEffect(() => { cargar(); }, [mostrarActivas]);

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
      const lista = mostrarActivas ? await obtenerReferenciasActivas() : await obtenerReferenciasInactivas();
      setReferencias(
        Array.isArray(lista)
          ? lista.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }))
          : []
      );
    } catch {
      snack.show("No se pudieron cargar las referencias");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const switchTab = (activas: boolean) => {
    Haptics.selectionAsync();
    Animated.spring(tabAnim, {
      toValue: activas ? 0 : 1,
      tension: 70,
      friction: 12,
      useNativeDriver: false,
    }).start();
    setMostrarActivas(activas);
  };

  const toggleEstado = async (ref: any) => {
    const accion = ref.activo ? "desactivar" : "activar";
    const mensaje = `¿Seguro que deseas ${accion} "${ref.nombre}"?`;

    const ejecutarToggle = async () => {
      setLoadingId(ref.idReferencia);
      try {
        await actualizarReferencia(ref.idReferencia, { ...ref, activo: !ref.activo });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setReferencias((prev) => prev.filter((r) => r.idReferencia !== ref.idReferencia));
      } catch {
        snack.show("No se pudo actualizar la referencia");
      } finally {
        setLoadingId(null);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(mensaje)) ejecutarToggle();
    } else {
      Alert.alert("Confirmar", mensaje, [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: ejecutarToggle },
      ]);
    }
  };

  const filtradas = referencias.filter((ref) => {
    const q = searchText.toLowerCase();
    return ref.nombre.toLowerCase().includes(q) || String(ref.idReferencia).toLowerCase().includes(q);
  });

  const tabIndicatorLeft = tabAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "50%"] });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }} activeOpacity={0.7}>
          <Icon name="arrow-back-outline" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referencias</Text>
        <TouchableOpacity
          onPress={() => router.push("/(admin)/registrarReferencia")}
          style={styles.addBtn}
          activeOpacity={0.85}
        >
          <Icon name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Animated.View style={[styles.tabIndicator, { left: tabIndicatorLeft }]} />
        <TouchableOpacity style={styles.tab} onPress={() => switchTab(true)} activeOpacity={0.8}>
          <Text style={[styles.tabText, mostrarActivas && styles.tabTextActive]}>Activas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => switchTab(false)} activeOpacity={0.8}>
          <Text style={[styles.tabText, !mostrarActivas && styles.tabTextActive]}>Inactivas</Text>
        </TouchableOpacity>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Icon name="search-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar referencia..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Icon name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!loading && (
        <Text style={styles.contador}>{filtradas.length} referencia{filtradas.length !== 1 ? "s" : ""}</Text>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={{ marginTop: 12, color: "#94a3b8" }}>Cargando referencias...</Text>
        </View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => item.idReferencia}
          onRefresh={() => cargar(true)}
          refreshing={refreshing}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <RefCard
              item={item}
              index={index}
              loadingId={loadingId}
              onEditar={() =>
                router.push({ pathname: "/(admin)/editarReferencia", params: { idReferencia: item.idReferencia } })
              }
              onToggle={() => toggleEstado(item)}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Icon name="albums-outline" size={56} color="#c7d2fe" />
              <Text style={styles.emptyTitle}>Sin referencias</Text>
              <Text style={styles.emptySub}>
                No hay referencias {mostrarActivas ? "activas" : "inactivas"}
              </Text>
            </View>
          )}
        />
      )}

      <Snackbar
        visible={snack.visible}
        onDismiss={snack.hide}
        duration={3500}
        style={{ backgroundColor: '#1e293b' }}
        theme={{ colors: { inverseSurface: '#1e293b', inverseOnSurface: '#ffffff' } }}
      >
        {snack.message}
      </Snackbar>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: PRIMARY, justifyContent: "center", alignItems: "center" },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#e1e7f5",
    borderRadius: 12,
    padding: 3,
    position: "relative",
    height: 42,
  },
  tabIndicator: {
    position: "absolute",
    top: 3,
    width: "50%",
    height: 36,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: { flex: 1, justifyContent: "center", alignItems: "center", zIndex: 1 },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: PRIMARY, fontWeight: "700" },
  searchContainer: { paddingHorizontal: 16, paddingTop: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e1e7f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, color: "#0f172a", fontSize: 14 },
  contador: { paddingHorizontal: 20, paddingVertical: 8, fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#153cc7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  cardAccent: { width: 4 },
  cardIcon: { width: 52, justifyContent: "center", alignItems: "center", backgroundColor: "#eef2ff" },
  cardName: { fontSize: 15, fontWeight: "700", color: "#0f172a", paddingTop: 14 },
  cardId: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 6, marginBottom: 14, gap: 4 },
  badgeActive: { backgroundColor: "#dcfce7" },
  badgeInactive: { backgroundColor: "#f1f5f9" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  actions: { justifyContent: "center", alignItems: "center", padding: 12, gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#374151", marginTop: 16 },
  emptySub: { fontSize: 13, color: "#94a3b8", textAlign: "center", marginTop: 6 },
});
