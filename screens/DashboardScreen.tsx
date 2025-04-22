import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Loader2, ArrowUp, ArrowDown, Check, Utensils, Syringe, Droplet, Plus, MessageCircle, Activity, Settings } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { ChatInterface } from "../components/chat-interface";
import { Footer } from "../components/footer";
import { LoadingSpinner } from "../components/loading-spinner";

// Define the navigation route types
type RootStackParamList = {
  Settings: undefined;
  HistoryPage: undefined;
  ProfilePage: undefined;
  MealsPage: undefined;
  InsulinPage: undefined;
  TrendsPage: undefined;
  // Add other screens here as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GlucoseReading {
  value: number;
  timestamp: Date | null;
}

interface ActivityItem {
  type: 'glucose' | 'meal' | 'insulin';
  value?: number;
  mealType?: string;
  carbs?: number;
  units?: number;
  timestamp: Date | null;
}

const mockGlucoseReadings: GlucoseReading[] = [
  { value: 142, timestamp: null },
  { value: 135, timestamp: null },
  { value: 128, timestamp: null },
  { value: 145, timestamp: null },
  { value: 138, timestamp: null },
  { value: 132, timestamp: null }
];

const mockActivities: ActivityItem[] = [
  {
    type: 'glucose',
    value: 142,
    timestamp: null
  },
  {
    type: 'meal',
    mealType: 'Almuerzo',
    carbs: 45,
    timestamp: null
  },
  {
    type: 'insulin',
    units: 4.2,
    timestamp: null
  },
  {
    type: 'glucose',
    value: 135,
    timestamp: null
  },
  {
    type: 'meal',
    mealType: 'Desayuno',
    carbs: 30,
    timestamp: null
  }
];

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [openDialog, setOpenDialog] = useState(false);
  const [glucoseValue, setGlucoseValue] = useState('');
  const [notes, setNotes] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [readings, setReadings] = useState<GlucoseReading[]>(mockGlucoseReadings);
  const [activities, setActivities] = useState<ActivityItem[]>(mockActivities);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const now = new Date();
    const updatedReadings = mockGlucoseReadings.map((reading, index) => ({
      ...reading,
      timestamp: new Date(now.getTime() - index * 2 * 60 * 60 * 1000)
    }));

    const updatedActivities = mockActivities.map((activity, index) => ({
      ...activity,
      timestamp: new Date(now.getTime() - index * 60 * 60 * 1000)
    }));

    setReadings(updatedReadings);
    setActivities(updatedActivities);
  }, []);

  const currentGlucose = readings[0]?.value || 0;
  const previousGlucose = readings[1]?.value || 0;
  const glucoseDiff = currentGlucose - previousGlucose;
  const lastUpdated = readings[0]?.timestamp
    ? formatDistanceToNow(readings[0].timestamp, { addSuffix: true })
    : '';

  const averageGlucose = Math.round(
    readings.reduce((acc, reading) => acc + reading.value, 0) / readings.length
  );

  const timeInRange = Math.round(
    (readings.filter(reading => reading.value >= 80 && reading.value <= 140).length / readings.length) * 100
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

  const glucoseStatus = getGlucoseStatus(currentGlucose);

  const handleSubmit = () => {
    setOpenDialog(false);
    setGlucoseValue('');
    setNotes('');
  };

  return (
    <View style={styles.pageContainer}>
      {isLoading ? (
        <LoadingSpinner text="Cargando datos..." />
      ) : (
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Settings width={20} height={20} color="#4b5563" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Activity width={32} height={32} color="#4CAF50" />
              <Text style={styles.title}>Indicadores</Text>
            </View>
          </View>

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
              <Text style={styles.timestamp}>Actualizado {lastUpdated}</Text>
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
              <View style={styles.chart}>
                {readings.slice(0, 6).reverse().map((reading, index) => {
                  const max = Math.max(...readings.map(r => r.value));
                  const min = Math.min(...readings.map(r => r.value));
                  const range = max - min || 1;
                  const height = ((reading.value - min) / range) * 70 + 10;
                  
                  return (
                    <View key={index} style={styles.chartBar}>
                      <View 
                        style={[
                          styles.bar,
                          { 
                            height: `${height}%`,
                            backgroundColor: reading.value >= 80 && reading.value <= 140 
                              ? 'rgba(34, 197, 94, 0.2)' 
                              : '#ffedd5'
                          }
                        ]}
                      >
                        <Text style={styles.barValue}>{reading.value}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statsCard}>
              <Text style={styles.statsLabel}>Promedio Diario</Text>
              <View style={styles.statsValue}>
                <Text style={styles.statsNumber}>{averageGlucose}</Text>
                <Text style={styles.statsUnit}>mg/dL</Text>
              </View>
              <View style={styles.statsIndicator}>
                <Check width={12} height={12} color="#4CAF50" />
                <Text style={styles.statsStatus}>
                  {averageGlucose >= 80 && averageGlucose <= 140 
                    ? 'En rango objetivo' 
                    : 'Fuera de rango'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>Actividad Reciente</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllLink}>Ver todo</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.activityList}>
              {activities.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityLeft}>
                    <View style={[
                      styles.activityIcon,
                      { 
                        backgroundColor: activity.type === 'glucose' 
                          ? 'rgba(34, 197, 94, 0.1)'
                          : activity.type === 'meal'
                          ? '#ffedd5'
                          : '#dbeafe'
                      }
                    ]}>
                      {activity.type === 'glucose' && <Droplet width={16} height={16} color="#4CAF50" />}
                      {activity.type === 'meal' && <Utensils width={16} height={16} color="#f97316" />}
                      {activity.type === 'insulin' && <Syringe width={16} height={16} color="#3b82f6" />}
                    </View>
                    <View>
                      <Text style={styles.activityName}>
                        {activity.type === 'glucose' && 'Lectura de glucosa'}
                        {activity.type === 'meal' && activity.mealType}
                        {activity.type === 'insulin' && 'Dosis de insulina'}
                      </Text>
                      <Text style={styles.activityTime}>
                        {activity.timestamp 
                          ? formatDistanceToNow(activity.timestamp, { addSuffix: true })
                          : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.activityValue}>
                    {activity.type === 'glucose' && `${activity.value} mg/dL`}
                    {activity.type === 'meal' && `${activity.carbs}g carbohidratos`}
                    {activity.type === 'insulin' && `${activity.units} unidades`}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Modal
            visible={openDialog}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setOpenDialog(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Agregar Lectura de Glucosa</Text>
                <Text style={styles.modalDescription}>
                  Ingresa tu lectura actual de glucosa para hacer seguimiento.
                </Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Lectura de Glucosa (mg/dL)</Text>
                  <TextInput
                    style={styles.input}
                    value={glucoseValue}
                    onChangeText={setGlucoseValue}
                    keyboardType="numeric"
                    placeholder="Ingresa tu lectura"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Notas (opcional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                    placeholder="Agrega comentarios sobre esta lectura"
                  />
                </View>
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setOpenDialog(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.submitButtonText}>Guardar Lectura</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      )}

      {!isLoading && (
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => setIsChatOpen(true)}
        >
          <MessageCircle width={24} height={24} color="white" />
        </TouchableOpacity>
      )}

      <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    paddingTop: 30,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    position: 'absolute',
    right: 0,
    zIndex: 1,
    alignSelf: 'center',
    marginTop: 8,  // Add margin to lower the button
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
    height: 80,
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 8,
  },
  chartBar: {
    width: 16,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barValue: {
    position: 'absolute',
    top: -28,
    fontSize: 12,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statsValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statsUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  statsStatus: {
    fontSize: 12,
    color: '#4CAF50',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 24,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 6,
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
});
