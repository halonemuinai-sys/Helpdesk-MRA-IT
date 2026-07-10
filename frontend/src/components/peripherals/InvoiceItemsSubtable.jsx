import React, { useState, useEffect } from 'react';
import { Eye, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function InvoiceItemsSubtable({ invoiceId, token, formatRupiah, statusOptions, onDeleteItem, onViewItem, user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/peripherals/invoices/${invoiceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch (err) {
        console.error('Gagal memuat barang invoice:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [invoiceId, token]);

  if (loading) {
    return (
      <tr>
        <td colSpan="9" className="py-4 text-center text-xs text-gray-400 font-semibold italic">
          Memuat daftar barang...
        </td>
      </tr>
    );
  }

  if (items.length === 0) {
    return (
      <tr>
        <td colSpan="9" className="py-4 text-center text-xs text-gray-400 font-semibold italic">
          Tidak ada barang fisik terdaftar.
        </td>
      </tr>
    );
  }

  return (
    <>
      {items.map((item) => {
        const statusObj = statusOptions.find(o => o.value === item.status) || statusOptions[0];
        return (
          <tr key={item.id} className="border-b border-gray-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
            <td className="py-2.5 px-4 font-bold text-gray-900 dark:text-white">{item.name}</td>
            <td className="py-2.5 px-4">
              <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-[9px] uppercase tracking-wider text-gray-500">
                {item.category}
              </span>
            </td>
            <td className="py-2.5 px-4 text-gray-600 dark:text-slate-400">{item.brand} {item.model || '-'}</td>
            <td className="py-2.5 px-4 font-mono text-gray-505">{item.serialNumber || '-'}</td>
            <td className="py-2.5 px-4 text-center font-bold">{item.quantity} Unit</td>
            <td className="py-2.5 px-4 text-right text-slate-500">{formatRupiah(item.purchaseCost)}</td>
            <td className="py-2.5 px-4 text-right font-bold text-gray-900 dark:text-white">{formatRupiah(item.totalCost)}</td>
            <td className="py-2.5 px-4 text-center">
              <span className={`inline-flex items-center gap-1 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusObj.color}`}>
                {statusObj.label}
              </span>
            </td>
            <td className="py-2.5 px-4 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onViewItem(item)}
                  className="p-1 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-500 rounded text-gray-400 transition"
                  title="Lihat Detail & Riwayat (Journey)"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {user.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/25 hover:text-red-500 rounded text-gray-400 transition"
                    title="Hapus Barang"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}
