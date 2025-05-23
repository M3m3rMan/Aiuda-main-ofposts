// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/auth';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}

function Layout() {
  const { isLoading, backendConnected } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a56db" />
        <Text style={styles.loadingText}>Loading application...</Text>
      </View>
    );
  }

  if (!backendConnected) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorText}>
          Could not connect to the server. Please check:
        </Text>
        <Text style={styles.errorBullet}>- Your network connection</Text>
        <Text style={styles.errorBullet}>- That the backend server is running</Text>
        <Text style={styles.errorText}>Then restart the app.</Text>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  loadingText: {
    marginTop: 20,
    color: '#333'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white'
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center'
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center'
  },
  errorBullet: {
    fontSize: 14,
    color: '#333',
    marginLeft: 20,
    marginBottom: 5
  }
});