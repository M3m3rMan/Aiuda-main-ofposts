// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {

  console.log('we are in screens now!')
  return (
    <Stack>
      <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
      <Stack.Screen name="Signup" options={{ headerShown: false }} />
    </Stack>
  );
}