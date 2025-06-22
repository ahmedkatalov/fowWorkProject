// OverdueClients.jsx
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

  const updateStatus = (id, status, comment = "", extra = {}) => {
    const updates = {
      status,
      ...(comment && { comment }),
      ...(status === "paid" && { paidAt: new Date().toISOString() }),
      ...extra,
    };
    update(ref(rtdb, `clients/${id}`), updates);
  };

  const removeClient = (id) => remove(ref(rtdb, `clients/${id}`));

  const filtered = clients.filter((c) => {
    const created = c.createdAt ? parseISO(c.createdAt) : null;
    const paid = c.paidAt ? parseISO(c.paidAt) : null;
    const isTodayPaid = paid && isToday(paid);
    const isCreatedToday = created && isToday(created);

    // Если клиент только сегодня добавлен, исключаем из всех фильтров
    if (isCreatedToday) return false;

    // Отображаем оплаченных клиентов только если они оплачены СЕГОДНЯ
    if (c.status === "paid") {
      if (!isTodayPaid) return false;
      return filter === "all" || filter === "paid";
    }

    return filter === "all" || c.status === filter;
  });

  const totalOverdueDebt = filtered.reduce((sum, c) => sum + Number(c.paymentAmount || 0), 0);

  return (
    <>
      {user.role === "admin" && (
        <div className="mb-4 p-3 bg-yellow-50 rounded text-sm text-gray-700">
          💸 <strong>Просроченный долг:</strong> {totalOverdueDebt.toLocaleString()}₽
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "paid", "rescheduled", "no_answer", "pending"].map((val) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1 rounded text-sm border ${
              filter === val ? "bg-blue-600 text-white" : "bg-white text-gray-700"
            }`}
          >
            {val === "all"
              ? "Все"
              : val === "paid"
              ? "Оплачено"
              : val === "rescheduled"
              ? "Перенос"
              : val === "no_answer"
              ? "Не отвечает"
              : "Ожидание"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">Клиентов нет.</p>
      ) : (
        filtered.map((c) => {
          const paid = c.paidAt ? parseISO(c.paidAt) : null;
          const isTodayPaid = paid && isToday(paid);

          return (
            <div key={c.id} className="relative">
              <ClientCard
                client={c}
                isAdmin={true}
                onStatusChange={updateStatus}
                onDelete={removeClient}
              />
              {c.status === "paid" && isTodayPaid && (
                <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-bl">
                  ⚠️ Клиент исчезнет завтра
                </div>
              )}
            </div>
          );
        })
      )}
    </>
  );
};

export default OverdueClients;
