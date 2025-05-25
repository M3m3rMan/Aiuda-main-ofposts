import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import { useNavigation } from 'expo-router';

const API_URL = 'http://192.168.1.78:3001/api';

const LAUSD_BLUE = '#00529B';
const LAUSD_GOLD = '#FFD100';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
};

type Conversation = {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: string;
};

export default function App() {
  const [showSidebar, setShowSidebar] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const navigation = useNavigation();

  // Fetch all conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      fetchMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
      tabBarStyle: { display: 'none' }, // This works if you’re inside a tab context
    });
  }, [navigation]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/conversations`);
      setConversations(res.data);
    } catch (err) {
      // handle error
    }
    setLoading(false);
  };

  const fetchMessages = async (id: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/conversations/${id}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      setMessages([]);
    }
    setLoading(false);
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    setShowSidebar(false);
  };

  const handleDeleteConversation = async (id: string) => {
    await axios.delete(`${API_URL}/conversations/${id}`);
    setConversations(prev => prev.filter(c => c._id !== id));
    if (currentConversationId === id) setCurrentConversationId(null);
  };

  const handleNewConversation = async () => {
    const res = await axios.post(`${API_URL}/conversations`, { title: `Chat ${conversations.length + 1}` });
    setConversations([res.data, ...conversations]);
    setCurrentConversationId(res.data._id);
    setShowSidebar(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !currentConversationId) return;
    setSending(true);
    // Add user message
    const userMsg = { role: 'user', content: input };
    await axios.post(`${API_URL}/conversations/${currentConversationId}/messages`, userMsg);
    setMessages(prev => [...prev, { ...userMsg, timestamp: new Date().toISOString() }]);
    setInput('');
    // Get assistant response
    try {
      const res = await axios.post(`${API_URL}/ask`, { question: input });
      const assistantMsg = { role: 'assistant', content: res.data.answer };
      await axios.post(`${API_URL}/conversations/${currentConversationId}/messages`, assistantMsg);
      setMessages(prev => [...prev, { ...assistantMsg, timestamp: new Date().toISOString() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not get an answer.' }]);
    }
    setSending(false);
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageBubble,
      item.role === 'user' ? styles.userBubble : styles.assistantBubble
    ]}>
      <Text style={[
        styles.messageText,
        item.role === 'user' ? styles.userText : styles.assistantText
      ]}>
        {item.content}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Hamburger Icon */}
      <TouchableOpacity style={styles.menu} onPress={() => setShowSidebar(true)}>
        <Ionicons name="menu" size={30} color={LAUSD_BLUE} />
      </TouchableOpacity>

      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          chats={conversations.map(c => ({ id: c._id, name: c.title }))}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
          onClose={() => setShowSidebar(false)}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={styles.headerTitle}>                                   Aiuda</Text>
        </View>
        <TouchableOpacity onPress={handleNewConversation}>
          <Ionicons name="add-circle" size={28} color={LAUSD_GOLD} />
        </TouchableOpacity>
      </View>

      {/* Main Chat Area */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator size="large" color={LAUSD_BLUE} />
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(_, idx) => idx.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={currentConversationId ? "Ask a question about LAUSD rules..." : "Select or start a chat"}
            style={styles.input}
            editable={!!currentConversationId && !sending}
            placeholderTextColor="#888"
          />
          <TouchableOpacity onPress={handleSend} disabled={!input.trim() || !currentConversationId || sending} style={styles.sendButton}>
            {sending ? (
              <ActivityIndicator size="small" color={LAUSD_BLUE} />
            ) : (
              <Ionicons name="send" size={24} color={input && currentConversationId ? LAUSD_BLUE : '#ccc'} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: LAUSD_BLUE,
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: LAUSD_BLUE,
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: LAUSD_GOLD,
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#222',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
    padding: 12,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: LAUSD_BLUE,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
  },
});
