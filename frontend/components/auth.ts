// components/auth.ts
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export const useAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_EXPO_CLIENT_ID', // Replace with your actual Expo client ID
    iosClientId: 'YOUR_IOS_CLIENT_ID', // Replace with your actual iOS client ID
    androidClientId: 'YOUR_ANDROID_CLIENT_ID', // Replace with your actual Android client ID
    webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with your actual Web client ID
  });

  const signInWithGoogle = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        // Handle Google sign-in result here
      }
    } catch (e) {
      // Handle error
    }
  };

  return { signInWithGoogle };
};