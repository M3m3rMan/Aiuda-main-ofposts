import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGoogleAuth } from '@/components/googleSignIn';
import { Link } from 'expo-router';
import { LAUSD_BLUE } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { signInWithGoogle, isSigningIn } = useGoogleAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aiuda Login</Text>
      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => signInWithGoogle()}
        disabled={isSigningIn}
      >
        <Ionicons name="logo-google" size={24} color="#DB4437" />
        <Text style={styles.googleButtonText}>
          {isSigningIn ? 'Signing In...' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>
      <Link href="/signup" asChild>
        <TouchableOpacity>
          <Text style={styles.signupLink}>Create Account</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: LAUSD_BLUE
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20
  },
  googleButtonText: {
    marginLeft: 10
  },
  signupLink: {
    color: LAUSD_BLUE
  }
});