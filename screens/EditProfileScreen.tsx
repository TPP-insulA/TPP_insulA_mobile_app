import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/use-auth';
import { updateUserProfile, UpdateProfileInput } from '../lib/api/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { User, UserCircle, Scale, Ruler, Calendar, Stethoscope, Save } from 'lucide-react-native';
import { AppHeader } from '../components/app-header';

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const { token, user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        weight: user?.weight?.toString() || '',
        height: user?.height?.toString() || '',
        diagnosisDate: user?.medicalInfo?.diagnosisDate || '',
        treatingDoctor: user?.medicalInfo?.treatingDoctor || '',
    });

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!token) return;

        try {
            setIsLoading(true);
            const updateData: UpdateProfileInput = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                weight: formData.weight ? parseFloat(formData.weight) : undefined,
                height: formData.height ? parseFloat(formData.height) : undefined,
                medicalInfo: {
                    diagnosisDate: formData.diagnosisDate,
                    treatingDoctor: formData.treatingDoctor,
                },
            };

            await updateUserProfile(updateData, token);
            Alert.alert(
                "Éxito",
                "Perfil actualizado correctamente",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'No se pudo actualizar el perfil');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title="Editar Perfil"
                icon={<User size={32} color="#fff" />}
                onBack={() => navigation.goBack()}
            />
            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <UserCircle size={20} color="#4b5563" />
                        <Text style={styles.sectionTitle}>Información Personal</Text>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.inputContainer}>
                            <View style={styles.labelContainer}>
                                <User size={16} color="#6b7280" />
                                <Text style={styles.label}>Nombre</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={formData.firstName}
                                onChangeText={(value) => handleChange('firstName', value)}
                                placeholder="Tu nombre"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.labelContainer}>
                                <User size={16} color="#6b7280" />
                                <Text style={styles.label}>Apellido</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={formData.lastName}
                                onChangeText={(value) => handleChange('lastName', value)}
                                placeholder="Tu apellido"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.labelContainer}>
                                <Scale size={16} color="#6b7280" />
                                <Text style={styles.label}>Peso (kg)</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={formData.weight}
                                onChangeText={(value) => handleChange('weight', value)}
                                placeholder="70"
                                keyboardType="numeric"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.labelContainer}>
                                <Ruler size={16} color="#6b7280" />
                                <Text style={styles.label}>Altura (cm)</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={formData.height}
                                onChangeText={(value) => handleChange('height', value)}
                                placeholder="170"
                                keyboardType="numeric"
                                editable={!isLoading}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Stethoscope size={20} color="#4b5563" />
                        <Text style={styles.sectionTitle}>Información Médica</Text>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.inputContainer}>
                            <View style={styles.labelContainer}>
                                <Calendar size={16} color="#6b7280" />
                                <Text style={styles.label}>Fecha de Diagnóstico</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.input}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.dateText}>{formData.diagnosisDate || 'Seleccionar fecha'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.labelContainer}>
                                <Stethoscope size={16} color="#6b7280" />
                                <Text style={styles.label}>Médico Tratante</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={formData.treatingDoctor}
                                onChangeText={(value) => handleChange('treatingDoctor', value)}
                                placeholder="Nombre del médico"
                                editable={!isLoading}
                            />
                        </View>
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    <Save size={20} color="white" />
                    <Text style={styles.saveButtonText}>
                        {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {showDatePicker && (
                <DateTimePicker
                    value={new Date(formData.diagnosisDate || Date.now())}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                            handleChange('diagnosisDate', selectedDate.toISOString().split('T')[0]);
                        }
                    }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f5',
    },
    content: {
        padding: 12,
    },
    section: {
        gap: 8,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    inputContainer: {
        marginBottom: 12,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
        color: '#111827',
        backgroundColor: '#ffffff',
    },
    dateText: {
        fontSize: 15,
        color: '#111827',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    saveButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
});