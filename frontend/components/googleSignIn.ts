import { auth } from './firebase';
import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';


WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '87766396469-n2sld10s99ssgouk6rvghpbj8l0oflgg.apps.googleusercontent.com',
    iosClientId: '87766396469-n2sld10s99ssgouk6rvghpbj8l0oflgg.apps.googleusercontent.com',
    webClientId: '1064574150351-thn2hkt8gnabvbjrds2ssfu6qk1pcojt.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({
      path: 'redirect',
      native: 'frontend://redirect'
    })
    
  });

  const signInWithGoogle = async () => {
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        const { idToken } = result.params;
        const credential = GoogleAuthProvider.credential(idToken);
        return await signInWithCredential(auth, credential);
      }
      return null;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };
  

  return { signInWithGoogle, logout, isSigningIn: request !== null && response === null };
}