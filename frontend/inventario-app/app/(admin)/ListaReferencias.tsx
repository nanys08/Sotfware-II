import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Button,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import {
  obtenerReferenciasActivas,
  obtenerReferenciasInactivas,
  obtenerReferenciaPorId,
  actualizarReferencia
} from "../../services/referenciaService";

export default function ListaReferencias() {
  const [referencias, setReferencias] = useState<any[]>([]);
  const [referenciasFiltradas, setReferenciasFiltradas] = useState<any[]>([]);
  const [searchText, setSearchText] = useState<string>(""); // ahora nombre claro
  const [usuarioActual, setUsuarioActual] = useState<any | null>(null);

  const [loadingLista, setLoadingLista] = useState(false);
  const [loadingAccionId, setLoadingAccionId] = useState<string | null>(null);

  const [mostrarActivas, setMostrarActivas] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verificarYcargar = async () => {
      const data = await AsyncStorage.getItem("usuario");

      if (!data) {
        Alert.alert("Sesión expirada", "Debes iniciar sesión nuevamente.");
        router.replace("/login");
        return;
      }

      const user = JSON.parse(data);
      setUsuarioActual(user);

      if (user.rol !== "ADMIN") {
        Alert.alert("Acceso denegado", "Solo los administradores pueden ver esta sección.");
        router.replace("/home");
        return;
      }

      await cargarReferencias();
    };

    verificarYcargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarActivas]);

  const cargarReferencias = async () => {
    try {
      setLoadingLista(true);
      let lista = mostrarActivas
        ? await obtenerReferenciasActivas()
        : await obtenerReferenciasInactivas();

      // ordenar por nombre (opcional)
      const listaOrdenada = Array.isArray(lista)
        ? lista.sort((a: any, b: any) =>
            String(a.nombre).localeCompare(String(b.nombre), "es", { sensitivity: "base" })
          )
        : [];

      setReferencias(listaOrdenada);
      setReferenciasFiltradas(listaOrdenada);
    } catch (error) {
      console.error("Error al cargar referencias:", error);
      Alert.alert("Error", "No se pudo cargar la lista de referencias.");
    } finally {
      setLoadingLista(false);
    }
  };

  // Filtrado: por idReferencia y (opcional) por nombre
  useEffect(() => {
    const q = (searchText || "").trim().toLowerCase();

    if (q === "") {
      setReferenciasFiltradas(referencias);
      return;
    }

    const lista = referencias.filter((ref) => {
      const idRef = String(ref.idReferencia ?? "").toLowerCase();
      const nombre = String(ref.nombre ?? "").toLowerCase();

      // busca por idReferencia o por nombre
      return idRef.includes(q) || nombre.includes(q);
    });

    setReferenciasFiltradas(lista);
  }, [searchText, referencias]);

  // Toggle estado (activar/desactivar) — usa obtenerReferenciaPorId y actualizarReferencia desde el backend
  const toggleEstado = (ref: any) => {
  Alert.alert(
    ref.activo ? "Desactivar referencia" : "Activar referencia",
    `¿Estás seguro de ${ref.activo ? "desactivar" : "activar"} "${ref.nombre}"?`,
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Aceptar",
        onPress: async () => {
          setLoadingAccionId(ref.idReferencia);
          try {

            const payload = {
              idReferencia: ref.idReferencia,
              nombre: ref.nombre,
              activo: !ref.activo,
            };

            await actualizarReferencia(ref.idReferencia, payload);

            Alert.alert(
              "Éxito",
              `Referencia ${payload.activo ? "activada" : "desactivada"} correctamente.`
            );

            await cargarReferencias();

          } catch (error) {
            console.error("Error al cambiar estado:", error);
            Alert.alert("Error", "No se pudo cambiar el estado.");
          } finally {
            setLoadingAccionId(null);
          }
        },
      },
    ]
  );
};

  const renderReferencia = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.nombre}>{item.nombre}</Text>

      {/* mostrar idReferencia (no 'codigo') */}
      <Text>ID Referencia: {String(item.idReferencia)}</Text>
      <Text>Estado: {item.activo ? "Activa" : "Inactiva"}</Text>

      <View style={styles.botones}>
        {/* EDITAR: enviamos el param idReferencia (nombre exacto) */}
        <Button
          title="Editar"
          onPress={() =>
            router.push({
              pathname: "/editarReferencia",
              params: { idReferencia: item.idReferencia }, // <-- CAMBIO: antes usabas "id"
            })
          }
        />

        <View style={{ width: 120 }}>
          {loadingAccionId === item.idReferencia ? (
            <ActivityIndicator size="small" />
          ) : (
            <Button
              title={item.activo ? "Desactivar" : "Activar"}
              color={item.activo ? "red" : "green"}
              onPress={() => toggleEstado(item)}
            />
          )}
        </View>
      </View>
    </View>
  );

  if (loadingLista) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" />
        <Text>Cargando referencias...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Referencias</Text>

      <Button
        title={
          mostrarActivas ? "Mostrando: ACTIVAS (ver INACTIVAS)" : "Mostrando: INACTIVAS (ver ACTIVAS)"
        }
        onPress={() => setMostrarActivas(!mostrarActivas)}
        color={mostrarActivas ? "green" : "red"}
      />

      <TextInput
        style={styles.input}
        placeholder="Buscar por idReferencia o nombre..."
        value={searchText}
        onChangeText={setSearchText}
        autoCapitalize="characters"
      />

      <FlatList
        data={referenciasFiltradas}
        renderItem={renderReferencia}
        keyExtractor={(item) => String(item.idReferencia)}
        ListEmptyComponent={() => (
          <Text style={{ textAlign: "center", marginTop: 10 }}>
            No hay referencias {mostrarActivas ? "activas" : "inactivas"}.
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  nombre: { fontWeight: "bold", fontSize: 16 },
  botones: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
});
