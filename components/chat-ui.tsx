import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
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
import { getGlucoseReadings } from '../lib/api/glucose';
import { getPredictionHistory } from '../lib/api/insulin';
import { getMeals } from '../lib/api/meals';
import { GEMINI_API_KEY } from '@env';
import Markdown from 'react-native-markdown-display';

type MessageType = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  showSuggestions?: boolean;
};

const suggestedQuestions = [
  '¿Necesito ajustar mi dosis de insulina?',
  '¿Cuál es mi tendencia de glucosa?',
  '¿Qué comidas me afectan más?',
  '¿Cómo puedo mejorar mi control?',
  '¿Cuál es mi promedio de glucosa?',
];

const formatAIResponse = (text: string): string => {
  // Split into paragraphs and take only the first 2-3 most important ones
  const paragraphs = text.split('\n').filter(p => p.trim());
  const importantParagraphs = paragraphs.slice(0, 3);
  
  // Convert list items to bullets if detected
  let formattedText = importantParagraphs.join('\n\n');
  if (formattedText.includes('- ') || formattedText.includes('• ')) {
    formattedText = formattedText
      .split('\n')
      .map(line => line.replace(/^[-•]\s*/, '• '))
      .join('\n');
  }
  
  return formattedText;
};

// Single-shot Gemini call
async function getAIResponse(prompt: string): Promise<string> {
  try {
    const API_KEY = GEMINI_API_KEY;
    console.log('[Chat] Using Gemini API Key:', API_KEY ? 'Provided' : 'Not provided');
    console.log('[Chat] API Key first 10 chars:', API_KEY.substring(0, 10) + '...');
    console.log('[Chat] Calling Gemini API...');
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    const json = await res.json();
    console.log('[Chat] Gemini API response received:', JSON.stringify(json, null, 2));
    
    if (!json.candidates || !json.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('[Chat] Invalid response structure:', json);
      return 'Lo siento, no tengo una respuesta en este momento.';
    }
    
    return json.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error('[Chat] Gemini API error:', err);
    return 'Hubo un error al conectar con el asistente. Intenta más tarde.';
  }
}

export function ChatUI({
  isModal,
  onClose,
  token,
  initialMessage,
}: {
  isModal: boolean;
  onClose: () => void;
  token: string | null;
  initialMessage?: string;
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

  // Handle initial message when chat opens
  useEffect(() => {
    if (initialMessage) {
      sendMessage(initialMessage);
    }
  }, [initialMessage]);

  // Validate token on mount and when token changes
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        console.warn('[Chat] No token provided');
        setIsValidToken(false);
        if (messages.length === 1 && messages[0].id === 'welcome') {
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
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!token || !isValidToken) {
      console.error('[Chat] No valid token available for API calls');
      setMessages(prev => {
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
    const userMsg: MessageType = {
      id: Date.now().toString(),
      content: text,
      sender: 'user',
      timestamp: new Date(),
      showSuggestions: false,
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const [glucoseData, insulinData, mealsData] = await Promise.all([
        getGlucoseReadings(token, { limit: 5 }).catch(err => {
          console.error('[Chat] Error fetching glucose data:', err?.message || String(err));
          return [];
        }),
        getPredictionHistory(token).catch(err => {
          console.error('[Chat] Error fetching insulin data:', err?.message || String(err));
          return { doses: [] };
        }),
        getMeals(token, { limit: 3 }).catch(err => {
          console.error('[Chat] Error fetching meals data:', err?.message || String(err));
          return [];
        })
      ]);

      const glucoseSummary = Array.isArray(glucoseData) && glucoseData.length > 0
        ? glucoseData
            .map(r => `${r.value} mg/dL @ ${new Date(r.timestamp).toLocaleDateString()}`)
            .join('; ')
        : 'No hay lecturas recientes';

      const insulinSummary = insulinData && Array.isArray(insulinData) && insulinData.length > 0
        ? insulinData.slice(0,3)
            .map(d => `${d.recommendedDose}U @ ${new Date(d.date).toLocaleTimeString()}`)
            .join('; ')
        : 'No hay dosis recientes';

      const mealsSummary = Array.isArray(mealsData) && mealsData.length > 0
        ? mealsData
            .map(m => `${m.type} (${m.totalCarbs}g carbs) @ ${new Date(m.timestamp).toLocaleTimeString()}`)
            .join('; ')
        : 'No hay comidas recientes';

      const context = [
        'Simula ser un asistente de salud para pacientes con diabetes tipo 1.',
        'El formato de fechas sera MM/dd/yyyy, pero vos responde con la fecha en formato corto escrita en español',
        'Si sientes que no tienes suficiente información, responde con "No tengo suficiente información para responder a esa pregunta".',
        'Proporciona respuestas claras y concisas, evitando tecnicismos innecesarios.',
        'Utiliza un tono amigable y profesional, como si fueras un asistente de salud virtual.',
        'Si sientes que la pregunta no es relacionada con la diabetes o factores que pueden afectar la glucosa, responde con "Lo siento, no puedo ayudar con eso".',
        'La pregunta la realiza un paciente con los siguientes datos:',
        `Paciente (últimos registros):`,
        `• Glucosa: ${glucoseSummary}`,
        `• Insulina: ${insulinSummary}`,
        `• Comidas: ${mealsSummary}`,
      ].join('\n');

      const prompt = `${context}\n\nUsuario pregunta: "${text}"\n\nAsistente:`;
      console.log('[Chat] Generated prompt:', prompt);

      // Call Gemini API and format response
      const aiText = await getAIResponse(prompt);
      const formattedResponse = formatAIResponse(aiText);

      const aiMsg: MessageType = {
        id: Date.now().toString() + '-ai',
        content: formattedResponse,
        sender: 'ai',
        timestamp: new Date(),
        showSuggestions: true,
      };

      setMessages(prev => {
        const updatedMessages = prev.map(m => ({
          ...m,
          showSuggestions: false as const,
        }));
        return [...updatedMessages, aiMsg];
      });
    } catch (error) {
      console.error('[Chat] Error processing message:', error instanceof Error ? error.message : String(error));
      
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
      setIsLoading(false);
    }
  };

  const handleSuggestion = (q: string) => sendMessage(q);

  return (
    <View style={[styles.container, isModal ? styles.modalContainer : styles.fullScreenContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleWithIcon}>
          <Bot size={24} color="#4CAF50" style={{ marginTop: 4 }} />
          <Text style={styles.headerText}>DiaBot</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Feather name={isModal ? "minimize-2" : "x"} size={18} color="#6b7280" />
          <Text style={styles.closeButtonText}>{isModal ? 'Ocultar' : 'Cerrar'}</Text>
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
              {msg.sender === 'user' ? (
                <Text style={[styles.messageText, styles.userMessageText]}>
                  {msg.content}
                </Text>
              ) : (
                <Markdown
                  style={{
                    body: styles.messageText,
                    strong: { color: '#4CAF50', fontWeight: 'bold' },
                    bullet_list: { marginTop: 8 },
                    list_item: { marginBottom: 4 },
                    heading1: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
                    heading2: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
                    heading3: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
                    code_inline: { backgroundColor: '#f4f4f5', padding: 4, borderRadius: 4 },
                    code_block: { backgroundColor: '#f4f4f5', padding: 12, borderRadius: 8, marginVertical: 8 },
                    blockquote: { borderLeftWidth: 4, borderLeftColor: '#4CAF50', paddingLeft: 12, marginVertical: 8 },
                    link: { color: '#4CAF50', textDecorationLine: 'underline' },
                  }}
                >
                  {msg.content}
                </Markdown>
              )}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  modalContainer: {
    borderRadius: 16,
    height: '90%',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    overflow: 'hidden',
    elevation: 5,
  },
  fullScreenContainer: {
    flex: 1,
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
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  closeButtonText: {
    marginLeft: 4,
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  chat: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
  },
  chatContent: {
    paddingVertical: 16,
    gap: 16,
  },
  message: {
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    maxWidth: '80%',
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    maxWidth: '92%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  userMessageText: {
    color: 'white',
  },
  suggestionContainer: {
    marginTop: 16,
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  suggestionText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
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
  sendButton: {
    padding: 8,
    borderRadius: 20,
  },
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