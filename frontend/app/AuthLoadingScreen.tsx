// app/screens/AuthLoadingScreen.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../components/firebase';

export default function AuthLoadingScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = auth.currentUser;

        if (user) {
          // Navigate to the tabs/home
          router.replace('/(tabs)');
        } else {
          // Navigate to login
          router.replace('/screens/LoginScreen');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/screens/LoginScreen');
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00529B" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
