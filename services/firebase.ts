import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBhtT26rqkVAOCvvyPAhUjWdQYPe-7iobY",
  authDomain: "resume-app-a3c51.firebaseapp.com",
  projectId: "resume-app-a3c51",
  storageBucket: "resume-app-a3c51.firebasestorage.app",
  messagingSenderId: "721103059213",
  appId: "1:721103059213:android:ce8216ce07e899f1c09844"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export default app;
