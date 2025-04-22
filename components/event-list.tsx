import { View, Text } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import tw from '../styles/theme';

interface Event {
  id: number
  type: string
  description: string
  timestamp: string
}

interface EventListProps {
  events: Event[]
}

export function EventList({ events }: EventListProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "exercise":
        return <Ionicons name="fitness-outline" size={20} color="#4CAF50" />
      case "medication":
        return <Ionicons name="water-outline" size={20} color="#3B82F6" />
      case "glucose":
        return <Ionicons name="water" size={20} color="#EF4444" />
      case "food":
        return <Ionicons name="restaurant-outline" size={20} color="#EAB308" />
      default:
        return <Ionicons name="ellipse-outline" size={20} color="#6B7280" />
    }
  }

  return (
    <View style={tw`gap-4`}>
      {events.map((event) => (
        <View key={event.id} style={tw`flex-row items-start gap-4`}>
          <View style={tw`bg-gray-100 p-2 rounded-full`}>
            {getEventIcon(event.type)}
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`font-medium text-text-primary`}>{event.description}</Text>
            <Text style={tw`text-sm text-text-secondary`}>{event.timestamp}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

