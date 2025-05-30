// LoginScreen.tsx
import React, { useState, useEffect } from 'react'; // Import useEffect
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Platform, Alert } from 'react-native';
import { useGoogleAuth } from '@/components/googleSignIn';
import { Link } from 'expo-router';
import { LAUSD_BLUE, LAUSD_GOLD } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from "@react-native-google-signin/google-signin";

const API_BASE = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://192.168.1.78:3000';

// Configure Google Sign-In (place your actual client IDs here)
GoogleSignin.configure({
  webClientId:
    "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
  iosClientId:
    "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
});

export default function LoginScreen() {
  const { signInWithGoogle, isSigningIn } = useGoogleAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();

  // New state to track Google Sign-In loading
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Login successful!');
        router.replace('/');
      } else {
        setMessage(data.error || 'Login failed.');
      }
    } catch (err) {
      setMessage('Network error.');
    }
    setIsLoggingIn(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      console.log("Google User Info:", userInfo);
      // After successful Google Sign-In, you might want to:
      // 1. Send the Google user info to your backend for authentication/user creation.
      // 2. Store the user info in local storage.
      // 3. Navigate to the main part of your app.
      setMessage('Google sign-in successful!');
      router.replace('/'); // Navigate to home or main screen
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            Alert.alert("Cancelled", "Google sign-in was cancelled.");
            break;
          case statusCodes.IN_PROGRESS:
            Alert.alert("In Progress", "Google sign-in is already in progress.");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert("Error", "Play Services not available or outdated.");
            break;
          default:
            Alert.alert("Error", "An unknown error occurred during Google sign-in.");
        }
      } else {
        Alert.alert("Error", "Something went wrong with Google sign-in. Please try again.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Aiuda</Text>
        <Text style={styles.title}>¡Bienvenido!</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.signupButton}
        onPress={handleLogin}
        disabled={isLoggingIn}
      >
        <Text style={styles.signupButtonText}>
          {isLoggingIn ? 'Logging In...' : 'Log In'}
        </Text>
      </TouchableOpacity>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        <Ionicons name="logo-google" size={24} color="#DB4437" />
        <Text style={styles.googleButtonText}>
          {isGoogleLoading ? 'Signing In...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Nuevo aquí?</Text>
        <Link href="/screens/SignupScreen" asChild>
          <TouchableOpacity>
            <Text style={styles.signupLink}>
              Inscribirse
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: LAUSD_BLUE,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    width: '100%',
    color: '#000', // Ensure text is visible
  },
  signupButton: {
    backgroundColor: LAUSD_GOLD,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  signupButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    width: '100%',
  },
  googleButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
    marginRight: 5,
  },
  signupLink: {
    color: LAUSD_GOLD,
    fontWeight: 'bold',
  },
  message: {
    color: 'red',
    marginBottom: 8,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#888',
    fontWeight: 'bold',
  },
  Placeholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  }
});