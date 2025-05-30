import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Linking, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import { useNavigation } from 'expo-router';

const API_URL = 'http://192.168.1.78:3000/api';

// LAUSD Official Colors
const LAUSD_BLUE = '#00529B';
const LAUSD_GOLD = '#FFD100';
const LAUSD_ORANGE = '#FF6B35';

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
      tabBarStyle: { display: 'none' },
    });
  }, [navigation]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/conversations`);
      setConversations(res.data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
    setLoading(false);
  };

  const fetchMessages = async (id: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/conversations/${id}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    }
    setLoading(false);
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    setShowSidebar(false);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/conversations/${id}`);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (currentConversationId === id) setCurrentConversationId(null);
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const handleNewConversation = async () => {
    try {
      const res = await axios.post(`${API_URL}/conversations`, { title: `Chat ${conversations.length + 1}` });
      setConversations([res.data, ...conversations]);
      setCurrentConversationId(res.data._id);
      setShowSidebar(false);
    } catch (err) {
      console.error('Error creating new conversation:', err);
    }
  };

  // Edit conversation title
  const editConversationTitle = async (id: string, newTitle: string) => {
    try {
      const res = await axios.patch(`${API_URL}/conversations/${id}`, { title: newTitle });
      setConversations(prev => prev.map(c => c._id === id ? res.data : c));
    } catch (err) {
      console.error('Error editing conversation:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentConversationId) return;
    setSending(true);

    // Add user message to DB and UI
    const userMsg = { role: 'user', content: input };
    try {
      await axios.post(`${API_URL}/conversations/${currentConversationId}/messages`, userMsg);
      setMessages(prev => [...prev, { ...userMsg, timestamp: new Date().toISOString() } as Message]);
      setInput('');

      // Get assistant response from backend API
      const res = await axios.post(`${API_URL}/ask`, {
        question: input,
        language: 'es'
      });
      const assistantMsg = { 
        role: 'assistant', 
        content: res.data.answer, 
        source: res.data.source
      };

      // Save assistant message to DB and UI
      await axios.post(`${API_URL}/conversations/${currentConversationId}/messages`, assistantMsg);
      setMessages(prev => [...prev, { ...assistantMsg, timestamp: new Date().toISOString() } as Message]);
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not get an answer.' }]);
    }
    setSending(false);
  };

  // Helper to render text with links
  function renderTextWithLinks(text: string, style: any) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, idx) => {
      if (urlRegex.test(part)) {
        return (
          <Text
            key={idx}
            style={[style, { color: LAUSD_ORANGE, textDecorationLine: 'underline' }]}
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        );
      }
      return <Text key={idx} style={style}>{part}</Text>;
    });
  }

  const renderItem = ({ item }: { item: Message & { source?: string } }) => (
    <View style={styles.messageContainer}>
      <View style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userBubble : styles.assistantBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.role === 'user' ? styles.userText : styles.assistantText
        ]}>
          {item.role === 'assistant'
            ? renderTextWithLinks(item.content, [styles.messageText, styles.assistantText])
            : item.content}
        </Text>
        {/* Show badge if this is a web search agent answer */}
        {item.role === 'assistant' && item.source === 'web-search-agent' && (
          <View style={styles.sourceBadge}>
            <Ionicons name="globe-outline" size={12} color={LAUSD_BLUE} />
            <Text style={styles.sourceText}>Web Search</Text>
          </View>
        )}
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.logoContainer}>
        <Ionicons name="school-outline" size={80} color={LAUSD_BLUE} />
      </View>
      <Text style={styles.emptyTitle}>Welcome to Aiuda</Text>
      <Text style={styles.emptySubtitle}>Your LAUSD AI Assistant</Text>
      <Text style={styles.emptyDescription}>
        Ask questions about LAUSD policies, procedures, and get help with school-related inquiries.
      </Text>
      {!currentConversationId && (
        <TouchableOpacity style={styles.startChatButton} onPress={handleNewConversation}>
          <Ionicons name="chatbubble-outline" size={20} color="#fff" />
          <Text style={styles.startChatText}>Start New Chat</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with gradient */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowSidebar(true)}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Aiuda</Text>
            <Text style={styles.headerSubtitle}>LAUSD AI Assistant</Text>
          </View>
          
          <TouchableOpacity style={styles.newChatButton} onPress={handleNewConversation}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Sidebar with overlay */}
        {showSidebar && (
          <>
            <TouchableWithoutFeedback onPress={() => setShowSidebar(false)}>
              <View style={styles.overlay} />
            </TouchableWithoutFeedback>
            <Sidebar
              chats={conversations.map(c => ({ id: c._id, name: c.title }))}
              onSelect={handleSelectConversation}
              onDelete={handleDeleteConversation}
              onClose={() => setShowSidebar(false)}
            />
          </>
        )}

        {/* Main Chat Area */}
        <KeyboardAvoidingView 
          style={styles.chatContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={LAUSD_BLUE} />
                  <Text style={styles.loadingText}>Loading conversation...</Text>
                </View>
              ) : messages.length === 0 ? (
                <EmptyState />
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  renderItem={renderItem}
                  keyExtractor={(_, idx) => idx.toString()}
                  contentContainerStyle={styles.messageList}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          </TouchableWithoutFeedback>

          {/* Enhanced Input Area */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={currentConversationId ? "Ask me about LAUSD policies, procedures..." : "Start a new chat to begin"}
                style={[
                  styles.input,
                  !currentConversationId && styles.inputDisabled
                ]}
                editable={!!currentConversationId && !sending}
                placeholderTextColor="#999"
                multiline
                maxLength={1000}
              />
              <TouchableOpacity 
                onPress={handleSend} 
                disabled={!input.trim() || !currentConversationId || sending} 
                style={[
                  styles.sendButton,
                  (input.trim() && currentConversationId && !sending) && styles.sendButtonActive
                ]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons 
                    name="send" 
                    size={20} 
                    color={(input.trim() && currentConversationId && !sending) ? '#fff' : '#ccc'} 
                  />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.inputHint}>
              Powered by AI • {input.length}/1000 characters
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: LAUSD_BLUE,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LAUSD_BLUE,
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  newChatButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  chatContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LAUSD_BLUE,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 18,
    color: LAUSD_ORANGE,
    marginBottom: 16,
    fontWeight: '600',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LAUSD_BLUE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startChatText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  messageList: {
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageBubble: {
    padding: 16,
    borderRadius: 20,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: LAUSD_BLUE,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 8,
  },
  assistantBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: LAUSD_GOLD,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#333',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 82, 155, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  sourceText: {
    fontSize: 12,
    color: LAUSD_BLUE,
    marginLeft: 4,
    fontWeight: '500',
  },
  inputWrapper: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
    maxHeight: 100,
  },
  inputDisabled: {
    color: '#999',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: LAUSD_BLUE,
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});