import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  browserLocalPersistence,
  GoogleAuthProvider
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC5BFittJw8l8Gvg1Nk5udOrKjA-1hIpz8",
  authDomain: "aiuda-app.firebaseapp.com",
  projectId: "aiuda-app",
  storageBucket: "aiuda-app.appspot.com",
  messagingSenderId: "595995285201",
  appId: "1:595995285201:web:5eba8c9508d56d8cbcd7f0",
  measurementId: "G-Q64HVDPK46"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };