import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { Footer } from '../components/footer';
import { useNavigation } from '@react-navigation/native';
import { Activity, Trash2, Plus } from 'lucide-react-native';
import { LoadingSpinner } from '../components/loading-spinner';
import { useAuth } from '../hooks/use-auth';
import { getPredictionHistory, deleteInsulinPrediction } from '../lib/api/insulin';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Swipeable } from 'react-native-gesture-handler';
import { AppHeader } from '../components/app-header';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

interface Event {
  id: number;
  timestamp: string;
  description: string;
  type: string;
  value?: number;
  units?: number;
  carbs?: number;
  items?: string[];
}

interface Plot {
  id: number;
  type: string;
  timeRange: string;
  label: string;
}

interface GlucoseData {
  time: string;
  glucose: number;
}

interface ApiError {
  plotId?: number;
  message: string;
}

const mockEvents: Event[] = [
  {
    id: 1,
    timestamp: '08:30',
    description: 'Pre-desayuno',
    type: 'glucose',
    value: 120,
  },
  {
    id: 2,
    timestamp: '12:30',
    description: 'Pre-almuerzo',
    type: 'insulin',
    units: 6,
  },
  {
    id: 3,
    timestamp: '13:00',
    description: 'Almuerzo',
    type: 'meal',
    carbs: 45,
    items: ['Arroz', 'Pollo', 'Ensalada'],
  },
];

const mockGlucoseData = Array.from({ length: 12 }, (_, i) => ({
  time: `${i * 2}:00`,
  glucose: Math.round(Math.random() * 50 + 100),
}));

const mockDailyPatternData = [
  { id: 'morning-1', value: 120, timestamp: 'morning' },
  { id: 'afternoon-1', value: 140, timestamp: 'afternoon' },
  { id: 'evening-1', value: 110, timestamp: 'evening' },
  { id: 'night-1', value: 130, timestamp: 'night' },
  { id: 'morning-2', value: 125, timestamp: 'morning' },
  { id: 'afternoon-2', value: 145, timestamp: 'afternoon' },
  { id: 'evening-2', value: 115, timestamp: 'evening' },
  { id: 'night-2', value: 135, timestamp: 'night' },
];

// --- Tab Components ---
function HistoryTab(props: any) {
  // All state and logic related to prediction history, filters, sorting, pagination, swipe-to-delete, etc.
  // Use props for any values/functions needed from parent (HistoryPage)
  // ...existing code for prediction history section, including ScrollView, filters, modals, etc...
  // Only the content inside the first section (before the statistics dashboard)
  // Replace the ScrollView and View wrapping the history section with just the content
  // ...
  return (
    <ScrollView>
      <View style={styles.content}>
        {/* HISTORIAL DE PREDICCIONES - ahora primero y fuera del Card */}
        <View style={{ marginBottom: 24 }}>
          {/* Filtros y tabla de historial, mover aquí el contenido de la sección historial */}
          <TouchableOpacity style={[styles.filterButtonSmall, {marginLeft: 0}]} onPress={()=>props.setFilterModalVisible(true)}>
            <Plus size={16} color="#fff" style={{marginRight: 4}} />
            <Text style={styles.filterButtonTextSmall}>Agregar filtros</Text>
          </TouchableOpacity>
          {/* Filtros activos */}
          <View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginLeft:20, marginBottom:8}}>
            {Object.entries(props.appliedFilters).map(([key, f]: [string, any]) => f.value ? (
              <View key={key} style={{flexDirection:'row', alignItems:'center', backgroundColor:'#e0f2f1', borderRadius:16, paddingHorizontal:10, paddingVertical:4, marginRight:8, marginBottom:4}}>
                <Text style={{fontSize:15, color:'#00796b', fontFamily:'System'}}>{key==='fecha'?'Fecha':key==='cgm'?'CGM':'Dosis'} {f.op} {f.value}</Text>
                <Pressable onPress={()=>{
                  const newFilters = {...props.appliedFilters};
                  newFilters[key as FilterKey] = {...newFilters[key as FilterKey], value: ''};
                  props.setAppliedFilters(newFilters);
                  props.setFilters(newFilters);
                }}>
                  <Text style={{marginLeft:6, color:'#ef4444', fontWeight:'bold'}}>×</Text>
                </Pressable>
              </View>
            ) : null)}
          </View>
          {/* Modal de filtros */}
          <Modal
            visible={props.filterModalVisible}
            animationType="slide"
            transparent
            onRequestClose={()=>props.setFilterModalVisible(false)}
          >
            <Pressable style={{flex:1, backgroundColor:'rgba(0,0,0,0.3)'}} onPress={()=>props.setFilterModalVisible(false)} />
            <View style={{position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24}}>
              <Text style={{fontSize:22, fontWeight:'bold', marginBottom:16, textAlign:'center'}}>Filtrar predicciones</Text>
              {/* Fecha */}
              <Text style={{fontSize:16, fontWeight:'600', marginTop:8}}>Fecha (dd/MM)</Text>
              <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                <TextInput
                  style={[tableStyles.filterInput, {flex:1}]}
                  placeholder="Ej: 16/05"
                  value={props.filters.fecha.value}
                  onChangeText={v=>props.setFilters((prev: any) => ({...prev, fecha:{...prev.fecha, value:v}}))}
                  placeholderTextColor="#bdbdbd"
                />
              </View>
              
              {/* CGM */}
              <Text style={{fontSize:16, fontWeight:'600', marginTop:16}}>Último CGM</Text>
              <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                <TouchableOpacity style={[filterOpBtnStyle(props.filters.cgm.op,'='), {marginRight:4}]} onPress={()=>props.setFilters((prev: any) => ({...prev, cgm:{...prev.cgm, op:'='}}))}><Text style={filterOpTextStyle(props.filters.cgm.op,'=')}>=</Text></TouchableOpacity>
                <TouchableOpacity style={filterOpBtnStyle(props.filters.cgm.op,'>')} onPress={()=>props.setFilters((prev: any) => ({...prev, cgm:{...prev.cgm, op:'>'}}))}><Text style={filterOpTextStyle(props.filters.cgm.op,'>')}>{'>'}</Text></TouchableOpacity>
                <TouchableOpacity style={filterOpBtnStyle(props.filters.cgm.op,'<')} onPress={()=>props.setFilters((prev: any) => ({...prev, cgm:{...prev.cgm, op:'<'}}))}><Text style={filterOpTextStyle(props.filters.cgm.op,'<')}>{'<'}</Text></TouchableOpacity>
                <TextInput
                  style={[tableStyles.filterInput, {flex:1, marginLeft:8}]}
                  placeholder="Valor"
                  value={props.filters.cgm.value}
                  onChangeText={v=>{
                    const validatedValue = props.validateNumericInput(v);
                    props.setFilters((prev: any) => ({...prev, cgm:{...prev.cgm, value:validatedValue}}));
                  }}
                  keyboardType="numeric"
                  placeholderTextColor="#bdbdbd"
                />
              </View>
              {/* Dosis */}
              <Text style={{fontSize:16, fontWeight:'600', marginTop:16}}>Dosis calculada</Text>
              <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                <TouchableOpacity style={[filterOpBtnStyle(props.filters.dosis.op,'='), {marginRight:4}]} onPress={()=>props.setFilters((prev: any) => ({...prev, dosis:{...prev.dosis, op:'='}}))}><Text style={filterOpTextStyle(props.filters.dosis.op,'=')}>=</Text></TouchableOpacity>
                <TouchableOpacity style={filterOpBtnStyle(props.filters.dosis.op,'>')} onPress={()=>props.setFilters((prev: any) => ({...prev, dosis:{...prev.dosis, op:'>'}}))}><Text style={filterOpTextStyle(props.filters.dosis.op,'>')}>{'>'}</Text></TouchableOpacity>
                <TouchableOpacity style={filterOpBtnStyle(props.filters.dosis.op,'<')} onPress={()=>props.setFilters((prev: any) => ({...prev, dosis:{...prev.dosis, op:'<'}}))}><Text style={filterOpTextStyle(props.filters.dosis.op,'<')}>{'<'}</Text></TouchableOpacity>
                <TextInput
                  style={[tableStyles.filterInput, {flex:1, marginLeft:8}]}
                  placeholder="Valor"
                  value={props.filters.dosis.value}
                  onChangeText={v=>{
                    const validatedValue = props.validateNumericInput(v);
                    props.setFilters((prev: any) => ({...prev, dosis:{...prev.dosis, value:validatedValue}}));
                  }}
                  keyboardType="numeric"
                  placeholderTextColor="#bdbdbd"
                />
              </View>
              <TouchableOpacity style={{backgroundColor:'#4CAF50', borderRadius:8, padding:14, marginTop:24}} onPress={()=>{
                props.setAppliedFilters(props.filters);
                props.setFilterModalVisible(false);
              }}>
                <Text style={{color:'#fff', fontWeight:'bold', fontSize:18, textAlign:'center'}}>Aplicar filtros</Text>
              </TouchableOpacity>
            </View>
          </Modal>
          {/* ...resto de la tabla... */}
          {props.isLoadingPredictions ? (
            <LoadingSpinner text="Cargando historial..." />
          ) : props.predictionError ? (
            <Text style={{ color: '#ef4444', textAlign: 'center', margin: 16, fontSize: 18, fontFamily:'System' }}>{props.predictionError}</Text>
          ) : props.filteredSortedHistoryAdvanced.length === 0 ? (
            <Text style={{ color: '#6b7280', textAlign: 'center', margin: 16, fontSize: 18, fontFamily:'System' }}>No hay predicciones registradas.</Text>
          ) : (
            <View style={cardStyles.predictionListContainer}>
              {/* Botones de ordenamiento */}
              <View style={cardStyles.sortHeader}>
                <TouchableOpacity 
                  style={[
                    cardStyles.sortButton,
                    props.sortBy === 'fecha' && cardStyles.sortButtonActive
                  ]}
                  onPress={() => {
                    props.setSortBy('fecha');
                    props.setSortDir(props.sortBy === 'fecha' && props.sortDir === 'desc' ? 'asc' : 'desc');
                  }}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={[
                      cardStyles.sortButtonText,
                      props.sortBy === 'fecha' && cardStyles.sortButtonTextActive
                    ]}>
                      Fecha 
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    cardStyles.sortButton,
                    props.sortBy === 'cgm' && cardStyles.sortButtonActive
                  ]}
                  onPress={() => {
                    props.setSortBy('cgm');
                    props.setSortDir(props.sortBy === 'cgm' && props.sortDir === 'desc' ? 'asc' : 'desc');
                  }}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={[
                      cardStyles.sortButtonText,
                      props.sortBy === 'cgm' && cardStyles.sortButtonTextActive
                    ]}>
                      CGM 
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    cardStyles.sortButton,
                    props.sortBy === 'dosis' && cardStyles.sortButtonActive
                  ]}
                  onPress={() => {
                    props.setSortBy('dosis');
                    props.setSortDir(props.sortBy === 'dosis' && props.sortDir === 'desc' ? 'asc' : 'desc');
                  }}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={[
                      cardStyles.sortButtonText,
                      props.sortBy === 'dosis' && cardStyles.sortButtonTextActive
                    ]}>
                      Dosis 
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              {/* Lista de tarjetas de predicción */}
              {props.filteredSortedHistoryAdvanced
                .slice((props.currentPage - 1) * props.itemsPerPage, props.currentPage * props.itemsPerPage)
                .map((pred: any, idx: number) => {
                // Formatear fecha como dd/MM y hora como HH:mm
                const fecha = pred.date 
                  ? format(toZonedTime(new Date(pred.date), 'America/Argentina/Buenos_Aires'), 'dd/MM') 
                  : '-';
                const hora = pred.date 
                  ? format(toZonedTime(new Date(pred.date), 'America/Argentina/Buenos_Aires'), 'HH:mm') 
                  : '';
                const cgmPrev = Array.isArray(pred.cgmPrev) && pred.cgmPrev.length > 0 ? pred.cgmPrev[0] : '-';
                
                // Emoji para la dosis
                let dosisEmoji = '💉';
                if (pred.recommendedDose > 8) dosisEmoji = '💉💉';

                // Render right action for swipe con animación
                const renderRightActions = (_progress: unknown, dragX: Animated.AnimatedInterpolation<number>) => {
                  const scale = dragX.interpolate({
                    inputRange: [-props.DELETE_WIDTH, 0],
                    outputRange: [1, 0.8],
                    extrapolate: 'clamp',
                  });
                  return (
                    <Animated.View style={[swipeStyles.animatedDeleteAction, { transform: [{ scale }], width: props.DELETE_WIDTH, height: props.ROW_HEIGHT }]}> 
                      <TouchableOpacity
                        style={[swipeStyles.deleteAction, { width: props.DELETE_WIDTH, height: props.ROW_HEIGHT }]}
                        onPress={() => props.handleDeletePrediction(pred.id)}
                        accessibilityLabel="Eliminar registro"
                        accessibilityRole="button"
                        activeOpacity={0.85}
                      >
                        <Trash2 size={22} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={swipeStyles.deleteActionText}>Eliminar</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                };

                // Mostrar spinner de loading si se está eliminando esta predicción
                if (props.isDeleting === pred.id) {
                  return (
                    <View key={idx} style={{ position: 'relative', height: props.ROW_HEIGHT, marginBottom: 10, justifyContent: 'center', alignItems: 'center' }}>
                      <LoadingSpinner text="Eliminando..." size="small" />
                    </View>
                  );
                }

                return (
                  <View key={idx} style={{ position: 'relative', height: props.ROW_HEIGHT, marginBottom: 10 }}>
                    {/* Esquinita roja */}
                    <View style={[swipeStyles.cornerIndicator, { height: 18, width: 18, top: 0, right: 0 }]} />
                    <Swipeable
                      ref={ref => { if (ref) props.swipeableRefs.current[pred.id] = ref; else delete props.swipeableRefs.current[pred.id]; }}
                      renderRightActions={renderRightActions}
                      overshootRight={false}
                      onSwipeableOpen={() => {
                        Object.keys(props.swipeableRefs.current).forEach((id: string) => {
                          if (id !== pred.id && props.swipeableRefs.current[id]) {
                            props.swipeableRefs.current[id].close();
                          }
                        });
                        props.setOpenSwipeable(pred.id);
                      }}
                      onSwipeableClose={() => {
                        if (props.openSwipeable === pred.id) props.setOpenSwipeable(null);
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[
                          cardStyles.predictionCard,
                          { paddingRight: 0, height: props.ROW_HEIGHT, minHeight: props.ROW_HEIGHT, justifyContent: 'center' },
                        ]}
                        onPress={() => (props.navigation as any).navigate('PredictionResultPage', { result: pred })}
                      >
                        {/* Fila de títulos alineados */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                          <View style={[cardStyles.dataColumn]}>
                            <Text style={cardStyles.dataLabel}>📅 Fecha</Text>
                          </View>
                          <View style={[cardStyles.dataColumn]}>
                            <Text style={cardStyles.dataLabel}>🩸 Último CGM</Text>
                          </View>
                          <View style={[cardStyles.dataColumn]}>
                            <Text style={cardStyles.dataLabel}>{dosisEmoji} Dosis calculada</Text>
                          </View>
                        </View>
                        {/* Fila de valores alineados */}
                        <View style={cardStyles.predictionContent}>
                          <View style={cardStyles.dataColumn}>
                            <Text style={[cardStyles.dataValue]}>{fecha} {hora}</Text>
                          </View>
                          <View style={cardStyles.dataColumn}>
                            <Text style={cardStyles.dataValue}>{cgmPrev} mg/dL</Text>
                          </View>
                          <View style={cardStyles.dataColumn}>
                            <Text style={cardStyles.dataValue}>{pred.recommendedDose} U</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Swipeable>
                  </View>
);
                })}
                
                {/* Controles de paginación */}
                {props.filteredSortedHistoryAdvanced.length > 0 && (
                  <View style={cardStyles.paginationContainer}>
                    <Text style={cardStyles.paginationInfo}>
                      Página {props.currentPage} de {Math.ceil(props.filteredSortedHistoryAdvanced.length / props.itemsPerPage)}
                    </Text>
                    <View style={cardStyles.paginationControls}>
                      <TouchableOpacity 
                        style={[
                          cardStyles.paginationButton,
                          props.currentPage === 1 && cardStyles.paginationButtonDisabled
                        ]}
                        onPress={() => props.setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                        disabled={props.currentPage === 1}
                      >
                        <Text style={[
                          cardStyles.paginationButtonText,
                          props.currentPage === 1 && cardStyles.paginationButtonTextDisabled
                        ]}>Anterior</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          cardStyles.paginationButton,
                          props.currentPage >= Math.ceil(props.filteredSortedHistoryAdvanced.length / props.itemsPerPage) && cardStyles.paginationButtonDisabled
                        ]}
                        onPress={() => props.setCurrentPage((prev: number) => Math.min(Math.ceil(props.filteredSortedHistoryAdvanced.length / props.itemsPerPage), prev + 1))}
                        disabled={props.currentPage >= Math.ceil(props.filteredSortedHistoryAdvanced.length / props.itemsPerPage)}
                      >
                        <Text style={[
                          cardStyles.paginationButtonText,
                          props.currentPage >= Math.ceil(props.filteredSortedHistoryAdvanced.length / props.itemsPerPage) && cardStyles.paginationButtonTextDisabled
                        ]}>Siguiente</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function StatsTab(props: any) {
  // All state and logic related to statistics dashboard
  // Use props for any values/functions needed from parent (HistoryPage)
  // ...existing code for statistics dashboard section...
  return (
    <ScrollView>
      <View style={styles.content}>
        {/* DASHBOARD DE ESTADÍSTICAS - all original code for this section */}
        <Card style={{ marginBottom: 24 }}>
          <CardHeader>
            <CardTitle style={{ textAlign: 'center' }}>Estadísticas de tus predicciones</CardTitle>
          </CardHeader>
          <CardContent>
            {props.stats ? (
              <View style={dashboardStyles.statsGrid}>
                {/* Glucosa promedio al aplicar dosis */}
                <View style={dashboardStyles.statBox}>
                  <Text style={dashboardStyles.statLabel}>Glucosa promedio al aplicar dosis</Text>
                  <Text style={dashboardStyles.statValue}>{props.stats.avgCGM.toFixed(1)} mg/dL</Text>
                </View>
                {/* Dosis aplicada vs recomendada (variación %) */}
                <View style={dashboardStyles.statBox}>
                  <Text style={dashboardStyles.statLabel}>Dosis aplicada vs recomendada (variación %)</Text>
                  <Text style={dashboardStyles.statValue}>
                    {props.stats.avgApplyVsRecPercent !== null ? props.stats.avgApplyVsRecPercent.toFixed(1) + ' %' : '-'}
                  </Text>
                </View>
                {/* Dosis recomendada promedio */}
                <View style={dashboardStyles.statBox}>
                  <Text style={dashboardStyles.statLabel}>Dosis recomendada promedio</Text>
                  <Text style={dashboardStyles.statValue}>{props.stats.avgRecDose.toFixed(2)} U</Text>
                </View>
                {/* Dosis aplicada promedio */}
                <View style={dashboardStyles.statBox}>
                  <Text style={dashboardStyles.statLabel}>Dosis aplicada promedio</Text>
                  <Text style={dashboardStyles.statValue}>{props.stats.avgApplyDose !== null ? props.stats.avgApplyDose.toFixed(2) + ' U' : '-'}</Text>
                </View>
                {/* Nivel de sueño promedio */}
                <View style={dashboardStyles.statBox}>
                  <Text style={dashboardStyles.statLabel}>Nivel de sueño promedio</Text>
                  <Text style={dashboardStyles.statValue}>{props.stats.avgSleep.toFixed(2)}</Text>
                </View>
                {/* Carbohidratos promedio */}
                <View style={dashboardStyles.statBox}>
                  <Text style={dashboardStyles.statLabel}>Carbohidratos promedio</Text>
                  <Text style={dashboardStyles.statValue}>{props.stats.avgCarbs.toFixed(1)} g</Text>
                </View>
                {/* Nivel de actividad promedio */}
                <View style={dashboardStyles.statBox}>
                  <Text style={dashboardStyles.statLabel}>Nivel de actividad promedio</Text>
                  <Text style={dashboardStyles.statValue}>{props.stats.avgActivity.toFixed(2)}</Text>
                </View>
                {/* Nivel de trabajo promedio */}
                <View style={dashboardStyles.statBox}>
                  <Text style={dashboardStyles.statLabel}>Nivel de trabajo promedio</Text>
                  <Text style={dashboardStyles.statValue}>{props.stats.avgWork.toFixed(2)}</Text>
                </View>
              </View>
            ) : (
              <Text style={dashboardStyles.noStatsText}>No hay datos suficientes para mostrar estadísticas.</Text>
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}

const Tab = createMaterialTopTabNavigator();

export default function HistoryPage() {
  const navigation = useNavigation();
  const { token, isAuthenticated, user } = useAuth();
  const [predictionHistory, setPredictionHistory] = useState<any[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [predictionToDelete, setPredictionToDelete] = useState<string | null>(null);

  // Estado para filtros y orden
  const [sortBy, setSortBy] = useState<'fecha' | 'cgm' | 'dosis'>('fecha');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filtros avanzados con operador
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    fecha: { op: '=', value: '' },
    cgm: { op: '=', value: '' },
    dosis: { op: '=', value: '' },
  });
  const [appliedFilters, setAppliedFilters] = useState({
    fecha: { op: '=', value: '' },
    cgm: { op: '=', value: '' },
    dosis: { op: '=', value: '' },
  });

  // Función de validación para campos numéricos
  const validateNumericInput = (value: string): string => {
    // Eliminar caracteres no válidos
    const cleaned = value.replace(/[^0-9.,]/g, '');
    
    // Si está vacío, devolver vacío
    if (!cleaned) return '';
    
    // Convertir comas a puntos para manejar un formato consistente
    const normalized = cleaned.replace(',', '.');
    
    // Limitar a 5 caracteres en total
    if (normalized.length > 5) return normalized.slice(0, 5);
    
    // Validar formato de número con máximo 2 decimales
    const regex = /^\d{1,3}(\.\d{0,2})?$/;
    if (!regex.test(normalized)) {
      // Si no cumple con el formato, intentar arreglarlo
      const parts = normalized.split('.');
      if (parts.length === 1) return parts[0].slice(0, 3); // Solo enteros, máximo 3 dígitos
      return parts[0].slice(0, 3) + '.' + parts[1].slice(0, 2); // Enteros + decimales
    }
    
    return normalized;
  };
  
  // --- Estadísticas ---
  const stats = React.useMemo(() => {
    if (!predictionHistory || predictionHistory.length === 0) return null;
    const count = predictionHistory.length;
    let sumCGM = 0, sumCarbs = 0, sumSleep = 0, sumWork = 0, sumActivity = 0, sumRecDose = 0, sumApplyDose = 0, countApply = 0;
    let sumRecDoseWithApply = 0, sumApplyDoseWithApply = 0, countWithApply = 0;
    let sumApplyVsRecPercent = 0, countApplyVsRecPercent = 0;
    predictionHistory.forEach(pred => {
      if (Array.isArray(pred.cgmPrev) && pred.cgmPrev.length > 0) sumCGM += Number(pred.cgmPrev[0] || 0);
      else sumCGM += 0;
      sumCarbs += Number(pred.carbs || 0);
      sumSleep += Number(pred.sleepLevel || 0);
      sumWork += Number(pred.workLevel || 0);
      sumActivity += Number(pred.activityLevel || 0);
      sumRecDose += Number(pred.recommendedDose || 0);
      if (typeof pred.applyDose === 'number' && typeof pred.recommendedDose === 'number' && pred.recommendedDose !== 0) {
        sumApplyDose += pred.applyDose;
        countApply++;
        sumRecDoseWithApply += Number(pred.recommendedDose || 0);
        sumApplyDoseWithApply += pred.applyDose;
        countWithApply++;
        // Calcular variación porcentual absoluta
        const percentDiff = Math.abs((pred.applyDose - pred.recommendedDose) / pred.recommendedDose) * 100;
        sumApplyVsRecPercent += percentDiff;
        countApplyVsRecPercent++;
      }
    });
    return {
      avgCGM: sumCGM / count,
      avgCarbs: sumCarbs / count,
      avgSleep: sumSleep / count,
      avgWork: sumWork / count,
      avgActivity: sumActivity / count,
      avgRecDose: sumRecDose / count,
      avgApplyDose: countApply > 0 ? sumApplyDose / countApply : null,
      avgRecDoseWithApply: countWithApply > 0 ? sumRecDoseWithApply / countWithApply : null,
      avgApplyDoseWithApply: countWithApply > 0 ? sumApplyDoseWithApply / countApply : null,
      avgApplyVsRecPercent: countApplyVsRecPercent > 0 ? sumApplyVsRecPercent / countApplyVsRecPercent : null,
      count,
      countWithApply,
    };
  }, [predictionHistory]);

  // --- Fetch de historial de predicciones ---
  const fetchPredictionHistoryData = async () => {
    if (!token || !user?.id) return;
    setIsLoadingPredictions(true);
    setPredictionError(null);
    try {
      const data = await getPredictionHistory(token, user.id);
      setPredictionHistory(
        data
          .slice()
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
    } catch (err) {
      setPredictionError('Error al cargar el historial de predicciones');
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchPredictionHistoryData();
    }
  }, [token, isAuthenticated]);

  // Resetear a la primera página cuando cambian los filtros o el ordenamiento
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters, sortBy, sortDir]);

  // Filtrado y ordenado avanzado
  const filteredSortedHistoryAdvanced = predictionHistory
    .filter(pred => {
      // Fecha
      const fecha = pred.date ? format(toZonedTime(new Date(pred.date), 'America/Argentina/Buenos_Aires'), 'dd/MM') : '-';
      const cgm = pred.cgmPrev && pred.cgmPrev.length > 0 ? pred.cgmPrev[0] : '';
      const dosis = pred.recommendedDose ?? '';
      
      // Fecha solo soporta igual
      let fechaOk = true;
      if (appliedFilters.fecha.value) {
        fechaOk = fecha.includes(appliedFilters.fecha.value);
      }
      
      // CGM
      let cgmOk = true;
      if (appliedFilters.cgm.value !== '') {
        const v = Number(appliedFilters.cgm.value);
        if (appliedFilters.cgm.op === '=') cgmOk = Number(cgm) === v;
        if (appliedFilters.cgm.op === '>') cgmOk = Number(cgm) > v;
        if (appliedFilters.cgm.op === '<') cgmOk = Number(cgm) < v;
      }
      
      // Dosis
      let dosisOk = true;
      if (appliedFilters.dosis.value !== '') {
        const v = Number(appliedFilters.dosis.value);
        if (appliedFilters.dosis.op === '=') dosisOk = Number(dosis) === v;
        if (appliedFilters.dosis.op === '>') dosisOk = Number(dosis) > v;
        if (appliedFilters.dosis.op === '<') dosisOk = Number(dosis) < v;
      }
      
      return fechaOk && cgmOk && dosisOk;
    })
    .sort((a, b) => {
      let vA, vB;
      if (sortBy === 'fecha') {
        vA = new Date(a.date).getTime();
        vB = new Date(b.date).getTime();
      } else if (sortBy === 'cgm') {
        vA = a.cgmPrev && a.cgmPrev.length > 0 ? a.cgmPrev[0] : 0;
        vB = b.cgmPrev && b.cgmPrev.length > 0 ? b.cgmPrev[0] : 0;
      } else {
        vA = a.recommendedDose ?? 0;
        vB = b.recommendedDose ?? 0;
      }
      if (vA === vB) return 0;
      return sortDir === 'asc' ? vA - vB : vB - vA;
    });

  // Function to handle prediction deletion
  const handleDeletePrediction = async (id: string) => {
    if (!token || !isAuthenticated) return;
    
    setPredictionToDelete(id);
    setShowDeleteConfirm(true);
  };

  // Function to confirm and process deletion
  const confirmDeletePrediction = async () => {
    if (!predictionToDelete || !token) return;
    
    setIsDeleting(predictionToDelete);
    setDeleteError(null);
    setShowDeleteConfirm(false);
    
    try {
      await deleteInsulinPrediction(predictionToDelete, token);
      // Remove the deleted item from state
      setPredictionHistory(prev => prev.filter(p => p.id !== predictionToDelete));
    } catch (error) {
      console.error('Error deleting prediction:', error);
      setDeleteError('Error al eliminar la predicción. Intenta de nuevo.');
    } finally {
      setIsDeleting(null);
      setPredictionToDelete(null);
    }
  };

  // Function to cancel deletion
  const cancelDeletePrediction = () => {
    setShowDeleteConfirm(false);
    setPredictionToDelete(null);
  };
  
  // Estado para swipe activo
  const [openSwipeable, setOpenSwipeable] = useState(null);
  const swipeableRefs = useRef<Record<string, any>>({});

  const ROW_HEIGHT = 74; // Ajusta este valor según el alto real de la fila
  const DELETE_WIDTH = 110; // Ancho fijo para el botón eliminar

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Historial"
        icon={<Activity width={32} height={32} color="#fff" />}
        onBack={() => navigation.goBack()}
      />
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenOptions={{
            tabBarLabelStyle: {
              fontWeight: 'bold',
              fontSize: 17,
              textTransform: 'none',
              fontFamily: 'System',
            },
            tabBarActiveTintColor: '#4CAF50',
            tabBarInactiveTintColor: '#6b7280',
            tabBarIndicatorStyle: {
              backgroundColor: '#4CAF50',
              height: 3,
              borderRadius: 2,
            },
            tabBarStyle: {
              backgroundColor: '#fff',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0',
            },
            tabBarPressColor: '#e0f2f1',
          }}
        >
          <Tab.Screen
            name="Predicciones"
            options={{ tabBarLabel: 'Predicciones' }}
          >
            {() => (
              <HistoryTab
                // Pass all necessary props/state/functions
                // e.g. predictionHistory, filters, handlers, etc.
                {...{
                  predictionHistory,
                  isLoadingPredictions,
                  predictionError,
                  isDeleting,
                  deleteError,
                  showDeleteConfirm,
                  predictionToDelete,
                  sortBy,
                  setSortBy,
                  sortDir,
                  setSortDir,
                  currentPage,
                  setCurrentPage,
                  itemsPerPage,
                  filterModalVisible,
                  setFilterModalVisible,
                  filters,
                  setFilters,
                  appliedFilters,
                  setAppliedFilters,
                  validateNumericInput,
                  fetchPredictionHistoryData,
                  handleDeletePrediction,
                  confirmDeletePrediction,
                  cancelDeletePrediction,
                  openSwipeable,
                  setOpenSwipeable,
                  swipeableRefs,
                  ROW_HEIGHT,
                  DELETE_WIDTH,
                  navigation,
                  filteredSortedHistoryAdvanced,
                  // ...any other needed props
                }}
              />
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Estadísticas"
            options={{ tabBarLabel: 'Estadísticas' }}
          >
            {() => (
              <StatsTab
                stats={stats}
                dashboardStyles={dashboardStyles}
                // ...any other needed props
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </View>
      <Footer />
      
      {/* Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDeletePrediction}
      >
        <View style={deleteStyles.modalOverlay}>
          <View style={deleteStyles.modalContent}>
            <Text style={deleteStyles.modalTitle}>Confirmar eliminación</Text>
            <Text style={deleteStyles.modalText}>
              ¿Estás seguro que deseas eliminar este registro?{'\n'}
              Esta acción no se puede deshacer.
            </Text>
            <View style={deleteStyles.buttonContainer}>
              <TouchableOpacity 
                style={[deleteStyles.button, deleteStyles.cancelButton]}
                onPress={cancelDeletePrediction}
              >
                <Text style={deleteStyles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[deleteStyles.button, deleteStyles.deleteButton]}
                onPress={confirmDeletePrediction}
              >
                <Text style={deleteStyles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const tableStyles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#e0f2f1',
    paddingVertical: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  filterInput: {
    flex: 1,
    fontSize: 18,
    backgroundColor: '#fff',
    marginHorizontal: 6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#222',
    borderWidth: 1,
    borderColor: '#b2dfdb',
    minWidth: 120,
  },
  headerRowSmall: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderBottomWidth: 2,
    borderBottomColor: '#388e3c',
    paddingVertical: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  thTouchSmall: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2, // Menos margen horizontal
  },
  thSmall: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'System',
    lineHeight: 18,
  },
  rowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 2,
  },
  rowEvenSmall: {
    backgroundColor: '#f9fbe7',
  },
  rowOddSmall: {
    backgroundColor: '#e0f7fa',
  },
  tdSmall: {
    flex: 1,
    color: '#222',
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 6,
    fontFamily: 'System',
  },
  tableContainer: {
    minWidth: 420,
    maxWidth: 600,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#b2dfdb',
    marginVertical: 8,
    marginLeft: 20,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5', // --background-light
  },
  content: {
    padding: 16,
    paddingBottom: 0,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50', // --apple-green
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280', // --text-secondary
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  plotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333', // --text-primary
    marginBottom: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#EF4444', // Red for remove
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333', // --text-primary
    marginLeft: 8,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  filterButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  filterButtonSmall: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 20,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  filterButtonTextSmall: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'System',
  },
  fontTitle: {
    fontFamily: 'System',
    fontWeight: 'bold',
    color: '#111827',
  },
  endSpacer: {
    height: 0, // Reducido a 0 para eliminar espacio adicional
    marginTop: 0,
    marginBottom: 0, // Sin margen inferior
  },
  // Estilos para el modal de eliminación
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

// Tipar funciones de filtro
function filterOpBtnStyle(selected: string, op: string) {
  return {
    backgroundColor: selected === op ? '#26a69a' : '#e0f2f1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: selected === op ? 2 : 1,
    borderColor: selected === op ? '#009688' : '#b2dfdb',
  };
}

// Define tipos para fontWeight
type FontWeightType = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

function filterOpTextStyle(selected: string, op: string) {
  return {
    color: selected === op ? '#fff' : '#00796b',
    fontWeight: 'bold' as FontWeightType,
    fontSize: 18,
  };
}

// Tipos para filtros
const filterKeys = ['fecha', 'cgm', 'dosis'] as const;
type FilterKey = typeof filterKeys[number];

// Nuevos estilos para las cards de predicciones
const cardStyles = StyleSheet.create({
  predictionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  predictionCardEven: {
    backgroundColor: '#f9fbe7',
  },
  predictionCardOdd: {
    backgroundColor: '#e0f7fa',
  },
  predictionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'System',
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'System',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'System',
    paddingVertical: 2,
  },
  timeValue: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'System',
  },
  predictionListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sortHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
    marginTop: 12,
  },
  sortButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#e8f5e9',
    margin: 2,
    borderRadius: 8,
  },
  sortButtonActive: {
    backgroundColor: '#4CAF50',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#4b5563',
    fontFamily: 'System',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  sortIcon: {
    marginLeft: 4,
  },
  paginationContainer: {
    marginTop: 12,
    marginBottom: 4,
    alignItems: 'center',
  },
  paginationInfo: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
    fontFamily: 'System',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  paginationButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  paginationButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'System',
  },
  paginationButtonTextDisabled: {
    color: '#a0a0a0',
  },
  totalPredictions: {
    fontSize: 16,
    color: '#333',
    marginTop: 8,
    marginBottom: 16,
    fontFamily: 'System',
  },
  totalPredictionsSmall: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'right',
    fontFamily: 'System',
    fontWeight: '400',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 8,
  },
  actionButton: {
    position: 'absolute',
    bottom: 8,
    left: 12,  // Cambiado de right a left
    padding: 6,
    borderRadius: 4,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButtonRow: {
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingLeft: 6,
  },
});

// Estilos para swipe action
const swipeStyles = StyleSheet.create({
  deleteAction: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  animatedDeleteAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  cornerIndicator: {
    position: 'absolute',
    backgroundColor: '#ef4444',
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 18,
    zIndex: 2,
  },
});

// Estilos para el modal de eliminación
const deleteStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

// Estilos para el dashboard de estadísticas
const dashboardStyles = StyleSheet.create({
  dashboardCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
    textAlign: 'center',
    fontFamily: 'System',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'System',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    fontFamily: 'System',
  },
  noStatsText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'System',
    marginVertical: 12,
  },
});