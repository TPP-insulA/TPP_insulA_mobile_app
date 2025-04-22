import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Calculator } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/Feather';
import { format } from 'date-fns';
import { Card } from '../components/ui/card';
import { BackButton } from '../components/back-button';
import { Footer } from '../components/footer';
import { useNavigation } from '@react-navigation/native';

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

export default function InsulinPage() {
  const navigation = useNavigation();
  const [currentGlucose, setCurrentGlucose] = useState('142');
  const [carbs, setCarbs] = useState('45');
  const [activity, setActivity] = useState(activityOptions[0]);
  const [timeOfDay, setTimeOfDay] = useState(timeOptions[1]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const recentPredictions: Prediction[] = [
    {
      mealType: 'Lunch',
      date: new Date(),
      carbs: 45,
      glucose: 142,
      units: 4.2,
      accuracy: 'Accurate'
    },
    {
      mealType: 'Breakfast',
      date: new Date(Date.now() - 7 * 60 * 60 * 1000),
      carbs: 22,
      glucose: 110,
      units: 2.5,
      accuracy: 'Accurate'
    },
    {
      mealType: 'Dinner',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      carbs: 60,
      glucose: 135,
      units: 5.8,
      accuracy: 'Slightly low'
    }
  ];

  const handleCalculate = () => {
    if (!currentGlucose || !carbs) return;
    
    setIsLoading(true);
    // Simular cálculo con delay
    setTimeout(() => {
      setRecommendation({
        total: 4.2,
        breakdown: {
          correctionDose: 1.2,
          mealDose: 2.5,
          activityAdjustment: -0.3,
          timeAdjustment: 0.8
        }
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleLogDose = () => {
    if (!recommendation) return;
    // Aquí iría la lógica para guardar la dosis
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
              <Calculator width={32} height={32} color="#4CAF50" />
              <Text style={styles.title}>Insulina</Text>
            </View>
            <Text style={styles.description}>Calculá y registrá tus dosis de insulina diarias</Text>
          </View>

          {/* Calculator Card */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Calculadora de Insulina</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nivel de Glucosa Actual</Text>
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
                <Text style={styles.label}>Carbohidratos a Consumir</Text>
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
                <Text style={styles.label}>Actividad Física Planificada</Text>
                <TouchableOpacity 
                  style={styles.select}
                  onPress={() => {/* Implementar selector */}}
                >
                  <Text style={styles.selectText}>{activity}</Text>
                  <Icon name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Hora del Día</Text>
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
                    <Icon name="droplet" size={24} color="#4CAF50" />
                  </View>
                  <View style={styles.recommendationContent}>
                    <Text style={styles.recommendationTitle}>Dosis de Insulina Recomendada</Text>
                    <View style={styles.recommendationValue}>
                      <Text style={styles.recommendationNumber}>{recommendation.total}</Text>
                      <Text style={styles.recommendationUnit}>unidades</Text>
                    </View>
                    <Text style={styles.recommendationSubtext}>
                      Basado en tu glucosa actual y la comida planificada
                    </Text>
                  </View>
                </View>

                <View style={styles.breakdownSection}>
                  <Text style={styles.breakdownTitle}>Cómo se calculó:</Text>
                  <View style={styles.breakdownList}>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownText}>Dosis de corrección (glucosa actual):</Text>
                      <Text style={styles.breakdownValue}>{recommendation.breakdown.correctionDose} unidades</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownText}>Dosis para comida ({carbs}g carbohidratos):</Text>
                      <Text style={styles.breakdownValue}>{recommendation.breakdown.mealDose} unidades</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownText}>Ajuste por actividad:</Text>
                      <Text style={styles.breakdownValue}>{recommendation.breakdown.activityAdjustment} unidades</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={styles.breakdownText}>Ajuste por hora del día:</Text>
                      <Text style={styles.breakdownValue}>{recommendation.breakdown.timeAdjustment} unidades</Text>
                    </View>
                    <View style={[styles.breakdownItem, styles.breakdownTotal]}>
                      <Text style={[styles.breakdownText, styles.totalText]}>Dosis total recomendada:</Text>
                      <Text style={[styles.breakdownValue, styles.totalValue]}>{recommendation.total} unidades</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.outlineButton]}
                  onPress={handleLogDose}
                  disabled={isLoading}
                >
                  <Icon name="check" size={20} color="#4CAF50" />
                  <Text style={styles.outlineButtonText}>Registrar Esta Dosis</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Prediction Performance Card */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Rendimiento de Predicciones</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.performanceHeader}>
                <View>
                  <Text style={styles.performanceLabel}>Precisión de Predicciones</Text>
                  <View style={styles.performanceValue}>
                    <Text style={styles.performanceNumber}>92%</Text>
                    <View style={styles.performanceBadge}>
                      <Icon name="trending-up" size={12} color="#4CAF50" />
                      <Text style={styles.performanceBadgeText}>3% este mes</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.miniChart}>
                  {/* Mini chart placeholder */}
                </View>
              </View>

              <Text style={styles.performanceDescription}>
                El modelo está aprendiendo continuamente de tus respuestas glucémicas y mejorando sus predicciones.
                La precisión reciente ha aumentado a medida que el modelo se adapta a tus patrones.
              </Text>

              <Text style={styles.sectionTitle}>Predicciones Recientes</Text>

              <View style={styles.predictionsList}>
                {recentPredictions.map((prediction, index) => (
                  <View key={index} style={styles.predictionItem}>
                    <View>
                      <Text style={styles.predictionTitle}>
                        {prediction.mealType} - {format(prediction.date, 'MMM dd, p')}
                      </Text>
                      <Text style={styles.predictionDetails}>
                        {prediction.carbs}g carbohidratos, {prediction.glucose} mg/dL
                      </Text>
                    </View>
                    <View style={styles.predictionRight}>
                      <Text style={styles.predictionUnits}>{prediction.units} unidades</Text>
                      <Text style={[
                        styles.predictionAccuracy,
                        prediction.accuracy === 'Accurate' && styles.accuracyGood,
                        prediction.accuracy === 'Slightly low' && styles.accuracyWarning,
                        prediction.accuracy === 'Low' && styles.accuracyBad
                      ]}>
                        {prediction.accuracy === 'Accurate' ? 'Precisa' : 
                         prediction.accuracy === 'Slightly low' ? 'Ligeramente baja' : 'Baja'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={[styles.button, styles.linkButton]}>
                <Text style={styles.linkButtonText}>Ver Todas las Predicciones</Text>
              </TouchableOpacity>
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
});