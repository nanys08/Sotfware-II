import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Platform
} from "react-native";

import { DrawerLayout, GestureHandlerRootView } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";

export default function Home() {

  const router = useRouter();
  const drawerRef = useRef<any>(null);

  const [usuario, setUsuario] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {

      const cargarUsuario = async () => {
        try {

          const data = await AsyncStorage.getItem("usuario");

          if (data) {
            const user = JSON.parse(data);
            setUsuario(user);
          } else {
            router.replace("/login");
          }

        } catch (error) {

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

    try {

      await AsyncStorage.removeItem("usuario");

      Alert.alert("Sesión cerrada");
      router.replace("/login");

    } catch {

      Alert.alert("Error", "No se pudo cerrar sesión");

    }
  };

  const renderDrawer = () => (

    <SafeAreaView style={styles.drawerContainer}>

      <View style={styles.drawerHeader}>

        <Icon name="person-circle-outline" size={80} color="#fff" />

        <Text style={styles.drawerTitle}>{usuario?.nombre}</Text>

        <Text style={styles.drawerSubtitle}>{usuario?.rol}</Text>

      </View>

      <View style={styles.drawerBody}>

        {usuario?.rol === "ADMIN" && (

          <>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                drawerRef.current?.closeDrawer();
                router.push("/(admin)/ListaUsuarios");
              }}
            >
              <Icon name="people-outline" size={22} color="#153cc7" />
              <Text style={styles.drawerText}>Lista de Usuarios</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                drawerRef.current?.closeDrawer();
                router.push("/(admin)/RegistrarUsuario");
              }}
            >
              <Icon name="person-add-outline" size={22} color="#153cc7" />
              <Text style={styles.drawerText}>Registrar Usuario</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                drawerRef.current?.closeDrawer();
                router.push("/(admin)/ListaReferencias");
              }}
            >
              <Icon name="albums-outline" size={22} color="#153cc7" />
              <Text style={styles.drawerText}>Lista de Referencias</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                drawerRef.current?.closeDrawer();
                router.push("/(admin)/registrarReferencia");
              }}
            >
              <Icon name="add-circle-outline" size={22} color="#153cc7" />
              <Text style={styles.drawerText}>Registrar Referencia</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                drawerRef.current?.closeDrawer();
                router.push("/(admin)/ListaRepuestos");
              }}
            >
              <Icon name="list-outline" size={22} color="#153cc7" />
              <Text style={styles.drawerText}>Lista de Repuestos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                drawerRef.current?.closeDrawer();
                router.push("/(admin)/RegistrarRepuesto");
              }}
            >
              <Icon name="construct-outline" size={22} color="#153cc7" />
              <Text style={styles.drawerText}>Registrar Repuesto</Text>
            </TouchableOpacity>

          </>
        )}

        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => {
            drawerRef.current?.closeDrawer();
            router.push("/(user)/EditarUsuario");
          }}
        >
          <Icon name="create-outline" size={22} color="#153cc7" />
          <Text style={styles.drawerText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.drawerItem, { marginTop: 20 }]}
          onPress={handleLogout}
        >
          <Icon name="exit-outline" size={22} color="red" />
          <Text style={[styles.drawerText, { color: "red" }]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>

  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#153cc7" />
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  const mainContent = (

    <SafeAreaView style={styles.container}>

      <View style={styles.pathBar}>
        <Text style={styles.pathText}>🏠 Home / Inicio</Text>
      </View>

      <View style={styles.header}>

        {Platform.OS !== "web" && (
          <TouchableOpacity onPress={() => drawerRef.current?.openDrawer()}>
            <Icon name="menu-outline" size={32} color="#153cc7" />
          </TouchableOpacity>
        )}

        <Text style={styles.headerText}>Inicio</Text>

      </View>

      <View style={styles.content}>

        <Text style={styles.welcomeText}>
          Hola, {usuario?.nombre}
        </Text>

        <Text style={styles.subText}>
          Cédula: {usuario?.cedula}
        </Text>

        <Text style={styles.subText}>
          Correo: {usuario?.correo}
        </Text>

        <Text style={styles.subText}>
          Rol: {usuario?.rol}
        </Text>

      </View>

    </SafeAreaView>
  );

  if (Platform.OS === "web") {

    return (

      <View style={{ flex: 1, flexDirection: "row" }}>

        <View style={{ width: 260 }}>
          {renderDrawer()}
        </View>

        <View style={{ flex: 1 }}>
          {mainContent}
        </View>

      </View>

    );
  }

  return (

    <GestureHandlerRootView style={{ flex: 1 }}>

      <DrawerLayout
        ref={drawerRef}
        drawerWidth={260}
        drawerPosition="left"
        renderNavigationView={renderDrawer}
      >

        {mainContent}

      </DrawerLayout>

    </GestureHandlerRootView>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F4F6FA"
  },

  pathBar: {
    backgroundColor: "#e9edf7",
    paddingVertical: 6,
    paddingHorizontal: 15
  },

  pathText: {
    fontSize: 13,
    color: "#4b5563"
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff"
  },

  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#153cc7",
    marginLeft: 10
  },

  content: {
    flex: 1,
    padding: 20
  },

  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#153cc7"
  },

  subText: {
    fontSize: 16,
    marginTop: 8
  },

  drawerContainer: {
    flex: 1,
    backgroundColor: "#fff"
  },

  drawerHeader: {
    backgroundColor: "#153cc7",
    alignItems: "center",
    paddingVertical: 30
  },

  drawerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold"
  },

  drawerSubtitle: {
    color: "#cbd5e1"
  },

  drawerBody: {
    padding: 15
  },

  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12
  },

  drawerText: {
    fontSize: 16,
    marginLeft: 12,
    color: "#153cc7"
  }

});