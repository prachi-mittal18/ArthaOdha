import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: false },
  },
  scales: {
    y: {
      grid: { color: "#f0f0f0" },
      ticks: { callback: (value) => `₹${value}` }
    },
    x: { grid: { display: false } }
  },
};

export function LineChart({ data }) {
  const chartData = {
    ...data,
    datasets: data.datasets.map(ds => ({
      ...ds, fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6
    }))
  };
  return <Line options={options} data={chartData} />;
}