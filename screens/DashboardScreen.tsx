import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Loader2, ArrowUp, ArrowDown, Check, Utensils, Syringe, Droplet, Plus, MessageCircle, Activity, X as CloseIcon, Pencil, AlertCircle } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChatInterface } from "../components/chat-interface";
import { Footer } from "../components/footer";
import { LoadingSpinner } from "../components/loading-spinner";
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { getGlucoseReadings, createGlucoseReading, getActivities } from '../lib/api/glucose';
import type { GlucoseReading, ActivityItem } from '../lib/api/glucose';
import { AppHeader } from '../components/app-header';

// Define the navigation route types
type RootStackParamList = {
  Settings: undefined;
  History: undefined;
  Profile: undefined;
  Meals: undefined;
  Insulin: undefined;
  Trends: undefined;
  Notifications: undefined;
  // Add other screens here as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { token } = useAuth();
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [glucoseValue, setGlucoseValue] = useState('');
  const [notes, setNotes] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([]);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      // Get last 6 glucose readings
      const glucoseReadings = await getGlucoseReadings(token, { limit: 6 });
      setReadings(glucoseReadings);

      // Get all activities but only show 5 initially
      const recentActivities = await getActivities(token);
      setAllActivities(recentActivities);
      setActivities(recentActivities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validateGlucoseValue = (value: string) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Update the state with cleaned value
    setGlucoseValue(numericValue);

    // Validate the numeric value
    const glucose = Number(numericValue);
    if (glucose < 0) {
      setFormError('El valor debe ser un número.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!token) return;

    // Validate before submitting
    if (!validateGlucoseValue(glucoseValue)) {
      return;
    }

    setIsLoading(true);
    try {
      await createGlucoseReading({ 
        value: Number(glucoseValue),
        notes 
      }, token);
      
      // Refresh data after adding new reading
      await fetchData();
      
      setOpenDialog(false);
      setGlucoseValue('');
      setNotes('');
      setFormError('');
      
      toast({
        title: 'Éxito',
        description: 'Lectura de glucosa guardada',
      });
    } catch (error) {
      console.error('Error saving glucose reading:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la lectura',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActivitiesView = () => {
    if (showAllActivities) {
      // Show only recent activities
      setActivities(allActivities.slice(0, 5));
    } else {
      // Show all activities
      setActivities(allActivities);
    }
    setShowAllActivities(!showAllActivities);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Hace 1 día';
    return `Hace ${diffInDays} días`;
  };

  // Rest of your component remains the same, just update the data access
  const currentGlucose = readings[0]?.value || 0;
  const previousGlucose = readings[1]?.value || 0;
  const glucoseDiff = currentGlucose - previousGlucose;
  const lastUpdated = readings[0]?.timestamp
    ? formatDistanceToNow(new Date(readings[0].timestamp), { addSuffix: true })
    : '';

  const averageGlucose = Math.round(
    readings.reduce((acc, reading) => acc + reading.value, 0) / (readings.length || 1)
  );

  const timeInRange = Math.round(
    (readings.filter(reading => reading.value >= 80 && reading.value <= 140).length / (readings.length || 1)) * 100
  );

  const getGlucoseStatus = (value: number) => {
    if (value < 80) return 'Bajo';
    if (value > 140) return 'Alto';
    return 'Normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Bajo':
        return { backgroundColor: '#fee2e2', color: '#b91c1c' };
      case 'Alto':
        return { backgroundColor: '#ffedd5', color: '#c2410c' };
      default:
        return { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4CAF50' };
    }
  };

  const getGlucoseIconColor = (value: number) => {
    if (value < 70) return '#ef4444'; // Rojo para bajo
    if (value < 80) return '#f97316'; // Naranja para límite bajo
    if (value > 180) return '#ef4444'; // Rojo para alto
    if (value > 140) return '#f97316'; // Naranja para límite alto
    return '#4CAF50'; // Verde para rango saludable
  };

  const getGlucoseIconBgColor = (value: number) => {
    if (value < 70) return 'rgba(239, 68, 68, 0.1)'; // Rojo con opacidad
    if (value < 80) return 'rgba(249, 115, 22, 0.1)'; // Naranja con opacidad
    if (value > 180) return 'rgba(239, 68, 68, 0.1)'; // Rojo con opacidad
    if (value > 140) return 'rgba(249, 115, 22, 0.1)'; // Naranja con opacidad
    return 'rgba(34, 197, 94, 0.1)'; // Verde con opacidad
  };

  const getAverageGlucoseStatus = (value: number) => {
    if (value < 70) return { text: 'Promedio bajo', color: '#ef4444', bgColor: '#fee2e2' };
    if (value < 80) return { text: 'Promedio límite bajo', color: '#f97316', bgColor: '#ffedd5' };
    if (value > 180) return { text: 'Promedio alto', color: '#ef4444', bgColor: '#fee2e2' };
    if (value > 140) return { text: 'Promedio límite alto', color: '#f97316', bgColor: '#ffedd5' };
    return { text: 'En rango objetivo', color: '#4CAF50', bgColor: 'rgba(34, 197, 94, 0.1)' };
  };

  const glucoseStatus = getGlucoseStatus(currentGlucose);

  const getBarColor = (value: number) => {
    if (value < 70) return { fill: '#ef4444', opacity: 0.8 }; // Rojo para bajo
    if (value < 80) return { fill: '#f97316', opacity: 0.8 }; // Naranja para límite bajo
    if (value > 180) return { fill: '#ef4444', opacity: 0.8 }; // Rojo para alto
    if (value > 140) return { fill: '#f97316', opacity: 0.8 }; // Naranja para límite alto
    return { fill: '#4CAF50', opacity: 0.8 }; // Verde para rango saludable
  };
  return (
    <View style={styles.container}>
      <AppHeader
        title=""
        icon={
          <Image
            source={require('../assets/logo_blanco_png.png')}
            style={{ width: 64, height: 64, resizeMode: 'contain', alignSelf: 'flex-start', marginLeft: 42}}
          />
        }
        right={
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => navigation.navigate('Profile')}>
            <Feather name="user" size={22} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Perfil</Text>
          </TouchableOpacity>
        }
      />
      {isLoading ? (
        <LoadingSpinner text="Cargando datos..." />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <View style={styles.statusContainer}>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(glucoseStatus).backgroundColor }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(glucoseStatus).color }]}>
                    {glucoseStatus}
                  </Text>
                </View>
                <Text style={styles.statusDescription}>
                  {currentGlucose >= 80 && currentGlucose <= 140 
                    ? 'En rango saludable' 
                    : 'Fuera de rango objetivo'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => setOpenDialog(true)}
              >
                <Plus width={16} height={16} color="white" />
                <Text style={styles.addButtonText}>Agregar Lectura</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Glucosa Actual</Text>
                <Text style={styles.timestamp}>
                  {readings[0]?.timestamp 
                    ? formatTimeAgo(new Date(readings[0].timestamp))
                    : ''}
                </Text>
              </View>
              
              <View style={styles.glucoseDisplay}>
                <View style={styles.glucoseValue}>
                  <Text style={styles.glucoseNumber}>{currentGlucose}</Text>
                  <Text style={styles.glucoseUnit}>mg/dL</Text>                
                  <View style={styles.glucoseDiff}>
                    {glucoseDiff < 0 ? (
                      <View style={styles.diffContainer}>
                        <ArrowDown width={16} height={16} color="#4CAF50" />
                        <Text style={styles.diffTextGreen}>{Math.abs(glucoseDiff)} mg/dL</Text>
                      </View>
                    ) : glucoseDiff > 0 ? (
                      <View style={styles.diffContainer}>
                        <ArrowUp width={16} height={16} color="#f97316" />
                        <Text style={styles.diffTextOrange}>{glucoseDiff} mg/dL</Text>
                      </View>
                    ) : (
                      <View style={styles.diffContainer}>
                        <Check width={16} height={16} color="#4CAF50" />
                        <Text style={styles.diffTextGreen}>Estable</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.iconContainer}>
                  <Droplet width={24} height={24} color="#4CAF50" />
                </View>
              </View>

              <View style={styles.chartContainer}>
                <View style={styles.yAxisLabels}>
                  <Text style={styles.axisLabel}>mg/dL</Text>
                  {[180, 140, 80, 70].map((value) => (
                    <Text key={value} style={[
                      styles.yAxisLabel,
                      value === 140 || value === 80 ? styles.yAxisLabelHighlight : null
                    ]}>
                      {value}
                    </Text>
                  ))}
                </View>
                <View style={styles.chartContent}>
                  <View style={styles.rangeIndicator}>
                    <Text style={styles.rangeText}>Rango saludable: 80-140 mg/dL</Text>
                  </View>
                  <View style={styles.chart}>
                    {readings.slice(0, 6).reverse().map((reading, index) => {
                      const max = Math.max(...readings.map(r => r.value));
                      const min = Math.min(...readings.map(r => r.value));
                      const range = max - min || 1;
                      const height = ((reading.value - min) / range) * 70 + 10;
                      const barColors = getBarColor(reading.value);
                      
                      return (
                        <View key={index} style={styles.chartBar}>
                          <View style={[
                            styles.bar,
                            { 
                              height: `${height}%`,
                              backgroundColor: barColors.fill,
                              opacity: barColors.opacity
                            } as any
                          ]}>
                            <View style={styles.barValueContainer}>
                              <Text style={[
                                styles.barValue,
                                { color: reading.value >= 70 && reading.value <= 140 ? '#4CAF50' : '#ef4444' }
                              ]}>
                                {reading.value}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.xAxisLabelContainer}>
                            <Text style={styles.xAxisLabel}>
                              {format(new Date(reading.timestamp), 'HH:mm')}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.targetRange}>
                    <View style={[styles.targetLine, styles.targetLineUpper]} />
                    <View style={[styles.targetLine, styles.targetLineLower]} />
                  </View>
                </View>
              </View>

            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statsCardHalf}>
                <Text style={styles.statsLabel}>Promedio Diario</Text>
                <View style={styles.statsValue}>
                  <Text style={[
                    styles.statsNumber,
                    { color: getAverageGlucoseStatus(averageGlucose).color }
                  ]}>
                    {averageGlucose}
                  </Text>
                  <Text style={styles.statsUnit}>mg/dL</Text>
                </View>
                <View style={[
                  styles.statsIndicator,
                  { backgroundColor: getAverageGlucoseStatus(averageGlucose).bgColor }
                ]}>
                  {averageGlucose >= 70 && averageGlucose <= 140 ? (
                    <Check width={12} height={12} color={getAverageGlucoseStatus(averageGlucose).color} />
                  ) : (
                    <AlertCircle width={12} height={12} color={getAverageGlucoseStatus(averageGlucose).color} />
                  )}
                  <Text style={[
                    styles.statsStatus,
                    { color: getAverageGlucoseStatus(averageGlucose).color }
                  ]}>
                    {getAverageGlucoseStatus(averageGlucose).text}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.statsCardHalf}
                onPress={() => navigation.navigate('History')}
              >
                <View style={styles.historyPreviewHeader}>
                  <Text style={styles.statsLabel}>Historial</Text>
                  <Text style={styles.viewMoreText}>Ver más</Text>
                </View>
                <View style={styles.historyPreviewContent}>
                  <View style={styles.historyIcon}>
                    <Activity width={24} height={24} color="#4CAF50" />
                  </View>
                  <Text style={styles.historyPreviewText}>
                    Ver análisis detallado y tendencias de tus lecturas
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>Actividad Reciente</Text>
                <TouchableOpacity onPress={toggleActivitiesView}>
                  <Text style={styles.viewAllLink}>
                    {showAllActivities ? 'Ver menos' : 'Ver todo'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.activityList}>
                {activities.map((activity, index) => (
                  <View key={index} style={[
                    styles.activityItem,
                    index === activities.length - 1 && styles.lastActivityItem,
                  ]}>
                    <View style={styles.activityLeft}>
                      <View style={[
                        styles.activityIcon,
                        { 
                          backgroundColor: activity.type === 'glucose' 
                            ? getGlucoseIconBgColor(activity.value || 0)
                            : activity.type === 'meal'
                            ? '#ffedd5'
                            : '#dbeafe'
                        }
                      ]}>
                        {activity.type === 'glucose' && (
                          <Droplet 
                            width={16} 
                            height={16} 
                            color={getGlucoseIconColor(activity.value || 0)} 
                          />
                        )}
                        {activity.type === 'meal' && <Utensils width={16} height={16} color="#f97316" />}
                        {activity.type === 'insulin' && <Syringe width={16} height={16} color="#3b82f6" />}
                      </View>
                      <View>
                        <Text style={styles.activityName}>
                          {activity.type === 'glucose' ? 'Lectura de glucosa' : 
                           activity.type === 'meal' ? activity.mealType || '' : 
                           activity.type === 'insulin' ? 'Dosis de insulina' : ''}
                        </Text>
                        <Text style={styles.activityTime}>
                          {activity.timestamp 
                            ? formatTimeAgo(new Date(activity.timestamp))
                            : ''}
                        </Text>
                        {activity.type === 'glucose' && activity.notes && (
                          <Text style={styles.activityNotes} numberOfLines={2}>
                            {activity.notes}
                          </Text>                      )}
                      </View>
                    </View>
                    <Text style={styles.activityValue}>
                      {activity.type === 'glucose' ? `${activity.value} mg/dL` :
                       activity.type === 'meal' ? `${activity.carbs}g carbohidratos` :
                       activity.type === 'insulin' ? `${activity.units} unidades` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <Modal
              visible={openDialog}
              animationType="slide"
              transparent={true}
              onRequestClose={() => {
                setOpenDialog(false);
                setFormError('');
              }}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitleContainer}>
                      <Droplet width={24} height={24} color="#4CAF50" />
                      <Text style={styles.modalTitle}>Agregar Lectura de Glucosa</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => {
                        setOpenDialog(false);
                        setFormError('');
                      }}
                    >
                      <CloseIcon width={20} height={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalDescription}>
                    Ingresa tu lectura actual de glucosa para hacer seguimiento. 📊
                  </Text>

                  <View style={styles.formGroup}>
                    <View style={styles.labelContainer}>
                      <Droplet width={16} height={16} color="#4CAF50" />
                      <Text style={styles.label}>Lectura de Glucosa</Text>
                    </View>
                    <View style={[
                      styles.inputWrapper,
                      formError ? styles.inputError : null
                    ]}>
                      <TextInput
                        style={styles.input}
                        value={glucoseValue}
                        onChangeText={(text) => {
                          validateGlucoseValue(text);
                        }}
                        keyboardType="numeric"
                        placeholder="Ingresa tu lectura"
                        maxLength={3}
                      />
                      <Text style={styles.inputUnit}>mg/dL</Text>
                    </View>
                    {formError ? (
                      <Text style={styles.errorText}>{formError}</Text>
                    ) : null}
                  </View>

                  <View style={styles.formGroup}>
                    <View style={styles.labelContainer}>
                      <Pencil width={16} height={16} color="#4CAF50" />
                      <Text style={styles.label}>Notas (opcional)</Text>
                    </View>
                    <View style={styles.textAreaContainer}>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={8}
                        placeholder="✍️ Agrega comentarios sobre esta lectura (ej: antes/después de comer, ejercicio, estrés...)"
                        textAlignVertical="top"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    <View style={[styles.helperText, { flexDirection: 'row', alignItems: 'center' }]}>
                      <AlertCircle width={12} height={12} color="#6b7280" />
                      <Text style={{ marginLeft: 4, fontSize: 12, color: '#6b7280' }}>
                        Las notas te ayudarán a recordar el contexto de esta lectura
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setOpenDialog(false);
                        setFormError('');
                      }}
                    >
                      <CloseIcon width={16} height={16} color="#6b7280" />
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        (!glucoseValue || !!formError) && styles.submitButtonDisabled
                      ]}
                      onPress={handleSubmit}
                      disabled={!glucoseValue || !!formError}
                    >
                      {isLoading ? (
                        <Loader2 width={16} height={16} color="white" />
                      ) : (
                        <Check width={16} height={16} color="white" />
                      )}
                      <Text style={styles.submitButtonText}>
                        {isLoading ? 'Guardando...' : 'Guardar Lectura'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      )}

      {!isLoading && (
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => setIsChatOpen(true)}
        >
          <MessageCircle width={24} height={24} color="white" />
        </TouchableOpacity>      )}
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        token={token} 
      />
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 14,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  glucoseDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  glucoseValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  glucoseNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  glucoseUnit: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  glucoseDiff: {
    marginLeft: 12,
  },
  diffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  diffTextGreen: {
    fontSize: 14,
    color: '#4CAF50',
  },
  diffTextOrange: {
    fontSize: 14,
    color: '#f97316',
  },
  iconContainer: {
    padding: 12,
    borderRadius: 9999,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  chartContainer: {
    marginTop: 16,
    height: 180, // Increased height to accommodate range indicator
    flexDirection: 'row',
    paddingRight: 16,
  },
  yAxisLabels: {
    width: 45,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingVertical: 10,
  },
  axisLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  yAxisLabelHighlight: {
    color: '#4b5563',
    fontWeight: '500',
  },
  chartContent: {
    flex: 1,
    position: 'relative',
  },
  rangeIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  rangeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
    paddingBottom: 25,
    paddingTop: 15,
  },
  targetRange: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '45%',
    height: '30%',
    justifyContent: 'space-between',
    zIndex: -1,
  },
  chartBar: {
    width: 16,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    position: 'relative',
  },
  barValueContainer: {
    position: 'absolute',
    top: -20,
    left: -12,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barValue: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  xAxisLabelContainer: {
    position: 'absolute',
    bottom: -22,
    left: -12,
    width: 40,
    alignItems: 'center',
  },
  xAxisLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  statsLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsCardHalf: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statsValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 8,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statsUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  statsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  historyPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewMoreText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  historyPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  historyPreviewText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllLink: {
    fontSize: 14,
    color: '#4CAF50',
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lastActivityItem: {
    borderBottomWidth: 0,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    padding: 8,
    borderRadius: 9999,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  activityValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityNotes: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
  },
  inputUnit: {
    paddingRight: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
    minHeight: 200,
  },
  textArea: {
    height: 200,
    textAlignVertical: 'top',
    borderWidth: 0,
    padding: 12,
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  helperText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  chatButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#d1d5db',
    opacity: 0.5,
  },
  targetLineUpper: {
    top: '30%',
  },
  targetLineLower: {
    top: '70%',
  },
});
