// 📁 src/App.jsx
import React, { useEffect, useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";
import TodayClients from "./pages/TodayClients";
import OverdueClients from "./pages/OverdueClients";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./components/AuthPage";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "./redux/store";
import { onAuthStateChanged } from "firebase/auth";
import { auth, rtdb } from "./firebase/config";
import { setUser, logout } from "./redux/sliceClient";
import { ref, get } from "firebase/database";

// 📦 Основная разметка навигации и маршрутов
const Layout = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <nav className="flex gap-4 mb-6 flex-wrap">
        <NavLink
          to="/today"
          className={({ isActive }) =>
            isActive
              ? "font-semibold text-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }
        >
          Сегодня
        </NavLink>
        <NavLink
          to="/overdue"
          className={({ isActive }) =>
            isActive
              ? "font-semibold text-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }
        >
          Просроченные
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive
              ? "font-semibold text-blue-600"
              : "text-gray-600 hover:text-blue-600"
          }
        >
          Профиль
        </NavLink>
      </nav>

      <Routes>
        <Route path="/today" element={<TodayClients />} />
        <Route path="/overdue" element={<OverdueClients />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<TodayClients />} />
      </Routes>
    </div>
  );
};

// 🔁 Обёртка с логикой аутентификации и восстановлением роли
const AppWrapper = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const uid = firebaseUser.uid;
          const roleSnap = await get(ref(rtdb, `users/${uid}/role`));
          const role = roleSnap.exists() ? roleSnap.val() : "user";

          dispatch(
            setUser({
              uid,
              email: firebaseUser.email,
              role,
            })
          );
        } catch (e) {
          console.error("Ошибка при получении роли:", e);
          dispatch(
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: "user",
            })
          );
        }
      } else {
        dispatch(logout());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return user?.email ? <Layout /> : <AuthPage />;
};

// 🧰 Главный компонент
const App = () => (
  <Provider store={store}>
    <Router>
      <AppWrapper />
    </Router>
  </Provider>
);

export default App;