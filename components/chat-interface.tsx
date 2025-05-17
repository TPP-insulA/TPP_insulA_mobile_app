import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Bot } from 'lucide-react-native';
import { Button } from './ui/button';
import { GEMINI_API_KEY } from '@env';

import { getGlucoseReadings } from '../lib/api/glucose';
import { getInsulinDoses }     from '../lib/api/insulin';
import { getMeals }            from '../lib/api/meals';

type MessageType = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  showSuggestions?: boolean;
};

const suggestedQuestions = [
  'Control de niveles de glucosa',
  'Qué hacer si el azúcar está alto',
  'Rangos ideales de glucosa',
  'Ejercicios recomendados',
  'Ejercicio y niveles de glucosa',
  'Alimentos a evitar',
];

// Single-shot Gemini call
async function getAIResponse(prompt: string): Promise<string> {
  try {
    console.log('[Chat] Calling Gemini API...');
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    const json = await res.json();
    console.log('[Chat] Gemini API response received');
    return json?.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Lo siento, no tengo una respuesta en este momento.';
  } catch (err) {
    console.error('[Chat] Gemini API error:', err);
    return 'Hubo un error al conectar con el asistente. Intenta más tarde.';
  }
}

export function ChatInterface({
  isOpen,
  onClose,
  token,
}: {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}) {
  const [messages, setMessages] = useState<MessageType[]>([{
    id: 'welcome',
    content: 'Hola, soy tu asistente de salud. ¿En qué puedo ayudarte hoy?',
    sender: 'ai',
    timestamp: new Date(),
    showSuggestions: true,
  }]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isValidToken, setIsValidToken] = useState(true);
  // Validate token on mount and when token changes
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        console.warn('[Chat] No token provided');
        setIsValidToken(false);
        if (messages.length === 1 && messages[0].id === 'welcome') {
          // Only update the message if it's just the welcome message
          setMessages([{
            id: 'auth-error',
            content: 'Lo siento, necesitas iniciar sesión para usar el asistente.',
            sender: 'ai',
            timestamp: new Date(),
            showSuggestions: false,
          }]);
        }
        return;
      }

      try {
        // Try to fetch some data to validate token
        await getGlucoseReadings(token, { limit: 1 });
        setIsValidToken(true);
      } catch (error) {
        console.error('[Chat] Token validation failed:', error instanceof Error ? error.message : String(error));
        setIsValidToken(false);
        setMessages([{
          id: 'auth-error',
          content: 'Lo siento, tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          sender: 'ai',
          timestamp: new Date(),
          showSuggestions: false,
        }]);
      }
    };

    validateToken();
  }, [token]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);  const sendMessage = async (text: string) => {
    if (!token || !isValidToken) {
      console.error('[Chat] No valid token available for API calls');
      setMessages(prev => {
        // Only add the error message if it's not already the last message
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.content?.includes('sesión ha expirado')) {
          return prev;
        }
        return [...prev, {
          id: Date.now().toString() + '-error',
          content: 'Lo siento, parece que tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          sender: 'ai',
          timestamp: new Date(),
          showSuggestions: false,
        }];
      });
      return;
    }

    console.log('[Chat] Sending new message:', text);
    // 1️⃣ Add user message
    const userMsg: MessageType = {
      id: Date.now().toString(),
      content: text,
      sender: 'user',
      timestamp: new Date(),
      showSuggestions: false,
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true); // Start loading

    try {
      // 2️⃣ Fetch patient data in parallel
      const safeToken = token ? `${token.slice(0, 10)}...` : 'No token';
      console.log('[Chat] Fetching patient data with token:', safeToken);
      
      const [glucoseData, insulinData, mealsData] = await Promise.all([
        getGlucoseReadings(token, { limit: 5 }).catch(err => {
          console.error(`[Chat] Error fetching glucose data with token ${safeToken}:`, err?.message || String(err));
          return [];
        }),
        getInsulinDoses(token, { limit: 3 }).catch(err => {
          console.error('[Chat] Error fetching insulin data:', err?.message || String(err));
          return { doses: [] };
        }),
        getMeals(token, { limit: 3 }).catch(err => {
          console.error('[Chat] Error fetching meals data:', err?.message || String(err));
          return [];
        })
      ]);      // Log data counts and mask token in all logs for security
      const maskedToken = token ? `${token.slice(0, 10)}...` : 'No token';
      const dataCounts = {
        glucoseCount: Array.isArray(glucoseData) ? glucoseData.length : 0,
        insulinCount: insulinData?.doses?.length || 0,
        mealsCount: Array.isArray(mealsData) ? mealsData.length : 0
      };
      console.log(`[Chat] Patient data fetched successfully with token ${maskedToken}:`, dataCounts);

      // 3️⃣ Build summaries with null checks and type guards
      const glucoseSummary = Array.isArray(glucoseData) && glucoseData.length > 0
        ? glucoseData
            .map(r => `${r.value} mg/dL @ ${new Date(r.timestamp).toLocaleDateString()}`)
            .join('; ')
        : 'No hay lecturas recientes';

      const insulinSummary = insulinData?.doses && Array.isArray(insulinData.doses) && insulinData.doses.length > 0
        ? insulinData.doses
            .map(d => `${d.units}U ${d.type} @ ${new Date(d.timestamp).toLocaleTimeString()}`)
            .join('; ')
        : 'No hay dosis recientes';

      const mealsSummary = Array.isArray(mealsData) && mealsData.length > 0
        ? mealsData
            .map(m => `${m.type} (${m.totalCarbs}g carbs) @ ${new Date(m.timestamp).toLocaleTimeString()}`)
            .join('; ')
        : 'No hay comidas recientes';

      // 4️⃣ Compose full prompt
      const context = [
        `Paciente (últimos registros):`,
        `• Glucosa: ${glucoseSummary}`,
        `• Insulina: ${insulinSummary}`,
        `• Comidas: ${mealsSummary}`,
      ].join('\n');

      const prompt = `${context}\n\nUsuario pregunta: "${text}"\n\nAsistente:`;
      console.log('[Chat] Generated prompt:', prompt);

      // 5️⃣ Call Gemini
      const aiText = await getAIResponse(prompt);

      // 6️⃣ Append AI message
      const aiMsg: MessageType = {
        id: Date.now().toString() + '-ai',
        content: aiText,
        sender: 'ai',
        timestamp: new Date(),
        showSuggestions: false,
      };

      setMessages(prev => {
        const updatedMessages = prev.map(m => ({
          ...m,
          showSuggestions: false as const,
        }));
        return [...updatedMessages, aiMsg];
      });
    } catch (error) {
      const safeToken = token ? `${token.slice(0, 10)}...` : 'No token';
      console.error(`[Chat] Error processing message with token ${safeToken}:`, error instanceof Error ? error.message : String(error));
      
      // Check for specific error types and provide appropriate user messages
      let errorMessage = 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.';
        } else if (error.message.includes('Unauthorized') || error.message.includes('token')) {
          errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        }
      }
      
      const errorMsg: MessageType = {
        id: Date.now().toString() + '-error',
        content: errorMessage,
        sender: 'ai',
        timestamp: new Date(),
        showSuggestions: false,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false); // End loading
    }
  };

  const handleSuggestion = (q: string) => sendMessage(q);

  return (
    <Modal visible={isOpen} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.chatWindow}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWithIcon}>
              <Bot size={24} color="#4CAF50" style={{ marginTop: 4 }} />
              <Text style={styles.headerText}>DiaBot</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="minimize-2" size={18} color="#6b7280" />
              <Text style={styles.closeButtonText}>Ocultar</Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <KeyboardAvoidingView
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={80}
          >
            <ScrollView
              style={styles.chat}
              contentContainerStyle={styles.chatContent}
              ref={scrollViewRef}
            >
              {messages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.message,
                    msg.sender === 'user' ? styles.userMessage : styles.aiMessage,
                  ]}
                >
                  <Text style={[
                    styles.messageText,
                    msg.sender === 'user' && styles.userMessageText,
                  ]}>
                    {msg.content}
                  </Text>
                  {msg.showSuggestions && (
                    <View style={styles.suggestionContainer}>
                      {suggestedQuestions.map(q => (
                        <TouchableOpacity
                          key={q}
                          style={styles.suggestionButton}
                          onPress={() => handleSuggestion(q)}
                        >
                          <Text style={styles.suggestionText}>{q}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
              {isLoading && (
                <View style={[styles.message, styles.aiMessage, styles.loadingContainer]}>
                  <ActivityIndicator size="small" color="#4CAF50" style={styles.loadingSpinner} />
                  <Text style={styles.messageText}>Pensando...</Text>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Escribe tu pregunta..."
                placeholderTextColor="#6b7280"
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => inputText.trim() && sendMessage(inputText)}
              >
                <Feather name="send" size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  chatWindow: {
    backgroundColor: '#f4f4f5',
    borderRadius: 16,
    height: '90%',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    overflow: 'hidden',
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  titleWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  closeButtonText: { marginLeft: 4, color: '#6b7280' },
  content: { flex: 1 },
  chat: { flex: 1, backgroundColor: '#f4f4f5', paddingHorizontal: 16 },
  chatContent: { paddingVertical: 16, gap: 16 },
  message: {
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    maxWidth: '80%',
    elevation: 2,
  },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#4CAF50' },
  aiMessage: { alignSelf: 'flex-start', backgroundColor: 'white' },
  messageText: { fontSize: 16, lineHeight: 24, color: '#111827' },
  userMessageText: { color: 'white' },
  suggestionContainer: { marginTop: 16, flexWrap: 'wrap', flexDirection: 'row', gap: 8 },
  suggestionButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  suggestionText: { fontSize: 14, color: '#4CAF50', fontWeight: '500' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  sendButton: { padding: 8, borderRadius: 20 },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingSpinner: {
    marginRight: 8,
  },
});
