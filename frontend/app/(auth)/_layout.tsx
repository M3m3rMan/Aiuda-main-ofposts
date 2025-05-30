// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {

  console.log('we are in (auth) now!')
  return (
    <Stack initialRouteName = "Signup">
      <Stack.Screen name="Login" options={{ headerShown: false }} />
      <Stack.Screen name="Signup" options={{ headerShown: false }} />
      <Stack.Screen name="AuthLoading" options={{ headerShown: false }} />
    </Stack>
  );
}