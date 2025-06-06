import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Platform, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as GoogleSignin from 'expo-auth-session/providers/google';

const API_BASE = 'https://aiuda-backend-production.up.railway.app';
const LAUSD_BLUE = Colors.light.tint;
const LAUSD_GOLD = '#FFD700'; // Use gold color for buttons

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const showAiudaWelcome = () => {
    Alert.alert(
      '¡Bienvenido a Aiuda!',
      'Para comenzar, haz clic en el botón de "Nueva Conversación" o selecciona una conversación existente. Escribe tu pregunta sobre LAUSD y Aiuda te responderá en español. ¡Estamos aquí para ayudarte!'
    );
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setMessage('');
    try {
      console.log('[Login] Sending login request:', { email });
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      console.log('[Login] Received response:', data);
      if (res.ok) {
        setMessage('¡Inicio de sesión exitoso!');
        showAiudaWelcome();
        setTimeout(() => router.replace('/(tabs)'), 500); // Small delay for UX
      } else {
        setMessage(data.error || 'Error al iniciar sesión.');
      }
    } catch (err) {
      console.error('[Login] Network or server error:', err);
      setMessage('Error de red. ¿El servidor está corriendo?');
    }
    setIsLoggingIn(false);
};


  // Google Sign-In setup
  const config = {
    webClientId:
      "Web-Client.apps.googleusercontent.com",
    iosClientId:
      "Ios-Client.apps.googleusercontent.com",
  };
  const [request, response, promptAsync] = GoogleSignin.useIdTokenAuthRequest(config);

  const handleGoogleSignIn = async () => {
    WebBrowser.maybeCompleteAuthSession();
    setIsGoogleLoading(true);
    try {
      await promptAsync();
    } catch (err) {
      console.error('[Google Sign-In] Error:', err);
    }
    setIsGoogleLoading(false);
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response.params;
      const token = authentication;
      console.log('[Google Sign-In] Token:', token);
      // You can handle the token here (e.g., send to backend)
      showAiudaWelcome();
      router.replace('/(tabs)'); // Navigate to index.tsx (root)
    }
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
      <TouchableOpacity
        style={styles.signupButton}
        onPress={handleLogin}
        disabled={isLoggingIn}
      >
        <Text style={styles.signupButtonText}>
          {isLoggingIn ? 'Iniciando sesión...' : 'Iniciar sesión'}
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
        onPress={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        <Ionicons name="logo-google" size={24} color="#DB4437" />
        <Text style={styles.googleButtonText}>
          {isGoogleLoading ? 'Ingresando...' : 'Continuar con Google'}
        </Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Nuevo aquí?</Text>
        <Link href="/screens/SignupScreen" asChild>
          <TouchableOpacity>
            <Text style={styles.signupLink}>
              Registrarse
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
    marginBottom: 20, // Reduced from 40 to 10 for tighter spacing
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
