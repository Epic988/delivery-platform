"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/"); return; }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    })
    .then(data => setStats(data))
    .catch(() => router.push("/"))
    .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="flex justify-between items-center mb-8">`n        <button onClick={() => router.push("/dashboard/orders")} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">إدارة الطلبات</button>
        <h1 className="text-3xl font-bold text-gray-800">لوحة تحكم الإدارة</h1>
        <button onClick={() => { localStorage.removeItem("token"); router.push("/"); }} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          تسجيل الخروج
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-gray-500 text-sm mb-2">العملاء</h2>
          <p className="text-3xl font-bold text-blue-600">{stats?.customers || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-gray-500 text-sm mb-2">المتاجر</h2>
          <p className="text-3xl font-bold text-green-600">{stats?.stores || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-gray-500 text-sm mb-2">طلبات التسوق</h2>
          <p className="text-3xl font-bold text-purple-600">{stats?.shoppingOrders || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-gray-500 text-sm mb-2">طلبات التوصيل</h2>
          <p className="text-3xl font-bold text-orange-600">{stats?.courierOrders || 0}</p>
        </div>
      </div>
    </div>
  );
}

