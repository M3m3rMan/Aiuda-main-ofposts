import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Chat = { id: string; name: string };
type Props = {
  chats: Chat[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

const Sidebar: React.FC<Props> = ({ chats, onSelect, onDelete, onClose }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity onPress={() => onSelect(item.id)}>
              <Text>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item.id)}>
              <Ionicons name="trash" size={20} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    padding: 16,
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 2, height: 0 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
});

export default Sidebar;
