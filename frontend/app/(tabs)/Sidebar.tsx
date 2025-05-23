// app/(tabs)/sidebar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface SidebarProps {
  isVisible: boolean;
  chats: { _id: string; name: string }[];
  onSelectChat: (chatId: string) => void;
  onCreateNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isVisible, 
  chats, 
  onSelectChat, 
  onCreateNewChat, 
  onDeleteChat, 
  onClose 
}) => {
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={28} color="#2563eb" />
      </TouchableOpacity>
      <Text style={styles.title}>Chats</Text>
      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.chatItem}>
            <TouchableOpacity onPress={() => onSelectChat(item._id)}>
              <Text style={styles.chatName}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDeleteChat(item._id)}>
              <Ionicons name="trash" size={20} color="#ff0000" />
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity onPress={onCreateNewChat} style={styles.newChatButton}>
        <Text style={styles.newChatText}>+ New Chat</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2563eb',
  },
  chatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  chatName: {
    fontSize: 16,
    color: '#111827',
  },
  newChatButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  newChatText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Sidebar;