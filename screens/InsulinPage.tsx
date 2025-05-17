import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Calculator, Droplet, Zap, TrendingUp, TrendingDown } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/Feather';
import { format } from 'date-fns';
import { Card } from '../components/ui/card';
import { BackButton } from '../components/back-button';
import { Footer } from '../components/footer';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/use-auth';
import { calculateInsulinDose, getInsulinPredictions } from '../lib/api/insulin';
import { 
  getInsulinDoses, 
  createInsulinDose, 
  deleteInsulinDose, 
  calculateInsulinDose,
  getInsulinPredictions,
  InsulinDose
} from '../lib/api/insulin';
import { AppHeader } from '../components/app-header';

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

export default function InsulinPage() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [glucoseInputs, setGlucoseInputs] = useState<string[]>(['']);
  const [carbs, setCarbs] = useState('');
  const [insulinOnBoard, setInsulinOnBoard] = useState('');
  const [targetBloodGlucose, setTargetBloodGlucose] = useState('');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const [glucoseExpanded, setGlucoseExpanded] = useState(true);
  const [sleepQuality, setSleepQuality] = useState(''); // 1-10
  const [workLevel, setWorkLevel] = useState(''); // 1-10
  const [exerciseLevel, setExerciseLevel] = useState(''); // 1-10

  const MAX_GLUCOSE_ENTRIES = 24;

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        if (!token) return;
        const predictionsResponse = await getInsulinPredictions(token, 10);
        setPredictions(predictionsResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading predictions');
      }
    };
    loadPredictions();
  }, [token]);

  const handleGlucoseChange = (value: string, idx: number) => {
    if (!/^\d{0,3}$/.test(value)) return;
    if (value === '0') return;
    const arr = [...glucoseInputs];
    arr[idx] = value;
    if (value && idx === glucoseInputs.length - 1 && arr.length < MAX_GLUCOSE_ENTRIES) {
      arr.push('');
    }
    setGlucoseInputs(arr.slice(0, MAX_GLUCOSE_ENTRIES));
  };

  const handleRemoveGlucose = (idx: number) => {
    const arr = glucoseInputs.filter((_, i) => i !== idx);
    setGlucoseInputs(arr.length === 0 ? [''] : arr);
  };

  const isValidCarbs = (val: string) => /^\d+(,\d{0,2})?$|^\d+(\.\d{0,2})?$/.test(val);
  const isValidInsulinOnBoard = (val: string) => /^\d+(,\d{0,2})?$|^\d+(\.\d{0,2})?$/.test(val);

  const isValidTargetGlucose = (val: string) => {
    if (!/^\d{0,3}$/.test(val)) return false;
    if (!val) return false;
    const n = Number(val);
    return n >= 80 && n <= 180;
  };
  const showTargetWarning = targetBloodGlucose && (!/^\d{0,3}$/.test(targetBloodGlucose) || Number(targetBloodGlucose) < 80 || Number(targetBloodGlucose) > 180);

  const canCalculate = () => {
    const glucosas = glucoseInputs.filter(g => g !== '' && g !== '0');
    return (
      glucosas.length > 0 &&
      glucosas.length <= MAX_GLUCOSE_ENTRIES &&
      carbs !== '' && isValidCarbs(carbs) &&
      insulinOnBoard !== '' && isValidInsulinOnBoard(insulinOnBoard) &&
      targetBloodGlucose && isValidTargetGlucose(targetBloodGlucose) &&
      sleepQuality !== '' && workLevel !== '' && exerciseLevel !== '' &&
      /^([1-9]|10)$/.test(sleepQuality) &&
      /^([1-9]|10)$/.test(workLevel) &&
      /^([1-9]|10)$/.test(exerciseLevel) &&
      !isLoading
    );
  };

  const handleCalculate = async () => {
    if (!canCalculate() || !token) return;
    setIsLoading(true);
    setError(null);
    try {
      const cgmPrev = glucoseInputs.filter(g => g !== '').map(Number);
      const calculation = {
        userId: token, // TODO: reemplazar con el ID del usuario
        date: new Date().toISOString(),
        cgmPrev,
        glucoseObjective: Number(targetBloodGlucose),
        carbs: Number(carbs.replace(',', '.')),
        insulinOnBoard: Number(insulinOnBoard.replace(',', '.')),
        sleepLevel: Number(sleepQuality),
        workLevel: Number(workLevel),
        activityLevel: Number(exerciseLevel),
      };
      const result = await calculateInsulinDose(calculation, token);
      (navigation as any).navigate('PredictionResultPage', { result });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error calculando dosis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Insulina"
        icon={<Droplet size={32} color="#fff" />}
        onBack={() => navigation.goBack()}
      />
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
                Calculá tu dosis de insulina con la calculadora inteligente
              </Text>
            </View>
          </View>

          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Calculator size={24} color="#4CAF50" />
                <Text style={styles.cardTitle}>Calculadora de Insulina</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                onPress={() => setGlucoseExpanded(exp => !exp)}
              >
                <Droplet size={16} color="#4CAF50" />
                <Text style={[styles.label, { flex: 1 }]}>Glucosa (mg/dL)</Text>
                <Icon name={glucoseExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#4CAF50" />
              </TouchableOpacity>
              <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 8 }}>
                Las mediciones se cargan de más reciente a más antigua. Solo se permiten mediciones de las últimas 2 horas (mg/dL). Máximo 24 mediciones.
              </Text>
              {glucoseExpanded && (
                <View>
                  {glucoseInputs.map((value, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={value}
                        onChangeText={v => handleGlucoseChange(v, idx)}
                        keyboardType="numeric"
                        placeholder={`Glucosa #${idx + 1}`}
                        maxLength={3}
                        editable={idx < MAX_GLUCOSE_ENTRIES}
                      />
                      <View style={styles.inputAddon}>
                        <Text style={styles.inputAddonText}>mg/dL</Text>
                      </View>
                      {idx > 0 && (
                        <TouchableOpacity onPress={() => handleRemoveGlucose(idx)} style={{ marginLeft: 8 }}>
                          <Icon name="x-circle" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  {glucoseInputs.length === MAX_GLUCOSE_ENTRIES && glucoseInputs[MAX_GLUCOSE_ENTRIES-1] !== '' && (
                    <Text style={{ color: '#ef4444', fontSize: 12 }}>Máximo 24 mediciones alcanzado.</Text>
                  )}
                </View>
              )}

              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Droplet size={16} color="#4CAF50" />
                  <Text style={styles.label}>Glucosa Objetivo</Text>
                </View>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.input}
                    value={targetBloodGlucose}
                    onChangeText={setTargetBloodGlucose}
                    keyboardType="numeric"
                    placeholder="Glucosa objetivo (mg/dL)"
                  />
                  <View style={styles.inputAddon}>
                    <Text style={styles.inputAddonText}>mg/dL</Text>
                  </View>
                </View>
                {showTargetWarning && (
                  <Text style={{ color: '#ef4444', fontSize: 12 }}>Debe ser un número entre 80 y 180 mg/dL.</Text>
                )}
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
                {carbs && !isValidCarbs(carbs) && (
                  <Text style={{ color: '#ef4444', fontSize: 12 }}>Ingrese un número válido (hasta 2 decimales).</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Zap size={16} color="#4CAF50" />
                  <Text style={styles.label}>Insulin On Board</Text>
                </View>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.input}
                    value={insulinOnBoard}
                    onChangeText={setInsulinOnBoard}
                    keyboardType="numeric"
                    placeholder="Insulina activa (U)"
                  />
                  <View style={styles.inputAddon}>
                    <Text style={styles.inputAddonText}>U</Text>
                  </View>
                </View>
                {insulinOnBoard && !isValidInsulinOnBoard(insulinOnBoard) && (
                  <Text style={{ color: '#ef4444', fontSize: 12 }}>Ingrese un número válido (hasta 2 decimales).</Text>
                )}
              </View>

              {/* CAMPOS DE SUEÑO, TRABAJO Y EJERCICIO AL FINAL */}
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Icon name="moon" size={16} color="#4CAF50" />
                  <Text style={styles.label}>¿Cómo dormiste? (1 = mal, 10 = excelente)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={sleepQuality}
                  onChangeText={v => {
                    if (/^$|^([1-9]|10)$/.test(v)) setSleepQuality(v);
                  }}
                  keyboardType="numeric"
                  placeholder="1-10"
                  maxLength={2}
                />
                {sleepQuality && (Number(sleepQuality) < 1 || Number(sleepQuality) > 10) && (
                  <Text style={{ color: '#ef4444', fontSize: 12 }}>Ingrese un valor entre 1 y 10.</Text>
                )}
              </View>
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Icon name="briefcase" size={16} color="#4CAF50" />
                  <Text style={styles.label}>Nivel de trabajo (1 = poco, 10 = mucho)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={workLevel}
                  onChangeText={v => {
                    if (/^$|^([1-9]|10)$/.test(v)) setWorkLevel(v);
                  }}
                  keyboardType="numeric"
                  placeholder="1-10"
                  maxLength={2}
                />
                {workLevel && (Number(workLevel) < 1 || Number(workLevel) > 10) && (
                  <Text style={{ color: '#ef4444', fontSize: 12 }}>Ingrese un valor entre 1 y 10.</Text>
                )}
              </View>
              <View style={styles.formGroup}>
                <View style={styles.labelContainer}>
                  <Icon name="activity" size={16} color="#4CAF50" />
                  <Text style={styles.label}>Ejercicio realizado (1 = nada, 10 = muy intenso)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={exerciseLevel}
                  onChangeText={v => {
                    if (/^$|^([1-9]|10)$/.test(v)) setExerciseLevel(v);
                  }}
                  keyboardType="numeric"
                  placeholder="1-10"
                  maxLength={2}
                />
                {exerciseLevel && (Number(exerciseLevel) < 1 || Number(exerciseLevel) > 10) && (
                  <Text style={{ color: '#ef4444', fontSize: 12 }}>Ingrese un valor entre 1 y 10.</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.button, styles.primaryButton, !canCalculate() && styles.buttonDisabled]}
                onPress={handleCalculate}
                disabled={!canCalculate()}
              >
                {isLoading ? (
                  <Icon name="loader" size={20} color="white" />
                ) : (
                  <Calculator size={20} color="white" />
                )}
                <Text style={styles.buttonText}>Calcular Dosis de Insulina</Text>
              </TouchableOpacity>
              {error && (
                <Text style={{ color: '#ef4444', marginTop: 8 }}>{error}</Text>
              )}
            </View>
          </Card>

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
                      Basado en tus datos ingresados 📊
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
              </View>
            </Card>
          )}

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
    paddingTop: 20,
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
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
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
});