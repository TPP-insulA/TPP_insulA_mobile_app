import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Card } from '../components/ui/card';
import { BackButton } from '../components/back-button';
import { LineChart } from 'react-native-chart-kit';
import { format } from 'date-fns';
import type { RouteProp } from '@react-navigation/native';

// Define el tipo de los parámetros esperados
interface PredictionResultParams {
  cgm_prev: number[];
  carbs: string;
  insulinOnBoard: string;
  targetBloodGlucose: string;
  predictedDose: number;
  applyDose: number;
  cgm_post: number[];
  datetime: string;
}

export default function PredictionResultPage() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, PredictionResultParams>, string>>();
  const {
    cgm_prev = [],
    carbs = '',
    insulinOnBoard = '',
    targetBloodGlucose = '',
    predictedDose = 0,
    applyDose = 0,
    cgm_post = [],
    datetime = '',
  } = (route.params || {}) as PredictionResultParams;

  // Invertir glucosas para que el más antiguo esté a la izquierda
  const glucosasPrev = [...cgm_prev].reverse();
  const glucosasPost = [...cgm_post]; // ya están de más antiguo a más reciente
  const glucosasCombinadas = [...glucosasPrev, ...glucosasPost];
  const predictedIndex = glucosasPrev.length - 1;
  const minY = Math.max(0, Math.min(...glucosasCombinadas) - 10);
  const maxY = Math.max(...glucosasCombinadas) + 10;

  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);
  const [showPostInputs, setShowPostInputs] = useState(false);
  const [cgmPostInputs, setCgmPostInputs] = useState<string[]>(['']);
  const [appliedDoseInput, setAppliedDoseInput] = useState('');
  const [postError, setPostError] = useState<string | null>(null);

  // Formatear fecha
  const formattedDate = datetime ? format(new Date(datetime), "dd/MM/yyyy HH:mm") : '';

  // Handlers para inputs de datos posteriores
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
    const glucosas = cgmPostInputs.filter(g => g !== '' && g !== '0');
    return glucosas.length > 0 && appliedDoseInput !== '' && !isNaN(Number(appliedDoseInput));
  };
  const handleSavePost = () => {
    if (!canUpdatePost()) {
      setPostError('Cargue al menos una glucosa y la dosis aplicada.');
      return;
    }
    setPostError(null);
    // Aquí normalmente guardarías los datos en backend o estado global
    // Para demo, solo actualizamos el estado local
    (route.params as any).cgm_post = cgmPostInputs.filter(g => g !== '').map(Number);
    (route.params as any).applyDose = Number(appliedDoseInput);
    setShowPostInputs(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('InsulinPage' as never)} style={styles.backButton}>
          <BackButton />
        </TouchableOpacity>
        <Text style={styles.title}>Resultado de Predicción</Text>
      </View>
      <Card style={styles.card}>
        {formattedDate && (
          <Text style={{ color: '#6b7280', fontSize: 14, marginBottom: 4, alignSelf: 'flex-end' }}>Fecha: {formattedDate}</Text>
        )}
        <Text style={styles.sectionTitle}>Dosis de Insulina Predicha 💉</Text>
        <View style={styles.doseRow}>
          <Text style={styles.doseValue}>{predictedDose}</Text>
          <Text style={styles.doseUnit}>unidades</Text>
        </View>
        <Text style={styles.sectionTitle}>Datos que utilizó:</Text>
        <View style={styles.dataTable}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>🩸 Glucosa(s) (mg/dL):</Text>
          </View>
          <Text style={styles.glucoseNote}>De más antiguo a más reciente:</Text>
          {glucosasPrev.map((g, idx) => (
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
            <Text style={styles.dataValue}>{targetBloodGlucose} mg/dL</Text>
          </View>
        </View>
        <Text style={{ color: '#4CAF50', fontSize: 14, marginBottom: 8, marginLeft: 2 }}>
          🤖 ¡Con cada dato posterior que agregues, el modelo irá aprendiendo y mejorando sus predicciones para vos! Cuantos más datos, más inteligente se vuelve tu asistente de insulina 🚀📈
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: showPostInputs ? '#388e3c' : '#4CAF50', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 12 }}
          onPress={() => setShowPostInputs(v => !v)}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>
            {showPostInputs ? 'Cancelar' : 'Agregar datos posteriores'}
          </Text>
        </TouchableOpacity>
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
                  <TouchableOpacity onPress={() => {
                    const arr = cgmPostInputs.filter((_, i) => i !== idx);
                    setCgmPostInputs(arr.length === 0 ? [''] : arr);
                  }} style={{ marginLeft: 8 }}>
                    <Text style={{ color: '#ef4444', fontSize: 18 }}>✕</Text>
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
                if (!/^\d+(,\d{0,2})?$|^\d+(\.\d{0,2})?$/.test(v) && v !== '') return;
                setAppliedDoseInput(v);
              }}
              keyboardType="numeric"
              placeholder="Dosis aplicada"
              maxLength={5}
            />
            {postError && <Text style={{ color: '#ef4444', fontSize: 12 }}>{postError}</Text>}
            <TouchableOpacity
              style={{ backgroundColor: '#388e3c', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 }}
              onPress={() => {
                const glucosas = cgmPostInputs.filter(g => g !== '' && g !== '0');
                if (glucosas.length === 0) {
                  setPostError('Cargue al menos una glucosa válida.');
                  return;
                }
                if (appliedDoseInput === '' || isNaN(Number(appliedDoseInput))) {
                  setPostError('Ingrese una dosis válida.');
                  return;
                }
                setPostError(null);
                (route.params as any).cgm_post = glucosas.map(Number);
                (route.params as any).applyDose = Number(appliedDoseInput);
                setShowPostInputs(false);
              }}
              disabled={cgmPostInputs.filter(g => g !== '' && g !== '0').length === 0 || appliedDoseInput === '' || isNaN(Number(appliedDoseInput))}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Guardar datos posteriores</Text>
            </TouchableOpacity>
          </View>
        )}
        {glucosasPost.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Datos posteriores:</Text>
            <Text style={styles.glucoseNote}>De más antiguo a más reciente:</Text>
            {glucosasPost.map((g, idx) => (
              <View key={idx} style={styles.glucoseRow}>
                <View style={{ flex: 1 }} />
                <Text style={styles.glucoseValue}>{g} mg/dL</Text>
              </View>
            ))}
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>💉 Dosis aplicada:</Text>
              <Text style={styles.dataValue}>{applyDose} unidades</Text>
            </View>
          </View>
        )}
        <Text style={styles.sectionTitle}>Gráfico CGM</Text>
        <View style={styles.chartContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: glucosasCombinadas.map(() => ''),
                datasets: [
                  {
                    data: glucosasCombinadas,
                    color: () => '#4CAF50',
                    strokeWidth: 2,
                  },
                ],
              }}
              width={Math.max(350, glucosasCombinadas.length * 40)}
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
              withDots
              withShadow={false}
              fromZero={minY === 0}
              style={{ borderRadius: 8 }}
              segments={glucosasCombinadas.length > 5 ? 5 : glucosasCombinadas.length}
              getDotColor={(dataPoint, index) =>
                index === predictedIndex ? '#ff9800' : '#4CAF50'
              }
              renderDotContent={({ x, y, index }) => {
                const isHigh = glucosasCombinadas[index] >= maxY - 10;
                const chartWidth = Math.max(350, glucosasCombinadas.length * 40);
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
                        <Text style={{ color: '#111827', fontSize: 13 }}>{glucosasCombinadas[index]} mg/dL</Text>
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
