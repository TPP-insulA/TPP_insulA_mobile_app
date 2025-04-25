import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface GlucoseTrendsChartProps {
  data: Array<{ time: string; glucose: number }>;
  timeRange: string;
}

export function GlucoseTrendsChart({ data, timeRange }: GlucoseTrendsChartProps) {
  const screenWidth = Dimensions.get("window").width - 40;

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#4CAF50",
      strokeOpacity: 0.9
    },
    propsForVerticalLabels: {
      fontSize: 10,
      rotation: 0,
      fontWeight: '500'
    },
    propsForHorizontalLabels: {
      fontSize: 10,
      fontWeight: '500'
    }
  };

  // Format x-axis labels based on the time range
  const labels = data.map(item => {
    const timeParts = item.time.split(':');
    return timeParts[0] + ':' + timeParts[1]; // Show HH:mm
  });

  const chartData = {
    labels,
    datasets: [
      {
        data: data.map(item => item.glucose),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2
      },
      // Add target range guidelines
      {
        data: Array(data.length).fill(140), // Upper target line
        color: (opacity = 1) => `rgba(249, 115, 22, ${opacity * 0.5})`,
        strokeWidth: 1,
        withDots: false
      },
      {
        data: Array(data.length).fill(70), // Lower target line
        color: (opacity = 1) => `rgba(249, 115, 22, ${opacity * 0.5})`,
        strokeWidth: 1,
        withDots: false
      }
    ],
    legend: ["Glucosa", "Límite alto", "Límite bajo"]
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
  }
});

