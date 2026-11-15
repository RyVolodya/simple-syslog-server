import React from "react";
import ReactApexChart from "react-apexcharts";
import { useNavigate } from "react-router-dom";
import { useGetSeverityStatsQuery } from "../../services/FilterMessages/FilterMessages";
import { DARK_DONUT_COLORS, LIGHT_DONUT_COLORS, useDarkDonutPalette } from "./useDarkDonutPalette";
import "./ApexChart.scss";

const ApexChartSeverity: React.FC = () => {
  const dark = useDarkDonutPalette();
  const navigate = useNavigate();
  const { data = [] } = useGetSeverityStatsQuery(undefined, { pollingInterval: 15000 });
  // Keep the eight Syslog levels, ordered by message volume (largest first).
  const stats = data.filter(item => Number(item.count) > 0).slice().sort((a, b) => b.count - a.count || a.severity - b.severity);
  const series = stats.map(item => item.count);
  const total = series.reduce((sum, count) => sum + count, 0);
  const options: ApexCharts.ApexOptions = {
    chart: { type: "donut", toolbar: { show: false }, animations: { enabled: false }, events: {
      dataPointSelection: (_event, _chart, config) => {
        const severity = stats[config.dataPointIndex]?.severity;
        if (severity === undefined) return;
        const now = new Date();
        const params = new URLSearchParams({ type: String(severity), from: new Date(now.getTime() - 86400000).toISOString(), to: now.toISOString() });
        navigate(`/message?${params.toString()}`);
      },
    } },
    labels: stats.map(item => item.label),
    colors: (dark ? LIGHT_DONUT_COLORS : DARK_DONUT_COLORS).slice(0, 8),
    legend: { position: "bottom", fontSize: "10px", markers: { size: 4 }, itemMargin: { horizontal: 5, vertical: 2 } },
    stroke: { width: 2, colors: ["#ffffff"] },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (value: number) => `${value.toLocaleString()} messages · ${total ? (value * 100 / total).toFixed(1) : "0.0"}%` } },
    plotOptions: { pie: { donut: { size: "70%", labels: {
      show: true,
      total: { show: true, label: "Total", color: "#14213d", fontSize: "11px", formatter: () => total.toLocaleString() },
      value: { show: true, color: "#14213d", fontSize: "14px", fontWeight: 700 },
    } } } },
  };
  return <section className="donut-card">
    <div className="donut-card__header"><div><span>Messages</span><h2>Severity</h2><p>Message counts by severity in the last 24 hours.</p></div></div>
    <div className="donut-card__chart"><ReactApexChart type="donut" options={options} series={series} height={238} /></div>
  </section>;
};
export default ApexChartSeverity;
