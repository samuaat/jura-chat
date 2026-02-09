import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCfE1H3Q45XHrmw1Jgk4UiKamZHFal0QQA",
  authDomain: "jura-v2.firebaseapp.com",
  projectId: "jura-v2",
  storageBucket: "jura-v2.firebasestorage.app",
  messagingSenderId: "964528236444",
  appId: "1:964528236444:web:cae20616cac15785968a59",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
