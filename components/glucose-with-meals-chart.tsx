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
  meals: Meal[];
  timeRange: string;
}

export default function GlucoseWithMealsChart({
  data,
  meals,
  timeRange,
}: GlucoseWithMealsChartProps) {
  const screenWidth = Dimensions.get('window').width - 64; // Accounting for padding

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#4CAF50',
    },
  };

  const chartData = {
    labels: data.map(d => d.time),
    datasets: [
      {
        data: data.map(d => d.glucose),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    // Add vertical lines for meals
    legend: meals.map(meal => meal.description),
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
      <View style={styles.mealsContainer}>
        {meals.map((meal) => (
          <View key={meal.id} style={styles.mealItem}>
            <Text style={styles.mealTime}>{meal.timestamp}</Text>
            <Text style={styles.mealDescription}>{meal.description}</Text>
            {meal.carbs && (
              <Text style={styles.mealCarbs}>{meal.carbs}g carbs</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  mealsContainer: {
    marginTop: 16,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  mealTime: {
    width: 60,
    fontSize: 14,
    color: '#6b7280',
  },
  mealDescription: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    marginHorizontal: 8,
  },
  mealCarbs: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
});