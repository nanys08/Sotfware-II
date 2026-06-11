// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Slot, Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const verificarSesion = async () => {
      const usuario = await AsyncStorage.getItem('usuario');
      setIsLoggedIn(!!usuario);
    };
    verificarSesion();
  }, []);

  if (isLoggedIn === null) return null; // ⏳ Esperando verificación

  return (
    <PaperProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          // 👇 Muestra las tabs solo si hay sesión
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          // 👇 Solo muestra el login si NO hay sesión
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        )}
      </Stack>
    </PaperProvider>
  );
}
