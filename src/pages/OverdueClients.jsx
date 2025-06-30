import React, { useEffect, useState } from "react";
import { ref, onValue, update, remove } from "firebase/database";
import { rtdb } from "../firebase/config";
import ClientCard from "../components/ClientCard";
import { isToday, parseISO, differenceInCalendarMonths } from "date-fns";
import { useSelector } from "react-redux";

const OverdueClients = () => {
  const user = useSelector((state) => state.user);
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState("all");
  const [overdueFilter, setOverdueFilter] = useState("all");

  useEffect(() => {
    const clientsRef = ref(rtdb, "clients");
    const unsub = onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setClients(list);
      } else {
        setClients([]);
      }
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

    if (isCreatedToday) return false;

    if (c.status === "paid") {
      return isTodayPaid && (filter === "all" || filter === "paid");
    }

    const monthsOverdue = created ? differenceInCalendarMonths(new Date(), created) : 0;

    if (overdueFilter === "1month" && monthsOverdue !== 1) return false;
    if (overdueFilter === "2month" && monthsOverdue !== 2) return false;
    if (overdueFilter !== "all" && overdueFilter !== "1month" && overdueFilter !== "2month") {
      return false;
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

      <div className="flex flex-wrap gap-2 mb-2">
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

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          ["all", "Все сроки"],
          ["1month", "Просрочка 1 месяц"],
          ["2month", "Просрочка 2 месяца"],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setOverdueFilter(val)}
            className={`px-3 py-1 rounded text-sm border ${
              overdueFilter === val ? "bg-purple-600 text-white" : "bg-white text-gray-700"
            }`}
          >
            {label}
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
