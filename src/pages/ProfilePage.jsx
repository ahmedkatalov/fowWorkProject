import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { logout } from "../redux/sliceClient";

const ProfilePage = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const handleLogout = () => {
    signOut(auth);
    dispatch(logout());
  };

  return (
    <div className="p-4 border rounded shadow bg-white max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Личный кабинет</h2>

      <div className="mb-4">
        <p><strong>Email:</strong> <span className="text-gray-800">{user.email}</span></p>
        <p><strong>Роль:</strong> <span className="text-blue-600 font-semibold">{user.role}</span></p>
      </div>

      {user.role === "admin" && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-700">Вы администратор. У вас есть расширенные права.</p>
        </div>
      )}

      {user.role !== "admin" && (
        <div className="mb-4 p-3 bg-yellow-50 rounded">
          <p className="text-sm text-yellow-800">Вы обычный пользователь.</p>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Выйти
      </button>
    </div>
  );
};

export default ProfilePage;
