import React from "react";
import { useSelector } from "react-redux";

const getStatusStyle = (status, isRescheduledToday) => {
  if (isRescheduledToday) return "bg-green-100 border-l-4 border-green-600";
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

const getStatusLabel = (status, isRescheduledToday) => {
  if (isRescheduledToday)
    return <span className="text-sm text-green-700 font-bold">Перенос на сегодня</span>;

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

const ClientCard = ({ client,  onStatusChange, onDelete, loading }) => {
  const user = useSelector((state) => state.user);

  let isRescheduledToday = false;

  if (client.status === "rescheduled" && client.comment) {
    try {
      const match = client.comment.match(/\b([1-9]|[12][0-9]|3[01])\b/);
      const commentDay = match ? parseInt(match[1], 10) : null;
      const today = new Date().getDate();

      if (commentDay === today) {
        isRescheduledToday = true;
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg shadow mb-4 ${getStatusStyle(client.status, isRescheduledToday)}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{client.fullName}</h3>
        {getStatusLabel(client.status, isRescheduledToday)}
      </div>

      {client.phone && (
        <p className="text-sm mb-1 text-gray-600">
          📞 Телефон: <a href={`tel:${client.phone}`} className="text-blue-600 underline hover:text-blue-800">{client.phone}</a>
        </p>
      )}

      {client.guarantorPhone && (
        <p className="text-sm mb-1 text-gray-600">
          👤 Поручитель: <a href={`tel:${client.guarantorPhone}`} className="text-blue-600 underline hover:text-blue-800">{client.guarantorPhone}</a>
        </p>
      )}

      <p className="text-sm mb-1 text-gray-600">
        💰 Сумма оплаты: <span className="text-black">{client.paymentAmount}</span>
      </p>

      <p className="text-sm mb-3 text-gray-600">
        📝 Комментарий: <span className="text-black">{client.comment || <em>Нет</em>}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        {client.status !== "paid" && (
          <button
            onClick={() => onStatusChange(client.id, "paid")}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            Оплатил
          </button>
        )}

        {client.status !== "no_answer" && (
          <button
            onClick={() => onStatusChange(client.id, "no_answer")}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Не отвечает
          </button>
        )}

        {client.status !== "rescheduled" && (
          <button
            onClick={() => {
              const comment = prompt("Введите дату или текст переноса (например: 'на 21')");
              if (comment) onStatusChange(client.id, "rescheduled", comment);
            }}
            className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
          >
            Перенос оплаты
          </button>
        )}

        {client.status !== "pending" && (
          <button
            onClick={() => onStatusChange(client.id, "pending")}
            className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
          >
            В ожидании
          </button>
        )}

        {user.role === "admin" && (
          <button
            onClick={() => onDelete(client.id)}
            className="border border-red-500 text-red-500 px-3 py-1 rounded text-sm hover:bg-red-50"
          >
            Удалить
          </button>
        )}
      </div>
    </div>
  );
};

export default ClientCard;