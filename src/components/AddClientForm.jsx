import React, { useState } from "react";
import { ref, push } from "firebase/database";
import { rtdb } from "../firebase/config";
import { useSelector } from "react-redux";

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

  if (currentUser?.role !== "admin") return null; // 🔒 Только для admin

const validate = () => {
  const newErrors = {};
  const phoneRegex = /^\d+$/; // Только цифры
  const amountRegex = /^\d+$/;

  if (formState.phone && !phoneRegex.test(formState.phone)) {
    newErrors.phone = "Введите только цифры";
  }

  if (formState.guarantorPhone && !phoneRegex.test(formState.guarantorPhone)) {
    newErrors.guarantorPhone = "Введите только цифры";
  }

  if (!amountRegex.test(formState.paymentAmount)) {
    newErrors.paymentAmount = "Введите только цифры";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  const handleAdd = async () => {
    if (!validate()) return;

    const clientsRef = ref(rtdb, "clients");
    const date = new Date();
    if (timing === "overdue") date.setDate(date.getDate() - 1);

    const newClient = {
      ...formState,
      createdAt: date.toISOString(),
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
          {/* Header */}
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

          {/* Сегодня / Просрочено */}
          <div>
            <label className="block text-sm font-medium mb-1">Клиент для:</label>
            <select
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Сегодня</option>
              <option value="overdue">Просрочено</option>
            </select>
          </div>

          {/* ФИО */}
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
          </div>

          {/* Телефоны */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Телефон клиента</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="\d*"
                placeholder="10–15 цифр"
                value={formState.phone}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    phone: e.target.value.replace(/\D/g, ""),
                  })
                }
                className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? "border-red-500" : ""
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Телефон поручителя</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="\d*"
                placeholder="10–15 цифр"
                value={formState.guarantorPhone}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    guarantorPhone: e.target.value.replace(/\D/g, ""),
                  })
                }
                className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                  errors.guarantorPhone ? "border-red-500" : ""
                }`}
              />
              {errors.guarantorPhone && (
                <p className="text-red-500 text-xs mt-1">{errors.guarantorPhone}</p>
              )}
            </div>
          </div>

          {/* Сумма */}
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

          {/* Кнопка */}
          <div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition w-full sm:w-auto"
            >
              Добавить клиента
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddClientForm;
