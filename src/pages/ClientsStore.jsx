// PaymentsHistoryPage.jsx
import React, { useEffect, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { rtdb } from "../firebase/config";
import { format, parseISO } from "date-fns";

const PaymentsHistoryPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [filteredClients, setFilteredClients] = useState([]);
  const [summaryByRecipient, setSummaryByRecipient] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [profit, setProfit] = useState(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualClient, setManualClient] = useState({
    fullName: "",
    phone: "",
    paymentAmount: "",
    paymentMethod: "cash",
    transferTo: ""
  });

  useEffect(() => {
    const clientsRef = ref(rtdb, "clients");
    const unsub = onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      const paid = list.filter(c => c.status === "paid" && c.paidAt);
      setClients(paid);

      const dates = [...new Set(paid.map(c => format(parseISO(c.paidAt), "yyyy-MM-dd")))].sort((a, b) => new Date(b) - new Date(a));
      setAvailableDates(dates);
      if (!selectedDate && dates.length > 0) setSelectedDate(dates[0]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const filtered = clients.filter(c => format(parseISO(c.paidAt), "yyyy-MM-dd") === selectedDate);
    setFilteredClients(filtered);

    const summary = {};
    let totalProfit = 0;
    filtered.forEach(c => {
      const amount = Number(c.paymentAmount || 0);
      totalProfit += amount;
      if (c.paymentMethod === "transfer" && c.transferTo) {
        summary[c.transferTo] = (summary[c.transferTo] || 0) + amount;
      }
    });
    setSummaryByRecipient(summary);
    setProfit(totalProfit);

    if (totalProfit > 0) {
      const summaryRef = ref(rtdb, `summary/byDate/${selectedDate}`);
      update(summaryRef, { profit: totalProfit });
    }
  }, [clients, selectedDate]);

  const handleManualAdd = async () => {
    const { fullName, phone, paymentAmount, paymentMethod, transferTo } = manualClient;
    if (!fullName || !paymentAmount || (paymentMethod === "transfer" && !transferTo)) {
      alert("Заполните все поля");
      return;
    }

    const newClient = {
      fullName,
      phone,
      paymentAmount,
      paymentMethod,
      transferTo: paymentMethod === "transfer" ? transferTo : "",
      paidAt: `${selectedDate}T12:00:00.000Z`,
      status: "paid"
    };

    const newRef = ref(rtdb, `clients/${Date.now()}`);
    await update(newRef, newClient);
    setManualModalOpen(false);
    setManualClient({ fullName: "", phone: "", paymentAmount: "", paymentMethod: "cash", transferTo: "" });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">История оплат</h2>

      {availableDates.length === 0 ? (
        <p className="text-gray-500">Нет данных об оплатах.</p>
      ) : (
        <>
          <button
            onClick={() => setManualModalOpen(true)}
            className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ➕ Добавить оплату вручную
          </button>

          <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="mb-4 w-full p-2 border rounded">
            {availableDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">Общая прибыль за день:</h3>
            {profit !== null ? (
              <p className="text-green-700 font-bold">💰 {profit.toLocaleString()}₽</p>
            ) : (
              <p className="text-sm text-gray-500">Нет прибыли.</p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Сводка переводов:</h3>
            {Object.keys(summaryByRecipient).length === 0 ? (
              <p className="text-sm text-gray-500">Нет переводов на эту дату.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {Object.entries(summaryByRecipient).map(([name, amount]) => (
                  <li key={name}>🔹 <strong>{name}</strong>: {amount.toLocaleString()}₽</li>
                ))}
              </ul>
            )}
          </div>

          <ul className="space-y-3">
            {filteredClients.map(c => (
              <li key={c.id} className="p-3 border rounded bg-green-50 text-green-900">
                <div className="font-medium">{c.fullName}</div>
                <div className="text-sm">Тел: {c.phone}</div>
                <div className="text-sm">Сумма: {c.paymentAmount}₽</div>
                <div className="text-sm">Дата оплаты: {format(parseISO(c.paidAt), "dd.MM.yyyy")}</div>
                {c.paymentMethod && (
                  <div className="text-sm">
                    Метод оплаты: <strong>{c.paymentMethod === "cash" ? "Наличные" : `Перевод на ${c.transferTo}`}</strong>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {manualModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-96 space-y-3">
            <h3 className="text-lg font-bold mb-2">Добавить оплату вручную</h3>
            <input type="text" placeholder="ФИО" value={manualClient.fullName} onChange={(e) => setManualClient({ ...manualClient, fullName: e.target.value })} className="w-full border px-3 py-2 rounded" />
            <input type="tel" placeholder="Телефон" value={manualClient.phone} onChange={(e) => setManualClient({ ...manualClient, phone: e.target.value })} className="w-full border px-3 py-2 rounded" />
            <input type="number" placeholder="Сумма" value={manualClient.paymentAmount} onChange={(e) => setManualClient({ ...manualClient, paymentAmount: e.target.value })} className="w-full border px-3 py-2 rounded" />
            <select value={manualClient.paymentMethod} onChange={(e) => setManualClient({ ...manualClient, paymentMethod: e.target.value })} className="w-full border px-3 py-2 rounded">
              <option value="cash">Наличные</option>
              <option value="transfer">Перевод</option>
            </select>
            {manualClient.paymentMethod === "transfer" && (
              <input type="text" placeholder="Кому перевод" value={manualClient.transferTo} onChange={(e) => setManualClient({ ...manualClient, transferTo: e.target.value })} className="w-full border px-3 py-2 rounded" />
            )}
            <div className="flex justify-between mt-4">
              <button onClick={handleManualAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Сохранить</button>
              <button onClick={() => setManualModalOpen(false)} className="text-gray-600 underline">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsHistoryPage;
