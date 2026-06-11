import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { Snackbar } from "react-native-paper";
import Icon from "react-native-vector-icons/Ionicons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Repuesto } from "../../types/repuesto";
import { listarRepuestos, eliminarCantidadRepuesto } from "../../services/repuestoService";
import { useSnackbar } from "../../hooks/useSnackbar";

const PRIMARY = "#153cc7";
const BG = "#f0f4ff";

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  EN_BODEGA:     { label: "En bodega",      color: "#153cc7", bg: "#eef2ff" },
  PARA_REPARAR:  { label: "Para reparar",   color: "#d97706", bg: "#fffbeb" },
  EN_REPARACION: { label: "En reparación",  color: "#7c3aed", bg: "#f5f3ff" },
};

const CALIDAD_LABEL: Record<string, string> = {
  NUEVO: "Nuevo",
  DE_SEGUNDA: "De segunda",
};

function RepuestoCard({
  item,
  index,
  onEditar,
  onEliminar,
}: {
  item: Repuesto;
  index: number;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const estado = ESTADO_CONFIG[item.estado] ?? { label: item.estado, color: "#6b7280", bg: "#f3f4f6" };

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: Math.min(index, 8) * 70,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
      }}
    >
      <View style={styles.card}>
        {/* Acento izquierdo */}
        <View style={[styles.accent, { backgroundColor: estado.color }]} />

        <View style={styles.cardIcon}>
          <Icon name="construct-outline" size={28} color={PRIMARY} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.cardSub}>ID: {item.idRepuesto}</Text>

          <View style={styles.tagsRow}>
            <View style={[styles.tag, { backgroundColor: estado.bg }]}>
              <Text style={[styles.tagText, { color: estado.color }]}>{estado.label}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: "#f3f4f6" }]}>
              <Text style={[styles.tagText, { color: "#374151" }]}>
                {CALIDAD_LABEL[item.calidad] ?? item.calidad}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <MetaChip icon="layers-outline" value={`×${item.cantidad}`} />
            <MetaChip icon="pricetag-outline" value={item.marca} />
            <MetaChip icon="albums-outline" value={item.referencia?.idReferencia ?? "-"} />
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
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#dc2626" }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onEliminar(); }}
            activeOpacity={0.8}
          >
            <Icon name="remove-circle-outline" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

function MetaChip({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={styles.metaChip}>
      <Icon name={icon} size={11} color="#6b7280" />
      <Text style={styles.metaText}>{value}</Text>
    </View>
  );
}

const ListaRepuestos = () => {
  const router = useRouter();
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRef, setFiltroRef] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRepuesto, setSelectedRepuesto] = useState<Repuesto | null>(null);
  const [cantidadEliminar, setCantidadEliminar] = useState("");
  const modalAnim = useRef(new Animated.Value(0)).current;
  const snack = useSnackbar();

  useEffect(() => { cargar(); }, []);

  const cargar = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      else setRefreshing(true);
      const data = await listarRepuestos();
      setRepuestos(Array.isArray(data) ? data : []);
    } catch {
      snack.show("No se pudieron cargar los repuestos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filtrar = () => {
    const q = busqueda.trim().toLowerCase();
    const r = filtroRef.trim().toLowerCase();
    return repuestos.filter((item) => {
      const nombre = (item.nombre ?? "").toLowerCase();
      const ref = (item.referencia?.idReferencia ?? "").toLowerCase();
      return (q === "" || nombre.includes(q)) && (r === "" || ref.includes(r));
    });
  };

  const abrirModal = (rep: Repuesto) => {
    setSelectedRepuesto(rep);
    setCantidadEliminar("");
    setModalVisible(true);
    Animated.spring(modalAnim, { toValue: 1, tension: 65, friction: 12, useNativeDriver: true }).start();
  };

  const cerrarModal = () => {
    Animated.timing(modalAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setModalVisible(false)
    );
  };

  const confirmarEliminar = async () => {
    if (!selectedRepuesto) return;
    const n = parseInt(cantidadEliminar, 10);
    if (isNaN(n) || n <= 0) {
      snack.show("Ingresa un número mayor que 0");
      return;
    }

    const mensaje = `¿Eliminar ${n} unidad(es) de "${selectedRepuesto.nombre}"?`;

    const ejecutar = async () => {
      try {
        cerrarModal();
        await eliminarCantidadRepuesto(selectedRepuesto.idRepuesto, n);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        snack.show(`Se eliminaron ${n} unidad(es).`);
        cargar(true);
      } catch (err: any) {
        snack.show(err.response?.data || err.message || "No se pudo eliminar");
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(mensaje)) ejecutar();
    } else {
      Alert.alert("Confirmar", mensaje, [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: ejecutar },
      ]);
    }
  };

  const datos = filtrar();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }} activeOpacity={0.7}>
          <Icon name="arrow-back-outline" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Repuestos</Text>
        <TouchableOpacity
          onPress={() => router.push("/(admin)/RegistrarRepuesto")}
          style={styles.addBtn}
          activeOpacity={0.85}
        >
          <Icon name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Búsquedas */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Icon name="search-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Buscar por nombre..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <Icon name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.searchBox, { marginTop: 8 }]}>
          <Icon name="albums-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Filtrar por referencia..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={filtroRef}
            onChangeText={setFiltroRef}
            autoCapitalize="characters"
          />
          {filtroRef.length > 0 && (
            <TouchableOpacity onPress={() => setFiltroRef("")}>
              <Icon name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contador */}
      {!loading && (
        <Text style={styles.contador}>{datos.length} repuesto{datos.length !== 1 ? "s" : ""}</Text>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={{ marginTop: 12, color: "#94a3b8" }}>Cargando repuestos...</Text>
        </View>
      ) : (
        <FlatList
          data={datos}
          keyExtractor={(item) => item.idRepuesto}
          onRefresh={() => cargar(true)}
          refreshing={refreshing}
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
          renderItem={({ item, index }) => (
            <RepuestoCard
              item={item}
              index={index}
              onEditar={() =>
                router.push({ pathname: "/(admin)/editarRepuesto", params: { id: item.idRepuesto } })
              }
              onEliminar={() => abrirModal(item)}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Icon name="cube-outline" size={56} color="#c7d2fe" />
              <Text style={styles.emptyTitle}>Sin repuestos</Text>
              <Text style={styles.emptySub}>No hay repuestos que coincidan con la búsqueda</Text>
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

      {/* Modal eliminar cantidad */}
      <Modal visible={modalVisible} transparent animationType="none">
        <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={cerrarModal}>
          <Animated.View
            style={[
              modalStyles.sheet,
              {
                transform: [
                  { scale: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                ],
                opacity: modalAnim,
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={modalStyles.handle} />
              <Text style={modalStyles.title}>Reducir stock</Text>
              {selectedRepuesto && (
                <Text style={modalStyles.sub}>
                  {selectedRepuesto.nombre} · Stock actual:{" "}
                  <Text style={{ fontWeight: "700", color: PRIMARY }}>{selectedRepuesto.cantidad}</Text>
                </Text>
              )}
              <TextInput
                style={modalStyles.input}
                placeholder="Cantidad a retirar"
                placeholderTextColor="#94a3b8"
                value={cantidadEliminar}
                onChangeText={setCantidadEliminar}
                keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                autoFocus
              />
              <View style={modalStyles.btnRow}>
                <TouchableOpacity style={modalStyles.btnCancel} onPress={cerrarModal} activeOpacity={0.8}>
                  <Text style={modalStyles.btnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={modalStyles.btnDelete}
                  onPress={confirmarEliminar}
                  activeOpacity={0.85}
                >
                  <Icon name="remove-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={modalStyles.btnDeleteText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    width: "88%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#e1e7f5",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  sub: { color: "#64748b", fontSize: 13, marginBottom: 16 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e1e7f5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 20,
  },
  btnRow: { flexDirection: "row", gap: 10 },
  btnCancel: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnCancelText: { color: "#475569", fontWeight: "600" },
  btnDelete: {
    flex: 1,
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  btnDeleteText: { color: "#fff", fontWeight: "700" },
});

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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
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
  contador: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
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
  accent: { width: 4 },
  cardIcon: {
    width: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef2ff",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a", paddingTop: 12, paddingRight: 4 },
  cardSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  tagsRow: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: "600" },
  metaRow: { flexDirection: "row", gap: 6, marginTop: 8, marginBottom: 12, flexWrap: "wrap" },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11, color: "#6b7280" },
  actions: {
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 1,
  },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#374151", marginTop: 16 },
  emptySub: { fontSize: 13, color: "#94a3b8", textAlign: "center", marginTop: 6 },
});

export default ListaRepuestos;
