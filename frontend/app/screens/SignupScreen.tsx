// app/signup.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as GoogleSignin from 'expo-auth-session/providers/google';
import { Link, useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
const { GoogleSignin: RNGoogleSignin } = require('@react-native-google-signin/google-signin');
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAUSD_BLUE = Colors.light.tint;
const LAUSD_GOLD = '#FFD700';
const API_BASE = 'http://IP-ADDRESS:3000';

export default function SignupScreen() {
  // const { signInWithGoogle } = useGoogleAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [message, setMessage] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const router = useRouter();

  // Google Sign-In setup
  const config = {
    webClientId:
      "WEB_CLIENT_ID.apps.googleusercontent.com",
    iosClientId:
      "IOS_CLIENT_ID.apps.googleusercontent.com",
  };
  const [request, response, promptAsync] = GoogleSignin.useIdTokenAuthRequest(config);

  const showAiudaWelcome = () => {
    Alert.alert(
      '¡Bienvenido a Aiuda!',
      'Para comenzar, haz clic en el botón de "Nueva Conversación" o selecciona una conversación existente. Escribe tu pregunta sobre LAUSD y Aiuda te responderá en español. ¡Estamos aquí para ayudarte!'
    );
  };

  const handleSignup = async () => {
    setMessage('');
    if (!username || !email || !password || !password2) {
      setMessage('Por favor, completa todos los campos.');
      return;
    }
    if (password !== password2) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }
    setIsSigningUp(true);
    try {
      console.log('[Signup] Sending signup request:', { username, email });
      const res = await fetch(`${API_BASE}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      console.log('[Signup] Received response:', data);
      if (res.ok && data.user && data.user.id) {
        await AsyncStorage.setItem('userId', String(data.user.id));
        showAiudaWelcome();
        setTimeout(() => router.replace('/(tabs)'), 500);
      } else {
        setMessage(data.error || 'Error al registrarse.');
      }
    } catch (err) {
      console.error('[Signup] Network or server error:', err);
      setMessage('Error de red. ¿El servidor está corriendo?');
    }
    setIsSigningUp(false);
  };

  const handleGoogleSignUp = async () => {
    WebBrowser.maybeCompleteAuthSession();
    setIsSigningUp(true);
    try {
      await promptAsync();
    } catch (err) {
      console.error('[Google Sign-In] Error:', err);
    }
    setIsSigningUp(false);
  };

  React.useEffect(() => {
    const handleGoogleAuth = async () => {
      if (response?.type === 'success') {
        const { authentication } = response.params;
        let idToken: string | undefined;
        if (typeof authentication === 'string') {
          idToken = authentication;
        } else if (authentication && typeof authentication === 'object') {
          const authObj = authentication as { idToken?: string; accessToken?: string };
          idToken = authObj.idToken || authObj.accessToken;
        }
        console.log('[Google Sign-In] Token:', idToken);

        try {
          // Send token to backend
          const res = await fetch(`${API_BASE}/api/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          const data = await res.json();
          if (res.ok && data.user && data.user.id) {
            await AsyncStorage.setItem('userId', String(data.user.id));
            showAiudaWelcome();
            setTimeout(() => router.replace('/(tabs)'), 500);
          } else {
            setMessage(data.error || 'Error al iniciar sesión.');
          }
        } catch (err) {
          console.error('[Google Sign-In] Backend error:', err);
          Alert.alert('Error', 'No se pudo conectar con el servidor.');
        }
      }
    };
    handleGoogleAuth();
  }, [response]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/logo4.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>¡Bienvenido a Aiuda!</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Nombre de usuario"
        placeholderTextColor="#999"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
        </TouchableOpacity>
      </View>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Repetir contraseña"
          placeholderTextColor="#999"
          secureTextEntry={!showPassword2}
          value={password2}
          onChangeText={setPassword2}
        />
        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword2(!showPassword2)}>
          <Ionicons name={showPassword2 ? 'eye-off' : 'eye'} size={22} color="#888" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.signupButton}
        onPress={handleSignup}
        disabled={isSigningUp}
      >
        <Text style={styles.signupButtonText}>
          {isSigningUp ? 'Registrando...' : 'Registrarse'}
        </Text>
      </TouchableOpacity>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>O</Text>
        <View style={styles.dividerLine} />
      </View>
      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignUp}
        disabled={isSigningUp}
      >
        <Ionicons name="logo-google" size={24} color="#DB4437" />
        <Text style={styles.googleButtonText}>
          {isSigningUp ? 'Registrando...' : 'Registrarse con Google'}
        </Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
        <Link href="/screens/LoginScreen" asChild>
          <TouchableOpacity>
            <Text style={styles.signupLink}>
              Iniciar sesión
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
    width: 300,
    height: 300,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: LAUSD_BLUE,
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
    color: '#000',
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  eyeIcon: {
    padding: 8,
    position: 'absolute',
    right: 10,
  },
});