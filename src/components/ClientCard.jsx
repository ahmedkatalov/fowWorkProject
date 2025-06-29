import React, { useState } from "react";
import { useSelector } from "react-redux";

const DEFAULT_RECIPIENTS = ["Муслим", "Магомед", "Сафаи"];

const getStatusStyle = (status, isRescheduledToday) => {
  if (isRescheduledToday) return "bg-green-100 border-l-4 border-green-600";
  switch (status) {
    case "paid": return "bg-green-100 border-l-4 border-green-500";
    case "no_answer": return "bg-red-100 border-l-4 border-red-500";
    case "rescheduled": return "bg-yellow-100 border-l-4 border-yellow-500";
    case "uncertain": return "bg-purple-100 border-l-4 border-purple-600";
    default: return "bg-orange-100 border-l-4 border-orange-500";
  }
};

const getStatusLabel = (status, isRescheduledToday) => {
  if (isRescheduledToday)
    return <span className="text-sm text-green-700 font-bold">Перенос на сегодня</span>;

  switch (status) {
    case "paid": return <span className="text-sm text-green-600 font-medium">Оплачено</span>;
    case "no_answer": return <span className="text-sm text-red-600 font-medium">Не отвечает</span>;
    case "rescheduled": return <span className="text-sm text-yellow-600 font-medium">Перенос</span>;
    case "uncertain": return <span className="text-sm text-purple-700 font-semibold">Под вопросом</span>;
    default: return <span className="text-sm text-orange-600 font-medium">В ожидании</span>;
  }
};

const ClientCard = ({ client, onStatusChange, onDelete, loading }) => {
  const user = useSelector((state) => state.user);
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [transferTo, setTransferTo] = useState("");
  const [actualPayment, setActualPayment] = useState(client.paymentAmount || "");

  const [showUncertainModal, setShowUncertainModal] = useState(false);
  const [uncertainReason, setUncertainReason] = useState("");

  let isRescheduledToday = false;
  if (client.status === "rescheduled" && client.comment) {
    try {
      const match = client.comment.match(/\b([1-9]|[12][0-9]|3[01])\b/);
      const commentDay = match ? parseInt(match[1], 10) : null;
      const today = new Date().getDate();
      if (commentDay === today) isRescheduledToday = true;
    } catch {}
  }

  const handlePaid = () => {
    setShowModal(true);
    setPaymentMethod(null);
    setTransferTo("");
    setActualPayment(client.paymentAmount || "");
  };

  const confirmPayment = () => {
    const now = new Date();
    const paidAt = now.toISOString();

    const extra = {
      paymentMethod,
      ...(paymentMethod === "transfer" && { transferTo }),
      paidAt,
      updatedBy: user.name || user.email,
      paymentAmount: actualPayment,
      originalAmount: client.originalAmount || client.paymentAmount,
      createdAt: client.createdAt || paidAt,
      status: "paid"
    };

    onStatusChange(client.id, "paid", client.comment || "", extra);
    setShowModal(false);
  };

  const handleResetToPending = () => {
    const confirmReset = window.confirm("Вы уверены, что хотите сбросить статус на 'Ожидание'? Данные об оплате будут удалены.");
    if (confirmReset) {
      onStatusChange(client.id, "pending", "", {
        paidAt: null,
        paymentMethod: null,
        transferTo: null,
        updatedBy: user.name || user.email,
        paymentAmount: client.originalAmount || client.paymentAmount,
        originalAmount: null
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
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
        <p className="text-sm text-gray-600">
          📞 Телефон: <a href={`tel:${client.phone}`} className="text-blue-600 underline hover:text-blue-800">{client.phone}</a>
        </p>
      )}

      {client.guarantorPhone && (
        <p className="text-sm text-gray-600">
          👤 Поручитель: <a href={`tel:${client.guarantorPhone}`} className="text-blue-600 underline hover:text-blue-800">{client.guarantorPhone}</a>
        </p>
      )}

      <p className="text-sm text-gray-600">
        💰 Сумма оплаты:{" "}
        {client.originalAmount && client.originalAmount !== client.paymentAmount ? (
          <>
            <span className="line-through text-red-500 mr-2">{client.originalAmount}₽</span>
            <span className="text-black font-semibold">{client.paymentAmount}₽</span>
          </>
        ) : (
          <span className="text-black">{client.paymentAmount}₽</span>
        )}
      </p>

      {client.status === "rescheduled" && client.comment && (
        <p className="text-sm text-yellow-800">
          📆 Перенос: <strong>{client.comment}</strong>
        </p>
      )}

      {client.status === "uncertain" && client.comment && (
        <p className="text-sm text-purple-800">
          ❔ Причина: <strong>{client.comment}</strong>
        </p>
      )}

      {client.paidAt && (
        <p className="text-sm text-green-700">
          ✅ Оплачено: <strong>{new Date(client.paidAt).toLocaleDateString()}</strong>
          {client.paymentMethod === "transfer" && client.transferTo && (
            <span> (перевод на {client.transferTo})</span>
          )}
        </p>
      )}

      {client.updatedBy && (
        <p className="text-sm text-gray-500">👤 Изменил: <strong>{client.updatedBy}</strong></p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {client.status !== "paid" && (
          <button onClick={handlePaid} className="bg-green-600 text-white px-3 py-1 rounded">Оплатил</button>
        )}
        {client.status !== "no_answer" && (
          <button onClick={() => onStatusChange(client.id, "no_answer", "", { updatedBy: user.name || user.email })} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Не отвечает</button>
        )}
        {client.status !== "rescheduled" && (
          <button onClick={() => {
            const comment = prompt("Введите дату или текст переноса (например: 'на 21')");
            if (comment) onStatusChange(client.id, "rescheduled", comment, { updatedBy: user.name || user.email });
          }} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">Перенос оплаты</button>
        )}
        {client.status !== "uncertain" && (
          <button onClick={() => setShowUncertainModal(true)} className="bg-purple-700 text-white px-3 py-1 rounded text-sm hover:bg-purple-800">Под вопросом</button>
        )}
        {client.status !== "pending" && client.status === "paid" && (
          <button onClick={handleResetToPending} className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500">В ожидании</button>
        )}
        {user.role === "admin" && (
          <button onClick={() => onDelete(client.id)} className="text-red-600 border border-red-500 px-3 py-1 rounded">Удалить</button>
        )}
      </div>

      {/* Модалка оплаты */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-80 shadow">
            <h3 className="text-lg font-bold mb-4">Оплата клиента</h3>
            <div className="flex flex-col gap-3">
              <input 
                type="number" 
                min="0" 
                placeholder="Введите сумму оплаты" 
                value={actualPayment} 
                onChange={(e) => setActualPayment(e.target.value)} 
                className="border px-3 py-2 rounded" 
              />
              <button 
                onClick={() => setPaymentMethod("cash")} 
                className={`py-2 rounded ${paymentMethod === "cash" ? "bg-green-600 text-white" : "bg-green-100 text-green-800"}`}
              >
                Наличные
              </button>
              <button 
                onClick={() => setPaymentMethod("transfer")} 
                className={`py-2 rounded ${paymentMethod === "transfer" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"}`}
              >
                Перевод
              </button>
              {paymentMethod === "transfer" && (
                <select 
                  className="border px-3 py-2 rounded" 
                  value={transferTo} 
                  onChange={(e) => setTransferTo(e.target.value)}
                  required
                >
                  <option value="">-- выберите получателя --</option>
                  {DEFAULT_RECIPIENTS.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={confirmPayment} 
                  disabled={!paymentMethod || !actualPayment || (paymentMethod === "transfer" && !transferTo)}
                  className={`py-2 px-4 rounded flex-1 ${(!paymentMethod || !actualPayment || (paymentMethod === "transfer" && !transferTo)) ? "bg-gray-300 cursor-not-allowed" : "bg-purple-600 text-white"}`}
                >
                  Подтвердить
                </button>
                <button 
                  onClick={() => { setShowModal(false); setPaymentMethod(null); setTransferTo(""); }} 
                  className="py-2 px-4 bg-gray-200 rounded flex-1"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка "Под вопросом" */}
      {showUncertainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-80 shadow">
            <h3 className="text-lg font-bold mb-4">Причина статуса «Под вопросом»</h3>
            <textarea
              value={uncertainReason}
              onChange={(e) => setUncertainReason(e.target.value)}
              placeholder="Введите причину..."
              className="w-full border px-3 py-2 rounded h-24"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  if (uncertainReason.trim()) {
                    onStatusChange(client.id, "uncertain", uncertainReason, {
                      updatedBy: user.name || user.email,
                    });
                    setUncertainReason("");
                    setShowUncertainModal(false);
                  }
                }}
                className="bg-purple-700 text-white px-4 py-2 rounded flex-1"
              >
                Сохранить
              </button>
              <button
                onClick={() => {
                  setUncertainReason("");
                  setShowUncertainModal(false);
                }}
                className="bg-gray-200 px-4 py-2 rounded flex-1"
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

export default ClientCard;
