// AddClientForm.jsx
import React, { useState } from "react";
import { ref, push, get } from "firebase/database";
import { rtdb } from "../firebase/config";
import { useSelector } from "react-redux";
import { isSameDay, parseISO } from "date-fns";

const AddClientForm = () => {
  const currentUser = useSelector((state) => state.user);
  const [formState, setFormState] = useState({
    fullName: "",
    phone: "",
    guarantorPhone: "",
    paymentAmount: "",
    status: "pending",
    comment: "",
  });
  const [timing, setTiming] = useState("today");
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  if (currentUser?.role !== "admin") return null;

  const validate = () => {
    const newErrors = {};
    const phoneRegex = /^\d+$/;

    if (!formState.fullName.trim()) newErrors.fullName = "Введите имя клиента";
    if (!formState.phone) newErrors.phone = "Введите номер клиента";
    else if (!phoneRegex.test(formState.phone)) newErrors.phone = "Введите только цифры";

    if (formState.guarantorPhone && !phoneRegex.test(formState.guarantorPhone)) {
      newErrors.guarantorPhone = "Введите только цифры";
    }

    const amount = Number(formState.paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.paymentAmount = "Введите корректную сумму";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const clientsRef = ref(rtdb, "clients");
      const snapshot = await get(clientsRef);
      const existingClients = snapshot.exists() ? snapshot.val() : {};
      const now = new Date();

      if (timing === "overdue") now.setDate(now.getDate() - 1);
      else if (timing === "overdue_1m") now.setMonth(now.getMonth() - 1);
      else if (timing === "overdue_2m") now.setMonth(now.getMonth() - 2);

      const phone = formState.phone;

      const isDuplicate = Object.values(existingClients).some((client) => {
        return (
          client.phone === phone &&
          client.createdAt &&
          isSameDay(parseISO(client.createdAt), now)
        );
      });

      if (isDuplicate) {
        alert("Клиент с таким номером уже добавлен на выбранную дату.");
        setLoading(false);
        return;
      }

      const newClient = {
        ...formState,
        createdAt: now.toISOString(),
      };

      await push(clientsRef, newClient);

      setFormState({
        fullName: "",
        phone: "",
        guarantorPhone: "",
        paymentAmount: "",
        status: "pending",
        comment: "",
      });
      setTiming("today");
      setErrors({});
      setShowForm(false);
    } catch (error) {
      console.error("Ошибка при добавлении клиента:", error);
      alert("Ошибка при добавлении. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Добавить клиента
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="space-y-4 border p-4 rounded-lg shadow bg-white max-w-2xl mx-auto"
        >
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-lg font-semibold">Новый клиент</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-red-500 text-sm"
            >
              ✕ Закрыть
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Клиент для:</label>
            <select
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Сегодня</option>
              <option value="overdue">Просрочено</option>
              <option value="overdue_1m">Просрочка 1 месяц</option>
              <option value="overdue_2m">Просрочка 2 месяца</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ФИО</label>
            <input
              type="text"
              placeholder="ФИО"
              value={formState.fullName}
              onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Телефон клиента</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="\d*"
                placeholder="8XXXXXXXXXX"
                value={formState.phone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "");
                  if (val.startsWith("9")) val = "8" + val;
                  setFormState({ ...formState, phone: val });
                }}
                className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? "border-red-500" : ""
                }`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Телефон поручителя</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="\d*"
                placeholder="8XXXXXXXXXX"
                value={formState.guarantorPhone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "");
                  if (val.startsWith("9")) val = "8" + val;
                  setFormState({ ...formState, guarantorPhone: val });
                }}
                className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                  errors.guarantorPhone ? "border-red-500" : ""
                }`}
              />
              {errors.guarantorPhone && (
                <p className="text-red-500 text-xs mt-1">{errors.guarantorPhone}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Сумма оплаты</label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="₸"
              value={formState.paymentAmount}
              onChange={(e) => setFormState({ ...formState, paymentAmount: e.target.value })}
              className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                errors.paymentAmount ? "border-red-500" : ""
              }`}
              required
            />
            {errors.paymentAmount && (
              <p className="text-red-500 text-xs mt-1">{errors.paymentAmount}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`bg-green-600 text-white px-4 py-2 rounded w-full sm:w-auto transition ${
                loading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
              }`}
            >
              {loading ? "Добавление..." : "Добавить клиента"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddClientForm;