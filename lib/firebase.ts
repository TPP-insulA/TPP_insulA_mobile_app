import { initializeApp, getApp, getApps } from '@react-native-firebase/app';

// Initialize Firebase if it hasn't been initialized yet
const firebaseConfig = {
  projectId: 'insula-4b1ba',
  apiKey: 'AIzaSyApJ0Yy69I23eN52Wek_DXTGQFfSSe-e3c',
  databaseURL: 'https://insula-4b1ba-default-rtdb.firebaseio.com',
  storageBucket: 'insula-4b1ba.firebasestorage.app',
  messagingSenderId: '345938546990',
  appId: '1:345938546990:android:763af6c9aa6817ea51eabf'
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export default app; 