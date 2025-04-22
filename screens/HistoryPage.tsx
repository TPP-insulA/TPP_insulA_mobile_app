import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
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
  const [plots, setPlots] = useState<Plot[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const addPlot = (plot: Omit<Plot, 'id'>) => {
    setPlots([...plots, { ...plot, id: Date.now() }]);
  };

  const removePlot = (id: number) => {
    setPlots(plots.filter((plot) => plot.id !== id));
  };

  const renderPlot = (plot: Plot) => {
    switch (plot.type) {
      case 'glucose':
        return (
          <GlucoseTrendsChart
            data={mockGlucoseData}
            timeRange={plot.timeRange}
          />
        );
      case 'daily_pattern':
        return <DailyPatternChart data={mockDailyPatternData} />;
      case 'glucose_meals':
        return (
          <GlucoseWithMealsChart
            data={mockGlucoseData}
            meals={mockEvents.filter((e) => e.type === 'meal')}
            timeRange={plot.timeRange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
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
                  <EventList events={mockEvents} />
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
});