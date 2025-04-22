import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from './ui/button'; 

// Types for our chat messages
type MessageType = {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  showSuggestions?: boolean
}

// Pre-written suggested questions
const suggestedQuestions = [
  "Control de niveles de glucosa",
  "Qué hacer si el azúcar está alto",
  "Rangos ideales de glucosa",
  "Ejercicios recomendados",
  "Ejercicio y niveles de glucosa",
  "Alimentos a evitar",
]

// Mock AI responses - in a real app, these would come from an AI service
const getAIResponse = (question: string): string => {
  const responses: Record<string, string> = {
    "Control de niveles de glucosa":
      "Para controlar mejor tus niveles de glucosa, es importante mantener una alimentación equilibrada, hacer ejercicio regularmente, tomar tus medicamentos según lo prescrito, y monitorear tus niveles de glucosa. También es útil llevar un registro de tus comidas y actividades para identificar patrones.",
    "Qué hacer si el azúcar está alto":
      "Si tu nivel de azúcar está muy alto (hiperglucemia), debes beber agua para mantenerte hidratado, hacer ejercicio ligero si es posible, y seguir tu plan de medicación. Si los niveles son extremadamente altos o persisten, contacta a tu médico inmediatamente.",
    "Rangos ideales de glucosa":
      "Los rangos ideales de glucosa varían según la persona, pero generalmente se recomienda entre 80-130 mg/dL antes de las comidas y menos de 180 mg/dL después de las comidas. Tu médico puede establecer rangos específicos para ti basados en tu situación particular.",
    "Ejercicios recomendados":
      "Los ejercicios aeróbicos como caminar, nadar, o andar en bicicleta son excelentes para personas con diabetes. También se recomienda incluir entrenamiento de fuerza 2-3 veces por semana. Siempre consulta con tu médico antes de comenzar un nuevo régimen de ejercicios.",
    "Ejercicio y niveles de glucosa":
      "El ejercicio generalmente disminuye los niveles de glucosa al aumentar la sensibilidad a la insulina. Sin embargo, el ejercicio intenso puede temporalmente aumentar la glucosa. Es importante monitorear tus niveles antes, durante y después del ejercicio, especialmente si usas insulina.",
    "Alimentos a evitar":
      "Es recomendable limitar alimentos con alto contenido de azúcares añadidos, carbohidratos refinados, grasas saturadas y sodio. Esto incluye bebidas azucaradas, dulces, pasteles, frituras y alimentos procesados. Consulta con un nutricionista para un plan personalizado.",
  }

  return (
    responses[question] ||
    "Lo siento, no tengo información específica sobre esa pregunta. ¿Podrías reformularla o preguntar algo más?"
  )
}

export function ChatInterface({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: "welcome",
      content: "Hola, soy tu asistente de salud. ¿En qué puedo ayudarte hoy?",
      sender: "ai",
      timestamp: new Date(),
      showSuggestions: true,
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const scrollViewRef = useRef<ScrollView>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true })
    }
  }, [messages])

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return

    // Add user message
    const userMessage: MessageType = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: MessageType = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(content),
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.chatContainer}>
          {/* Chat header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Feather name="cpu" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.headerTitle}>Asistente de Salud</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          {/* Chat content */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message) => (
              <View key={message.id} style={styles.messageWrapper}>
                <View
                  style={[
                    styles.message,
                    message.sender === "user" ? styles.userMessage : styles.aiMessage,
                  ]}
                >
                  <Text style={message.sender === "user" ? styles.userMessageText : styles.aiMessageText}>
                    {message.content}
                  </Text>
                  <Text style={styles.timestamp}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                {message.showSuggestions && (
                  <View style={styles.suggestionsContainer}>
                    {suggestedQuestions.map((question) => (
                      <Button
                        key={question}
                        variant="secondary"
                        onPress={() => handleSendMessage(question)}
                        style={styles.suggestionButton}
                      >
                        {question}
                      </Button>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Input form */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Escribe tu mensaje..."
              onSubmitEditing={() => handleSendMessage(inputValue)}
            />
            <Button
              variant="default"
              style={styles.sendButton}
              onPress={() => handleSendMessage(inputValue)}
            >
              <Feather name="send" size={20} color="#fff" />
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    height: '80%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)', // #4CAF50 with 0.1 opacity
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageWrapper: {
    gap: 8,
  },
  message: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  suggestionsContainer: {
    gap: 8,
  },
  suggestionButton: {
    marginVertical: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
  },
})

