// 📁 src/pages/SearchClient.jsx
import React, { useState } from "react";
import { ref, get, update, remove } from "firebase/database";
import { rtdb } from "../firebase/config";
import { toast } from "react-toastify";
import ClientCard from "./ClientCard";
import { useSelector } from "react-redux";

export const SearchClient = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const user = useSelector((state) => state.user);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      const snapshot = await get(ref(rtdb, "clients"));
      const data = snapshot.val();
      if (!data) {
        setSearchResults([]);
        toast.info("Клиенты не найдены");
        return;
      }

      const results = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .filter((client) =>
          client.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      if (results.length === 0) toast.info("Клиенты не найдены");

      setSearchResults(results);
    } catch (error) {
      toast.error("Ошибка при поиске клиента");
      console.error(error);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">🔍 Поиск клиента</h2>
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Введите имя клиента..."
          className="flex-1 p-2 border rounded text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Найти
        </button>
      </form>

      {searchResults.length > 0 ? (
        <div className="space-y-4">
          {searchResults.map((client) => (
            <div key={client.id} className="border rounded p-3 relative">
              <ClientCard
                client={client}
                isAdmin={user.role === "admin"}
                onStatusChange={(id, status, comment = "", extra = {}) =>
                  update(ref(rtdb, `clients/${id}`), {
                    status,
                    ...(comment && { comment }),
                    ...(status === "paid" && { paidAt: new Date().toISOString() }),
                    ...extra,
                  })
                }
                onDelete={(id) => remove(ref(rtdb, `clients/${id}`))}
              />
            </div>
          ))}
        </div>
      ) : (
        searchTerm && (
          <p className="text-gray-500">Клиентов с таким именем не найдено.</p>
        )
      )}
    </div>
  );
};


