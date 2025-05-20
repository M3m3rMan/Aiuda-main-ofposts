import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView, 
  Platform,
  Keyboard
} from 'react-native';
import axios from 'axios';
const { v4: uuidv4 } = require('uuid');
import Ionicons from '@expo/vector-icons/Ionicons';

// Types
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

const ChatScreen = () => {
  // State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  // Config - Update this to match your actual backend URL
  const BACKEND_URL = 'http://192.168.1.78:3001';

  // Initial welcome message
  useEffect(() => {
    setMessages([{
      id: uuidv4(),
      text: "¡Hola! ¿En qué puedo ayudarle hoy?",
      sender: 'bot'
    }]);
  }, []);

  interface ChatResponse {
      id: string;
      reply: string;
  }
  
  const sendMessage = async () => {
      if (!input.trim()) return;
      
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
        // Send to your backend endpoint
        const res = await axios.post<ChatResponse>(`${BACKEND_URL}/chat/`, {
          user_id: "lausd_parent_123",
          content: input,
          language: 'es'
        });
  
        const botMessage = {
          id: res.data.id,
          text: res.data.reply,
          sender: 'bot' as const,
        };
  
        setMessages(prev => [...prev, botMessage]);
      } catch (err) {
        console.error("Error sending message:", err);
        Alert.alert("Error", "Failed to send message");
        setMessages(prev => prev.filter(m => m.id !== userMessage.id));
        setInput(userMessage.text);
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>LAUSD Parent Assistant</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Area */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#1a56db',
    alignItems: 'center'
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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

export default ChatScreen;