import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: true,
      text: "Holdings",
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.dataset.label || "";
          const value = context.parsed.y.toFixed(2);
          const quantities = context.dataset.quantities;
          const lines = [`${label}: ₹${value}`];
          if (quantities && quantities[context.dataIndex] !== undefined) {
            lines.push(`Quantity: ${quantities[context.dataIndex]}`);
          }
          return lines;
        },
      },
    },
  },
};

export function VerticalGraph({ data }) {
  return <Bar options={options} data={data} />;
}
