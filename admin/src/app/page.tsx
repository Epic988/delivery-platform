"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createApiClient } from "@delivery/shared";

const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://delivery-api-luar.onrender.com", getToken: () => typeof window !== 'undefined' ? localStorage.getItem('token') : null });

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api.login({ phone, password });
      if (res.user.role !== "ADMIN") throw new Error("هذا الحساب ليس مديراً");
      localStorage.setItem("token", res.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900" dir="rtl">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">لوحة الإدارة</h1>
        {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm">{error}</div>}
        <div className="mb-4">
          <label className="block text-gray-800 font-bold mb-2">رقم الهاتف</label>
          <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+249..." dir="ltr" required className="w-full" />
        </div>
        <div className="mb-6">
          <label className="block text-gray-800 font-bold mb-2">كلمة المرور</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? "جاري الدخول..." : "تسجيل الدخول"}
        </button>
      </form>
    </div>
  );
}
