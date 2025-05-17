import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bell } from 'lucide-react-native';
import { BackButton } from '../components/back-button';
import { AppHeader } from '../components/app-header';
import { Footer } from '../components/footer';

// Placeholder notification data
const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        title: 'Recordatorio de medición',
        message: 'Es hora de medir tu nivel de glucosa',
        timestamp: '2025-04-22T10:00:00Z',
        read: false,
        type: 'reminder'
    },
    {
        id: '2',
        title: 'Nivel de glucosa alto',
        message: 'Tu última medición muestra niveles elevados de glucosa',
        timestamp: '2025-04-22T09:30:00Z',
        read: true,
        type: 'alert'
    },
    {
        id: '3',
        title: 'Nueva recomendación',
        message: 'Tienes una nueva recomendación de ajuste de dosis',
        timestamp: '2025-04-21T15:45:00Z',
        read: true,
        type: 'recommendation'
    }
];

interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    type: 'reminder' | 'alert' | 'recommendation';
}

export default function NotificationsScreen() {
    const navigation = useNavigation();

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity 
            style={[
                styles.notificationItem,
                !item.read && styles.unreadNotification
            ]}
        >
            <View style={styles.notificationIcon}>
                <Bell 
                    size={24} 
                    color={item.type === 'alert' ? '#EF4444' : '#4CAF50'}
                />
            </View>
            <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.notificationTime}>
                    {formatTimestamp(item.timestamp)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title="Notificaciones"
                icon={<Bell size={28} color="#fff" />}
                onBack={() => navigation.goBack()}
            />
            <FlatList
                data={MOCK_NOTIFICATIONS}
                renderItem={renderNotification}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <Footer />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f5',
    },
    notificationsList: {
        padding: 16,
    },
    notificationItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    unreadNotification: {
        backgroundColor: '#f0fdf4',
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 8,
    },
    notificationTime: {
        fontSize: 12,
        color: '#6b7280',
    },
    separator: {
        height: 12,
    },
});