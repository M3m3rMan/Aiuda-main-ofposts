// app/signup.tsx
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useGoogleAuth } from '@/components/googleSignIn';
import { Link } from 'expo-router';
import { LAUSD_BLUE, LAUSD_GOLD } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const { signInWithGoogle, isSigningIn } = useGoogleAuth();

  return (
    <View style={styles.container}>
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
        <Text style={styles.welcome}>Get Started</Text>
        <Text style={styles.description}>
          Create an account to access LAUSD information in Spanish
        </Text>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => signInWithGoogle()}
          disabled={isSigningIn}
        >
          <Ionicons name="logo-google" size={24} color="#DB4437" />
          <Text style={styles.googleButtonText}>
            {isSigningIn ? 'Creating Account...' : 'Sign Up with Google'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="../login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
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
    marginBottom: 40,
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
    marginTop: 20,
  },
  footerText: {
    color: '#666',
    marginRight: 5,
  },
  loginLink: {
    color: LAUSD_BLUE,
    fontWeight: 'bold',
  },
});