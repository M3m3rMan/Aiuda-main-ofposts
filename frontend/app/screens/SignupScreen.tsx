import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView
} from 'react-native';
import { useGoogleAuth } from '@/components/googleSignIn';
import { Link } from 'expo-router';
import { LAUSD_BLUE, LAUSD_GOLD } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://192.168.1.78:3000';

export default function SignupScreen() {
  const { signInWithGoogle } = useGoogleAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleGoogleSignUp = async () => {
    setIsSigningUp(true);
    try {
      await signInWithGoogle();
      console.log('Create Account button pressed!');
    } catch (e) {
      console.log('setIsSignUp setting to true')
      setMessage('Google sign up failed.');
    }
    setIsSigningUp(false);
  };

  const handleSignup = async () => {
    setIsSigningUp(true);
    setMessage('');
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setIsSigningUp(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Signup successful! You can now log in.');
      } else {
        setMessage(data.error || 'Signup failed.');
      }
    } catch (err) {
      setMessage('Network error.');
    }
    setIsSigningUp(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Aiuda</Text>
            <Text style={styles.subtitle}>Create Your Account</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.welcome}>Welcome!</Text>
            <Text style={styles.description}>
              Sign up to access important LAUSD information in Spanish.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Username"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholderTextColor="#888"
            />

            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignup}
              disabled={isSigningUp}
            >
              <Text style={styles.signupButtonText}>
                {isSigningUp ? 'Signing Up...' : 'Sign Up'}
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
              onPress={handleGoogleSignUp}
              disabled={isSigningUp}
            >
              <Ionicons name="logo-google" size={24} color="#DB4437" />
              <Text style={styles.googleButtonText}>
                {isSigningUp ? 'Creating Account...' : 'Sign Up with Google'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Link href="/screens/LoginScreen" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
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
  content: {
    paddingHorizontal: 4,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: LAUSD_BLUE,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  signupButton: {
    backgroundColor: LAUSD_GOLD,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
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
  },
  googleButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerText: {
    color: '#666',
    marginRight: 5,
  },
  loginLink: {
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
});
