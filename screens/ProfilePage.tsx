import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Settings, User, Bell, ChevronRight, LogOut } from 'lucide-react-native';
import { Footer } from "../components/footer";
import { ProfilePhoto } from '../components/profile-photo';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { useAuth } from '../hooks/use-auth';
import { getUserProfile, updateProfileImage, ProfileResponse } from '../lib/api/auth';
import { LoadingSpinner } from '../components/loading-spinner';

type RootStackParamList = {
  Login: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Notifications: undefined;
};

export default function ProfilePage() {
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { token, logout } = useAuth();

    useEffect(() => {
        fetchProfileData();
    }, [token]);

    const fetchProfileData = async () => {
        if (!token) return;
        
        try {
            setIsLoading(true);
            const data = await getUserProfile(token);
            setProfileData(data);
            if (data.imageUrl) {
                setProfileImage(data.imageUrl);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            Alert.alert('Error', 'No se pudo cargar el perfil');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = async (newImageUrl: string) => {
        if (!token) return;
        
        try {
            await updateProfileImage(newImageUrl, token);
            setProfileImage(newImageUrl);
        } catch (error) {
            console.error('Error updating profile image:', error);
            Alert.alert('Error', 'No se pudo actualizar la imagen de perfil');
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigation.navigate('Login');
        } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Error', 'No se pudo cerrar la sesión');
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <LoadingSpinner color="#4CAF50" text="Cargando perfil..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.content}>
                    <View style={styles.profileSection}>
                        <ProfilePhoto 
                            imageUri={profileImage} 
                            onImageChange={handleImageChange}
                        />
                        <View style={styles.profileInfo}>
                            <Text style={styles.name}>
                                {profileData ? `${profileData.firstName} ${profileData.lastName}` : 'Usuario'}
                            </Text>
                            <Text style={styles.email}>{profileData?.email}</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Información Personal</Text>
                        <View style={styles.card}>
                            <TouchableOpacity 
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('EditProfile')}
                            >
                                <View style={styles.menuItemLeft}>
                                    <User size={20} color="#6b7280" />
                                    <Text style={styles.menuItemText}>Editar Perfil</Text>
                                </View>
                                <ChevronRight size={20} color="#6b7280" />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('Settings')}
                            >
                                <View style={styles.menuItemLeft}>
                                    <Settings size={20} color="#6b7280" />
                                    <Text style={styles.menuItemText}>Preferencias</Text>
                                </View>
                                <ChevronRight size={20} color="#6b7280" />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.menuItem}
                                onPress={() => navigation.navigate('Notifications')}
                            >
                                <View style={styles.menuItemLeft}>
                                    <Bell size={20} color="#6b7280" />
                                    <Text style={styles.menuItemText}>Notificaciones</Text>
                                </View>
                                <ChevronRight size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Datos Médicos</Text>
                        <View style={styles.card}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Tipo de Diabetes</Text>
                                <Text style={styles.infoValue}>
                                    {profileData?.medicalInfo?.diabetesType === 'type1' ? 'Tipo 1' : '-'}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>Fecha de Diagnóstico</Text>
                              <Text style={styles.infoValue}>
                                {profileData?.medicalInfo?.diagnosisDate 
                                  ? new Date(profileData.medicalInfo.diagnosisDate).toLocaleDateString('es-ES')
                                  : '-'}
                              </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Médico Tratante</Text>
                                <Text style={styles.infoValue}>
                                    {profileData?.medicalInfo?.treatingDoctor || '-'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <LogOut size={20} color="#dc2626" />
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <Footer />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f5',
    },
    header: {
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        padding: 16,
        gap: 24,
    },
    profileSection: {
        marginTop:25,
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    profileInfo: {
        alignItems: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: '#6b7280',
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
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuItemText: {
        fontSize: 16,
        color: '#111827',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    infoLabel: {
        fontSize: 16,
        color: '#6b7280',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#fee2e2',
        borderRadius: 8,
        gap: 8,
    },
    logoutText: {
        color: '#dc2626',
        fontSize: 16,
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

