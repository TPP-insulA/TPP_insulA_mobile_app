import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';

interface ProfilePhotoProps {
    imageUri: string | null;
    onImageChange: (uri: string) => void;
}

export function ProfilePhoto({ imageUri, onImageChange }: ProfilePhotoProps) {
    const pickImage = async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para cambiar la foto de perfil.');
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0].uri) {
                // Here you would typically upload the image to your server first
                // For now, we'll just pass the local URI
                onImageChange(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'No se pudo seleccionar la imagen');
        }
    };

    return (
        <TouchableOpacity onPress={pickImage} style={styles.container}>
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
                <View style={styles.placeholderContainer}>
                    <Camera size={40} color="#9ca3af" />
                </View>
            )}
            <View style={styles.editBadge}>
                <Camera size={16} color="white" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: 100,
        height: 100,
        marginBottom: 16,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    editBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: '#4CAF50',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
});