import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import GlucoseChart from '../components/glucose-chart';
import { BloodGlucoseChart } from '../components/blood-glucose-chart';

// Mock data for the charts with correct format
const mockGlucoseData = Array.from({ length: 24 }, (_, i) => ({
  id: `reading-${i}`,
  timestamp: `2025-04-09 ${i}:00:00`,
  value: Math.random() * 100 + 80
}));

const mockBloodGlucoseData = Array.from({ length: 24 }, (_, i) => ({
  date: `2025-04-09 ${i}:00:00`,
  glucose: Math.random() * 100 + 80
}));

const targetRange = {
  min: 70,
  max: 180
};

export default function TrendsPage() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Análisis de Tendencias</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Glucosa en el Tiempo</Text>
            <View style={styles.card}>
              <GlucoseChart 
                data={mockGlucoseData}
                title="Niveles de Glucosa"
                targetRange={targetRange}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribución de Glucosa</Text>
            <View style={styles.card}>
              <BloodGlucoseChart 
                data={mockBloodGlucoseData}
                timeRange="24h"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estadísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Promedio</Text>
                <Text style={styles.statValue}>120 mg/dL</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Tiempo en Rango</Text>
                <Text style={styles.statValue}>75%</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Variabilidad</Text>
                <Text style={styles.statValue}>32%</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Lecturas/día</Text>
                <Text style={styles.statValue}>12</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  header: {
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 30,
    paddingVertical: 4,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
});

