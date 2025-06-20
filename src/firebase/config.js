// 📁 src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// ✅ Реальная конфигурация Firebase (из твоей консоли)
const firebaseConfig = {
  apiKey: "AIzaSyBrSH5n-tEgXItWI0J1BNLTRspabHOMo5Q",
  authDomain: "barru-959595.firebaseapp.com",
  databaseURL: "https://barru-959595-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "barru-959595",
  storageBucket: "barru-959595.appspot.com", // Исправлено: правильный адрес storage
  messagingSenderId: "770466108654",
  appId: "1:770466108654:web:fcb43e50d28719cfc20fff",
  measurementId: "G-R8SM0BPSRQ"
};

// ✅ Инициализация Firebase
const app = initializeApp(firebaseConfig);

// ✅ Экспорт необходимых сервисов
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const analytics = getAnalytics(app); // по желанию
