import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { ChatUI } from './chat-ui';

export function ChatInterface({
  isOpen,
  onClose,
  token,
  initialMessage,
}: {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  initialMessage?: string;
}) {
  return (
    <Modal visible={isOpen} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <ChatUI
          isModal={true}
          onClose={onClose}
          token={token}
          initialMessage={initialMessage}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
});
