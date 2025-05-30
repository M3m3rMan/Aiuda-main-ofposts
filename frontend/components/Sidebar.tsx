// components/Sidebar.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthProvider';
import { LAUSD_BLUE, LAUSD_GOLD, LAUSD_ORANGE } from '@/constants/Colors';
import LausdLogo from '../assets/images/logo.png';

type Chat = { id: string; name: string };
type Props = {
  chats: Chat[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

const Sidebar: React.FC<Props> = ({ chats, onSelect, onDelete, onClose }) => {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDeleteChat = (id: string, name: string) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
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

  const renderChatItem = ({ item }: { item: Chat }) => (
    <View style={styles.chatItem}>
      <TouchableOpacity
        onPress={() => onSelect(item.id)}
        style={styles.chatButton}
        activeOpacity={0.7}
      >
        <View style={styles.chatIconContainer}>
          <Ionicons name="chatbubble-outline" size={18} color={LAUSD_BLUE} />
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
        <Ionicons name="trash-outline" size={16} color="#ff4757" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Image source={LausdLogo} style={styles.logo} />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Aiuda</Text>
            <Text style={styles.subtitle}>AI Assistant</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={LAUSD_BLUE} />
        </TouchableOpacity>
      </View>

      {/* User Profile Section */}
      {user && (
        <View style={styles.userSection}>
          <View style={styles.userContainer}>
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.userImage} />
            ) : (
              <View style={styles.userPlaceholder}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.displayName || 'User' }
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* New Chat Button */}
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => {
          onClose();
          // This should trigger new chat creation in parent
        }}
        activeOpacity={0.8}
      >
        <View style={styles.newChatIconContainer}>
          <Ionicons name="add" size={20} color="#fff" />
        </View>
        <Text style={styles.newChatText}>New Conversation</Text>
      </TouchableOpacity>

      {/* Chat List Section */}
      <View style={styles.chatListSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={16} color={LAUSD_BLUE} />
          <Text style={styles.sectionTitle}>Recent Chats</Text>
        </View>
        
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Start a new chat to begin</Text>
            </View>
          }
        />
      </View>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => {
            // Handle settings
            console.log('Settings pressed');
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={20} color={LAUSD_BLUE} />
          <Text style={styles.footerButtonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerButton, styles.logoutButton]}
          onPress={() => {
            Alert.alert(
              'Log Out',
              'Are you sure you want to log out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Log Out', 
                  style: 'destructive',
                  onPress: () => {
                    // Handle logout
                    onClose();
                  }
                }
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#ff4757" />
          <Text style={[styles.footerButtonText, styles.logoutText]}>Log Out</Text>
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
    backgroundColor: '#fff',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 5, height: 0 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 12,
    borderRadius: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 24,
    color: LAUSD_BLUE,
  },
  subtitle: {
    fontSize: 12,
    color: LAUSD_ORANGE,
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userSection: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LAUSD_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LAUSD_BLUE,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newChatIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  newChatText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  chatListSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: LAUSD_BLUE,
  },
  listContent: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatIconContainer: {
    marginRight: 12,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerButtonText: {
    marginLeft: 8,
    fontSize: 15,
    color: LAUSD_BLUE,
  },
  logoutButton: {
    marginTop: 10,
  },
  logoutText: {
    color: '#ff4757',
  },
});

export default Sidebar;