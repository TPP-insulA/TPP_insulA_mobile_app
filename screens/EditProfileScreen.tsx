import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/use-auth';
import { updateUserProfile, UpdateProfileInput } from '../lib/api/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BackButton } from '../components/back-button';
import { User } from 'lucide-react-native';

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
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <BackButton />
                    </TouchableOpacity>
                    <User width={32} height={32} color="#4CAF50" />
                    <Text style={styles.title}>Editar Perfil</Text>
                </View>
            </View>
            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información Personal</Text>
                    <View style={styles.card}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nombre</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.firstName}
                                onChangeText={(value) => handleChange('firstName', value)}
                                placeholder="Tu nombre"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Apellido</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.lastName}
                                onChangeText={(value) => handleChange('lastName', value)}
                                placeholder="Tu apellido"
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Peso (kg)</Text>
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
                            <Text style={styles.label}>Altura (cm)</Text>
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
                    <Text style={styles.sectionTitle}>Información Médica</Text>
                    <View style={styles.card}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Fecha de Diagnóstico</Text>
                            <TouchableOpacity
                                style={styles.input}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text>{formData.diagnosisDate || 'Seleccionar fecha'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Médico Tratante</Text>
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
    header: {
        width: '100%',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
        position: 'relative',
        width: '100%',
        justifyContent: 'center',
        paddingVertical: 8,
        marginTop: 30,
    },
    backButton: {
        position: 'absolute',
        left: 0,
        zIndex: 1,
        alignSelf: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        padding: 16,
        paddingTop: 24,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#ffffff',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 32,
        shadowColor: '#4CAF50',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    saveButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
        elevation: 0,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});