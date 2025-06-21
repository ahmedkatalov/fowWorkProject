import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase/config";
import { format, parseISO } from "date-fns";

const PaymentsHistoryPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [filteredClients, setFilteredClients] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);

  useEffect(() => {
    const clientsRef = ref(rtdb, "clients");
    const unsubscribe = onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const clientList = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      const paidClients = clientList.filter((c) => c.status === "paid" && c.paidAt);

      setClients(paidClients);

      const uniqueDates = [
        ...new Set(
          paidClients.map((c) => format(parseISO(c.paidAt), "yyyy-MM-dd"))
        ),
      ];
      uniqueDates.sort((a, b) => new Date(b) - new Date(a));

      setAvailableDates(uniqueDates);

      if (!selectedDate && uniqueDates.length > 0) {
        setSelectedDate(uniqueDates[0]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const filtered = clients.filter(
      (c) => format(parseISO(c.paidAt), "yyyy-MM-dd") === selectedDate
    );
    setFilteredClients(filtered);
  }, [clients, selectedDate]);

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">История оплат</h2>

      {availableDates.length === 0 ? (
        <p className="text-gray-500 text-sm">Нет данных об оплатах.</p>
      ) : (
        <>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mb-4 w-full p-2 border rounded"
          >
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>

          <ul className="space-y-3">
            {filteredClients.map((c) => (
              <li
                key={c.id}
                className="p-3 border rounded bg-green-50 text-green-900"
              >
                <div className="font-medium">{c.fullName}</div>
                <div className="text-sm">Тел: {c.phone}</div>
                <div className="text-sm">Сумма: {c.paymentAmount}₽</div>
                <div className="text-sm">Дата оплаты: {format(parseISO(c.paidAt), "dd.MM.yyyy")}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default PaymentsHistoryPage;
