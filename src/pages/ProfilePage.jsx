// ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { signOut } from "firebase/auth";
import { auth, rtdb } from "../firebase/config";
import { logout } from "../redux/sliceClient";
import { ref, onValue, set, remove } from "firebase/database";
import { isToday, parseISO, format } from "date-fns";
import * as XLSX from "xlsx";

const ProfilePage = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [clients, setClients] = useState([]);
  const [profitHistory, setProfitHistory] = useState({});
  const [selectedDate, setSelectedDate] = useState("");

  const handleLogout = () => {
    signOut(auth);
    dispatch(logout());
  };

  const getValidAmount = (val) => {
    const num = Number(val);
    return isNaN(num) || num <= 0 ? 0 : num;
  };

  // 📥 Загрузка клиентов
  useEffect(() => {
    const clientsRef = ref(rtdb, "clients");
    const unsubscribe = onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setClients(list);
      } else {
        setClients([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 📤 Сохраняем прибыль/долг за сегодня
  useEffect(() => {
    if (user.role !== "admin" || clients.length === 0) return;

    const today = format(new Date(), "yyyy-MM-dd");

    let initialDebt = 0;
    let paidToday = 0;

    for (const c of clients) {
      if (!c.createdAt) continue;
      let date;
      try {
        date = parseISO(c.createdAt);
      } catch {
        continue;
      }
      if (!isToday(date)) continue;

      const amount = getValidAmount(c.paymentAmount);
      if (c.status === "paid") paidToday += amount;
      initialDebt += amount;
    }

    const profitRef = ref(rtdb, `profitHistory/${today}`);
    set(profitRef, {
      profit: paidToday,
      debt: initialDebt,
    });
  }, [clients, user.role]);

  // 📚 Загрузка истории
  useEffect(() => {
    const historyRef = ref(rtdb, "profitHistory");
    const unsub = onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {};
      setProfitHistory(data);

      if (!selectedDate && Object.keys(data).length > 0) {
        const latest = Object.keys(data).sort().reverse()[0];
        setSelectedDate(latest);
      }
    });
    return () => unsub();
  }, [selectedDate]);

  // 📊 Статистика из истории
  const totalProfit = Object.values(profitHistory).reduce(
    (sum, d) => sum + getValidAmount(d.profit),
    0
  );

  // 💰 Фактическая текущая задолженность по всем клиентам
  const totalCurrentDebt = clients.reduce((sum, c) => {
    const isPaid = c.status === "paid";
    return isPaid ? sum : sum + getValidAmount(c.paymentAmount);
  }, 0);

  const handleClearHistory = () => {
    if (!window.confirm("Удалить всю историю?")) return;
    remove(ref(rtdb, "profitHistory"))
      .then(() => {
        setProfitHistory({});
        setSelectedDate("");
      })
      .catch(() => alert("Ошибка удаления истории."));
  };

  const handleExportToExcel = () => {
    const rows = Object.entries(profitHistory).map(([date, val]) => {
      const debt = getValidAmount(val?.debt);
      const profit = getValidAmount(val?.profit);
      return {
        Дата: date,
        "Было в долге": debt,
        "Вернули": profit,
        "Осталось": debt - profit,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "История");
    XLSX.writeFile(wb, "История_прибыли.xlsx");
  };

  const selectedEntry = profitHistory[selectedDate] || {};
  const entryDebt = getValidAmount(selectedEntry?.debt);
  const entryProfit = getValidAmount(selectedEntry?.profit);
  const entryRemaining = entryDebt - entryProfit;

  return (
    <div className="p-4 border rounded shadow bg-white max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Личный кабинет</h2>

      <div className="mb-4">
        <p><strong>Email:</strong> <span className="text-gray-800">{user.email}</span></p>
        <p><strong>Роль:</strong> <span className="text-blue-600 font-semibold">{user.role}</span></p>
      </div>

      {user.role === "admin" && (
        <>
          <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
            <p className="text-blue-700">Вы администратор. У вас есть расширенные права.</p>
          </div>

          <div className="mb-6 space-y-3 text-sm">
            <div className="p-3 bg-red-50 rounded text-red-800">
              💸 <strong>Общая задолженность (в реальном времени):</strong> {totalCurrentDebt.toLocaleString()}₽
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">📊 История по дням</h3>
            {Object.keys(profitHistory).length === 0 ? (
              <p className="text-gray-500 text-sm">Нет данных по истории.</p>
            ) : (
              <>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mb-3 p-2 border rounded text-sm w-full"
                >
                  {Object.keys(profitHistory).sort().reverse().map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={handleClearHistory}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                  >
                    🗑 Очистить всю историю
                  </button>
                  <button
                    onClick={handleExportToExcel}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm"
                  >
                    📥 Экспорт в Excel
                  </button>
                </div>

                <div className="p-3 bg-blue-50 rounded text-blue-700 text-sm">
                  📅 <strong>{selectedDate}</strong><br />
                  💼 Было в долге: {entryDebt.toLocaleString()}₽<br />
                  ✅ Вернули: {entryProfit.toLocaleString()}₽<br />
                  📉 Осталось: {entryRemaining.toLocaleString()}₽
                </div>
              </>
            )}
          </div>
        </>
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
