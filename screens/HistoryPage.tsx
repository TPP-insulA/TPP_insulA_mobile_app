import React, { useState, useEffect } from 'react';
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
  Pressable
} from 'react-native';
import { GlucoseTrendsChart } from '../components/glucose-trends-chart';
import DailyPatternChart from '../components/daily-pattern-chart';
import { Footer } from '../components/footer';
import { BackButton } from '../components/back-button';
import { useNavigation } from '@react-navigation/native';
import { Activity, Plus } from 'lucide-react-native';
import PlotSelectorModal from '../components/plot-selector-modal';
import GlucoseWithMealsChart from '../components/glucose-with-meals-chart';
import { LoadingSpinner } from '../components/loading-spinner';
import { API_URL } from '../lib/api/auth';
import { useAuth } from '../hooks/use-auth';
import { getPredictionHistory } from '../lib/api/insulin';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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

export default function HistoryPage() {
  const navigation = useNavigation();
  const { token, isAuthenticated, user } = useAuth();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState<{ [key: number]: boolean }>({});
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [plotData, setPlotData] = useState<{
    [key: number]: {
      glucose?: GlucoseData[];
      meals?: any[];
      stats?: any;
    };
  }>({});
  const [predictionHistory, setPredictionHistory] = useState<any[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // Estado para filtros y orden
  const [sortBy, setSortBy] = useState<'fecha' | 'cgm' | 'dosis'>('fecha');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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
  
  const fetchData = async (plot: Plot) => {
    if (!token || !isAuthenticated) return;
    
    setIsLoading(prev => ({ ...prev, [plot.id]: true }));
    setErrors(prev => prev.filter(e => e.plotId !== plot.id));
    
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const timeRange = plot.timeRange;

      switch (plot.type) {
        case 'glucose': {
          const response = await fetch(`${API_URL}/glucose?range=${timeRange}`, { headers });
          if (!response.ok) throw new Error('Failed to fetch glucose data');
          const data = await response.json();
          // Transform to required format
          const transformedData = data.map((reading: any) => ({
            time: new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            glucose: reading.value
          }));
          setPlotData(prev => ({
            ...prev,
            [plot.id]: { ...prev[plot.id], glucose: transformedData }
          }));
          break;
        }
        case 'glucose_meals': {
          const [glucoseRes, mealsRes] = await Promise.all([
            fetch(`${API_URL}/glucose?range=${timeRange}`, { headers }),
            fetch(`${API_URL}/meals?range=${timeRange}`, { headers })
          ]);
          if (!glucoseRes.ok || !mealsRes.ok) throw new Error('Failed to fetch glucose or meals data');
          const [glucoseData, mealsData] = await Promise.all([
            glucoseRes.json(),
            mealsRes.json()
          ]);
          const transformedGlucose = glucoseData.map((reading: any) => ({
            time: new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            glucose: reading.value
          }));
          setPlotData(prev => ({
            ...prev,
            [plot.id]: { 
              glucose: transformedGlucose,
              meals: mealsData
            }
          }));
          break;
        }
        case 'daily_pattern': {
          const response = await fetch(`${API_URL}/glucose/stats?range=${timeRange}`, { headers });
          if (!response.ok) throw new Error('Failed to fetch glucose stats');
          const data = await response.json();
          setPlotData(prev => ({
            ...prev,
            [plot.id]: { stats: data }
          }));
          break;
        }
      }
    } catch (error) {
      setErrors(prev => [...prev, { 
        plotId: plot.id, 
        message: error instanceof Error ? error.message : 'Error al cargar datos' 
      }]);
    } finally {
      setIsLoading(prev => ({ ...prev, [plot.id]: false }));
    }
  };

  const fetchEvents = async () => {
    if (!token || !isAuthenticated) return;

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Make API calls and handle each response individually
      let allEvents = [];
      
      try {
        const glucoseRes = await fetch(`${API_URL}/glucose?range=24h&limit=10`, { headers });
        if (glucoseRes.ok) {
          const glucose = await glucoseRes.json();
          if (Array.isArray(glucose)) {
            allEvents.push(...glucose.map((g: any) => ({
              id: g.id,
              timestamp: new Date(g.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              description: 'Lectura de glucosa',
              type: 'glucose',
              value: g.value
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching glucose events:', error);
      }

      try {
        const mealsRes = await fetch(`${API_URL}/meals?range=24h&limit=10`, { headers });
        if (mealsRes.ok) {
          const meals = await mealsRes.json();
          if (Array.isArray(meals)) {
            allEvents.push(...meals.map((m: any) => ({
              id: m.id,
              timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              description: m.description || 'Comida',
              type: 'meal',
              carbs: m.carbs,
              items: m.items || []
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching meal events:', error);
      }

      try {
        const insulinRes = await fetch(`${API_URL}/insulin?range=24h&limit=10`, { headers });
        if (insulinRes.ok) {
          const insulin = await insulinRes.json();
          if (Array.isArray(insulin)) {
            allEvents.push(...insulin.map((i: any) => ({
              id: i.id,
              timestamp: new Date(i.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              description: 'Dosis de insulina',
              type: 'insulin',
              units: i.units
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching insulin events:', error);
      }

      try {
        const activitiesRes = await fetch(`${API_URL}/activities?range=24h&limit=10`, { headers });
        if (activitiesRes.ok) {
          const activities = await activitiesRes.json();
          if (Array.isArray(activities)) {
            allEvents.push(...activities.map((a: any) => ({
              id: a.id,
              timestamp: new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              description: a.description || 'Actividad física',
              type: 'activity',
              duration: a.duration
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching activity events:', error);
      }

      // Sort all events by timestamp and take the latest 10
      if (allEvents.length > 0) {
        allEvents.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setEvents(allEvents.slice(0, 10));
      }
    } catch (error) {
      console.error('Error in fetchEvents:', error);
      // Set empty events array to avoid undefined errors
      setEvents([]);
    }
  };

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

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      ...plots.map(plot => fetchData(plot)),
      fetchEvents(),
      fetchPredictionHistoryData()
    ]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchEvents();
      fetchPredictionHistoryData();
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (token && isAuthenticated) {
      plots.forEach(plot => {
        if (!plotData[plot.id]) {
          fetchData(plot);
        }
      });
    }
  }, [plots, token, isAuthenticated]);

  const addPlot = (plot: Omit<Plot, 'id'>) => {
    setPlots([...plots, { ...plot, id: Date.now() }]);
  };

  const removePlot = (id: number) => {
    setPlots(plots.filter((plot) => plot.id !== id));
  };

  const renderPlot = (plot: Plot) => {
    if (isLoading[plot.id]) {
      return <LoadingSpinner text="Cargando datos..." />;
    }

    const error = errors.find(e => e.plotId === plot.id);
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      );
    }

    const data = plotData[plot.id];
    if (!data) return null;

    switch (plot.type) {
      case 'glucose':
        return (
          <GlucoseTrendsChart
            data={data.glucose || []}
            timeRange={plot.timeRange}
          />
        );
      case 'daily_pattern':
        return <DailyPatternChart data={data.stats || []} />;
      case 'glucose_meals':
        return (
          <GlucoseWithMealsChart 
            data={data.glucose || []}
            meals={Array.isArray(data.meals) ? data.meals : []}
            timeRange={plot.timeRange}
          />
        );
      default:
        return null;
    }
  };

  // Filtrado y ordenado
  // El método filteredSortedHistory ya no se usa, solo usamos el avanzado
  
  // Aplica los filtros avanzados
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#4CAF50']}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <BackButton />
            </TouchableOpacity>
            <Activity width={32} height={32} color="#4CAF50" />
            <Text style={styles.title}>Historial</Text>
          </View>
          <Text style={styles.subtitle}>Registros y tendencias de glucosa</Text>
        </View>

        <View style={styles.content}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>Agregar Gráfico</Text>
          </TouchableOpacity>

          {plots.length === 0 ? (
            <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                No hay gráficos agregados aún. Toca "Agregar Gráfico" para comenzar.
                </Text>
            </View>
          ) : (
            plots.map((plot) => (
              <View key={plot.id} style={styles.card}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePlot(plot.id)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.plotTitle}>{plot.label}</Text>
                {renderPlot(plot)}
              </View>
            ))
          )}

          {/* Tabla de predicciones */}
          <View style={[styles.card, {padding: 0, overflow: 'hidden'}]}>
            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop: 20, marginBottom: 0, marginHorizontal: 20}}>
              <Text style={[styles.sectionTitle, styles.fontTitle, {fontSize: 22}]}>Historial de Predicciones</Text>
            </View>
            <TouchableOpacity style={[styles.filterButtonSmall, {marginLeft: 20}]} onPress={()=>setFilterModalVisible(true)}>
              <Plus size={16} color="#fff" style={{marginRight: 4}} />
              <Text style={styles.filterButtonTextSmall}>Agregar filtros</Text>
            </TouchableOpacity>
            {/* Filtros activos */}
            <View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginLeft:20, marginBottom:8}}>
              {Object.entries(appliedFilters).map(([key, f]) => f.value ? (
                <View key={key} style={{flexDirection:'row', alignItems:'center', backgroundColor:'#e0f2f1', borderRadius:16, paddingHorizontal:10, paddingVertical:4, marginRight:8, marginBottom:4}}>
                  <Text style={{fontSize:15, color:'#00796b', fontFamily:'System'}}>{key==='fecha'?'Fecha':key==='cgm'?'CGM':'Dosis'} {f.op} {f.value}</Text>
                  <Pressable onPress={()=>{
                    const newFilters = {...appliedFilters};
                    newFilters[key as FilterKey] = {...newFilters[key as FilterKey], value: ''};
                    setAppliedFilters(newFilters);
                    setFilters(newFilters);
                  }}>
                    <Text style={{marginLeft:6, color:'#ef4444', fontWeight:'bold'}}>×</Text>
                  </Pressable>
                </View>
              ) : null)}
            </View>
            {/* Modal de filtros */}
            <Modal
              visible={filterModalVisible}
              animationType="slide"
              transparent
              onRequestClose={()=>setFilterModalVisible(false)}
            >
              <Pressable style={{flex:1, backgroundColor:'rgba(0,0,0,0.3)'}} onPress={()=>setFilterModalVisible(false)} />
              <View style={{position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24}}>
                <Text style={{fontSize:22, fontWeight:'bold', marginBottom:16, textAlign:'center'}}>Filtrar predicciones</Text>
                {/* Fecha */}
                <Text style={{fontSize:16, fontWeight:'600', marginTop:8}}>Fecha (dd/MM)</Text>
                <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                  <TextInput
                    style={[tableStyles.filterInput, {flex:1}]}
                    placeholder="Ej: 16/05"
                    value={filters.fecha.value}
                    onChangeText={v=>setFilters(prev=>({...prev, fecha:{...prev.fecha, value:v}}))}
                    placeholderTextColor="#bdbdbd"
                  />
                </View>
                
                {/* CGM */}
                <Text style={{fontSize:16, fontWeight:'600', marginTop:16}}>Último CGM</Text>
                <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                  <TouchableOpacity style={[filterOpBtnStyle(filters.cgm.op,'='), {marginRight:4}]} onPress={()=>setFilters(prev=>({...prev, cgm:{...prev.cgm, op:'='}}))}><Text style={filterOpTextStyle(filters.cgm.op,'=')}>=</Text></TouchableOpacity>
                  <TouchableOpacity style={filterOpBtnStyle(filters.cgm.op,'>')} onPress={()=>setFilters(prev=>({...prev, cgm:{...prev.cgm, op:'>'}}))}><Text style={filterOpTextStyle(filters.cgm.op,'>')}>{'>'}</Text></TouchableOpacity>
                  <TouchableOpacity style={filterOpBtnStyle(filters.cgm.op,'<')} onPress={()=>setFilters(prev=>({...prev, cgm:{...prev.cgm, op:'<'}}))}><Text style={filterOpTextStyle(filters.cgm.op,'<')}>{'<'}</Text></TouchableOpacity>
                  <TextInput
                    style={[tableStyles.filterInput, {flex:1, marginLeft:8}]}
                    placeholder="Valor"
                    value={filters.cgm.value}
                    onChangeText={v=>{
                      const validatedValue = validateNumericInput(v);
                      setFilters(prev=>({...prev, cgm:{...prev.cgm, value:validatedValue}}));
                    }}
                    keyboardType="numeric"
                    placeholderTextColor="#bdbdbd"
                  />
                </View>
                {/* Dosis */}
                <Text style={{fontSize:16, fontWeight:'600', marginTop:16}}>Dosis calculada</Text>
                <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                  <TouchableOpacity style={[filterOpBtnStyle(filters.dosis.op,'='), {marginRight:4}]} onPress={()=>setFilters(prev=>({...prev, dosis:{...prev.dosis, op:'='}}))}><Text style={filterOpTextStyle(filters.dosis.op,'=')}>=</Text></TouchableOpacity>
                  <TouchableOpacity style={filterOpBtnStyle(filters.dosis.op,'>')} onPress={()=>setFilters(prev=>({...prev, dosis:{...prev.dosis, op:'>'}}))}><Text style={filterOpTextStyle(filters.dosis.op,'>')}>{'>'}</Text></TouchableOpacity>
                  <TouchableOpacity style={filterOpBtnStyle(filters.dosis.op,'<')} onPress={()=>setFilters(prev=>({...prev, dosis:{...prev.dosis, op:'<'}}))}><Text style={filterOpTextStyle(filters.dosis.op,'<')}>{'<'}</Text></TouchableOpacity>
                  <TextInput
                    style={[tableStyles.filterInput, {flex:1, marginLeft:8}]}
                    placeholder="Valor"
                    value={filters.dosis.value}
                    onChangeText={v=>{
                      const validatedValue = validateNumericInput(v);
                      setFilters(prev=>({...prev, dosis:{...prev.dosis, value:validatedValue}}));
                    }}
                    keyboardType="numeric"
                    placeholderTextColor="#bdbdbd"
                  />
                </View>
                <TouchableOpacity style={{backgroundColor:'#4CAF50', borderRadius:8, padding:14, marginTop:24}} onPress={()=>{
                  setAppliedFilters(filters);
                  setFilterModalVisible(false);
                }}>
                  <Text style={{color:'#fff', fontWeight:'bold', fontSize:18, textAlign:'center'}}>Aplicar filtros</Text>
                </TouchableOpacity>
              </View>
            </Modal>
            {/* ...resto de la tabla... */}
            {isLoadingPredictions ? (
              <LoadingSpinner text="Cargando historial..." />
            ) : predictionError ? (
              <Text style={{ color: '#ef4444', textAlign: 'center', margin: 16, fontSize: 18, fontFamily:'System' }}>{predictionError}</Text>
            ) : filteredSortedHistoryAdvanced.length === 0 ? (
              <Text style={{ color: '#6b7280', textAlign: 'center', margin: 16, fontSize: 18, fontFamily:'System' }}>No hay predicciones registradas.</Text>
            ) : (
              <View style={{alignItems:'center'}}>
                <View style={[tableStyles.tableContainer, {alignSelf:'center', minWidth: 420, maxWidth: 600, marginLeft: 20, marginRight: 20, width: '100%'}]}>
                  {/* Encabezado con orden */}
                  <View style={tableStyles.headerRowSmall}>
                    <TouchableOpacity style={tableStyles.thTouchSmall} onPress={() => {
                      setSortBy('fecha');
                      setSortDir(sortBy === 'fecha' && sortDir === 'desc' ? 'asc' : 'desc');
                    }}>
                      <Text style={tableStyles.thSmall}>
                        Fecha {sortBy === 'fecha' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={tableStyles.thTouchSmall} onPress={() => {
                      setSortBy('cgm');
                      setSortDir(sortBy === 'cgm' && sortDir === 'desc' ? 'asc' : 'desc');
                    }}>
                      <Text style={tableStyles.thSmall}>
                        Ult.{"\n"}CGM {sortBy === 'cgm' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={tableStyles.thTouchSmall} onPress={() => {
                      setSortBy('dosis');
                      setSortDir(sortBy === 'dosis' && sortDir === 'desc' ? 'asc' : 'desc');
                    }}>
                      <Text style={tableStyles.thSmall}>
                        Dosis{"\n"}calculada {sortBy === 'dosis' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {/* Filas */}
                  {filteredSortedHistoryAdvanced.map((pred, idx) => {
                    const fecha = pred.date ? format(toZonedTime(new Date(pred.date), 'America/Argentina/Buenos_Aires'), 'dd/MM HH:mm') : '-';
                    const cgmPrev = Array.isArray(pred.cgmPrev) && pred.cgmPrev.length > 0 ? pred.cgmPrev[0] : '-';
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.7}
                        style={[
                          tableStyles.rowSmall,
                          idx % 2 === 0 ? tableStyles.rowEvenSmall : tableStyles.rowOddSmall,
                        ]}
                        onPress={() => (navigation as any).navigate('PredictionResultPage', { result: pred })}
                      >
                        <Text style={tableStyles.tdSmall}>{fecha}</Text>
                        <Text style={tableStyles.tdSmall}>{cgmPrev}</Text>
                        <Text style={tableStyles.tdSmall}>{pred.recommendedDose}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

        </View>
      </ScrollView>
      <Footer />
      <PlotSelectorModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddPlot={addPlot}
      />
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
  header: {
    width: '100%',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
    paddingBottom: 12,
    paddingTop: 20,

  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 4,
    marginTop: 30,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333', // --text-primary
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280', // --text-secondary
    marginBottom: 16,
  },
  content: {
    padding: 16,
    paddingBottom: 80, // Space for footer
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