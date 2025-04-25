import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Calculator, Droplet, Activity, Clock, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, XCircle, Zap, Calendar } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/Feather';
import { format } from 'date-fns';
import { Card } from '../components/ui/card';
import { BackButton } from '../components/back-button';
import { Footer } from '../components/footer';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/use-auth';
import { 
  getInsulinDoses, 
  createInsulinDose, 
  deleteInsulinDose, 
  calculateInsulinDose,
  getInsulinPredictions,
  InsulinDose
} from '../lib/api/insulin';

interface Recommendation {
  total: number;
  breakdown: {
    correctionDose: number;
    mealDose: number;
    activityAdjustment: number;
    timeAdjustment: number;
  };
}

interface Prediction {
  mealType: string;
  date: Date;
  carbs: number;
  glucose: number;
  units: number;
  accuracy: 'Accurate' | 'Slightly low' | 'Low';
}

const activityOptions = [
  'Ninguna',
  'Ligera (30 min caminata)',
  'Moderada (30 min trote)',
  'Intensa (1hr ejercicio)'
];

const timeOptions = [
  'Mañana (6:00-11:00)',
  'Tarde (11:00-17:00)',
  'Noche (17:00-22:00)',
  'Madrugada (22:00-6:00)'
];

type InsulinType = 'rapid' | 'long';

export default function InsulinPage() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [currentGlucose, setCurrentGlucose] = useState('142');
  const [carbs, setCarbs] = useState('45');
  const [activity, setActivity] = useState(activityOptions[0]);
  const [timeOfDay, setTimeOfDay] = useState(timeOptions[1]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [insulinDoses, setInsulinDoses] = useState<InsulinDose[]>([]);
  const [showDoseModal, setShowDoseModal] = useState(false);
  const [newDose, setNewDose] = useState<{
    units: string;
    type: InsulinType;
    notes: string;
  }>({
    units: '',
    type: 'rapid',
    notes: ''
  });

  const [predictions, setPredictions] = useState<{
    accuracy: {
      percentage: number;
      trend: {
        value: number;
        direction: 'up' | 'down';
      };
    };
    predictions: Array<{
      id: number;
      mealType: string;
      date: Date;
      carbs: number;
      glucose: number;
      units: number;
      accuracy: 'Accurate' | 'Slightly low' | 'Low';
    }>;
  } | null>(null);

  // Load insulin doses
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!token) return;
        
        const [dosesResponse, predictionsResponse] = await Promise.all([
          getInsulinDoses(token, { limit: 10 }),
          getInsulinPredictions(token, 10)
        ]);

        setInsulinDoses(dosesResponse.doses);
        setPredictions(predictionsResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      }
    };

    loadData();
  }, [token]);

  const handleCalculate = async () => {
    if (!currentGlucose || !carbs || !token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await calculateInsulinDose({
        currentGlucose: Number(currentGlucose),
        carbs: Number(carbs),
        activity,
        timeOfDay
      }, token);

      setRecommendation({
        total: result.total,
        breakdown: result.breakdown
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error calculating dose');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDose = () => {
    setShowDoseModal(true);
  };

  const handleSaveDose = async () => {
    if (!newDose.units || !token) return;
    
    try {
      const dose = await createInsulinDose({
        units: Number(newDose.units),
        type: newDose.type,
        timestamp: new Date(),
        notes: newDose.notes || undefined
      }, token);

      setInsulinDoses(prev => [dose, ...prev]);
      setShowDoseModal(false);
      setNewDose({ units: '', type: 'rapid', notes: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving dose');
    }
  };

  const handleDeleteDose = async (id: number) => {
    if (!token) return;
    
    try {
      await deleteInsulinDose(id, token);
      setInsulinDoses(prev => prev.filter(dose => dose.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting dose');
    }
  };

  const handleLogDose = async () => {
    if (!recommendation || !token) return;
    
    try {
      const dose = await createInsulinDose({
        units: recommendation.total,
        type: 'rapid',
        timestamp: new Date(),
        notes: `Calculated dose - ${carbs}g carbs, ${currentGlucose} mg/dL`
      }, token);

      setInsulinDoses(prev => [dose, ...prev]);
      setRecommendation(null);
      setCurrentGlucose('');
      setCarbs('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error logging dose');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <BackButton />
              </TouchableOpacity>
              <View style={styles.titleRow}>
                <Droplet size={32} color="#4CAF50" />
                <Text style={styles.title}>Insulina</Text>
              </View>
            </View>
            <View style={styles.descriptionContainer}>
              <Icon name="edit-3" size={16} color="#6b7280" />
              <Text style={styles.description}>
                Calculá y registrá tus dosis de insulina diarias
              </Text>
            </View>
          </View>

          {/* Registro de Dosis Card */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderContent}>
                <View style={styles.cardTitleContainer}>
                  <Calendar size={24} color="#4CAF50" />
                  <Text style={styles.cardTitle}>Registro de Dosis</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddDose}
                >
                  <Icon name="plus" size={20} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cardContent}>
              {insulinDoses.length === 0 ? (
                <View style={styles.emptyState}>
                  <Droplet size={24} color="#9ca3af" />
                  <Text style={styles.emptyStateText}>No hay dosis registradas 📋</Text>
                  <Text style={styles.emptyStateSubtext}>Toca el botón + para agregar una dosis ➕</Text>
                </View>
              ) : (
                <View style={styles.dosesList}>
                  {insulinDoses.map((dose) => (
                    <View key={dose.id} style={styles.doseItem}>
                      <View style={styles.doseInfo}>
                        <View style={styles.doseHeader}>
                          <View style={styles.doseBadge}>
                            {dose.type === 'rapid' ? (
                              <Zap size={12} color="#3b82f6" />
                            ) : (
                              <Clock size={12} color="#8b5cf6" />
                            )}
                            <Text style={[
                              styles.doseBadgeText,
                              { color: dose.type === 'rapid' ? '#3b82f6' : '#8b5cf6' }
                            ]}>
                              {dose.type === 'rapid' ? 'Rápida' : 'Lenta'}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDeleteDose(dose.id)}
                            style={styles.deleteButton}
                          >
                            <Icon name="trash-2" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.doseUnits}>💉 {dose.units} unidades</Text>
                        <Text style={styles.doseTime}>
                          📅 {format(dose.timestamp, 'HH:mm - dd/MM/yyyy')}
                        </Text>
                        {dose.notes && (
                          <Text style={styles.doseNotes}>📝 {dose.notes}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Card>

          {/* Calculator Card */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Calculator size={24} color="#4CAF50" />
                <Text style={styles.cardTitle}>Calculadora de Insulina</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Droplet size={16} color="#4CAF50" />
                  <Text style={styles.label}>Nivel de Glucosa Actual</Text>
                </View>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.input}
                    value={currentGlucose}
                    onChangeText={setCurrentGlucose}
                    keyboardType="numeric"
                    placeholder="Ingrese lectura de glucosa"
                  />
                  <View style={styles.inputAddon}>
                    <Text style={styles.inputAddonText}>mg/dL</Text>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Icon name="coffee" size={16} color="#4CAF50" />
                  <Text style={styles.label}>Carbohidratos a Consumir</Text>
                </View>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.input}
                    value={carbs}
                    onChangeText={setCarbs}
                    keyboardType="numeric"
                    placeholder="Ingrese carbohidratos"
                  />
                  <View style={styles.inputAddon}>
                    <Text style={styles.inputAddonText}>gramos</Text>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Activity size={16} color="#4CAF50" />
                  <Text style={styles.label}>Actividad Física Planificada</Text>
                </View>
                <TouchableOpacity 
                  style={styles.select}
                  onPress={() => {/* Implementar selector */}}
                >
                  <Text style={styles.selectText}>{activity}</Text>
                  <Icon name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Clock size={16} color="#4CAF50" />
                  <Text style={styles.label}>Hora del Día</Text>
                </View>
                <TouchableOpacity 
                  style={styles.select}
                  onPress={() => {/* Implementar selector */}}
                >
                  <Text style={styles.selectText}>{timeOfDay}</Text>
                  <Icon name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleCalculate}
                disabled={isLoading || !currentGlucose || !carbs}
              >
                {isLoading ? (
                  <View>
                    <Icon name="loader" size={20} color="white" />
                  </View>
                ) : (
                  <Calculator size={20} color="white" />
                )}
                <Text style={styles.buttonText}>Calcular Dosis de Insulina</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Recommendation Card */}
          {recommendation && (
            <Card style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.recommendationHeader}>
                  <View style={styles.iconContainer}>
                    <Droplet size={24} color="#4CAF50" />
                  </View>
                  <View style={styles.recommendationContent}>
                    <Text style={styles.recommendationTitle}>Dosis de Insulina Recomendada ✨</Text>
                    <View style={styles.recommendationValue}>
                      <Text style={styles.recommendationNumber}>{recommendation.total}</Text>
                      <Text style={styles.recommendationUnit}>unidades 💉</Text>
                    </View>
                    <Text style={styles.recommendationSubtext}>
                      Basado en tu glucosa actual y la comida planificada 📊
                    </Text>
                  </View>
                </View>

                <View style={styles.breakdownSection}>
                  <Text style={styles.breakdownTitle}>Cómo se calculó: 🔍</Text>
                  <View style={styles.breakdownList}>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownText}>🩺 Dosis de corrección:</Text>
                      <Text style={styles.breakdownValue}>{recommendation.breakdown.correctionDose} U</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownText}>🍽️ Dosis para comida:</Text>
                      <Text style={styles.breakdownValue}>{recommendation.breakdown.mealDose} U</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownText}>🏃‍♂️ Ajuste por actividad:</Text>
                      <Text style={styles.breakdownValue}>{recommendation.breakdown.activityAdjustment} U</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownText}>🕒 Ajuste por hora:</Text>
                      <Text style={styles.breakdownValue}>{recommendation.breakdown.timeAdjustment} U</Text>
                    </View>
                    <View style={[styles.breakdownItem, styles.breakdownTotal]}>
                      <Text style={[styles.breakdownText, styles.totalText]}>💉 Dosis total:</Text>
                      <Text style={[styles.breakdownValue, styles.totalValue]}>{recommendation.total} U</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.outlineButton]}
                  onPress={handleLogDose}
                  disabled={isLoading}
                >
                  <CheckCircle size={20} color="#4CAF50" />
                  <Text style={styles.outlineButtonText}>Registrar Esta Dosis ✅</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Prediction Performance Card */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <TrendingUp size={24} color="#4CAF50" />
                <Text style={styles.cardTitle}>Rendimiento de Predicciones</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.performanceHeader}>
                <View>
                  <Text style={styles.performanceLabel}>Precisión de Predicciones 🎯</Text>
                  <View style={styles.performanceValue}>
                    <Text style={styles.performanceNumber}>{predictions?.accuracy.percentage}%</Text>
                    <View style={styles.performanceBadge}>
                      {predictions?.accuracy.trend.direction === 'up' ? (
                        <TrendingUp size={12} color="#4CAF50" />
                      ) : (
                        <TrendingDown size={12} color="#ef4444" />
                      )}
                      <Text style={styles.performanceBadgeText}>
                        {predictions?.accuracy.trend.value}% este mes
                        {predictions?.accuracy.trend.direction === 'up' ? ' 📈' : ' 📉'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <Text style={styles.performanceDescription}>
                🤖 El modelo está aprendiendo continuamente de tus respuestas glucémicas y mejorando sus predicciones.
                La precisión reciente ha {predictions?.accuracy.trend.direction === 'up' ? 'aumentado ⬆️ ' : 'disminuido ⬇️ '} 
                 a medida que el modelo se adapta a tus patrones.
              </Text>

              <Text style={styles.sectionTitle}>Predicciones Recientes 🔮</Text>

              <View style={styles.predictionsList}>
                {predictions?.predictions.map((prediction) => (
                  <View key={prediction.id} style={styles.predictionItem}>
                    <View>
                      <Text style={styles.predictionTitle}>
                        🕒 {prediction.mealType} - {format(new Date(prediction.date), 'MMM dd, p')}
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
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Modal para agregar dosis */}
      {showDoseModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Dosis de Insulina</Text>
              <TouchableOpacity 
                onPress={() => setShowDoseModal(false)}
                style={styles.closeButton}
              >
                <Icon name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Unidades</Text>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.input}
                    value={newDose.units}
                    onChangeText={(value) => setNewDose(prev => ({ ...prev, units: value }))}
                    keyboardType="numeric"
                    placeholder="Ingrese unidades"
                  />
                  <View style={styles.inputAddon}>
                    <Text style={styles.inputAddonText}>U</Text>
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipo de Insulina</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      newDose.type === 'rapid' && styles.typeOptionSelected,
                      newDose.type === 'rapid' && styles['typeOptionSelected-rapid'],
                      newDose.type !== 'rapid' && styles['typeOption-rapid']
                    ]}
                    onPress={() => setNewDose(prev => ({ ...prev, type: 'rapid' }))}
                  >
                    <Icon 
                      name="zap" 
                      size={16} 
                      color={newDose.type === 'rapid' ? '#ffffff' : '#3b82f6'} 
                    />
                    <Text style={[
                      styles.typeOptionText,
                      newDose.type === 'rapid' && styles.typeOptionTextSelected
                    ]}>Rápida</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      newDose.type === 'long' && styles.typeOptionSelected,
                      newDose.type === 'long' && styles['typeOptionSelected-long'],
                      newDose.type !== 'long' && styles['typeOption-long']
                    ]}
                    onPress={() => setNewDose(prev => ({ ...prev, type: 'long' }))}
                  >
                    <Icon 
                      name="clock" 
                      size={16} 
                      color={newDose.type === 'long' ? '#ffffff' : '#8b5cf6'} 
                    />
                    <Text style={[
                      styles.typeOptionText,
                      newDose.type === 'long' && styles.typeOptionTextSelected
                    ]}>Lenta</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Notas (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newDose.notes}
                  onChangeText={(value) => setNewDose(prev => ({ ...prev, notes: value }))}
                  placeholder="Agregar notas o comentarios"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  textBreakStrategy="simple"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, styles.primaryButton, !newDose.units && styles.buttonDisabled]}
                onPress={handleSaveDose}
                disabled={!newDose.units}
              >
                <Icon name="check" size={20} color="white" />
                <Text style={styles.buttonText}>Guardar Dosis</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    width: '100%',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 30,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
    alignSelf: 'center',
  },
  titleSection: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 15,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  cardContent: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputAddon: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  inputAddonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  selectText: {
    fontSize: 16,
    color: '#111827',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  recommendationContent: {
    flex: 1,
  },
  iconContainer: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  recommendationValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  recommendationNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
  recommendationUnit: {
    fontSize: 16,
    color: '#6b7280',
  },
  recommendationSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  breakdownSection: {
    gap: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  breakdownList: {
    gap: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownText: {
    fontSize: 14,
    color: '#6b7280',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#111827',
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 8,
  },
  totalText: {
    fontWeight: '600',
  },
  totalValue: {
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: 'white',
  },
  outlineButtonText: {
    color: '#4CAF50',
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  performanceValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  performanceNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  performanceBadgeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  miniChart: {
    width: 50,
    height: 50,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  performanceDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  predictionsList: {
    gap: 16,
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predictionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  predictionDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  predictionRight: {
    alignItems: 'flex-end',
  },
  predictionUnits: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  predictionAccuracy: {
    fontSize: 12,
    fontWeight: '500',
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
  linkButton: {
    backgroundColor: 'transparent',
  },
  linkButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  dosesList: {
    gap: 16,
  },
  doseItem: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  doseInfo: {
    gap: 8,
  },
  doseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  doseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  doseBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
  },
  doseUnits: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  doseTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  doseNotes: {
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  modalForm: {
    gap: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    gap: 8,
    backgroundColor: 'white',
  },
  typeOptionSelected: {
    borderColor: 'transparent',
    backgroundColor: '#3b82f6', // For rapid insulin
  },
  'typeOption-rapid': {
    borderColor: '#3b82f6',
  },
  'typeOption-long': {
    borderColor: '#8b5cf6',
  },
  'typeOptionSelected-rapid': {
    backgroundColor: '#3b82f6',
  },
  'typeOptionSelected-long': {
    backgroundColor: '#8b5cf6',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeOptionTextSelected: {
    color: '#ffffff',
  },
  textArea: {
    minHeight: 100,
    height: 'auto',
    maxHeight: 200,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});