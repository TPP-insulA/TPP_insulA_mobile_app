import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChatUI } from '../components/chat-ui';
import { useAuth } from '../hooks/use-auth';

export function FullChatScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();

  return (
    <View style={styles.container}>
      <ChatUI
        isModal={false}
        onClose={() => navigation.goBack()}
        token={token}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
}); 