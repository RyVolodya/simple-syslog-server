import React from "react";
import ReactApexChart from "react-apexcharts";
import { useSubscribeMessageStatsQuery } from "../../services/MessagePercent/MessagePercent";
import "./ApexChart.scss";
import { useDarkDonutPalette } from "./useDarkDonutPalette";

const severityNames: Record<number, string> = {
  0: "Emergency",
  1: "Alert",
  2: "Critical",
  3: "Error",
  4: "Warning",
  5: "Notice",
  6: "Informational",
  7: "Debug",
};


const severityLightColors: Record<number, string> = {
  0: "#c4b5fd", // Emergency — lavender
  1: "#f9a8d4", // Alert — pink
  2: "#d8b4fe", // Critical — lilac
  3: "#fdba74", // Error — light orange
  4: "#fda4af", // Warning — coral
  5: "#7dd3fc", // Notice — sky blue
  6: "#a3e635", // Informational — lime
  7: "#fde68a", // Debug — soft yellow
};

const ApexChart: React.FC = () => {
  const dark = useDarkDonutPalette();
  const { data } = useSubscribeMessageStatsQuery();
  const stats = Array.isArray(data) ? data.slice().sort((a, b) => Number(a.message_type) - Number(b.message_type)) : [];
  const series = stats.map((item) => Number(item.count ?? 0));
  const labels = stats.map((item) => severityNames[Number(item.message_type)] || `Level ${item.message_type}`);
  const colors = stats.map((item) => severityLightColors[Number(item.message_type)] || "#fde68a");
  const total = stats.reduce((sum, item) => sum + Number(item.count ?? 0), 0);

  const options: ApexCharts.ApexOptions = {
    chart: { type: "donut", toolbar: { show: false }, animations: { enabled: false } },
    labels,
    colors: !dark ? stats.map((item) => ({
      0: "#6d28d9", 1: "#be123c", 2: "#a21caf", 3: "#c2410c",
      4: "#dc2626", 5: "#1d4ed8", 6: "#15803d", 7: "#475569",
    }[Number(item.message_type)] || "#475569")) : colors,
    legend: { position: "bottom", fontSize: "10px", markers: { size: 4 }, itemMargin: { horizontal: 5, vertical: 2 } },
    stroke: { width: 2, colors: ["#ffffff"] },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (value: number) => `${value.toLocaleString()} messages` } },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: { show: true, color: "#7b8798", fontSize: "10px" },
            value: { show: true, color: "#14213d", fontSize: "18px", fontWeight: 700 },
            total: {
              show: true,
              label: "Events",
              color: "#7b8798",
              formatter: () => total.toLocaleString(),
            },
          },
        },
      },
    },
  };

  return (
    <section className="donut-card">
      <div className="donut-card__header">
        <div>
          <span>Severity</span>
          <h2>Event severity</h2>
          <p>Distribution by RFC 5424 severity level.</p>
        </div>
      </div>
      <div className="donut-card__chart">
        <ReactApexChart type="donut" options={options} series={series} height={238} />
      </div>
    </section>
  );
};

export default ApexChart;
