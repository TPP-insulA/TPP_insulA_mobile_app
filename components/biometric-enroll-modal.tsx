import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  Image 
} from 'react-native';
import { Fingerprint, ScanFace } from 'lucide-react-native';

interface BiometricEnrollModalProps {
  visible: boolean;
  biometricType: 'TouchID' | 'FaceID' | 'Biometrics' | null;
  onAccept: () => void;
  onReject: () => void;
}

export const BiometricEnrollModal: React.FC<BiometricEnrollModalProps> = ({
  visible,
  biometricType,
  onAccept,
  onReject,
}) => {
  const getIcon = () => {
    switch (biometricType) {
      case 'TouchID':
        return <Fingerprint size={48} color="#4CAF50" />;
      case 'FaceID':
        return <ScanFace size={48} color="#4CAF50" />;
      default:
        return <Fingerprint size={48} color="#4CAF50" />;
    }
  };

  const getBiometricName = () => {
    switch (biometricType) {
      case 'TouchID':
        return 'Touch ID';
      case 'FaceID':
        return 'Face ID';
      default:
        return 'Biometría';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          
          <Text style={styles.title}>Acceso Rápido y Seguro</Text>
          
          <Text style={styles.description}>
            ¿Quieres usar {getBiometricName()} para iniciar sesión más rápido la próxima vez?
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.rejectButton]} 
              onPress={onReject}
            >
              <Text style={styles.rejectButtonText}>Ahora No</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
            >
              <Text style={styles.acceptButtonText}>Activar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  rejectButton: {
    backgroundColor: '#f3f4f6',
  },
  rejectButtonText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 16,
  },
});
