import React from "react";
import ReactApexChart from "react-apexcharts";
import { useSubscribeMessageStatsQuery } from "../../services/MessagePercent/MessagePercent";
import "./ApexChart.scss";

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


const severityColors: Record<number, string> = {
  0: "#7c3aed", // Emergency
  1: "#be123c", // Alert
  2: "#c026d3", // Critical
  3: "#f97316", // Error
  4: "#ef4444", // Warning - always red
  5: "#0ea5e9", // Notice
  6: "#16a34a", // Informational - always green
  7: "#64748b", // Debug
};

const ApexChart: React.FC = () => {
  const { data } = useSubscribeMessageStatsQuery();
  const stats = Array.isArray(data) ? data.slice().sort((a, b) => Number(a.message_type) - Number(b.message_type)) : [];
  const series = stats.map((item) => Number(item.count ?? 0));
  const labels = stats.map((item) => severityNames[Number(item.message_type)] || `Level ${item.message_type}`);
  const colors = stats.map((item) => severityColors[Number(item.message_type)] || "#64748b");
  const total = stats.reduce((sum, item) => sum + Number(item.count ?? 0), 0);

  const options: ApexCharts.ApexOptions = {
    chart: { type: "donut", toolbar: { show: false }, animations: { enabled: false } },
    labels,
    colors,
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
