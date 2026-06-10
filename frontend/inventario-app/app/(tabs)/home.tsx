import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Animated,
} from "react-native";
import { DrawerLayout, GestureHandlerRootView } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

const PRIMARY = "#153cc7";
const BG = "#f0f4ff";

type NavItem = {
  icon: string;
  label: string;
  route: string;
  color: string;
};

const ADMIN_NAV: NavItem[] = [
  { icon: "people-outline", label: "Lista de Usuarios", route: "/(admin)/ListaUsuarios", color: "#153cc7" },
  { icon: "person-add-outline", label: "Registrar Usuario", route: "/(admin)/RegistrarUsuario", color: "#059669" },
  { icon: "albums-outline", label: "Lista de Referencias", route: "/(admin)/ListaReferencias", color: "#7c3aed" },
  { icon: "add-circle-outline", label: "Registrar Referencia", route: "/(admin)/registrarReferencia", color: "#d97706" },
  { icon: "construct-outline", label: "Lista de Repuestos", route: "/(admin)/ListaRepuestos", color: "#0891b2" },
  { icon: "add-outline", label: "Registrar Repuesto", route: "/(admin)/RegistrarRepuesto", color: "#be185d" },
];

const ROL_COLOR: Record<string, string> = {
  ADMIN: "#153cc7",
  TECNICO: "#059669",
};

export default function Home() {
  const router = useRouter();
  const drawerRef = useRef<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useFocusEffect(
    useCallback(() => {
      const cargarUsuario = async () => {
        try {
          const data = await AsyncStorage.getItem("usuario");
          if (data) {
            setUsuario(JSON.parse(data));
            Animated.parallel([
              Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
              Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
            ]).start();
          } else {
            router.replace("/login");
          }
        } catch {
          Alert.alert("Error", "No se pudo cargar el usuario");
          router.replace("/login");
        } finally {
          setLoading(false);
        }
      };
      cargarUsuario();
    }, [])
  );

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Cerrar sesión", "¿Seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("usuario");
          router.replace("/login");
        },
      },
    ]);
  };

  const navTo = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    drawerRef.current?.closeDrawer();
    router.push(route as any);
  };

  const renderDrawer = () => (
    <SafeAreaView style={drawerStyles.container}>
      {/* Header del drawer */}
      <View style={drawerStyles.header}>
        <View style={drawerStyles.avatar}>
          <Icon name="person" size={36} color="#fff" />
        </View>
        <Text style={drawerStyles.name}>{usuario?.nombre}</Text>
        <View style={[drawerStyles.rolBadge, { backgroundColor: ROL_COLOR[usuario?.rol] ?? PRIMARY }]}>
          <Text style={drawerStyles.rolText}>{usuario?.rol}</Text>
        </View>
        <Text style={drawerStyles.cedula}>Cédula: {usuario?.cedula}</Text>
      </View>

      {/* Navegación */}
      <View style={drawerStyles.nav}>
        {usuario?.rol === "ADMIN" &&
          ADMIN_NAV.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={drawerStyles.navItem}
              onPress={() => navTo(item.route)}
              activeOpacity={0.75}
            >
              <View style={[drawerStyles.navIcon, { backgroundColor: item.color + "18" }]}>
                <Icon name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={drawerStyles.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}

        <TouchableOpacity
          style={drawerStyles.navItem}
          onPress={() => navTo("/(user)/EditarUsuario")}
          activeOpacity={0.75}
        >
          <View style={[drawerStyles.navIcon, { backgroundColor: "#47556918" }]}>
            <Icon name="create-outline" size={20} color="#475569" />
          </View>
          <Text style={drawerStyles.navLabel}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={drawerStyles.logout} onPress={handleLogout} activeOpacity={0.8}>
        <Icon name="log-out-outline" size={20} color="#dc2626" />
        <Text style={drawerStyles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG }}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={{ marginTop: 12, color: "#475569" }}>Cargando perfil...</Text>
      </View>
    );
  }

  const mainContent = (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* Top bar */}
      <View style={styles.topBar}>
        {Platform.OS !== "web" && (
          <TouchableOpacity
            onPress={() => drawerRef.current?.openDrawer()}
            style={styles.menuBtn}
            activeOpacity={0.8}
          >
            <Icon name="menu-outline" size={26} color={PRIMARY} />
          </TouchableOpacity>
        )}
        <Text style={styles.topTitle}>Inicio</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.menuBtn} activeOpacity={0.8}>
          <Icon name="log-out-outline" size={22} color="#dc2626" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Bienvenida */}
        <Animated.View style={[styles.welcomeCard, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.welcomeLeft}>
            <Text style={styles.welcomeHi}>Hola, 👋</Text>
            <Text style={styles.welcomeName}>{usuario?.nombre}</Text>
            <View style={[styles.rolPill, { backgroundColor: ROL_COLOR[usuario?.rol] ?? PRIMARY }]}>
              <Text style={styles.rolPillText}>{usuario?.rol}</Text>
            </View>
          </View>
          <View style={styles.welcomeIcon}>
            <Icon name="person-circle-outline" size={70} color={PRIMARY} />
          </View>
        </Animated.View>

        {/* Info */}
        <View style={styles.infoCard}>
          <InfoRow icon="card-outline" label="Cédula" value={usuario?.cedula} />
          <View style={styles.divider} />
          <InfoRow icon="mail-outline" label="Correo" value={usuario?.correo} />
          <View style={styles.divider} />
          <InfoRow icon="shield-checkmark-outline" label="Rol" value={usuario?.rol} />
        </View>

        {/* Accesos rápidos (solo ADMIN) */}
        {usuario?.rol === "ADMIN" && (
          <>
            <Text style={styles.sectionTitle}>Acceso rápido</Text>
            <View style={styles.grid}>
              {ADMIN_NAV.map((item, i) => (
                <Animated.View
                  key={i}
                  style={[styles.gridCardWrap, { opacity: fadeAnim }]}
                >
                  <TouchableOpacity
                    style={styles.gridCard}
                    onPress={() => navTo(item.route)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.gridIcon, { backgroundColor: item.color + "18" }]}>
                      <Icon name={item.icon} size={26} color={item.color} />
                    </View>
                    <Text style={styles.gridLabel}>{item.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );

  if (Platform.OS === "web") {
    return (
      <View style={{ flex: 1, flexDirection: "row" }}>
        <View style={{ width: 280 }}>{renderDrawer()}</View>
        <View style={{ flex: 1 }}>{mainContent}</View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DrawerLayout
        ref={drawerRef}
        drawerWidth={285}
        drawerPosition="left"
        renderNavigationView={renderDrawer}
      >
        {mainContent}
      </DrawerLayout>
    </GestureHandlerRootView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10 }}>
      <Icon name={icon} size={18} color="#153cc7" style={{ marginRight: 10 }} />
      <Text style={{ color: "#94a3b8", fontSize: 13, width: 60 }}>{label}</Text>
      <Text style={{ color: "#0f172a", fontSize: 14, fontWeight: "600", flex: 1 }}>{value ?? "-"}</Text>
    </View>
  );
}

const drawerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: PRIMARY,
    padding: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  name: { color: "#fff", fontSize: 18, fontWeight: "700" },
  rolBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
  },
  rolText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  cedula: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 6 },
  nav: { padding: 16, flex: 1 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  navLabel: { fontSize: 14, color: "#0f172a", fontWeight: "500" },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 10,
  },
  logoutText: { color: "#dc2626", fontSize: 15, fontWeight: "600" },
});

const styles = StyleSheet.create({
  topBar: {
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
  menuBtn: { padding: 4 },
  topTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  content: { padding: 16, paddingBottom: 40 },
  welcomeCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    elevation: 3,
    shadowColor: "#153cc7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  welcomeLeft: { flex: 1 },
  welcomeHi: { fontSize: 14, color: "#94a3b8" },
  welcomeName: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginTop: 2 },
  rolPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 8,
  },
  rolPillText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  welcomeIcon: { marginLeft: 12 },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  divider: { height: 1, backgroundColor: "#f1f5f9" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridCardWrap: { width: "47%" },
  gridCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  gridIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
});
