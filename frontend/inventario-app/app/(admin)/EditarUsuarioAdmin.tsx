import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { actualizarUsuario, obtenerUsuarioPorId } from '../../services/usuarioService';

export default function EditarUsuarioAdmin() {
  const router = useRouter();
  const { idUsuario } = useLocalSearchParams();
  const [usuarioAdmin, setUsuarioAdmin] = useState<any>(null);
  const [usuarioEditado, setUsuarioEditado] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [rol, setRol] = useState('');

  // Verificar que el usuario sea ADMIN
  useEffect(() => {
    const verificarAcceso = async () => {
      const data = await AsyncStorage.getItem('usuario');
      if (!data) {
        Alert.alert('Sesión expirada', 'Debes iniciar sesión nuevamente.');
        router.replace('/login');
        return;
      }
      const user = JSON.parse(data);
      if (user.rol !== 'ADMIN') {
        Alert.alert('Acceso denegado', 'Solo los administradores pueden editar usuarios.');
        router.replace('/home');
        return;
      }
      setUsuarioAdmin(user);
    };
    verificarAcceso();
  }, []);

  // Cargar datos del usuario a editar
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        if (!idUsuario) return;

        const idValido =
          Array.isArray(idUsuario) ? parseInt(idUsuario[0]) : parseInt(idUsuario as string);

        if (isNaN(idValido)) return;

        const data = await obtenerUsuarioPorId(idValido);

        setUsuarioEditado(data);
        setNombre(data.nombre);
        setCedula(data.cedula.toString());
        setCorreo(data.correo);
        setRol(data.rol);
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar la información del usuario.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    cargarUsuario();
  }, [idUsuario]);

  // Actualizar usuario
  const handleActualizar = async () => {
    if (!nombre || !correo || !rol) {
      Alert.alert('Error', 'Por favor llena todos los campos requeridos (excepto la contraseña).');
      return;
    }

    try {
      const idValido =
        Array.isArray(idUsuario) ? parseInt(idUsuario[0]) : parseInt(idUsuario as string);

      if (isNaN(idValido)) {
        Alert.alert('Error', 'ID de usuario inválido.');
        return;
      }

      const datosActualizados: Record<string, any> = {
        nombre,
        cedula,
        correo,
        rol: rol.toUpperCase(),
      };

      if (contrasena.trim() !== '') {
        datosActualizados.contrasena = contrasena;
      }

      await actualizarUsuario(idValido, datosActualizados);
      Alert.alert('Éxito', 'Usuario actualizado correctamente.');
      router.push('/ListaUsuarios');
    } catch (error: any) {
      const mensajeError =
        error.response?.data ||
        error.response?.data?.message ||
        'No se pudo actualizar el usuario.';

      Alert.alert('Error', mensajeError);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando usuario...</Text>
      </View>
    );
  }

  if (!usuarioEditado) {
    return (
      <View style={styles.container}>
        <Text>No se encontró el usuario.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Usuario</Text>

      <TextInput
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
        style={styles.input}
      />

      {/* 🚫 CÉDULA NO EDITABLE */}
      <TextInput
        placeholder="Cédula"
        value={cedula}
        editable={false}               // NO editable
        selectTextOnFocus={false}      // No deja seleccionar
        style={[styles.input, styles.disabledInput]} // Gris
      />

      <TextInput
        placeholder="Correo"
        value={correo}
        onChangeText={setCorreo}
        style={styles.input}
      />

      <TextInput
        placeholder="Nueva contraseña (opcional)"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
        style={styles.input}
      />

      <TextInput
        placeholder="Rol (ADMIN o TECNICO)"
        value={rol}
        onChangeText={setRol}
        style={styles.input}
      />

      <View style={styles.buttonContainer}>
        <Button title="Actualizar Usuario" onPress={handleActualizar} />
      </View>

      <View style={{ marginTop: 10 }}>
        <Button title="Cancelar" color="gray" onPress={() => router.push('/ListaUsuarios')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  disabledInput: {
    backgroundColor: '#eee',
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
});
