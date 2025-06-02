import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Linking, SafeAreaView, ScrollView, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Markdown from 'react-native-markdown-display';

const API_URL = 'http://192.168.1.78:3000/api';

// Premium Gold Color Palette - Inspired by luxury and professionalism
const COLORS = {
  primary: '#F7C52D',        // Bright Gold
  primaryDark: '#E6B800',    // Darker Gold
  primaryLight: '#FFE066',   // Light Gold
  secondary: '#FFF8DC',      // Cornsilk
  accent: '#FFD700',         // Pure Gold
  background: '#FEFEFE',     // Almost white
  surface: '#FFFFFF',        // Pure white
  surfaceElevated: '#FFFBF0', // Warm white
  cardBackground: '#FFFDF7', // Card background
  text: '#1A1A1A',           // Near black
  textSecondary: '#4A4A4A',  // Dark gray
  textTertiary: '#8A8A8A',   // Medium gray
  textLight: '#B0B0B0',      // Light gray
  border: '#F0F0F0',         // Light border
  borderGold: '#F7C52D',     // Gold border
  shadow: 'rgba(247, 197, 45, 0.15)',
  shadowDark: 'rgba(0, 0, 0, 0.1)',
  gradient: {
    start: '#FFE066',
    middle: '#F7C52D',
    end: '#E6B800'
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  disabled: '#F5F5F5',
  white: '#FFFFFF'
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  source?: string;
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
  const sidebarAnimation = useRef(new Animated.Value(-320)).current;

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

  // Sidebar animation
  useEffect(() => {
    Animated.timing(sidebarAnimation, {
      toValue: showSidebar ? 0 : -320,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showSidebar]);

  // CRUD: Fetch all conversations
  const fetchConversations = async () => {
    setLoading(true);
    try {
      console.log('Fetching conversations from:', `${API_URL}/conversations`);
      const response = await fetch(`${API_URL}/conversations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Conversations fetched:', data);
      setConversations(data || []);
      
      // If no conversations exist, create a default one
      if (!data || data.length === 0) {
        await handleNewConversation();
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      // Fallback to creating a new conversation
      await handleNewConversation();
    }
    setLoading(false);
  };

  // CRUD: Fetch messages for a specific conversation
  const fetchMessages = async (id: string) => {
    setLoading(true);
    try {
      console.log('Fetching messages for conversation:', id);
      const response = await fetch(`${API_URL}/conversations/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Messages fetched:', data);
      
      // Set messages from the conversation
      setMessages(data.messages || []);
      
      // If this is the first time opening this conversation and it's empty, add welcome message
      if (!data.messages || data.messages.length === 0) {
        const welcomeMessage: Message = {
          role: 'assistant',
          content: '¡Hola! Soy Aiuda, tu asistente inteligente para LAUSD. Estoy aquí para ayudarte con información sobre políticas escolares, actividades, calificaciones y cualquier pregunta relacionada con la educación de tu hijo/a. ¿En qué puedo ayudarte hoy?',
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
        
        // Save welcome message to backend
        try {
          await fetch(`${API_URL}/conversations/${id}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(welcomeMessage),
          });
        } catch (saveError) {
          console.error('Error saving welcome message:', saveError);
        }
      }
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

  // CRUD: Delete conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      console.log('Deleting conversation:', id);
      const response = await fetch(`${API_URL}/conversations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Conversation deleted successfully');
      
      // Update local state
      setConversations(prev => prev.filter(c => c._id !== id));
      
      // If we deleted the current conversation, clear it
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
        
        // If there are other conversations, select the first one
        const remainingConversations = conversations.filter(c => c._id !== id);
        if (remainingConversations.length > 0) {
          setCurrentConversationId(remainingConversations[0]._id);
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  // CRUD: Create new conversation
  const handleNewConversation = async () => {
    try {
      console.log('Creating new conversation');
      const response = await fetch(`${API_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Nueva Conversación'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const newConversation = await response.json();
      console.log('New conversation created:', newConversation);
      
      // Update local state
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversation._id);
      setShowSidebar(false);
      
      // Clear messages for new conversation
      setMessages([]);
    } catch (err) {
      console.error('Error creating new conversation:', err);
      
      // Fallback: create local conversation
      const fallbackConv = {
        _id: Date.now().toString(),
        title: 'Nueva Conversación',
        messages: [],
        createdAt: new Date().toISOString()
      };
      setConversations(prev => [fallbackConv, ...prev]);
      setCurrentConversationId(fallbackConv._id);
      setShowSidebar(false);
    }
  };

  // CRUD: Update conversation title
  const updateConversationTitle = async (conversationId: string, newTitle: string) => {
    try {
      console.log('Updating conversation title:', conversationId, newTitle);
      const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const updatedConversation = await response.json();
      console.log('Conversation title updated:', updatedConversation);
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversationId 
            ? { ...conv, title: newTitle }
            : conv
        )
      );
    } catch (err) {
      console.error('Error updating conversation title:', err);
    }
  };

  // Enhanced handleSend with CRUD operations
  const handleSend = async () => {
    if (!input.trim() || !currentConversationId) return;
    setSending(true);

    const userMsg: Message = { 
      role: 'user', 
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    // Generate conversation title from first user message if it's the default title
    const currentConversation = conversations.find(c => c._id === currentConversationId);
    if (currentConversation && currentConversation.title === 'Nueva Conversación' && messages.length <= 1) {
      const newTitle = currentInput.length > 30 
        ? currentInput.substring(0, 30) + '...' 
        : currentInput;
      await updateConversationTitle(currentConversationId, newTitle);
    }

    try {
      console.log('Sending request to backend:', `${API_URL}/ask`);
      console.log('Request payload:', { question: currentInput, threadId: currentConversationId });
      
      // Send message to AI
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          question: currentInput,
          threadId: currentConversationId
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);
      
      const assistantMsg: Message = { 
        role: 'assistant', 
        content: data.answer,
        timestamp: new Date().toISOString(),
        source: data.source || 'rag-system'
      };
      
      setMessages(prev => [...prev, assistantMsg]);

      // CRUD: Save both messages to the conversation
      try {
        // Save user message
        await fetch(`${API_URL}/conversations/${currentConversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userMsg),
        });

        // Save assistant message
        await fetch(`${API_URL}/conversations/${currentConversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(assistantMsg),
        });

        console.log('Messages saved to conversation successfully');
      } catch (saveError) {
        console.error('Error saving messages to conversation:', saveError);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg: Message = { 
        role: 'assistant', 
        content: 'Lo siento, hubo un error al procesar tu pregunta. Por favor intenta nuevamente.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
      
      // Save error message to conversation
      try {
        await fetch(`${API_URL}/conversations/${currentConversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userMsg),
        });

        await fetch(`${API_URL}/conversations/${currentConversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorMsg),
        });
      } catch (saveError) {
        console.error('Error saving error messages:', saveError);
      }
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    router.replace('/screens/LoginScreen')
    console.log('Logout pressed');
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
            style={[style, { color: COLORS.primary, textDecorationLine: 'underline' }]}
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        );
      }
      return <Text key={idx} style={style}>{part}</Text>;
    });
  }

  const renderItem = ({ item }: { item: Message }) => (
    <View style={styles.messageContainer}>
      <View style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userBubble : styles.assistantBubble
      ]}>
        {item.role === 'assistant' ? (
          <Markdown style={markdownStyles}>
            {item.content}
          </Markdown>
        ) : (
          <Text style={[
            styles.messageText,
            styles.userText
          ]}>
            {item.content}
          </Text>
        )}
        {item.role === 'assistant' && item.source === 'web-search-agent' && (
          <View style={styles.sourceBadge}>
            <Ionicons name="globe-outline" size={12} color={COLORS.primary} />
            <Text style={styles.sourceText}>Búsqueda Web</Text>
          </View>
        )}
      </View>
      {item.timestamp && (
        <Text style={[
          styles.timestamp,
          item.role === 'user' ? styles.timestampRight : styles.timestampLeft
        ]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );

  // Enhanced EmptyState with better messaging
  const EmptyState = () => (
    <View style={styles.emptyState}>
      {/* Animated logo with glow effect */}
      <View style={styles.logoContainer}>
        <View style={styles.logoGlow}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/images/logo3.png')}
              style={{ width: 110, height: 110, resizeMode: 'contain' }}
            />
          </View>
        </View>
        <View style={styles.sparkleContainer}>
          <Ionicons name="sparkles" size={20} color={COLORS.primary} />
        </View>
      </View>
      
      <Text style={styles.emptyTitle}>¡Bienvenido a Aiuda!</Text>
      <Text style={styles.emptySubtitle}>Tu asistente inteligente para información escolar de LAUSD</Text>
      
      {/* Enhanced features grid */}
      <View style={styles.featuresGrid}>
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="school-outline" size={22} color={COLORS.white} />
          </View>
          <Text style={styles.featureTitle}>Políticas Escolares</Text>
          <Text style={styles.featureDescription}>Información actualizada sobre reglas y procedimientos</Text>
        </View>
        
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: COLORS.accent }]}>
            <Ionicons name="help-circle-outline" size={22} color={COLORS.white} />
          </View>
          <Text style={styles.featureTitle}>Respuestas Inmediatas</Text>
          <Text style={styles.featureDescription}>Soluciones rápidas a tus preguntas frecuentes</Text>
        </View>
        
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: COLORS.primaryDark }]}>
            <Ionicons name="language-outline" size={22} color={COLORS.white} />
          </View>
          <Text style={styles.featureTitle}>Soporte Bilingüe</Text>
          <Text style={styles.featureDescription}>Disponible en español e inglés</Text>
        </View>
        
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: COLORS.success }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.white} />
          </View>
          <Text style={styles.featureTitle}>Información Confiable</Text>
          <Text style={styles.featureDescription}>Datos oficiales y verificados de LAUSD</Text>
        </View>
      </View>
      
      {/* Enhanced CTA button */}
      {!currentConversationId && (
        <TouchableOpacity style={styles.ctaButton} onPress={handleNewConversation}>
          <View style={styles.ctaContent}>
            <Ionicons name="chatbubbles" size={20} color={COLORS.white} />
            <Text style={styles.ctaText}>Comenzar Nueva Conversación</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </View>
        </TouchableOpacity>
      )}
      
      {/* Trust indicators */}
      <View style={styles.trustSection}>
        <View style={styles.trustIndicator}>
          <View style={[styles.trustDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.trustText}>Información Oficial LAUSD</Text>
        </View>
        <View style={styles.trustIndicator}>
          <View style={[styles.trustDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.trustText}>Disponible 24/7</Text>
        </View>
        <View style={styles.trustIndicator}>
          <View style={[styles.trustDot, { backgroundColor: COLORS.warning }]} />
          <Text style={styles.trustText}>Respuestas Actualizadas</Text>
        </View>
      </View>
    </View>
  );

  // Enhanced Sidebar with better conversation management
  const Sidebar = () => (
    <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnimation }] }]}>
      {/* Enhanced Header */}
      <View style={styles.sidebarHeader}>
        <View style={styles.sidebarHeaderTop}>
          <View style={styles.sidebarLogoContainer}>
            <View style={styles.sidebarLogo}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={{ width: 32, height: 32, resizeMode: 'contain' }}
              />
            </View>
            <View style={styles.sidebarTitleContainer}>
              <Text style={styles.sidebarTitle}>Aiuda</Text>
              <Text style={styles.sidebarSubtitle}>Asistente IA</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.closeSidebarButton}
            onPress={() => setShowSidebar(false)}
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.newConversationButton} onPress={handleNewConversation}>
          <View style={styles.newConvIcon}>
            <Ionicons name="add" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.newConversationText}>Nueva Conversación</Text>
        </TouchableOpacity>
      </View>
      
      {/* Conversations List */}
      <View style={styles.conversationsSection}>
        <Text style={styles.sectionLabel}>Conversaciones Recientes</Text>
        
        <FlatList
          data={conversations || []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.conversationsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.conversationItemContainer}>
              <TouchableOpacity
                style={[
                  styles.conversationItem,
                  currentConversationId === item._id && styles.conversationItemActive
                ]}
                onPress={() => handleSelectConversation(item._id)}
              >
                <View style={styles.conversationContent}>
                  <View style={styles.conversationIcon}>
                    <Ionicons 
                      name="chatbubble-outline" 
                      size={16} 
                      color={currentConversationId === item._id ? COLORS.primary : COLORS.textTertiary} 
                    />
                  </View>
                  <View style={styles.conversationTextContainer}>
                    <Text style={[
                      styles.conversationTitle,
                      currentConversationId === item._id && styles.conversationTitleActive
                    ]}>
                      {item.title.length > 25 ? item.title.substring(0, 25) + '...' : item.title}
                    </Text>
                    <Text style={styles.conversationPreview}>
                      {(item.messages || []).length > 0 
                        ? `${item.messages.length} mensajes` 
                        : 'Nueva conversación'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteConversation(item._id)}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyConversations}>
              <Ionicons name="chatbubbles-outline" size={32} color={COLORS.textLight} />
              <Text style={styles.emptyConversationsText}>No hay conversaciones</Text>
              <Text style={styles.emptyConversationsSubtext}>Inicia una nueva conversación</Text>
            </View>
          }
        />
      </View>
      
      {/* Enhanced Footer */}
      <View style={styles.sidebarFooter}>
        <TouchableOpacity style={styles.footerButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowSidebar(true)}>
            <Ionicons name="menu" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.headerLogo}>
              <Image
                source={require('../../assets/images/logo3.png')}
                style={{ width: 50, height: 50, resizeMode: 'contain' }}
              />
            </View>
            <Text style={styles.headerTitle}>Aiuda</Text>
          </View>
          
          <TouchableOpacity style={styles.newChatHeaderButton} onPress={handleNewConversation}>
            <Ionicons name="create-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Sidebar Overlay */}
        {showSidebar && (
          <TouchableWithoutFeedback onPress={() => setShowSidebar(false)}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
        )}
        
        {/* Sidebar */}
        {showSidebar && <Sidebar />}
        
        {/* Main Chat Container */}
        <KeyboardAvoidingView 
          style={styles.chatContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingSpinner}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  </View>
                  <Text style={styles.loadingText}>Cargando conversación...</Text>
                </View>
              ) : messages.length === 0 ? (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                  <EmptyState />
                </ScrollView>
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
              
              {/* Enhanced Typing Indicator */}
              {sending && (
                <View style={styles.typingContainer}>
                  <View style={styles.typingBubble}>
                    <View style={styles.typingAnimation}>
                      <View style={[styles.typingDot, styles.dot1]} />
                      <View style={[styles.typingDot, styles.dot2]} />
                      <View style={[styles.typingDot, styles.dot3]} />
                    </View>
                    <Text style={styles.typingText}>Aiuda está escribiendo...</Text>
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
          
          {/* Enhanced Input Area */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={currentConversationId ? "Escribe tu pregunta aquí..." : "Selecciona o crea una conversación para comenzar"}
                style={[
                  styles.input,
                  !currentConversationId && styles.inputDisabled
                ]}
                editable={!!currentConversationId && !sending}
                placeholderTextColor={COLORS.textLight}
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
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons 
                    name="send" 
                    size={18} 
                    color={(input.trim() && currentConversationId && !sending) ? COLORS.white : COLORS.textLight} 
                  />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.inputHint}>
              Aiuda puede cometer errores. Verifica información importante.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 4,
    marginTop: 2,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: COLORS.surfaceElevated,
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4e8d0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  newChatHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 320,
    backgroundColor: COLORS.surface,
    zIndex: 1000,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  sidebarHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
  },
  sidebarHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sidebarLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sidebarLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4e8d0', // <-- beige color
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sidebarTitleContainer: {},
  sidebarTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
  },
  sidebarSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  closeSidebarButton: {
    padding: 8,
  },
  newConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newConvIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  newConversationText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  conversationsSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conversationsList: {
    paddingBottom: 20,
  },
  conversationItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  conversationItemActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.borderGold,
    borderWidth: 2,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationTextContainer: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  conversationTitleActive: {
    color: COLORS.primary,
  },
  conversationPreview: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyConversations: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyConversationsText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptyConversationsSubtext: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  sidebarFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutButtonText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Missing styles for message rendering
  userText: {
    color: COLORS.white,
  },
  assistantText: {
    color: COLORS.text,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sourceText: {
    fontSize: 11,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  timestampRight: {
    textAlign: 'right',
    alignSelf: 'flex-end',
  },
  timestampLeft: {
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  
  // Missing styles for EmptyState
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  logoGlow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f4e8d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    width: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  trustSection: {
    alignItems: 'center',
    gap: 8,
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trustText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  
  // Missing styles for main container
  chatContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  messageList: {
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  
  // Missing styles for typing indicator
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: '80%',
  },
  typingAnimation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginHorizontal: 1,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  typingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  
  // Missing styles for input area
  inputWrapper: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 8,
    paddingHorizontal: 0,
    maxHeight: 100,
    lineHeight: 20,
  },
  inputDisabled: {
    color: COLORS.textLight,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.disabled,
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
  },
  inputHint: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

// Add markdown styles at the bottom before the regular styles
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 15,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 12,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 10,
  },
  paragraph: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  strong: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  em: {
    fontStyle: 'italic',
    color: COLORS.text,
  },
  link: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  code_inline: {
    backgroundColor: COLORS.surface,
    color: COLORS.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  code_block: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.text,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fence: {
    backgroundColor: COLORS.surfaceElevated,
    color: COLORS.text,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  blockquote: {
    backgroundColor: COLORS.secondary,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
    borderRadius: 4,
  },
  list_item: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  hr: {
    backgroundColor: COLORS.border,
    height: 1,
    marginVertical: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginVertical: 8,
  },
  thead: {
    backgroundColor: COLORS.surfaceElevated,
  },
  tbody: {
    backgroundColor: COLORS.surface,
  },
  th: {
    padding: 8,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  td: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
});