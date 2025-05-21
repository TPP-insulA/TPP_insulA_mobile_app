import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Settings, User, Bell, ChevronRight, LogOut, ClipboardList, Stethoscope } from 'lucide-react-native';
import { Footer } from "../components/footer";
import { ProfilePhoto } from '../components/profile-photo';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { useAuth } from '../hooks/use-auth';
import { getUserProfile, updateProfileImage, ProfileResponse, API_URL } from '../lib/api/auth';
import { LoadingSpinner } from '../components/loading-spinner';
import Feather from 'react-native-vector-icons/Feather';
import * as FileSystem from 'expo-file-system';

type RootStackParamList = {
  Login: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Notifications: undefined;
};

export default function ProfilePage() {    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<ProfileResponse | null>(null);    const [isLoading, setIsLoading] = useState(true);
    // Removed unused showDropdown state
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
            if (data.profileImage) {
                setProfileImage(data.profileImage);
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
        
        if (!newImageUrl) {
            Alert.alert('Error', 'No se pudo obtener la imagen');
            return;
        }

        try {
            // Read the file and convert it to base64
            const base64 = await FileSystem.readAsStringAsync(newImageUrl, {
                encoding: FileSystem.EncodingType.Base64,
            });
            
            // Create the data URI with a shorter prefix
            const imageUrl = `data:image/jpeg;base64,${base64}`;
            
            // Send only the first 100 characters of the base64 string in logs
            console.log('Sending image update...', {
                base64Preview: base64.substring(0, 100) + '...',
                totalLength: base64.length
            });
            
            // Update the profile image
            const response = await updateProfileImage(imageUrl, token);
            
            // Update local state with the image URL from the response
            if (response.profileImage) {
                setProfileImage(response.profileImage);
            } else {
                setProfileImage(imageUrl);
            }
        } catch (error) {
            console.error('Error updating profile image:', error instanceof Error ? error.message : 'Unknown error');
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
            {/* Botón Volver arriba a la izquierda */}
            <View style={{ position: 'absolute', top: 14, left: 10, zIndex: 10 }}>
                <TouchableOpacity
                    style={[
                        {
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            backgroundColor: '#2e7d32',
                            borderRadius: 18,
                            paddingVertical: 4,
                            paddingHorizontal: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.18,
                            shadowRadius: 2,
                            elevation: 3,
                            borderWidth: 1.5,
                            borderColor: '#fff',
                        },
                    ]}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.85}
                >
                    <Feather name="arrow-left" size={16} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, letterSpacing: 0.1 }}>Volver</Text>
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <View style={styles.profileSection}>
                        <View>
                            <ProfilePhoto 
                                imageUri={profileImage} 
                                onImageChange={handleImageChange}
                            />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.name}>
                                {profileData ? `${profileData.firstName} ${profileData.lastName}` : 'Usuario'}
                            </Text>
                            <Text style={styles.email}>
                                {profileData?.email || ''}
                            </Text>
                            <TouchableOpacity 
                                style={styles.logoutButton}
                                onPress={handleLogout}
                            >
                                <LogOut size={20} color="#dc2626" />
                                <Text style={styles.logoutButtonText}>
                                    Cerrar Sesión
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <ClipboardList size={24} color="#4b5563" />
                            <Text style={styles.sectionTitle}>Información Personal</Text>
                        </View>
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
                        <View style={styles.sectionHeader}>
                            <Stethoscope size={24} color="#4b5563" />
                            <Text style={styles.sectionTitle}>Datos Médicos</Text>
                        </View>
                        <View style={styles.card}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Tipo de Diabetes</Text>
                                <Text style={styles.infoValue}>
                                    {profileData?.medicalInfo?.diabetesType === 'type1' ? 'Tipo 1' : '-'}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>
                                    Fecha de Diagnóstico
                                </Text>
                                <Text style={styles.infoValue}>
                                    {profileData?.medicalInfo?.diagnosisDate 
                                        ? new Date(profileData.medicalInfo.diagnosisDate).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })
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
                </View>
            </ScrollView>
            <Footer />
        </SafeAreaView>
    );
}

// Clean up unnecessary showDropdown state since we're not using dropdown anymore
ProfilePage.displayName = 'ProfilePage';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f5',
    },
    scrollContent: {
        flexGrow: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
        position: 'relative',
        width: '100%',
        justifyContent: 'center',
        paddingVertical: 4,
        marginTop: 30,
    },
    content: {
        padding: 12,
        gap: 16,
    },
    profileSection: {
        marginTop: 35,
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
        marginTop: 12,
        borderWidth: 1.5,
        borderColor: '#dc2626',
    },
    logoutButtonText: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '500',
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
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    email: {
        fontSize: 15,
        color: '#6b7280',
    },
    section: {
        gap: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 4,
        width: '100%',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuItemText: {
        fontSize: 15,
        color: '#111827',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    infoLabel: {
        fontSize: 15,
        color: '#6b7280',
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
        color: '#111827',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

