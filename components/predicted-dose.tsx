import React from 'react';
import { View, Text } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { tw } from '../styles/theme';

interface PredictedDoseProps {
  dose: number
}

export function PredictedDose({ dose }: PredictedDoseProps) {
  return (
    <View style={tw`flex-row items-center justify-center gap-4`}>
      <View style={tw`bg-apple-green/10 p-3 rounded-full`}>
        <Ionicons name="medical-outline" size={32} color="#4CAF50" />
      </View>
      <View>
        <Text style={tw`text-sm text-text-secondary`}>Dosis sugerida</Text>
        <Text style={tw`text-3xl font-bold text-text-primary`}>{dose}U</Text>
      </View>
    </View>
  );
}

