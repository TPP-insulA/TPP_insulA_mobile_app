import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Loader2, ArrowUp, ArrowDown, Check, Utensils, Syringe, Droplet, Plus, MessageCircle, Activity, X as CloseIcon, Pencil, AlertCircle, Calendar, Calculator, TrendingUp, ChevronRight } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ChatInterface } from "../components/chat-interface";
import { Footer } from "../components/footer";
import { LoadingSpinner } from "../components/loading-spinner";
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { getGlucoseReadings, createGlucoseReading, getActivities } from '../lib/api/glucose';
import type { GlucoseReading, ActivityItem } from '../lib/api/glucose';
import { AppHeader } from '../components/app-header';
import { getInsulinPredictions } from '../lib/api/insulin';

// Add type definitions for predictions
type Prediction = {
  id: number;
  mealType: string;
  date: Date;
  carbs: number;
  glucose: number;
  units: number;
  accuracy: 'Accurate' | 'Slightly low' | 'Low';
};

type PredictionsData = {
  accuracy: {
    percentage: number;
    trend: {
      value: number;
      direction: 'up' | 'down';
    };
  };
  predictions: Prediction[];
};

// Define the navigation route types
type RootStackParamList = {
  Settings: undefined;
  History: undefined;
  Profile: undefined;
  Meals: undefined;
  Insulin: undefined;
  Trends: undefined;
  Notifications: undefined;
  PredictionResultPage: { 
    result: {
      type: 'prediction';
      timestamp: string;
      mealType: string;
      carbs: number;
      units: number;
      accuracy: 'Accurate' | 'Slightly low' | 'Low';
      id: number;
    }
  };
  // Add other screens here as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Extend ActivityItem type to include predictions
type ExtendedActivityItem = ActivityItem | {
  type: 'prediction';
  timestamp: Date;
  mealType: string;
  carbs: number;
  units: number;
  accuracy: 'Accurate' | 'Slightly low' | 'Low';
  id: number;
};

// Add this mock data at the top of the file, after the types
const mockPredictions: PredictionsData = {
  accuracy: {
    percentage: 85,
    trend: {
      value: 5,
      direction: 'up' as const
    }
  },
  predictions: [
    {
      id: 1,
      mealType: 'Desayuno',
      date: new Date('2024-03-20T08:00:00'),
      carbs: 45,
      glucose: 120,
      units: 3.5,
      accuracy: 'Accurate'
    },
    {
      id: 2,
      mealType: 'Almuerzo',
      date: new Date('2024-03-20T13:00:00'),
      carbs: 60,
      glucose: 135,
      units: 4.2,
      accuracy: 'Slightly low'
    },
    {
      id: 3,
      mealType: 'Cena',
      date: new Date('2024-03-20T19:00:00'),
      carbs: 50,
      glucose: 110,
      units: 3.8,
      accuracy: 'Accurate'
    },
    {
      id: 4,
      mealType: 'Snack',
      date: new Date('2024-03-20T16:00:00'),
      carbs: 30,
      glucose: 125,
      units: 2.1,
      accuracy: 'Low'
    }
  ]
};

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { token } = useAuth();
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [glucoseValue, setGlucoseValue] = useState('');
  const [notes, setNotes] = useState('');
  const [dateValue, setDateValue] = useState(format(new Date(), 'dd/MM/yyyy HH:mm'));
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [todaysReadings, setTodaysReadings] = useState<GlucoseReading[]>([]);
  const [activities, setActivities] = useState<ExtendedActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [allActivities, setAllActivities] = useState<ExtendedActivityItem[]>([]);
  const [visibleActivities, setVisibleActivities] = useState<ExtendedActivityItem[]>([]);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const ACTIVITIES_PER_PAGE = 5; // Número de actividades por página
  const [formError, setFormError] = useState('');
  const [dateError, setDateError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [predictions, setPredictions] = useState<PredictionsData | null>(null);
  const [isPredictionsExpanded, setIsPredictionsExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      // Get all glucose readings for today with a single API call
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
      
      const todaysReadings = await getGlucoseReadings(token, { 
        startDate: startOfDay,
        endDate: endOfDay 
      });
      
      // Store today's readings in state
      setTodaysReadings(todaysReadings);
      
      // Use the same data for the chart (latest 6 readings)
      setReadings(todaysReadings.slice(0, 6));
      
      // Get all activities but only show the first page initially
      const recentActivities = await getActivities(token);
      console.log('Recent activities:', recentActivities);
      
      // Use mock predictions
      setPredictions(mockPredictions);

      // Convert predictions to activity format
      const predictionActivities: ExtendedActivityItem[] = mockPredictions.predictions.map(pred => ({
        type: 'prediction',
        timestamp: pred.date,
        mealType: pred.mealType,
        carbs: pred.carbs,
        units: pred.units,
        accuracy: pred.accuracy,
        id: pred.id
      }));

      // Combine and sort all activities by timestamp
      const allActivitiesCombined = [...recentActivities, ...predictionActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setAllActivities(allActivitiesCombined);
      setVisibleActivities(allActivitiesCombined.slice(0, ACTIVITIES_PER_PAGE));
      setActivitiesPage(1);
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
    
    // Limpiar el error si el valor es válido
    setFormError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!token) return;

    // Validar formato de fecha (dd/MM/yyyy HH:mm)
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;
    if (!dateRegex.test(dateValue)) {
      setDateError('Formato de fecha inválido. Use dd/MM/yyyy HH:mm');
      return;
    }

    // Extraer componentes de la fecha para validación
    const [datePart, timePart] = dateValue.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    
    // Validar día, mes, año
    const dayNum = parseInt(day);
    const monthNum = parseInt(month) - 1; // Meses en JS son 0-11
    const yearNum = parseInt(year);
    const hoursNum = parseInt(hours);
    const minutesNum = parseInt(minutes);

    // Validar hora (0-23)
    if (hoursNum < 0 || hoursNum > 23) {
      setDateError('La hora debe estar entre 00 y 23');
      return;
    }
    
    // Validar minutos (0-59)
    if (minutesNum < 0 || minutesNum > 59) {
      setDateError('Los minutos deben estar entre 00 y 59');
      return;
    }
    
    // Validar que la fecha sea válida en general (detecta días inválidos como 31/02)
    const dateObj = new Date(yearNum, monthNum, dayNum, hoursNum, minutesNum);
    if (
      dateObj.getFullYear() !== yearNum || 
      dateObj.getMonth() !== monthNum || 
      dateObj.getDate() !== dayNum
    ) {
      setDateError('Fecha inválida. Por favor verifica el día y mes');
      return;
    }

    // Validar que se tenga un valor de glucosa
    if (!glucoseValue) {
      setFormError('Ingrese un valor de glucosa válido');
      return;
    }

    setIsLoading(true);
    try {
      // Convertir a UTC ISO string
      const utcDate = dateObj.toISOString();

      await createGlucoseReading({ 
        value: Number(glucoseValue),
        notes: notes.substring(0, 30), // Limitar notas a 30 caracteres
        date: utcDate,
      }, token);
      
      // Refresh data after adding new reading
      await fetchData();
      
      setOpenDialog(false);
      setGlucoseValue('');
      setNotes('');
      setFormError('');
      setDateError('');
      // Resetear la fecha a la actual
      setDateValue(format(new Date(), 'dd/MM/yyyy HH:mm'));
      
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

  const loadMoreActivities = () => {
    const nextPage = activitiesPage + 1;
    const endIndex = nextPage * ACTIVITIES_PER_PAGE;
    
    // Cargar el siguiente lote de actividades
    setVisibleActivities(allActivities.slice(0, endIndex));
    setActivitiesPage(nextPage);
  };

  const resetActivitiesList = () => {
    // Volver al estado inicial de solo 5 registros
    setVisibleActivities(allActivities.slice(0, ACTIVITIES_PER_PAGE));
    setActivitiesPage(1);
  };

  const hasMoreActivities = visibleActivities.length < allActivities.length;
  const hasExpandedActivities = visibleActivities.length > ACTIVITIES_PER_PAGE;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes === 1) return 'Hace 1 minuto';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return 'Hace 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Hace 1 día';
    return `Hace ${diffInDays} días`;
  };

  // Rest of your component remains the same, just update the data access
  const currentGlucose = readings.length > 0 ? readings[0].value : 0;
  const previousGlucose = readings.length > 1 ? readings[1].value : 0;
  const glucoseDiff = (currentGlucose !== 0 && previousGlucose !== 0) ? currentGlucose - previousGlucose : 0;
  const lastUpdated = readings[0]?.timestamp
    ? formatTimeAgo(new Date(readings[0].timestamp))
    : '';

  const averageGlucose = Math.round(
    todaysReadings.reduce((acc, reading) => acc + reading.value, 0) / (todaysReadings.length || 1)
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
  const closeDialog = () => {
    setOpenDialog(false);
    setFormError('');
    setDateError('');
    // Resetear campos cada vez que se cierra el modal
    setGlucoseValue('');
    setNotes('');
    // Resetear la fecha a la actual
    setDateValue(format(new Date(), 'dd/MM/yyyy HH:mm'));
  };

  const openGlucoseInputDialog = () => {
    // Asegurar que el campo de fecha se inicialice con la fecha actual
    setDateValue(format(new Date(), 'dd/MM/yyyy HH:mm'));
    setOpenDialog(true);
  };

  const handlePress = (activity: ExtendedActivityItem) => {
    if (activity.type === 'meal') {
      navigation.navigate('Meals');
    } else if (activity.type === 'insulin') {
      navigation.navigate('History');
    } else if (activity.type === 'prediction') {
      navigation.navigate('PredictionResultPage', {
        result: {
          type: 'prediction',
          timestamp: activity.timestamp.toISOString(),
          mealType: activity.mealType,
          carbs: activity.carbs,
          units: activity.units,
          accuracy: activity.accuracy,
          id: activity.id
        }
      });
    }
  };

  const renderActivityItem = (activity: ExtendedActivityItem) => {
    const isClickable = activity.type === 'meal' || activity.type === 'insulin' || activity.type === 'prediction';
    const Wrapper = isClickable ? TouchableOpacity : View;
    const wrapperProps = isClickable ? {
      onPress: () => handlePress(activity),
      activeOpacity: 0.7,
    } : {};

    let icon;
    let title;
    let subtitle;
    let backgroundColor = '#f3f4f6';

    switch (activity.type) {
      case 'glucose':
        icon = <Droplet size={20} color={getGlucoseIconColor(activity.value || 0)} />;
        title = `${activity.value || 0} mg/dL`;
        subtitle = formatTimeAgo(new Date(activity.timestamp));
        backgroundColor = getGlucoseIconBgColor(activity.value || 0);
        break;
      case 'meal':
        icon = <Utensils size={20} color="#4CAF50" />;
        title = `${activity.mealType} (${activity.carbs}g)`;
        subtitle = formatTimeAgo(new Date(activity.timestamp));
        backgroundColor = '#e8f5e9';
        break;
      case 'insulin':
        icon = <Syringe size={20} color="#2196F3" />;
        title = `${activity.units} unidades`;
        subtitle = formatTimeAgo(new Date(activity.timestamp));
        backgroundColor = '#e3f2fd';
        break;
      case 'prediction':
        icon = <Calculator size={20} color="#2196F3" />;
        title = `${activity.mealType} (${activity.carbs}g)`;
        subtitle = `${activity.units} unidades - ${activity.accuracy === 'Accurate' ? '✅ Precisa' : activity.accuracy === 'Slightly low' ? '⚠️ Ligeramente baja' : '❌ Baja'}`;
        backgroundColor = '#e3f2fd';
        break;
    }

    return (
      <Wrapper
        key={`${activity.type}-${new Date(activity.timestamp).getTime()}`}
        style={[
          styles.activityItem,
          { backgroundColor },
          isClickable && styles.clickableActivityItem
        ]}
        {...wrapperProps}
      >
        <View style={styles.activityIcon}>
          {icon}
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{title}</Text>
          <Text style={styles.activitySubtitle}>{subtitle}</Text>
        </View>
        {isClickable && (
          <View style={styles.activityArrow}>
            <ChevronRight size={20} color="#6b7280" />
          </View>
        )}
      </Wrapper>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title=""
        icon={
          <Image
            source={require('../assets/logo_blanco_png.png')}
            style={{ width: 64, height: 64, resizeMode: 'contain', alignSelf: 'flex-start', marginLeft: 72}}
          />
        }
        right={
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(255,255,255,0.10)',
              borderRadius: 24,
              paddingVertical: 6,
              paddingHorizontal: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.25)'
            }}
            onPress={() => navigation.navigate('Profile')}
          >
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
                onPress={openGlucoseInputDialog}
              >
                <Plus width={16} height={16} color="white" />
                <Text style={styles.addButtonText}>Agregar Lectura</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <Droplet size={20} color="#4CAF50" />
                  <Text style={styles.cardTitle}>Glucosa Diaria</Text>
                </View>
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
                  {readings.length === 0 ? (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>No hay datos disponibles</Text>
                    </View>
                  ) : (
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
                  )}
                  <View style={styles.targetRange}>
                    <View style={[styles.targetLine, styles.targetLineUpper]} />
                    <View style={[styles.targetLine, styles.targetLineLower]} />
                  </View>
                </View>
              </View>

            </View>

            <View style={styles.predictionsCard}>
              <TouchableOpacity 
                style={styles.predictionsHeader}
                onPress={() => setIsPredictionsExpanded(!isPredictionsExpanded)}
              >
                <View style={styles.predictionsHeaderLeft}>
                  <Text style={styles.statsLabel}>Rendimiento de Predicciones</Text>
                  {predictions?.accuracy && (
                    <View style={styles.accuracyBadge}>
                      <Text style={styles.accuracyPercentage}>{predictions.accuracy.percentage}%</Text>
                      <View style={styles.trendContainer}>
                        <TrendingUp 
                          size={16} 
                          color={predictions.accuracy.trend.direction === 'up' ? '#4CAF50' : '#ef4444'} 
                        />
                        <Text style={[
                          styles.trendText,
                          { color: predictions.accuracy.trend.direction === 'up' ? '#4CAF50' : '#ef4444' }
                        ]}>
                          {predictions.accuracy.trend.value}%
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                <Feather 
                  name={isPredictionsExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>

              {isPredictionsExpanded && (
                <>
                  {predictions?.predictions?.length === 0 ? (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>No hay datos disponibles</Text>
                    </View>
                  ) : (
                    <View style={styles.predictionsList}>
                      {predictions?.predictions?.map((prediction) => (
                        <View key={prediction.id} style={styles.predictionItem}>
                          <View>
                            <Text style={styles.predictionTitle}>
                              🕒 {prediction.mealType} - {format(prediction.date, 'MMM dd, p')}
                            </Text>
                            <Text style={styles.predictionDetails}>
                              🍽️ {prediction.carbs}g carbohidratos, 🩺 {prediction.glucose} mg/dL
                            </Text>
                          </View>
                          <View style={styles.predictionRight}>
                            <Text style={styles.predictionUnits}>💉 {prediction.units} unidades</Text>
                            <Text style={[
                              styles.predictionAccuracy,
                              prediction.accuracy === 'Accurate' && styles.accuracyGood,
                              prediction.accuracy === 'Slightly low' && styles.accuracyWarning,
                              prediction.accuracy === 'Low' && styles.accuracyBad
                            ]}>
                              {prediction.accuracy === 'Accurate' ? '✅ Precisa' : 
                               prediction.accuracy === 'Slightly low' ? '⚠️ Ligeramente baja' : '❌ Baja'}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity 
                style={styles.newPredictionButton}
                onPress={() => navigation.navigate('Insulin')}
              >
                <View style={styles.newPredictionContent}>
                  <View style={styles.newPredictionIcon}>
                    <Calculator width={24} height={24} color="#4CAF50" />
                  </View>
                  <Text style={styles.newPredictionText}>
                    Calcular nueva dosis de insulina
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statsCardHalf}>
                <Text style={styles.statsLabel}>Promedio Diario</Text>
                {todaysReadings.length === 0 ? (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No hay datos disponibles</Text>
                  </View>
                ) : (
                  <>
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
                  </>
                )}
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
                <View style={styles.cardTitleContainer}>
                  <Activity size={20} color="#4CAF50" />
                  <Text style={styles.activityTitle}>Actividad Reciente</Text>
                </View>
                {(hasMoreActivities || hasExpandedActivities) && (
                  <Text style={styles.activityCount}>
                    Mostrando {visibleActivities.length} de {allActivities.length}
                  </Text>
                )}
              </View>
              
              <View style={styles.activityList}>
                {visibleActivities.map((activity, index) => {
                  const isClickable = activity.type === 'meal' || activity.type === 'insulin' || activity.type === 'prediction';
                  const ActivityWrapper = isClickable ? TouchableOpacity : View;

                  return (
                    <ActivityWrapper
                      key={index}
                      style={[
                        styles.activityItem,
                        index === visibleActivities.length - 1 && !hasMoreActivities && styles.lastActivityItem,
                        isClickable && styles.clickableActivityItem,
                      ]}
                      onPress={isClickable ? () => handlePress(activity) : undefined}
                      activeOpacity={0.7}
                    >
                      <View style={styles.activityLeft}>
                        <View style={[
                          styles.activityIcon,
                          { 
                            backgroundColor: activity.type === 'glucose' 
                              ? getGlucoseIconBgColor(activity.value || 0)
                              : activity.type === 'meal'
                              ? '#ffedd5'
                              : activity.type === 'prediction'
                              ? '#dbeafe'
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
                          {activity.type === 'prediction' && <Calculator width={16} height={16} color="#3b82f6" />}
                        </View>
                        <View>
                          <Text style={styles.activityName}>
                            {activity.type === 'glucose' ? 'Lectura de glucosa' : 
                             activity.type === 'meal' ? activity.mealType || '' : 
                             activity.type === 'prediction' ? 'Predicción de insulina' :
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
                            </Text>
                          )}
                          {activity.type === 'prediction' && (
                            <Text style={[
                              styles.predictionAccuracy,
                              activity.accuracy === 'Accurate' && styles.accuracyGood,
                              activity.accuracy === 'Slightly low' && styles.accuracyWarning,
                              activity.accuracy === 'Low' && styles.accuracyBad
                            ]}>
                              {activity.accuracy === 'Accurate' ? '✅ Precisa' : 
                               activity.accuracy === 'Slightly low' ? '⚠️ Ligeramente baja' : '❌ Baja'}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Text style={styles.activityValue}>
                        {activity.type === 'glucose' ? `${activity.value} mg/dL` :
                         activity.type === 'meal' ? `${activity.carbs}g carbohidratos` :
                         activity.type === 'prediction' ? `${activity.units} unidades` :
                         activity.type === 'insulin' ? `${activity.units} unidades` : ''}
                      </Text>
                    </ActivityWrapper>
                  );
                })}
              </View>
              
              <View style={styles.activityButtonsContainer}>
                {hasMoreActivities && (
                  <TouchableOpacity 
                    style={styles.minimalButton}
                    onPress={loadMoreActivities}
                  >
                    <Feather name="chevron-down" size={16} color="#4CAF50" />
                    <Text style={styles.minimalButtonText}>Ver más</Text>
                  </TouchableOpacity>
                )}
                
                {hasExpandedActivities && (
                  <TouchableOpacity 
                    style={styles.minimalButton}
                    onPress={resetActivitiesList}
                  >
                    <Feather name="chevron-up" size={16} color="#f97316" />
                    <Text style={[styles.minimalButtonText, styles.minimalButtonTextAlt]}>Ver menos</Text>
                  </TouchableOpacity>
                )}
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
                      <Calendar width={16} height={16} color="#4CAF50" />
                      <Text style={styles.label}>Fecha y Hora</Text>
                    </View>
                    <View style={[
                      styles.inputWrapper,
                      dateError ? styles.inputError : null
                    ]}>
                      <TextInput
                        style={styles.input}
                        value={dateValue}
                        onChangeText={(text) => {
                          setDateValue(text);
                          // Limpiar el error de fecha cuando el usuario modifica el valor
                          if (dateError) {
                            setDateError('');
                          }
                        }}
                        placeholder="dd/MM/yyyy HH:mm"
                        maxLength={16}
                      />
                    </View>
                    <View style={[styles.helperText, { flexDirection: 'row', alignItems: 'center' }]}>
                      <AlertCircle width={12} height={12} color="#6b7280" />
                      <Text style={{ marginLeft: 4, fontSize: 12, color: '#6b7280' }}>
                        Formato: dd/MM/yyyy HH:mm
                      </Text>
                    </View>
                    {dateError ? (
                      <Text style={styles.errorText}>{dateError}</Text>
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
                        onChangeText={(text) => setNotes(text.substring(0, 30))}
                        multiline
                        numberOfLines={3}
                        maxLength={30}
                        placeholder="✍️ Agrega comentarios breves..."
                        textAlignVertical="top"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    <View style={[styles.helperText, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <AlertCircle width={12} height={12} color="#6b7280" />
                        <Text style={{ marginLeft: 4, fontSize: 12, color: '#6b7280' }}>
                          Máximo 30 caracteres
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>
                        {notes.length}/30
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setOpenDialog(false);
                        setFormError('');
                        setDateError('');
                      }}
                    >
                      <CloseIcon width={16} height={16} color="#6b7280" />
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        (!glucoseValue || isLoading || !!formError || !!dateError) && styles.submitButtonDisabled
                      ]}
                      onPress={handleSubmit}
                      disabled={!glucoseValue || isLoading || !!formError || !!dateError}
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
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noDataText: {
    fontSize: 14,
    color: '#6b7280',
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
    gap: 12,
    marginBottom: 24,
  },
  statsCardHalf: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statsLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  statsValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statsUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsStatus: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  statsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
    marginTop: 2,
  },
  historyPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewMoreText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
  },
  historyPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyIcon: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  historyPreviewText: {
    fontSize: 12,
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
    minHeight: 100,
  },
  textArea: {
    height: 100,
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
  noDataStats: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 231, 235, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  noDataStatsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  activityCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#f97316',
  },
  activityButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  minimalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  minimalButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  minimalButtonTextAlt: {
    color: '#f97316',
  },
  predictionsList: {
    gap: 12,
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  predictionDetails: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  predictionRight: {
    alignItems: 'flex-end',
  },
  predictionUnits: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  predictionAccuracy: {
    fontSize: 12,
    marginTop: 2,
  },
  accuracyGood: {
    color: '#4CAF50',
  },
  accuracyWarning: {
    color: '#f59e0b',
  },
  accuracyBad: {
    color: '#ef4444',
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clickableActivityItem: {
    cursor: 'pointer',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  activityArrow: {
    marginLeft: 8,
  },
  predictionsCard: {
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
  predictionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 8,
  },
  accuracyPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  newPredictionButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  newPredictionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newPredictionIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  newPredictionText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
});
