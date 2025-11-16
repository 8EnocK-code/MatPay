import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

type Props = {
  ownerShare: number;
  driverShare: number;
  conductorShare: number;
};

export default function RevenuePieChart({ ownerShare, driverShare, conductorShare }: Props) {
  const data = {
    labels: ["Owner", "Driver", "Conductor"],
    datasets: [
      {
        data: [ownerShare, driverShare, conductorShare],
        backgroundColor: ["#7C3AED", "#06B6D4", "#3B82F6"],
        hoverOffset: 6,
      },
    ],
  };

  return (
    <div style={{ maxWidth: 420 }}>
      <Pie data={data} />
    </div>
  );
}

