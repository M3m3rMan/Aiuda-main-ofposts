// components/auth.ts
import { auth, googleProvider } from './firebase';
import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export const useAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '1064574150351-3ovkrm8qhd88raml28iu5unlh685mfm0.apps.googleusercontent.com', // Replace with your actual Expo client ID
    iosClientId: '1064574150351-nvpn1ps57e8c2mc3vrql2kaojs16glv9.apps.googleusercontent.com', // Replace with your actual iOS client ID
    webClientId: '1064574150351-thn2hkt8gnabvbjrds2ssfu6qk1pcojt.apps.googleusercontent.com', // Replace with your actual Web client ID
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