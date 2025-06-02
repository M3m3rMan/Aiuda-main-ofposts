// components/Sidebar.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthProvider';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Premium Gold & Yellow Color Palette
const COLORS = {
  primary: '#FFD700',        // Pure Gold
  secondary: '#FFA500',      // Orange-Gold
  accent: '#FFED4E',         // Bright Yellow
  background: '#FFFEF9',     // Cream white
  surface: '#FFFFFF',        // Pure white
  surfaceElevated: '#FFFEF7', // Slightly warm white
  text: '#1A1A1A',          // Almost black
  textSecondary: '#4A4A4A',  // Dark gray
  textLight: '#8B8B8B',      // Medium gray
  textMuted: '#B8B8B8',      // Light gray
  border: '#F5F5F5',         // Very light gray
  borderAccent: '#FFE55C',   // Yellow border
  shadow: 'rgba(255, 215, 0, 0.2)', // Gold shadow
  shadowDark: 'rgba(0,0,0,0.1)', // Dark shadow
  danger: '#FF4757',         // Red for delete
  success: '#2ED573',        // Green for success
  gradient: {
    primary: ['#FFD700', '#FFA500'] as import('react-native').ColorValue[], // Gold to Orange
    secondary: ['#FFED4E', '#FFD700'] as import('react-native').ColorValue[], // Yellow to Gold
    surface: ['#FFFFFF', '#FFFEF9'] as import('react-native').ColorValue[], // White to Cream
  },
  opacity: {
    light: 0.1,
    medium: 0.3,
    heavy: 0.6,
  }
};

type Chat = { id: string; name: string };
type Props = {
  chats: Chat[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onNewChat: () => void;
};

const Sidebar: React.FC<Props> = ({ chats, onSelect, onDelete, onClose, onNewChat }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDeleteChat = (id: string, name: string) => {
    Alert.alert(
      'Eliminar conversación',
      `¿Estás seguro de que deseas eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => onDelete(id)
        }
      ]
    );
  };

  const formatChatName = (name: string) => {
    if (name.length > 25) {
      return name.substring(0, 25) + '...';
    }
    return name;
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement logout functionality here if available
            router.replace('/screens/LoginScreen');
          }
        }
      ]
    );
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <View style={styles.chatItem}>
      <TouchableOpacity
        onPress={() => {
          onSelect(item.id);
          onClose();
        }}
        style={styles.chatContent}
        activeOpacity={0.7}
      >
        <View style={styles.chatIconContainer}>
          <LinearGradient
            colors={COLORS.gradient.secondary as [import('react-native').ColorValue, import('react-native').ColorValue]}
            style={styles.chatIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image 
              source={require('../assets/images/logo.png')} 
              style={{
                width: 20,
                height: 20,
                resizeMode: 'contain',
                tintColor: COLORS.surface
              }}
            />
          </LinearGradient>
        </View>
        <Text style={styles.chatName} numberOfLines={1} ellipsizeMode="tail">
          {formatChatName(item.name)}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleDeleteChat(item.id, item.name)}
        style={styles.deleteButton}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={COLORS.gradient.surface as [import('react-native').ColorValue, import('react-native').ColorValue]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <LinearGradient
            colors={COLORS.gradient.primary as [import('react-native').ColorValue, import('react-native').ColorValue]}
            style={styles.logoContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Image 
              source={require('../assets/images/logo.png')} 
              style={styles.logoImage}
            />
          </LinearGradient>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Aiuda</Text>
            <Text style={styles.subtitle}>Asistente IA</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <View style={styles.closeButtonBackground}>
            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* User Profile Section */}
      {user && (
        <View style={styles.userSection}>
          <View style={styles.userContainer}>
            {user.photoURL ? (
              <View style={styles.userImageContainer}>
                <Image source={{ uri: user.photoURL }} style={styles.userImage} />
                <View style={styles.userImageBorder} />
              </View>
            ) : (
              <LinearGradient
                colors={COLORS.gradient.primary as [import('react-native').ColorValue, import('react-native').ColorValue]}
                style={styles.userPlaceholder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="person" size={22} color={COLORS.surface} />
              </LinearGradient>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.displayName || 'Usuario'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* New Chat Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => {
            onNewChat();
            onClose();
          }}
          activeOpacity={0.8}
        >
          <View style={styles.newChatIcon}>
            <Ionicons name="add" size={24} color={COLORS.surface} />
          </View>
          <Text style={styles.newChatText}>Nueva Conversación</Text>
        </TouchableOpacity>
      </View>

      {/* Chats List */}
      <View style={styles.chatsSection}>
        <Text style={styles.sectionTitle}>Conversaciones</Text>
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          style={styles.chatsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No hay conversaciones aún.{'\n'}
                Inicia una nueva conversación.
              </Text>
            </View>
          )}
        />
      </View>

      {/* Footer Section */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '85%',
    maxWidth: 320,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    zIndex: 1000,
    elevation: 20,
    shadowColor: COLORS.shadowDark,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 8, height: 0 },
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  logoImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '800',
    fontSize: 24,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userSection: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  userImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userImageBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  userPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  actionSection: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  newChatButton: {
    borderRadius: 12,
    elevation: 6,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  newChatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  newChatIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatText: {
    fontWeight: '700',
    fontSize: 16,
    color: COLORS.surface,
    flex: 1,
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  chatsSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 16,
  },
  chatsList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.danger + '10',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.danger,
    marginLeft: 8,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
    elevation: 2,
    shadowColor: COLORS.shadowDark,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatIconContainer: {
    marginRight: 12,
  },
  chatIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatName: {
    fontWeight: '500',
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.danger + '10',
  },
});

export default Sidebar;