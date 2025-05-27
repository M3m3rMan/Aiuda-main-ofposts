import { Redirect } from 'expo-router';
import { useAuth } from '@/components/AuthProvider';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00529B" />
      </View>
    );
  }

  return user ? <Redirect href="/home" /> : <Redirect href="/login" />;
}