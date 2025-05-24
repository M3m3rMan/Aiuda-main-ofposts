// app/(tabs)/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  ActivityIndicator, StyleSheet, Alert, KeyboardAvoidingView, 
  Platform, Keyboard, Dimensions
} from 'react-native';
import axios from 'axios';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './Sidebar';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

interface Chat {
  _id: string;
  title: string;
}

const App = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const BACKEND_URL = 'http://192.168.1.78:3001';

  // Fetch all conversations on mount
  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/conversations`)
      .then(res => setChats(res.data))
      .catch(err => {
        console.error('Failed to load chats', err?.response?.status, err?.response?.data, err.message);
      });
  }, []);

  // Load messages for a selected conversation
  const handleSelectChat = async (chatId: string) => {
    setSidebarVisible(false);
    setCurrentChatId(chatId);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/conversations/${chatId}`);
      setMessages(res.data.messages.map((msg: any) => ({
        id: uuidv4(),
        text: msg.content,
        sender: msg.role === 'user' ? 'user' : 'bot'
      })));
    } catch (err) {
      Alert.alert('Error', 'Could not load chat');
    }
  };

  // Create a new conversation
  const handleCreateNewChat = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/conversations`, { title: `New Chat ${chats.length + 1}` });
      setChats([...chats, res.data]);
      setSidebarVisible(false);
      setCurrentChatId(res.data._id);
      setMessages([]);
    } catch (err) {
      Alert.alert('Error', 'Could not create chat');
    }
  };

  // Delete a conversation
  const handleDeleteChat = async (chatId: string) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/conversations/${chatId}`);
      setChats(chats.filter(chat => chat._id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not delete chat');
    }
  };

  // Send a message (add to conversation and get bot reply)
  const sendMessage = async () => {
    if (!input.trim() || !currentChatId) return;

    const userMessage = {
      id: uuidv4(),
      text: input,
      sender: 'user' as const,
    };

    setIsSending(true);
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    Keyboard.dismiss();

    try {
      // Add user message to conversation in backend
      await axios.post(`${BACKEND_URL}/api/conversations/${currentChatId}/messages`, {
        role: 'user',
        content: input
      });

      // Get bot reply from your /api/ask endpoint
      const response = await axios.post(`${BACKEND_URL}/api/ask`, {
        question: input
      }, {
        timeout: 10000
      });

      const botMessage = {
        id: uuidv4(),
        text: response.data.answer || "No pude entender tu pregunta. ¿Podrías reformularla?",
        sender: 'bot' as const,
      };

      // Add bot message to conversation in backend
      await axios.post(`${BACKEND_URL}/api/conversations/${currentChatId}/messages`, {
        role: 'assistant',
        content: botMessage.text
      });

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = (error as any).code === 'ECONNABORTED' 
        ? "La solicitud tardó demasiado. Por favor intenta nuevamente."
        : "Hubo un error al procesar tu mensaje. Por favor intenta más tarde.";
      
      setMessages(prev => [...prev, {
        id: uuidv4(),
        text: errorMessage,
        sender: 'bot'
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <View style={[
      styles.bubble,
      message.sender === 'user' ? styles.userBubble : styles.botBubble
    ]}>
      <Text style={message.sender === 'user' ? styles.userText : styles.botText}>
        {message.text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Sidebar 
        isVisible={sidebarVisible} 
        chats={chats.map(chat => ({ _id: chat._id, name: chat.title }))}
        onSelectChat={handleSelectChat}
        onCreateNewChat={handleCreateNewChat}
        onDeleteChat={handleDeleteChat}
        onClose={() => setSidebarVisible(false)}
      />

      <View style={[styles.chatContainer, sidebarVisible && styles.chatShifted]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidebarVisible(true)}>
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>LAUSD Parent Assistant</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => <MessageBubble message={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor="#888"
            style={styles.input}
            editable={!isSending}
            multiline
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim() || isSending}
            style={[
              styles.sendButton,
              (!input.trim() || isSending) && styles.disabledButton
            ]}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  chatContainer: {
    flex: 1,
  },
  chatShifted: {
    marginLeft: Dimensions.get('window').width * 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a56db',
  },
  title: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: -24,
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 80,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1a56db',
    borderBottomRightRadius: 0,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
    borderBottomLeftRadius: 0,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#111827',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
    color: '#111827',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a56db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

export default App;

