"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/"); return; }
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/courier-orders`, { headers }).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/drivers-list`, { headers }).then(r => r.json())
    ]).then(([ordersRes, driversRes]) => {
      setOrders(ordersRes.data || []);
      setDrivers(driversRes.data || []);
    }).finally(() => setLoading(false));
  }, [router]);

  const dispatchOrder = async (orderId: string, driverId: string) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderType: "COURIER", orderId, driverId })
      });
      alert("تم تعيين السائق بنجاح!");
      window.location.reload();
    } catch (e) { alert("فشل التعيين"); }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="p-8" dir="rtl">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
        <button onClick={() => router.push("/dashboard")} className="bg-gray-500 text-white px-4 py-2 rounded">عودة</button>
      </div>
      <table className="w-full bg-white rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-right">رقم الطلب</th>
            <th className="p-3 text-right">الحالة</th>
            <th className="p-3 text-right">العميل</th>
            <th className="p-3 text-right">إجراء</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} className="border-t">
              <td className="p-3">{o.orderNumber}</td>
              <td className="p-3 text-orange-600">{o.status}</td>
              <td className="p-3">{o.customer?.fullName}</td>
              <td className="p-3">
                {o.status === "QUOTED" || o.status === "CONFIRMED" ? (
                  <select onChange={(e) => dispatchOrder(o.id, e.target.value)} className="border p-1 rounded">
                    <option value="">تعيين سائق...</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.user.fullName}</option>)}
                  </select>
                ) : <span className="text-green-600">تم التعيين</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
