// components/Sidebar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthProvider';
import { LAUSD_BLUE, LAUSD_GOLD } from '@/constants/Colors';

type Chat = { id: string; name: string };
type Props = {
  chats: Chat[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

const Sidebar: React.FC<Props> = ({ chats, onSelect, onDelete, onClose }) => {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Aiuda</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={LAUSD_BLUE} />
        </TouchableOpacity>
      </View>

      {user && (
        <View style={styles.userContainer}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.userImage} />
          ) : (
            <View style={styles.userPlaceholder}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.displayName || 'User'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.chatItem}>
            <TouchableOpacity
              onPress={() => onSelect(item.id)}
              style={styles.chatButton}
            >
              <Text style={styles.chatName} numberOfLines={1} ellipsizeMode="tail">
                {item.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No conversations yet</Text>
        }
      />

      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => {
          // Handle new chat
          onClose();
        }}
      >
        <Ionicons name="add-circle" size={20} color={LAUSD_BLUE} />
        <Text style={styles.newChatText}>New Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onClose}
      >
        <Ionicons name="log-out-outline" size={20} color="#ff4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '80%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    padding: 16,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 2, height: 0 },
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 40,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
    color: LAUSD_BLUE,
  },
  closeButton: {
    padding: 8,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 16,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: LAUSD_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatButton: {
    flex: 1,
    paddingRight: 10,
  },
  chatName: {
    fontSize: 16,
    color: '#333',
  },
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontSize: 16,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LAUSD_GOLD,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  newChatText: {
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffeeee',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  logoutText: {
    color: '#ff4444',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});

export default Sidebar;