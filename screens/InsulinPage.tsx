import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Modal, Pressable } from 'react-native';
import { Calculator, Droplet, Zap, TrendingUp, TrendingDown, AlertCircle, Coffee, Moon, Briefcase, Activity } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/Feather';
import { format } from 'date-fns';
import { Card } from '../components/ui/card';
import { Footer } from '../components/footer';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/use-auth';
import { 
  calculateInsulinDose,
  getInsulinPredictions,
} from '../lib/api/insulin';
import { getGlucoseReadings } from '../lib/api/glucose';
import { AppHeader } from '../components/app-header';

const MAX_GLUCOSE_ENTRIES = 24;

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

const GlucoseModal = memo(({ 
  isVisible, 
  onClose, 
  glucoseInputs, 
  onGlucoseChange, 
  onRemoveGlucose, 
  onAddGlucose,
  isLoadingGlucose,
  noGlucoseFound,
  onLoadRecent,
  token
}: {
  isVisible: boolean;
  onClose: () => void;
  glucoseInputs: string[];
  onGlucoseChange: (value: string, idx: number) => void;
  onRemoveGlucose: (idx: number) => void;
  onAddGlucose: () => void;
  isLoadingGlucose: boolean;
  noGlucoseFound: boolean;
  onLoadRecent: () => void;
  token: string | null;
}) => {
  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ingresar Mediciones de Glucosa 🩺</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalDescription}>
            Ingresa tus niveles de glucosa recientes (mg/dL) de las últimas 2 horas. Máximo 24 mediciones. Usa el botón 'Cargar últimos valores' para obtener datos automáticos o ingrésalos manualmente. 📝
          </Text>

          <TouchableOpacity
            style={[styles.loadButton, noGlucoseFound ? styles.loadButtonDisabled : (isLoadingGlucose && styles.buttonDisabled)]}
            onPress={onLoadRecent}
            disabled={isLoadingGlucose || !token || noGlucoseFound}
          >
            {isLoadingGlucose ? (
              <Icon name="loader" size={16} color="#4CAF50" />
            ) : noGlucoseFound ? (
              <Icon name="x-circle" size={16} color="#9CA3AF" />
            ) : (
              <Icon name="refresh-cw" size={16} color="#4CAF50" />
            )}
            <Text style={[styles.loadButtonText, noGlucoseFound && styles.disabledButtonText]}>
              {noGlucoseFound ? "No se encontraron valores" : "Cargar últimos valores"}
            </Text>
          </TouchableOpacity>

          <ScrollView 
            style={styles.glucoseInputsScroll}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.glucoseInputsContent}
          >
            <View style={styles.glucoseGrid}>
              {glucoseInputs.map((value, idx) => (
                <View key={idx} style={styles.glucoseInputContainer}>
                  <TextInput
                    style={styles.glucoseInput}
                    value={value}
                    onChangeText={v => onGlucoseChange(v, idx)}
                    keyboardType="numeric"
                    placeholder={`Glucosa #${idx + 1}`}
                    maxLength={3}
                  />
                  <View style={styles.glucoseInputAddon}>
                    <Text style={styles.glucoseInputAddonText}>mg/dL</Text>
                  </View>
                  {idx > 0 && (
                    <TouchableOpacity onPress={() => onRemoveGlucose(idx)} style={styles.removeGlucoseButton}>
                      <Icon name="x-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          {glucoseInputs.length < MAX_GLUCOSE_ENTRIES && (
            <TouchableOpacity
              style={styles.addGlucoseInputButton}
              onPress={onAddGlucose}
            >
              <Icon name="plus-circle" size={20} color="#4CAF50" />
              <Text style={styles.addGlucoseInputText}>Agregar medición</Text>
            </TouchableOpacity>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

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
  const [isLoadingGlucose, setIsLoadingGlucose] = useState(false);
  const [noGlucoseFound, setNoGlucoseFound] = useState(false);
  const [sleepQuality, setSleepQuality] = useState(''); // 1-10
  const [workLevel, setWorkLevel] = useState(''); // 1-10
  const [exerciseLevel, setExerciseLevel] = useState(''); // 1-10

  // New states for glucose modal
  const [isGlucoseModalVisible, setIsGlucoseModalVisible] = useState(false);
  const [showAllGlucoseInputs, setShowAllGlucoseInputs] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  const INITIAL_VISIBLE_INPUTS = 12;

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

  const loadRecentGlucoseReadings = async () => {
    setIsLoadingGlucose(true);
    setError(null);
    setNoGlucoseFound(false);
    try {
      if (!token) return;
      
      const now = new Date();
      const startDate = new Date(now.getTime() - (2 * 60 + 15) * 60 * 1000);
      
      const params = {
        startDate: startDate.toISOString(),
        limit: MAX_GLUCOSE_ENTRIES
      };
      
      const readings = await getGlucoseReadings(token, params);
      
      const glucoseValues = readings
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, MAX_GLUCOSE_ENTRIES - 1)
        .map(reading => reading.value.toString());
      
      if (glucoseValues.length === 0) {
        setNoGlucoseFound(true);
        setGlucoseInputs(['']);
        return;
      }
      
      if (glucoseValues.length < MAX_GLUCOSE_ENTRIES) {
        glucoseValues.push('');
      }
      
      setGlucoseInputs(glucoseValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando lecturas de glucosa');
      setNoGlucoseFound(true);
    } finally {
      setIsLoadingGlucose(false);
    }
  };

  const handleGlucoseChange = useCallback((value: string, idx: number) => {
    if (!/^\d{0,3}$/.test(value)) return;
    if (value === '0') return;
    const arr = [...glucoseInputs];
    arr[idx] = value;
    if (value && idx === glucoseInputs.length - 1 && arr.length < MAX_GLUCOSE_ENTRIES) {
      arr.push('');
    }
    setGlucoseInputs(arr.slice(0, MAX_GLUCOSE_ENTRIES));
  }, [glucoseInputs]);

  const handleRemoveGlucose = useCallback((idx: number) => {
    const arr = glucoseInputs.filter((_, i) => i !== idx);
    setGlucoseInputs(arr.length === 0 ? [''] : arr);
  }, [glucoseInputs]);

  const handleAddGlucose = useCallback(() => {
    const newInputs = [...glucoseInputs];
    newInputs.push('');
    setGlucoseInputs(newInputs);
  }, [glucoseInputs]);

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
        userId: token,
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

  // Glucose Summary Component
  const GlucoseSummary = () => {
    const validGlucoses = glucoseInputs.filter(g => g !== '' && g !== '0');
    if (validGlucoses.length === 0) return null;

    return (
      <View style={styles.glucoseSummary}>
        <View style={styles.glucoseSummaryContent}>
          <View style={styles.glucoseSummaryHeader}>
            <Droplet size={16} color="#4CAF50" />
            <Text style={styles.glucoseSummaryText}>
              {validGlucoses.length} glucosa(s) ingresada(s)
            </Text>
          </View>
          <Text style={styles.glucoseSummaryValues}>
            {validGlucoses.join(', ')} mg/dL
          </Text>
        </View>
        <TouchableOpacity
          style={styles.editGlucoseButton}
          onPress={() => setIsGlucoseModalVisible(true)}
        >
          <Text style={styles.editGlucoseText}>Editar</Text>
        </TouchableOpacity>
      </View>
    );
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
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Calculator size={24} color="#4CAF50" />
                <Text style={styles.cardTitle}>Calculadora de Insulina</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              {/* Glucose Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                <Droplet size={16} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Glucosa</Text>
                </View>
                {glucoseInputs.filter(g => g !== '' && g !== '0').length === 0 ? (
                  <TouchableOpacity
                    style={styles.addGlucoseButton}
                    onPress={() => setIsGlucoseModalVisible(true)}
                  >
                    <Droplet size={16} color="#fff" />
                    <Text style={styles.addGlucoseText}>Agregar Glucosas 📈</Text>
                  </TouchableOpacity>
                ) : (
                  <GlucoseSummary />
                )}
                      </View>

              {/* Nutrition and Control Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Coffee size={16} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Nutrición y Control</Text>
                </View>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionRow}>
                    <View style={styles.nutritionLabel}>
                      <View style={styles.nutritionLabelHeader}>
                        <Droplet size={16} color="#4CAF50" />
                        <Text style={styles.nutritionLabelText}>Glucosa Objetivo</Text>
                      </View>
                      <Text style={styles.nutritionDescription}>Valor deseado de glucosa (80-180 mg/dL)</Text>
                    </View>
                    <View style={styles.nutritionInput}>
                      {showTargetWarning && (
                        <Text style={[styles.errorText, styles.errorTextAbove]}>Debe ser entre 80-180 mg/dL</Text>
                      )}
                      <TextInput
                        style={[styles.nutritionInputField, showTargetWarning && styles.errorInput]}
                        value={targetBloodGlucose}
                        onChangeText={setTargetBloodGlucose}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                      <Text style={styles.nutritionUnit}>mg/dL</Text>
                    </View>
                  </View>

                  <View style={styles.nutritionRow}>
                    <View style={styles.nutritionLabel}>
                      <View style={styles.nutritionLabelHeader}>
                        <Coffee size={16} color="#4CAF50" />
                        <Text style={styles.nutritionLabelText}>Carbohidratos</Text>
                      </View>
                      <Text style={styles.nutritionDescription}>Cantidad de carbohidratos a consumir</Text>
                    </View>
                    <View style={styles.nutritionInput}>
                      <TextInput
                        style={styles.nutritionInputField}
                        value={carbs}
                        onChangeText={setCarbs}
                        keyboardType="numeric"
                        placeholder="0.00"
                      />
                      <Text style={styles.nutritionUnit}>g</Text>
                    </View>
                  </View>

                  <View style={styles.nutritionRow}>
                    <View style={styles.nutritionLabel}>
                      <View style={styles.nutritionLabelHeader}>
                        <Zap size={16} color="#4CAF50" />
                        <Text style={styles.nutritionLabelText}>Insulina Activa</Text>
                      </View>
                      <Text style={styles.nutritionDescription}>Insulina que aún actúa en tu cuerpo</Text>
                    </View>
                    <View style={styles.nutritionInput}>
                      <TextInput
                        style={styles.nutritionInputField}
                        value={insulinOnBoard}
                        onChangeText={setInsulinOnBoard}
                        keyboardType="numeric"
                        placeholder="0.00"
                      />
                      <Text style={styles.nutritionUnit}>U</Text>
                    </View>
                  </View>
                </View>
                {carbs && !isValidCarbs(carbs) && (
                  <Text style={styles.errorText}>Número válido (2 decimales)</Text>
                )}
                {insulinOnBoard && !isValidInsulinOnBoard(insulinOnBoard) && (
                  <Text style={styles.errorText}>Número válido (2 decimales)</Text>
                )}
              </View>

              {/* Lifestyle Factors Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Activity size={16} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Factores de Estilo de Vida</Text>
                </View>

                <View style={styles.lifestyleGrid}>
                  <View style={styles.lifestyleItem}>
                    <View style={styles.lifestyleLabelContainer}>
                      <Moon size={16} color="#4CAF50" />
                      <Text style={styles.lifestyleLabel}>Sueño</Text>
                    </View>
                    <Text style={styles.lifestyleDescription}>1: Sin dormir, 10: Dormido bien</Text>
                <TextInput
                      style={styles.lifestyleInput}
                  value={sleepQuality}
                  onChangeText={v => {
                    if (/^$|^([1-9]|10)$/.test(v)) setSleepQuality(v);
                  }}
                  keyboardType="numeric"
                  placeholder="1-10"
                  maxLength={2}
                />
              </View>

                  <View style={styles.lifestyleItem}>
                    <View style={styles.lifestyleLabelContainer}>
                      <Briefcase size={16} color="#4CAF50" />
                      <Text style={styles.lifestyleLabel}>Trabajo</Text>
                </View>
                    <Text style={styles.lifestyleDescription}>1: Sin estrés, 10: Muy estresado</Text>
                <TextInput
                      style={styles.lifestyleInput}
                  value={workLevel}
                  onChangeText={v => {
                    if (/^$|^([1-9]|10)$/.test(v)) setWorkLevel(v);
                  }}
                  keyboardType="numeric"
                  placeholder="1-10"
                  maxLength={2}
                />
              </View>

                  <View style={styles.lifestyleItem}>
                    <View style={styles.lifestyleLabelContainer}>
                      <Activity size={16} color="#4CAF50" />
                      <Text style={styles.lifestyleLabel}>Ejercicio</Text>
                </View>
                    <Text style={styles.lifestyleDescription}>1: Sin actividad, 10: Intenso</Text>
                <TextInput
                      style={styles.lifestyleInput}
                  value={exerciseLevel}
                  onChangeText={v => {
                    if (/^$|^([1-9]|10)$/.test(v)) setExerciseLevel(v);
                  }}
                  keyboardType="numeric"
                  placeholder="1-10"
                  maxLength={2}
                />
                  </View>
                </View>
              </View>

              {/* Calculate Button */}
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
                <View style={styles.errorContainer}>
                  <AlertCircle size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Recommendation Section */}
          {recommendation && (
            <Card style={styles.card}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setShowRecommendation(!showRecommendation)}
              >
                <View style={styles.sectionTitleContainer}>
                    <Droplet size={24} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Dosis de Insulina Recomendada ✨</Text>
                  </View>
                <Icon
                  name={showRecommendation ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#4CAF50"
                />
              </TouchableOpacity>

              {showRecommendation && (
                  <View style={styles.recommendationContent}>
                    <View style={styles.recommendationValue}>
                      <Text style={styles.recommendationNumber}>{recommendation.total}</Text>
                      <Text style={styles.recommendationUnit}>unidades 💉</Text>
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
                    </View>
                  </View>
                </View>
              )}
            </Card>
          )}
        </View>
      </ScrollView>
      <Footer />
      <GlucoseModal
        isVisible={isGlucoseModalVisible}
        onClose={() => setIsGlucoseModalVisible(false)}
        glucoseInputs={glucoseInputs}
        onGlucoseChange={handleGlucoseChange}
        onRemoveGlucose={handleRemoveGlucose}
        onAddGlucose={handleAddGlucose}
        isLoadingGlucose={isLoadingGlucose}
        noGlucoseFound={noGlucoseFound}
        onLoadRecent={loadRecentGlucoseReadings}
        token={token}
      />
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
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 12,
  },
  cardHeader: {
    marginBottom: 2,
    alignItems: 'center',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  cardContent: {
    gap: 10,
  },
  section: {
    gap: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    gap: 4,
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
    padding: 10,
    fontSize: 16,
  },
  inputAddon: {
    padding: 10,
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
    padding: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 6,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  glucoseInputsScroll: {
    maxHeight: 400,
  },
  glucoseInputsContent: {
    paddingBottom: 16,
  },
  glucoseGrid: {
    gap: 8,
  },
  glucoseInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  glucoseInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 48,
  },
  glucoseInputAddon: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  glucoseInputAddonText: {
    fontSize: 12,
    color: '#6b7280',
  },
  removeGlucoseButton: {
    marginLeft: 4,
  },
  addGlucoseInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  addGlucoseInputText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  glucoseSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  glucoseSummaryContent: {
    flexDirection: 'column',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  glucoseSummaryText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  glucoseSummaryValues: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  editGlucoseButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  editGlucoseText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  addGlucoseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addGlucoseText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  recommendationContent: {
    gap: 16,
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
  breakdownSection: {
    gap: 12,
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
    fontWeight: '500',
    color: '#111827',
  },
  predictionsContent: {
    gap: 16,
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
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
  loadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  loadButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  loadButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  lifestyleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  lifestyleItem: {
    flex: 1,
    gap: 4,
  },
  lifestyleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lifestyleLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  lifestyleDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  lifestyleInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#f9fafb',
  },
  labelContainer: {
    gap: 2,
    marginBottom: 4,
  },
  inputDescription: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  nutritionGrid: {
    gap: 10,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
  },
  nutritionLabel: {
    flex: 1,
    gap: 4,
  },
  nutritionLabelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nutritionLabelText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  nutritionDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 22,
  },
  nutritionInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 8,
    minWidth: 95,
    marginLeft: 10,
  },
  nutritionInputField: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 4,
    textAlign: 'right',
  },
  nutritionUnit: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
  },
  glucoseSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorTextAbove: {
    position: 'absolute',
    top: -22,
    right: 0,
    fontSize: 12,
    fontWeight: '500',
  },
  errorInput: {
    borderColor: '#ef4444',
  },
});