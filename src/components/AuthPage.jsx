import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/sliceClient";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase/config";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [mode, setMode] = useState("login");
  const dispatch = useDispatch();

  const clearFields = () => {
    setEmail("");
    setPassword("");
    setRole("user");
  };

  const handleRegister = async () => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    localStorage.setItem("role", role);
    dispatch(setUser({ uid: userCred.user.uid, email, role }));
    clearFields();
  };

  const handleLogin = async () => {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const savedRole = localStorage.getItem("role") || "user";
    dispatch(setUser({ uid: userCred.user.uid, email, role: savedRole }));
    clearFields();
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded-lg mt-10">
      <h2 className="text-2xl font-semibold text-center mb-6">
        {mode === "login" ? "Вход" : "Регистрация"}
      </h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {mode === "register" && (
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 border rounded mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="teacher">Teacher</option>
        </select>
      )}

      <div className="flex gap-2 mb-4">
        {mode === "register" ? (
          <button
            onClick={handleRegister}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Зарегистрироваться
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Войти
          </button>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button
            className="text-blue-600 hover:underline"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
