"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [slug, setSlug] = useState(""); const [nameAr, setNameAr] = useState(""); const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stores`).then(r => r.json()).then(d => setStores(d.data || [])).finally(() => setLoading(false));
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
    <div className="p-8" dir="rtl">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">إدارة المتاجر</h1>
        <button onClick={() => router.push("/dashboard")} className="bg-gray-500 text-white px-4 py-2 rounded">عودة</button>
      </div>
      <form onSubmit={addStore} className="bg-white p-4 rounded shadow mb-6 flex gap-4">
        <input value={nameAr} onChange={e=>setNameAr(e.target.value)} placeholder="اسم المتجر" className="border p-2 rounded" required />
        <input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="الرابط بالإنجليزية (مثال: my-store)" className="border p-2 rounded" required />
        <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="العنوان" className="border p-2 rounded" required />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">إضافة متجر</button>
      </form>
      <div className="grid grid-cols-3 gap-4">
        {stores.map(s => <div key={s.id} className="bg-white p-4 rounded shadow"><h2 className="font-bold">{s.nameAr}</h2><p className="text-sm text-gray-500">{s.addressText}</p></div>)}
      </div>
    </div>
  );
}
