import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlucoseTrendsChart } from '../components/glucose-trends-chart';
import DailyPatternChart from '../components/daily-pattern-chart';
import { EventList } from '../components/event-list';
import { Footer } from '../components/footer';
import { BackButton } from '../components/back-button';
import { useNavigation } from '@react-navigation/native';
import { Activity, Plus, ListChecks } from 'lucide-react-native';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion-native';
import PlotSelectorModal from '../components/plot-selector-modal';
import GlucoseWithMealsChart from '../components/glucose-with-meals-chart';
import { LoadingSpinner } from '../components/loading-spinner';
import { API_URL } from '../lib/api/auth';
import { useAuth } from '../hooks/use-auth';

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
  const { token, isAuthenticated } = useAuth();
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

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      ...plots.map(plot => fetchData(plot)),
      fetchEvents()
    ]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchEvents();
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

          <Accordion>
            <AccordionItem value="events">
              <AccordionTrigger>
                <View style={styles.accordionHeader}>
                  <ListChecks size={20} color="#6b7280" />
                  <Text style={styles.sectionTitle}>Eventos Recientes</Text>
                </View>
              </AccordionTrigger>
              <AccordionContent>
                <View style={styles.card}>
                  <EventList events={events} />
                </View>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
});