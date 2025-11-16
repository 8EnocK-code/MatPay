import React, { useEffect, useState } from "react";
import RevenuePieChart from "../components/RevenuePieChart";
import api from "../api";

export default function RevenueAnalytics() {
  const [data, setData] = useState({ owner: 0, driver: 0, conductor: 0, loaded: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await api<{ owner: number; driver: number; conductor: number }>("/owner/revenue-split");
        setData({ ...resp, loaded: true });
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Failed to load revenue data");
        setData({ owner: 0, driver: 0, conductor: 0, loaded: true });
      }
    })();
  }, []);

  if (!data.loaded) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Revenue Split</h2>
      <RevenuePieChart ownerShare={data.owner} driverShare={data.driver} conductorShare={data.conductor} />
      <div className="mt-6 space-y-2">
        <p className="text-sm text-gray-600">Owner: {data.owner}%</p>
        <p className="text-sm text-gray-600">Driver: {data.driver}%</p>
        <p className="text-sm text-gray-600">Conductor: {data.conductor}%</p>
      </div>
    </div>
  );
}

