import { Redirect } from 'expo-router';
import { useAuth } from '@/components/AuthProvider';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  // Always redirect to login screen on app load
  return <Redirect href="/screens/LoginScreen" />;
}