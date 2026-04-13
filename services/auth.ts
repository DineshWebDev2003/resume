import { auth } from './firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

let GoogleSignin: any = null;
try {
  // Use require for dynamic loading to prevent crash if native module isn't present
  const GoogleSigninModule = require('@react-native-google-signin/google-signin').GoogleSignin;
  GoogleSignin = GoogleSigninModule;
  
  GoogleSignin.configure({
    webClientId: '721103059213-s9ru15vv3kk302tahf97dl0k70sj6a4c.apps.googleusercontent.com',
    offlineAccess: true,
  });
} catch (e) {
  console.warn('GoogleSignin native module not found. Please rebuild your native app.');
}

export const signInWithGoogle = async () => {
  if (!GoogleSignin) {
    throw new Error('Google Sign-In is not supported in this environment. Please ensure you are using a development build with the Google Sign-In plugin.');
  }

  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    const idToken = userInfo.data?.idToken;
    if (!idToken) {
      throw new Error('No ID token found');
    }

    const googleCredential = GoogleAuthProvider.credential(idToken);
    return signInWithCredential(auth, googleCredential);
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const signOut = async () => {
  if (GoogleSignin) {
    try {
      await GoogleSignin.signOut();
      await auth.signOut();
    } catch (error) {
      console.error('Sign-Out Error:', error);
      throw error;
    }
  } else {
    await auth.signOut();
  }
};
