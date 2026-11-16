"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [nameAr, setNameAr] = useState(""); const [price, setPrice] = useState(""); const [storeId, setStoreId] = useState("");

  const load = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`).then(r => r.json()).then(d => setProducts(d.data || []));
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stores`).then(r => r.json()).then(d => {
       setStores(d.data || []);
       if (d.data && d.data.length > 0) setStoreId(d.data[0].id);
    });
  };
  useEffect(load, []);

  const addProduct = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stores/${storeId}/products`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nameAr, price: Number(price), stock: 100 })
    });
    setNameAr(""); setPrice(""); load();
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50 text-gray-900" dir="rtl">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-bold">إدارة المنتجات</h1>
        <button onClick={() => router.push("/dashboard")} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">عودة</button>
      </div>
      <form onSubmit={addProduct} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-bold text-gray-800 mb-2">المتجر</label>
          <select value={storeId} onChange={e=>setStoreId(e.target.value)} className="w-full" required>
            {stores.map(s => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-sm font-bold text-gray-800 mb-2">اسم المنتج</label>
          <input value={nameAr} onChange={e=>setNameAr(e.target.value)} placeholder="عصير مانجو" className="w-full" required />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-sm font-bold text-gray-800 mb-2">السعر (SDG)</label>
          <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="1500" className="w-full" required />
        </div>
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 h-10 whitespace-nowrap">إضافة منتج</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-bold text-lg">{p.nameAr}</h2>
            <p className="text-green-600 font-bold mt-2">{p.price} SDG</p>
          </div>
        ))}
      </div>
    </div>
  );
}
