"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [slug, setSlug] = useState(""); const [nameAr, setNameAr] = useState(""); const [address, setAddress] = useState("");

  const load = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stores`).then(r => r.json()).then(d => setStores(d.data || []));
  };
  useEffect(load, []);

  const addStore = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stores`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ slug, nameAr, addressText: address, lat: 15.5, lng: 32.5 })
    });
    setSlug(""); setNameAr(""); setAddress(""); load();
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50 text-gray-900" dir="rtl">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-bold">إدارة المتاجر</h1>
        <button onClick={() => router.push("/dashboard")} className="bg-gray-500 text-white px-4 py-2 rounded">عودة</button>
      </div>
      <form onSubmit={addStore} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-bold text-gray-800 mb-2">اسم المتجر</label>
          <input value={nameAr} onChange={e=>setNameAr(e.target.value)} placeholder="مثال: متجر الخرطوم" className="w-full border border-gray-300 rounded p-2 text-gray-900" required />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-sm font-bold text-gray-800 mb-2">الرابط (بالإنجليزية)</label>
          <input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="khartoum-store" className="w-full border border-gray-300 rounded p-2 text-gray-900" dir="ltr" required />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-sm font-bold text-gray-800 mb-2">العنوان</label>
          <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="الخرطوم، شارع النيل" className="w-full border border-gray-300 rounded p-2 text-gray-900" required />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 h-10 whitespace-nowrap">إضافة متجر</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stores.map(s => (
          <div key={s.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg">{s.nameAr}</h2>
            <p className="text-sm text-gray-500">{s.addressText}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
