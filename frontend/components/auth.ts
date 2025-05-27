// components/auth.ts
import { auth, googleProvider } from './firebase';
import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
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
        const { id_token } = result.params;
        const credential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, credential);
        await AsyncStorage.setItem('userToken', userCredential.user.uid);
        return userCredential.user;
      }
      return null;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return null;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userToken');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return { signInWithGoogle, logout, response };
};