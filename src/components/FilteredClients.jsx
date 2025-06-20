import React, { useState } from "react";

const getStatusStyle = (status) => {
  switch (status) {
    case "paid":
      return "bg-green-100 border-l-4 border-green-500";
    case "no_answer":
      return "bg-red-100 border-l-4 border-red-500";
    case "rescheduled":
      return "bg-yellow-100 border-l-4 border-yellow-500";
    default:
      return "bg-orange-100 border-l-4 border-orange-500";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "paid":
      return <span className="text-sm text-green-600 font-medium">Оплачено</span>;
    case "no_answer":
      return <span className="text-sm text-red-600 font-medium">Не отвечает</span>;
    case "rescheduled":
      return <span className="text-sm text-yellow-600 font-medium">Перенос</span>;
    default:
      return <span className="text-sm text-orange-600 font-medium">В ожидании</span>;
  }
};

const ClientCard = ({ client, isAdmin, onStatusChange, onDelete }) => {
  const [filter, setFilter] = useState("all");

  const shouldDisplay = () => {
    if (filter === "all") return true;
    return client.status === filter;
  };

  if (!shouldDisplay()) return null;

  return (
    <>
      <div className="mb-4 flex gap-6 flex-wrap">
        {[
          { label: "Все", value: "all" },
          { label: "Оплачено", value: "paid" },
          { label: "Перенос", value: "rescheduled" },
          { label: "Не отвечает", value: "no_answer" },
        ].map(({ label, value }) => (
          <button
            key={value}
            className={`px-4 py-1 rounded border text-sm font-medium ${
              filter === value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border-gray-300"
            }`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className={`p-4 rounded-lg shadow ${getStatusStyle(client.status)} mb-4`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-semibold">{client.fullName}</span>
          {getStatusLabel(client.status)}
        </div>

        <p className="text-sm mb-1 text-gray-600">📞 Телефон: <span className="text-black">{client.phone}</span></p>
        <p className="text-sm mb-1 text-gray-600">👤 Поручитель: <span className="text-black">{client.guarantorPhone}</span></p>
        <p className="text-sm mb-1 text-gray-600">💰 Сумма оплаты: <span className="text-black">{client.paymentAmount}</span></p>
        <p className="text-sm mb-3 text-gray-600">
          📝 Комментарий:{" "}
          <span className="text-black">{client.comment || <em>Нет</em>}</span>
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onStatusChange(client.id, "paid")}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            Оплатил
          </button>
          <button
            onClick={() => onStatusChange(client.id, "no_answer")}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Не отвечает
          </button>
          <button
            onClick={() => {
              const comment = prompt("Дата оплаты?");
              if (comment) onStatusChange(client.id, "rescheduled", comment);
            }}
            className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
          >
            Перенос оплаты
          </button>
          {isAdmin && (
            <button
              onClick={() => onDelete(client.id)}
              className="border  border-red-500 text-red-500 px-3 py-1 rounded text-sm hover:bg-red-50"
            >
              Удалить
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientCard;
