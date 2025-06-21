import React, { useEffect, useState } from "react";
import { ref, onValue, update, remove } from "firebase/database";
import { rtdb } from "../firebase/config";
import ClientCard from "../components/ClientCard";
import { isToday, parseISO } from "date-fns";
import { useSelector } from "react-redux";

const OverdueClients = () => {
    const user = useSelector((state) => state.user);
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const clientsRef = ref(rtdb, "clients");
    const unsub = onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setClients(list);
      } else setClients([]);
    });
    return () => unsub();
  }, []);

 const updateStatus = (id, status, comment = "") => {
  const updates = { status };
  if (status === "paid") {
    updates.paidAt = new Date().toISOString(); // 🟢 фиксирует дату оплаты
  }
  if (comment) updates.comment = comment;
  update(ref(rtdb, `clients/${id}`), updates);
};

  const removeClient = (id) => remove(ref(rtdb, `clients/${id}`));

  const filtered = clients.filter((c) => {
    const date = c.createdAt ? parseISO(c.createdAt) : null;
    return (
      date && !isToday(date) && c.status !== "paid" && (filter === "all" || c.status === filter)
    );
  });

  const totalOverdueDebt = filtered.reduce((sum, c) => sum + Number(c.paymentAmount || 0), 0);

  return (
    <>
      <div className="mb-2 text-sm text-gray-700">
  {user.role === "admin" && (
        <div className="mb-4 p-3 bg-yellow-50 rounded">
                💸 <strong>Просроченный долг:</strong> {totalOverdueDebt.toLocaleString()}₽
        </div>
      )}

      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          ["all", "Все"],
          ["paid", "Оплачено"],
          ["rescheduled", "Перенос"],
          ["no_answer", "Не отвечает"],
          ["pending", "Ожидание"],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1 rounded text-sm border ${
              filter === val ? "bg-blue-600 text-white" : "bg-white text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? <p className="text-gray-500">Клиентов нет.</p> :
        filtered.map((c) => (
          <ClientCard
            key={c.id}
            client={c}
            isAdmin={true}
            onStatusChange={updateStatus}
            onDelete={removeClient}
          />
        ))}
    </>
  );
};

export default OverdueClients;
