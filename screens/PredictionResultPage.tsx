import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card } from '../components/ui/card';
import { BackButton } from '../components/back-button';
import { LineChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { RouteProp } from '@react-navigation/native';
import type { InsulinPredictionResult } from '../lib/api/insulin';
import Icon from 'react-native-vector-icons/Feather';
import { updateInsulinPredictionResult } from '../lib/api/insulin';
import { useAuth } from '../hooks/use-auth';

export default function PredictionResultPage() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, { result: InsulinPredictionResult }>, string>>();
  const result: InsulinPredictionResult = (route.params as any)?.result || {};
  const {
    userId = '',
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
  // Detectar si hay datos posteriores (glucosa o dosis)
  const hasPostData = cgmPostOrdered.length > 0 || (applyDose !== undefined && applyDose !== null && applyDose !== 0);

  // Combinar CGM previos y posteriores para el gráfico
  const cgmCombined = [...cgmPrevOrdered, ...cgmPostOrdered];
  const predictedIndex = cgmPrevOrdered.length - 1;
  const minY = cgmCombined.length > 0 ? Math.max(0, Math.min(...cgmCombined) - 10) : 0;
  const maxY = cgmCombined.length > 0 ? Math.max(...cgmCombined) + 10 : 100;

  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);
  const [showPostInputs, setShowPostInputs] = useState(false);
  const [cgmPostInputs, setCgmPostInputs] = useState<string[]>(['']);
  const [appliedDoseInput, setAppliedDoseInput] = useState('');
  const [postError, setPostError] = useState<string | null>(null);
  const { token } = useAuth();
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

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
        ...result,
        cgmPost: cgmPostInputs.filter(g => g !== '').map(Number),
        applyDose: appliedDoseInput !== '' ? Number(appliedDoseInput.replace(',', '.')) : undefined,
      };
      await updateInsulinPredictionResult(token ?? '', updatedResult);
      result.cgmPost = updatedResult.cgmPost;
      result.applyDose = updatedResult.applyDose;
      setShowPostInputs(false);
    } catch (err) {
      setPostError('Error guardando datos posteriores');
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeletePost = async () => {
    setIsDeletingPost(true);
    setPostError(null);
    try {
      const updatedResult = {
        ...result,
        cgmPost: [],
        applyDose: undefined,
      };
      await updateInsulinPredictionResult(token ?? '', updatedResult);
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('InsulinPage' as never)} style={styles.backButton}>
          <BackButton />
        </TouchableOpacity>
        <Text style={styles.title}>Resultado de Predicción</Text>
      </View>
      {date && (
        <View style={{alignItems: 'flex-end', marginRight: 20, marginTop: 4, marginBottom: -8}}>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>
            Fecha: {(() => {
              try {
                const zoned = toZonedTime(new Date(date), 'America/Argentina/Buenos_Aires');
                return format(zoned, 'dd/MM/yyyy HH:mm');
              } catch {
                return '';
              }
            })()}
          </Text>
        </View>
      )}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Dosis de Insulina Calculada 💉</Text>
        <View style={styles.doseRow}>
          <Text style={styles.doseValue}>{recommendedDose}</Text>
          <Text style={styles.doseUnit}>unidades</Text>
        </View>
        <Text style={styles.sectionTitle}>Datos que utilizó:</Text>
        <View style={styles.dataTable}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>🩸 Glucosa(s) (mg/dL):</Text>
          </View>
          <Text style={styles.glucoseNote}>De más antiguo a más reciente:</Text>
          {cgmPrevOrdered.map((g: number, idx: number) => (
            <View key={idx} style={styles.glucoseRow}>
              <View style={{ flex: 1 }} />
              <Text style={styles.glucoseValue}>{g} mg/dL</Text>
            </View>
          ))}
          <View style={styles.spacer} />
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>🍞 Carbohidratos:</Text>
            <Text style={styles.dataValue}>{carbs} gramos</Text>
          </View>
          <View style={styles.spacer} />
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>💉 Insulin On Board:</Text>
            <Text style={styles.dataValue}>{insulinOnBoard} unidades</Text>
          </View>
          <View style={styles.spacer} />
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>🎯 Glucosa Objetivo:</Text>
            <Text style={styles.dataValue}>{glucoseObjective} mg/dL</Text>
          </View>
          <View style={styles.spacer} />
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>😴 Nivel de sueño:</Text>
            <Text style={styles.dataValue}>{sleepLevel}</Text>
          </View>
          <View style={styles.spacer} />
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>💼 Nivel de trabajo:</Text>
            <Text style={styles.dataValue}>{workLevel}</Text>
          </View>
          <View style={styles.spacer} />
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>🏃‍♂️ Nivel de actividad:</Text>
            <Text style={styles.dataValue}>{activityLevel}</Text>
          </View>
        </View>
        <Text style={{ color: '#4CAF50', fontSize: 14, marginBottom: 8, marginLeft: 2 }}>
          🤖 ¡Con cada dato posterior que agregues, el modelo irá aprendiendo y mejorando sus predicciones para vos! Cuantos más datos, más inteligente se vuelve tu asistente de insulina 🚀📈
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: showPostInputs ? '#dc2626' : '#4CAF50', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 12 }}
          onPress={() => setShowPostInputs(v => !v)}
          disabled={isSavingPost || isDeletingPost}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>
            {showPostInputs
              ? 'Cancelar'
              : hasPostData
                ? 'Editar datos posteriores'
                : 'Agregar datos posteriores'}
          </Text>
        </TouchableOpacity>
        {hasPostData && !showPostInputs && (
          <TouchableOpacity
            style={{ backgroundColor: '#ef4444', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 12 }}
            onPress={handleDeletePost}
            disabled={isDeletingPost || isSavingPost}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>
              {isDeletingPost ? 'Eliminando...' : 'Eliminar datos posteriores'}
            </Text>
          </TouchableOpacity>
        )}
        {showPostInputs && (
          <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Glucosa(s) posteriores (mg/dL)</Text>
            <Text style={{ color: '#6b7280', fontSize: 12, marginBottom: 8 }}>
              Ingrese las mediciones de glucosa de las próximas 2 horas, de más antiguo a más reciente.
            </Text>
            {cgmPostInputs.map((value, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={value}
                  onChangeText={v => {
                    if (!/^\d{0,3}$/.test(v)) return;
                    if (v === '0') return;
                    const arr = [...cgmPostInputs];
                    arr[idx] = v;
                    if (v && idx === cgmPostInputs.length - 1 && arr.length < 24) {
                      arr.push('');
                    }
                    setCgmPostInputs(arr.slice(0, 24));
                  }}
                  keyboardType="numeric"
                  placeholder={`Glucosa post #${idx + 1}`}
                  maxLength={3}
                  editable={idx < 24}
                />
                <View style={styles.inputAddon}>
                  <Text style={styles.inputAddonText}>mg/dL</Text>
                </View>
                {idx > 0 && (
                  <TouchableOpacity onPress={() => handleRemoveCgmPost(idx)} style={{ marginLeft: 8 }}>
                    <Icon name="x-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {cgmPostInputs.length === 24 && cgmPostInputs[23] !== '' && (
              <Text style={{ color: '#ef4444', fontSize: 12 }}>Máximo 24 mediciones alcanzado.</Text>
            )}
            <View style={{ marginBottom: 8 }} />
            <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Dosis de insulina aplicada (U):</Text>
            <TextInput
              style={[styles.input, { marginBottom: 8 }]}
              value={appliedDoseInput}
              onChangeText={v => {
                // Permitir coma o punto como separador decimal
                if (!/^\d+(,\d{0,2})?$|^\d+(\.\d{0,2})?$/.test(v) && v !== '') return;
                setAppliedDoseInput(v);
              }}
              keyboardType="numeric"
              placeholder="Dosis aplicada"
              maxLength={5}
            />
            {postError && <Text style={{ color: '#ef4444', fontSize: 12 }}>{postError}</Text>}
            <TouchableOpacity
              style={{ backgroundColor: canUpdatePost() && !isSavingPost ? '#388e3c' : '#9CA3AF', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 }}
              onPress={handleSavePost}
              disabled={!canUpdatePost() || isSavingPost}
            >
              {isSavingPost ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="loader" size={20} color="white" />
                  <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>Actualizando...</Text>
                </View>
              ) : (
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Guardar datos posteriores</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        {(cgmPostOrdered.length > 0 || (applyDose !== undefined && applyDose !== null && applyDose !== 0)) && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Datos posteriores:</Text>
            {cgmPostOrdered.length > 0 && (
              <>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>🩸 Glucosa(s) (mg/dL):</Text>
                </View>
                <Text style={styles.glucoseNote}>De más antiguo a más reciente:</Text>
                {cgmPostOrdered.map((g: number, idx: number) => (
                  <View key={idx} style={styles.glucoseRow}>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.glucoseValue}>{g} mg/dL</Text>
                  </View>
                ))}
              </>
            )}
            {applyDose !== undefined && applyDose !== null && applyDose !== 0 && !isNaN(Number(applyDose)) && (
              <>
                <View style={styles.spacer} />
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>💉 Dosis aplicada:</Text>
                  <Text style={styles.dataValue}>{Number(applyDose)} unidades</Text>
                </View>
              </>
            )}
          </View>
        )}
        <Text style={styles.sectionTitle}>Gráfico CGM</Text>
        <View style={styles.chartContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: cgmCombined.map(() => ''),
                datasets: [
                  {
                    data: cgmCombined,
                    color: () => '#4CAF50',
                    strokeWidth: 2,
                  },
                ],
              }}
              width={Math.max(350, cgmCombined.length * 40)}
              height={220}
              yAxisSuffix=" mg/dL"
              formatYLabel={yValue => `${yValue}`}
              yLabelsOffset={5}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: '#388e3c',
                },
                propsForBackgroundLines: {
                  stroke: '#e5e7eb',
                },
              }}
              bezier
              getDotColor={(_dataPoint, index) =>
                index === predictedIndex ? '#ff9800' : '#4CAF50'
              }
              renderDotContent={({ x, y, index }) => {
                const isHigh = cgmCombined[index] >= maxY - 10;
                const chartWidth = Math.max(350, cgmCombined.length * 40);
                const tooltipWidth = 90;
                let left = x - 40;
                if (x + tooltipWidth > chartWidth) {
                  left = x - tooltipWidth;
                }
                return (
                  <React.Fragment key={`dot-${index}`}>
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
                          borderColor: index === predictedIndex ? '#ff9800' : '#4CAF50',
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
              onDataPointClick={({ index, x, y }) => {
                setTooltip({ index, x, y });
                setTimeout(() => setTooltip(null), 2000);
              }}
            />
          </ScrollView>
          <Text style={styles.timeLegend}>De más antiguo a más reciente <Text style={{fontSize:18}}>→</Text></Text>
          <Text style={styles.predictedDoseLabel}><Text style={{color:'#ff9800', fontWeight:'bold'}}>●</Text> Momento de aplicación de la dosis de insulina</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white' },
  backButton: { marginRight: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  card: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: 'white' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  doseRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  doseValue: { fontSize: 32, fontWeight: 'bold', color: '#4CAF50' },
  doseUnit: { fontSize: 18, color: '#6b7280', marginLeft: 8 },
  dataTable: { marginBottom: 16 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  dataLabel: { fontWeight: '500', color: '#374151' },
  dataValue: { color: '#111827', fontSize: 15 },
  chartPlaceholder: { height: 200, backgroundColor: '#e5e7eb', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  chartContainer: { alignItems: 'center', marginTop: 8, marginBottom: 8 },
  predictedDoseLabel: { color: '#111827', fontWeight: 'bold', fontSize: 14, marginTop: 4, alignSelf: 'flex-end', marginRight: 12 },
  glucoseNote: { fontSize: 12, color: '#6b7280', marginBottom: 2, marginLeft: 4 },
  glucoseRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 12, marginBottom: 6 },
  glucoseValue: { color: '#111827', fontSize: 15, textAlign: 'right', flex: 1 },
  spacer: { height: 12 },
  timeLegend: { fontSize: 12, color: '#6b7280', marginTop: 4, alignSelf: 'center' },
  input: {
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
});
