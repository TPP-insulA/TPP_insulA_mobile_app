import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface GlucoseData {
  time: string;
  glucose: number;
}

interface Meal {
  id: number;
  timestamp: string;
  description: string;
  type: string;
  carbs?: number;
  items?: string[];
}

interface GlucoseWithMealsChartProps {
  data: GlucoseData[];
  meals?: Meal[];
  timeRange: string;
}

export default function GlucoseWithMealsChart({
  data,
  meals = [],
  timeRange,
}: GlucoseWithMealsChartProps) {
  const screenWidth = Dimensions.get('window').width - 64;

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: 4,
      strokeWidth: 2,
      stroke: '#4CAF50',
    },
    propsForVerticalLabels: {
      fontSize: 10,
      rotation: 0,
      fontWeight: '500',
    },
    propsForHorizontalLabels: {
      fontSize: 10,
      fontWeight: '500',
    },
  };

  // Find meal times that match with glucose readings
  const mealTimes = meals.map(meal => {
    const mealTime = new Date(meal.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const dataIndex = data.findIndex(d => d.time === mealTime);
    return { 
      ...meal, 
      dataIndex,
      glucoseValue: dataIndex >= 0 ? data[dataIndex].glucose : null 
    };
  }).filter(meal => meal.dataIndex >= 0);

  const chartData = {
    labels: data.map(d => d.time),
    datasets: [
      {
        data: data.map(d => d.glucose),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      },
      // Add target range guidelines
      {
        data: Array(data.length).fill(140),
        color: (opacity = 1) => `rgba(249, 115, 22, ${opacity * 0.3})`,
        strokeWidth: 1,
      },
      {
        data: Array(data.length).fill(70),
        color: (opacity = 1) => `rgba(249, 115, 22, ${opacity * 0.3})`,
        strokeWidth: 1,
      }
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.targetRangeText}>Rango objetivo: 70-140 mg/dL</Text>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withVerticalLines={false}
        withHorizontalLines={true}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        withInnerLines={true}
        yAxisInterval={50}
        yAxisSuffix=" mg/dL"
        segments={5}
      />
      {meals.length > 0 && (
        <View style={styles.mealsContainer}>
          <Text style={styles.mealsTitle}>Comidas</Text>
          {meals.map((meal) => (
            <View key={meal.id} style={styles.mealItem}>
              <Text style={styles.mealTime}>
                {new Date(meal.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
              <View style={styles.mealInfoContainer}>
                <Text style={styles.mealDescription}>{meal.description}</Text>
                {meal.carbs && (
                  <Text style={styles.mealCarbs}>{meal.carbs}g carbohidratos</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  targetRangeText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  mealsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  mealsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  mealTime: {
    width: 60,
    fontSize: 14,
    color: '#6b7280',
  },
  mealInfoContainer: {
    flex: 1,
  },
  mealDescription: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  mealCarbs: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
});