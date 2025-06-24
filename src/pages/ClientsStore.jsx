import React, { useEffect, useState } from "react";
import { ref, onValue, update, remove } from "firebase/database";
import { rtdb } from "../firebase/config";
import { format, parseISO } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useSelector } from "react-redux";

const PaymentsHistoryPage = () => {
  const currentUser = useSelector((state) => state.user);

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
    transferTo: "",
  });
  const [undoData, setUndoData] = useState(null);
  const [editClient, setEditClient] = useState(null);

  useEffect(() => {
    const clientsRef = ref(rtdb, "clients");
    const unsub = onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      const paid = list.filter((c) => c.status === "paid" && c.paidAt);
      setClients(paid);

      const dates = [
        ...new Set(paid.map((c) => format(parseISO(c.paidAt), "yyyy-MM-dd"))),
      ].sort((a, b) => new Date(b) - new Date(a));
      setAvailableDates(dates);
      if (!selectedDate && dates.length > 0) setSelectedDate(dates[0]);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    const filtered = clients.filter(
      (c) => format(parseISO(c.paidAt), "yyyy-MM-dd") === selectedDate
    );
    setFilteredClients(filtered);

    const summary = {};
    let totalProfit = 0;
    filtered.forEach((c) => {
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
    const { fullName, phone, paymentAmount, paymentMethod, transferTo } =
      manualClient;
    if (
      !fullName ||
      !paymentAmount ||
      (paymentMethod === "transfer" && !transferTo)
    ) {
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
      status: "paid",
      updatedBy: currentUser?.email || "Неизвестный",
    };

    const newRef = ref(rtdb, `clients/${Date.now()}`);
    await update(newRef, newClient);
    setManualModalOpen(false);
    setManualClient({
      fullName: "",
      phone: "",
      paymentAmount: "",
      paymentMethod: "cash",
      transferTo: "",
    });
  };

  const handleDeleteClient = async (client) => {
    if (!window.confirm("Удалить клиента?")) return;
    setUndoData({ client, timeoutId: null });

    const timeoutId = setTimeout(async () => {
      const clientRef = ref(rtdb, `clients/${client.id}`);
      await remove(clientRef);

      const logRef = ref(rtdb, `logs/deletions/${Date.now()}`);
      await update(logRef, {
        clientId: client.id,
        fullName: client.fullName,
        deletedAt: new Date().toISOString(),
      });

      setUndoData(null);
    }, 5000);

    setUndoData((prev) => ({ ...prev, timeoutId }));
  };

  const exportToExcel = () => {
    if (filteredClients.length === 0) {
      alert("Нет данных для экспорта.");
      return;
    }
    const data = filteredClients.map((c) => ({
      ФИО: c.fullName,
      Телефон: c.phone,
      Сумма: c.paymentAmount,
      "Дата оплаты": format(parseISO(c.paidAt), "dd.MM.yyyy"),
      "Метод оплаты":
        c.paymentMethod === "cash"
          ? "Наличные"
          : `Перевод на ${c.transferTo || ""}`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Оплаты");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `История_оплат_${selectedDate}.xlsx`);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">История оплат</h2>

      {availableDates.length === 0 ? (
        <p className="text-gray-500">Нет данных об оплатах.</p>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setManualModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              ➕ Добавить оплату вручную
            </button>
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              📤 Экспорт в Excel
            </button>
          </div>

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

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">
              Общая прибыль за день:
            </h3>
            {profit !== null ? (
              <p className="text-green-700 font-bold">
                💰 {profit.toLocaleString()}₽
              </p>
            ) : (
              <p className="text-sm text-gray-500">Нет прибыли.</p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Сводка переводов:</h3>
            {Object.keys(summaryByRecipient).length === 0 ? (
              <p className="text-sm text-gray-500">
                Нет переводов на эту дату.
              </p>
            ) : (
              <ul className="text-sm space-y-1">
                {Object.entries(summaryByRecipient).map(([name, amount]) => (
                  <li key={name}>
                    🔹 <strong>{name}</strong>: {amount.toLocaleString()}₽
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ul className="space-y-3">
            {filteredClients.map((c) => (
              <li
                key={c.id}
                className="p-3 border rounded bg-green-50 text-green-900 relative"
              >
                <div className="font-medium">{c.fullName}</div>
                <div className="text-sm">Тел: {c.phone}</div>
                <div className="text-sm">
  Сумма:{" "}
  {c.originalAmount && c.originalAmount !== c.paymentAmount ? (
    <>
      <span className="line-through text-gray-400 mr-1">
        {Number(c.originalAmount).toLocaleString()}₽
      </span>
      <span className="text-black font-medium">
        {Number(c.paymentAmount).toLocaleString()}₽
      </span>
    </>
  ) : (
    <span>{Number(c.paymentAmount).toLocaleString()}₽</span>
  )}
</div>

                <div className="text-sm">
                  Дата оплаты: {format(parseISO(c.paidAt), "dd.MM.yyyy")}
                </div>
                {c.paymentMethod && (
                  <div className="text-sm">
                    Метод оплаты:{" "}
                    <strong>
                      {c.paymentMethod === "cash"
                        ? "Наличные"
                        : `Перевод на ${c.transferTo}`}
                    </strong>
                  </div>
                )}
                {c.updatedBy && (
                  <div className="text-sm text-gray-500">
                    👤 Оплату добавил: {c.updatedBy}
                  </div>
                )}
                <button
                  onClick={() => handleDeleteClient(c)}
                  className="absolute top-2 right-2 text-red-500 text-sm hover:underline"
                >
                  Удалить
                </button>
                <button
                  onClick={() => setEditClient(c)}
                  className="absolute top-2 right-16 text-blue-500 text-sm hover:underline"
                >
                  Редактировать
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {undoData && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow-lg">
          <p>
            Удаление клиента <strong>{undoData.client.fullName}</strong> через 5
            секунд...
          </p>
          <button
            className="text-blue-600 underline mt-1"
            onClick={() => {
              clearTimeout(undoData.timeoutId);
              setUndoData(null);
            }}
          >
            Отменить
          </button>
        </div>
      )}

      {manualModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-96 space-y-3">
            <h3 className="text-lg font-bold mb-2">Добавить оплату вручную</h3>
            <input
              type="text"
              placeholder="ФИО"
              value={manualClient.fullName}
              onChange={(e) =>
                setManualClient({ ...manualClient, fullName: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            />
            <input
              type="tel"
              placeholder="Телефон"
              value={manualClient.phone}
              onChange={(e) =>
                setManualClient({ ...manualClient, phone: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            />
            <input
              type="number"
              placeholder="Сумма"
              value={manualClient.paymentAmount}
              onChange={(e) =>
                setManualClient({
                  ...manualClient,
                  paymentAmount: e.target.value,
                })
              }
              className="w-full border px-3 py-2 rounded"
            />
            <select
              value={manualClient.paymentMethod}
              onChange={(e) =>
                setManualClient({
                  ...manualClient,
                  paymentMethod: e.target.value,
                })
              }
              className="w-full border px-3 py-2 rounded"
            >
              <option value="cash">Наличные</option>
              <option value="transfer">Перевод</option>
            </select>
            {manualClient.paymentMethod === "transfer" && (
              <input
                type="text"
                placeholder="Кому перевод"
                value={manualClient.transferTo}
                onChange={(e) =>
                  setManualClient({
                    ...manualClient,
                    transferTo: e.target.value,
                  })
                }
                className="w-full border px-3 py-2 rounded"
              />
            )}
            <div className="flex justify-between mt-4">
              <button
                onClick={handleManualAdd}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Сохранить
              </button>
              <button
                onClick={() => setManualModalOpen(false)}
                className="text-gray-600 underline"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {editClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-96 space-y-3">
            <h3 className="text-lg font-bold mb-2">Редактировать клиента</h3>
            <input
              type="text"
              placeholder="ФИО"
              value={editClient.fullName}
              onChange={(e) =>
                setEditClient({ ...editClient, fullName: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            />
            <input
              type="tel"
              placeholder="Телефон"
              value={editClient.phone}
              onChange={(e) =>
                setEditClient({ ...editClient, phone: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            />
            <input
              type="number"
              placeholder="Сумма"
              value={editClient.paymentAmount}
              onChange={(e) =>
                setEditClient({ ...editClient, paymentAmount: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            />
            <select
              value={editClient.paymentMethod}
              onChange={(e) =>
                setEditClient({ ...editClient, paymentMethod: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            >
              <option value="cash">Наличные</option>
              <option value="transfer">Перевод</option>
            </select>
            {editClient.paymentMethod === "transfer" && (
              <input
                type="text"
                placeholder="Кому перевод"
                value={editClient.transferTo}
                onChange={(e) =>
                  setEditClient({ ...editClient, transferTo: e.target.value })
                }
                className="w-full border px-3 py-2 rounded"
              />
            )}
            <div className="flex justify-between mt-4">
              <button
                onClick={async () => {
                  const clientRef = ref(rtdb, `clients/${editClient.id}`);
                  await update(clientRef, editClient);
                  setEditClient(null);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Сохранить
              </button>
              <button
                onClick={() => setEditClient(null)}
                className="text-gray-600 underline"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsHistoryPage;
