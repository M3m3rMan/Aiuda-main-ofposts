// app/screens/AuthLoadingScreen.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../components/firebase';

export default function AuthLoadingScreen({ navigation }: { navigation: any }) {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is logged in with Firebase
        const user = auth.currentUser;
        
        if (user) {
          // User is logged in, navigate to main app
          navigation.replace('(tabs)');
        } else {
          // No user logged in, navigate to login
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigation.replace('Login');
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