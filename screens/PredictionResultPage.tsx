import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card } from '../components/ui/card';
import { LineChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { RouteProp } from '@react-navigation/native';
import type { InsulinPredictionResult } from '../lib/api/insulin';
import { Activity, Calendar, Syringe, ChevronRight, Plus, Trash2, Database, LineChart as LineChartIcon, Clipboard, Info } from 'lucide-react-native';
import { updateInsulinPredictionResult } from '../lib/api/insulin';
import { useAuth } from '../hooks/use-auth';
import { AppHeader } from '../components/app-header';
import { getGlucoseReadings } from '../lib/api/glucose';
import Icon from 'react-native-vector-icons/Feather';

export default function PredictionResultPage() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, { result: InsulinPredictionResult }>, string>>();
  const result: InsulinPredictionResult = (route.params as any)?.result || {};
  const {
    id = '',
    cgmPrev = [],
    glucoseObjective = 0,
    carbs = 0,
    insulinOnBoard = 0,
    sleepLevel = 0,
    workLevel = 0,
    activityLevel = 0,
    recommendedDose = 0,
    applyDose = 0,
    cgmPost = [],
    date = '',
  } = result;

  // Use cgmPrev/cgmPost directly, always in the same order (oldest to newest)
  const cgmPrevOrdered = Array.isArray(cgmPrev) ? [...cgmPrev].reverse() : [];
  const cgmPostOrdered = Array.isArray(cgmPost) ? cgmPost : [];
  const hasPostData = cgmPostOrdered.length > 0 || (applyDose !== undefined && applyDose !== null && applyDose !== 0);

  const [showAllGlucoses, setShowAllGlucoses] = useState(false);
  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);
  const [showPostInputs, setShowPostInputs] = useState(false);
  const [cgmPostInputs, setCgmPostInputs] = useState<string[]>(['']);
  const [appliedDoseInput, setAppliedDoseInput] = useState('');
  const [postError, setPostError] = useState<string | null>(null);
  const { token } = useAuth();
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [isLoadingPostGlucose, setIsLoadingPostGlucose] = useState(false);
  const [noPostGlucoseFound, setNoPostGlucoseFound] = useState(false);

  // Combinar CGM previos y posteriores para el gráfico
  const cgmCombined = [...cgmPrevOrdered, ...cgmPostOrdered];
  const predictedIndex = cgmPrevOrdered.length - 1;
  const minY = cgmCombined.length > 0 ? Math.max(0, Math.min(...cgmCombined) - 10) : 0;
  const maxY = cgmCombined.length > 0 ? Math.max(...cgmCombined) + 10 : 100;

  // Handlers for post data inputs
  const handleCgmPostChange = (value: string, idx: number) => {
    if (!/^[0-9]{0,3}$/.test(value)) return;
    const arr = [...cgmPostInputs];
    arr[idx] = value;
    if (value && idx === cgmPostInputs.length - 1 && arr.length < 24) {
      arr.push('');
    }
    setCgmPostInputs(arr.slice(0, 24));
  };

  const handleRemoveCgmPost = (idx: number) => {
    const arr = cgmPostInputs.filter((_, i) => i !== idx);
    setCgmPostInputs(arr.length === 0 ? [''] : arr);
  };

  const canUpdatePost = () => {
    const glucoses = cgmPostInputs.filter(g => g !== '' && g !== '0');
    const hasGlucosa = glucoses.length > 0;
    const hasDosis = appliedDoseInput !== '' && !isNaN(Number(appliedDoseInput.replace(',', '.')));
    return (hasGlucosa || hasDosis);
  };

  const handleSavePost = async () => {
    if (!canUpdatePost()) {
      setPostError('Cargue al menos una glucosa o la dosis aplicada.');
      return;
    }
    setPostError(null);
    setIsSavingPost(true);
    try {
      const updatedResult = {
        applyDose: appliedDoseInput !== '' ? Number(appliedDoseInput.replace(',', '.')) : undefined,
        cgmPost: cgmPostInputs.filter(g => g !== '').map(Number),
      };
      console.log(result);
      await updateInsulinPredictionResult(token ?? '', result.id, updatedResult);
      result.cgmPost = updatedResult.cgmPost;
      result.applyDose = updatedResult.applyDose;
      setShowPostInputs(false);
    } catch (err) {
      setPostError('Error guardando datos posteriores');
    } finally {
      setIsSavingPost(false);
    }
  };

  const loadPostGlucoseReadings = async () => {
    setIsLoadingPostGlucose(true);
    setPostError(null);
    setNoPostGlucoseFound(false);
    try {
      if (!token || !date) {
        setPostError('No se puede cargar datos sin fecha de dosis');
        return;
      }
      
      // Calcular fechas: desde la fecha del resultado hasta 2h15m después
      const startDate = new Date(date);
      const endDate = new Date(startDate.getTime() + (2 * 60 + 15) * 60 * 1000); // 2h15m en milisegundos
      
      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 24
      };
      
      const readings = await getGlucoseReadings(token, params);
      
      // Ordenar de más antigua a más reciente para datos posteriores
      const glucoseValues = readings
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(0, 23) // Dejamos espacio para un campo adicional (máximo 23 en lugar de 24)
        .map(reading => reading.value.toString());
      
      // Verificar si se encontraron valores
      if (glucoseValues.length === 0) {
        setNoPostGlucoseFound(true);
        setCgmPostInputs(['']);
        return;
      }
      
      // Asegurarnos de que haya un campo vacío al final siempre que no hayamos alcanzado el máximo
      if (glucoseValues.length < 24) {
        glucoseValues.push('');
      }
      
      // Actualizar los inputs con los valores encontrados
      setCgmPostInputs(glucoseValues);
    } catch (err) {
      setPostError('Error cargando lecturas de glucosa posteriores');
      setNoPostGlucoseFound(true);
    } finally {
      setIsLoadingPostGlucose(false);
    }
  };

  const handleDeletePost = async () => {
    setIsDeletingPost(true);
    setPostError(null);
    try {
      const updatedResult = {
        cgmPost: [],
        applyDose: undefined,
      };
      await updateInsulinPredictionResult(token ?? '', result.id, updatedResult);
      result.cgmPost = [];
      result.applyDose = undefined;
      setCgmPostInputs(['']);
      setAppliedDoseInput('');
      setShowPostInputs(false);
    } catch (err) {
      setPostError('Error eliminando datos posteriores');
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleEditPost = () => {
    // Inicializar con los valores existentes cuando se edita
    if (cgmPost && cgmPost.length > 0) {
      // Convertir los valores existentes a strings
      const values = cgmPost.map(val => val.toString());
      
      // Asegurarse de que haya un campo vacío al final para agregar más valores
      if (values.length < 24) {
        values.push('');
      }
      
      setCgmPostInputs(values);
    } else {
      setCgmPostInputs(['']);
    }
    
    // Inicializar con la dosis aplicada existente
    if (applyDose !== undefined && applyDose !== null && applyDose !== 0) {
      setAppliedDoseInput(applyDose.toString());
    } else {
      setAppliedDoseInput('');
    }
    
    setShowPostInputs(true);
  };

  const formattedDate = date ? (() => {
    try {
      const zoned = toZonedTime(new Date(date), 'America/Argentina/Buenos_Aires');
      return format(zoned, 'dd/MM/yyyy HH:mm');
    } catch {
      return '';
    }
  })() : '';

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Resultado de Predicción"
        icon={<Activity size={24} color="#fff" />}
        onBack={() => navigation.navigate('History' as never)}
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Fecha */}
        <Card style={styles.dateCard}>
          <View style={styles.dateContainer}>
            <Calendar size={20} color="#4CAF50" />
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </Card>

        {/* Dosis Calculada */}
        <Card style={styles.doseCard}>
          <View style={styles.doseHeader}>
            <Syringe size={24} color="#4CAF50" />
            <Text style={styles.doseTitle}>Dosis Calculada</Text>
          </View>
          <View style={styles.doseValueContainer}>
            <Text style={styles.doseValue}>{recommendedDose}</Text>
            <Text style={styles.doseUnit}>unidades</Text>
          </View>
        </Card>

        {/* Datos Utilizados */}
        <Card style={styles.dataCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Database size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Datos Utilizados</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Estos son los datos que el modelo utilizó para calcular la dosis de insulina recomendada.
            </Text>
          </View>
          <View style={styles.dataContainer}>
            {/* Left side - Glucose readings */}
            <View style={styles.glucoseSection}>
              <Text style={styles.dataLabel}>🩸 Glucosa(s)</Text>
              <View style={styles.glucoseList}>
                {(showAllGlucoses ? cgmPrevOrdered : cgmPrevOrdered.slice(0, 4)).map((glucose, index) => (
                  <View key={index} style={styles.glucoseItem}>
                    <View style={styles.glucoseBullet}>
                      <Text style={styles.glucoseBulletText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.glucoseValue}>{glucose} mg/dL</Text>
                  </View>
                ))}
              </View>
              {cgmPrevOrdered.length > 4 ? (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllGlucoses(!showAllGlucoses)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllGlucoses ? 'Ver menos' : `Ver ${cgmPrevOrdered.length - 4} más`}
                  </Text>
                  <ChevronRight
                    size={16}
                    color="#4CAF50"
                    style={[
                      styles.showMoreIcon,
                      showAllGlucoses && styles.showMoreIconRotated,
                    ]}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.noMoreReadings}>
                  <Text style={styles.noMoreReadingsText}>No hay más lecturas de glucosa</Text>
                </View>
              )}
            </View>

            {/* Right side - Other data */}
            <View style={styles.otherDataSection}>
              <View style={styles.dataColumn}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>🍞 Carbs</Text>
                  <Text style={styles.dataValue}>{carbs} g</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>💉 IOB</Text>
                  <Text style={styles.dataValue}>{insulinOnBoard} u</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>🎯 Objetivo</Text>
                  <Text style={styles.dataValue}>{glucoseObjective} mg/dL</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>😴 Sueño</Text>
                  <Text style={styles.dataValue}>{sleepLevel}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>💼 Trabajo</Text>
                  <Text style={styles.dataValue}>{workLevel}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>🏃‍♂️ Actividad</Text>
                  <Text style={styles.dataValue}>{activityLevel}</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* Gráfico CGM */}
        <Card style={styles.chartCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <LineChartIcon size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Evolución de Glucosa</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Este gráfico muestra la evolución de tus niveles de glucosa antes y después de la dosis.
            </Text>
          </View>
          <View style={styles.chartContainer}>
            <Text style={styles.yAxisLabel}>Glucosa (mg/dL)</Text>
            <LineChart
              data={{
                labels: cgmCombined.map((_, i) => i.toString()),
                datasets: [{
                  data: cgmCombined,
                  color: () => '#4CAF50',
                  strokeWidth: 2,
                }],
              }}
              width={Dimensions.get('window').width - 48}
              height={180}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '5',
                  strokeWidth: '0',
                  stroke: '#4CAF50',
                },
                propsForLabels: {
                  fontSize: 12,
                },
              }}
              bezier
              style={styles.chart}
              withDots={true}
              withShadow={false}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              fromZero={false}
              yAxisSuffix=""
              yAxisInterval={1}
              segments={5}
              getDotColor={(dataPoint, index) => index === predictedIndex ? '#ff9800' : '#4CAF50'}
              onDataPointClick={({ index, x, y }) => {
                setTooltip({ index, x, y });
                setTimeout(() => setTooltip(null), 1000);
                const isHigh = cgmCombined[index] >= maxY - 10;
                const chartWidth = Dimensions.get('window').width - 48;
                const tooltipWidth = 90;
                let left = x - 40;
                if (x + tooltipWidth > chartWidth) {
                  left = x - tooltipWidth;
                }
                return (
                  <React.Fragment key={`dot-content-${index}`}>
                    {tooltip && tooltip.index === index && (
                      <View
                        key={`tooltip-${index}`}
                        style={{
                          position: 'absolute',
                          left,
                          top: isHigh ? y + 20 : y - 40,
                          backgroundColor: '#fff',
                          borderRadius: 6,
                          padding: 6,
                          borderWidth: 1,
                          borderColor: '#4CAF50',
                          zIndex: 10,
                          minWidth: 80,
                          alignItems: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 2,
                          elevation: 3,
                        }}
                      >
                        <Text style={{ color: index === predictedIndex ? '#ff9800' : '#4CAF50', fontWeight: 'bold', fontSize: 13 }}>{`Glucosa #${index + 1}`}</Text>
                        <Text style={{ color: '#111827', fontSize: 13 }}>{cgmCombined[index]} mg/dL</Text>
                      </View>
                    )}
                  </React.Fragment>
                );
              }}
            />
            <Text style={styles.xAxisLabel}>Tiempo</Text>
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Momento de aplicación de la dosis</Text>
            </View>
          </View>
        </Card>

        {/* Datos Posteriores */}
        <Card style={styles.postDataCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Clipboard size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Datos Posteriores</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Acá podes ingresar o ver los datos de glucosa y dosis aplicadas después de la predicción.
            </Text>
          </View>
          {!showPostInputs ? (
            <>
              {hasPostData ? (
                <View style={styles.postDataContent}>
                  {cgmPostOrdered.length > 0 && (
                    <View style={styles.postDataItem}>
                      <Text style={styles.postDataLabel}>📊 Glucosa(s) posterior(es):</Text>
                      <Text style={styles.postDataValue}>{cgmPostOrdered.join(', ')} mg/dL</Text>
                    </View>
                  )}
                  {applyDose > 0 && (
                    <View style={styles.postDataItem}>
                      <Text style={styles.postDataLabel}>💉 Dosis aplicada:</Text>
                      <Text style={styles.postDataValue}>{applyDose} unidades</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.noDataText}>No hay datos posteriores registrados</Text>
              )}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={handleEditPost}
                  disabled={isSavingPost || isDeletingPost}
                >
                  <Plus size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {hasPostData ? 'Editar datos' : 'Agregar datos'}
                  </Text>
                </TouchableOpacity>
                
                {hasPostData && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDeletePost}
                    disabled={isDeletingPost || isSavingPost}
                  >
                    <Trash2 size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>
                      {isDeletingPost ? 'Eliminando...' : 'Eliminar datos'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <View style={styles.postInputsContainer}>
              <Text style={styles.inputLabel}>📊 Glucosa(s) posterior(es) (mg/dL)</Text>
              <Text style={styles.inputHelper}>
                Ingrese las mediciones de glucosa de las próximas 2 horas
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.loadButton, 
                  noPostGlucoseFound ? styles.loadButtonDisabled : (isLoadingPostGlucose && styles.buttonDisabled)
                ]}
                onPress={loadPostGlucoseReadings}
                disabled={isLoadingPostGlucose || !token || noPostGlucoseFound}
              >
                {isLoadingPostGlucose ? (
                  <Icon name="loader" size={16} color="#4CAF50" />
                ) : noPostGlucoseFound ? (
                  <Icon name="x-circle" size={16} color="#9CA3AF" />
                ) : (
                  <Icon name="refresh-cw" size={16} color="#4CAF50" />
                )}
                <Text style={[styles.loadButtonText, noPostGlucoseFound && styles.disabledButtonText]}>
                  {noPostGlucoseFound ? "No se encontraron valores" : "Cargar últimos valores"}
                </Text>
              </TouchableOpacity>
              
              {cgmPostInputs.map((value, idx) => (
                <View key={idx} style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={v => handleCgmPostChange(v, idx)}
                    keyboardType="numeric"
                    placeholder={`Glucosa #${idx + 1}`}
                    maxLength={3}
                    editable={idx < 24}
                  />
                  <Text style={styles.inputUnit}>mg/dL</Text>
                  {idx > 0 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveCgmPost(idx)}
                      style={styles.removeInputButton}
                    >
                      <Text style={styles.removeInputText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TextInput
                style={styles.doseInput}
                value={appliedDoseInput}
                onChangeText={setAppliedDoseInput}
                keyboardType="numeric"
                placeholder="💉 Dosis aplicada (unidades)"
                maxLength={5}
              />
              {postError && <Text style={styles.errorText}>{postError}</Text>}
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={[styles.inputButton, styles.cancelButton]}
                  onPress={() => setShowPostInputs(false)}
                >
                  <Text style={styles.inputButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputButton, styles.saveButton]}
                  onPress={handleSavePost}
                  disabled={!canUpdatePost() || isSavingPost}
                >
                  <Text style={styles.inputButtonText}>
                    {isSavingPost ? 'Guardando...' : 'Guardar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

        <Text style={styles.aiNote}>
          🤖 ¡Con cada dato posterior que agregues, el modelo irá aprendiendo y mejorando sus predicciones para vos! Cuantos más datos, más inteligente se vuelve tu asistente de insulina 🚀📈
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    flex: 1,
  },
  dateCard: {
    margin: 16,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#e8f5e9',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  doseCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#e8f5e9',
  },
  doseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  doseTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  doseValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  doseValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  doseUnit: {
    marginLeft: 8,
    fontSize: 18,
    color: '#6b7280',
  },
  dataCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 16,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 32,
    lineHeight: 20,
  },
  dataContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  glucoseSection: {
    width: '45%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  otherDataSection: {
    width: '55%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dataColumn: {
    width: '95%',
    flexDirection: 'column',
    gap: 4,
  },
  dataItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dataLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  glucoseList: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  glucoseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 40,
  },
  glucoseBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  glucoseBulletText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  glucoseValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    textAlign: 'left',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  showMoreText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  showMoreIcon: {
    marginLeft: 4,
  },
  showMoreIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  noMoreReadings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  noMoreReadingsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    textAlign: 'center',
  },
  chartCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartContainer: {
    position: 'relative',
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff9800',
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#111827',
  },
  predictionDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff9800',
  },
  postDataCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postDataContent: {
    marginBottom: 16,
  },
  postDataItem: {
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  postDataLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  postDataValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  noDataText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionButtonTextCancel: {
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 8,
  },
  postInputsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  inputHelper: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputUnit: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  removeInputButton: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeInputText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doseInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  inputButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  inputButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  aiNote: {
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
  },
  xAxisLabel: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -50 }],
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  yAxisLabel: {
    position: 'absolute',
    top: 0,
    left: 20,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  loadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#e1f5fe',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  loadButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 8,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});
