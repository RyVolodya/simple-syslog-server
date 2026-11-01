import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";
import { useSubscribeDevicesPercentStatsQuery } from "../../services/DevicesPercent/DevicesPercent";
import "./ApexChart.scss";

export interface StatsPayload {
  device_id: string;
  messages: number;
  percent: number | string | null;
}

/** WCAG relative luminance: select whichever of black/white has higher contrast. */
const contrastText = (color: string): "#000000" | "#ffffff" => {
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color.trim());
  if (!hex) return "#000000";
  const expanded = hex[1].length === 3
    ? hex[1].split("").map((c) => c + c).join("")
    : hex[1];
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(expanded.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.179 ? "#000000" : "#ffffff";
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char] || char));

// The same palette drives both the SVG slices and the tooltip backgrounds.
const SLICE_COLORS = [
  "#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0",
  "#3F51B5", "#546E7A", "#D4526E", "#8D5B4C", "#F9A3A4",
];

const ApexChartLeft: React.FC = () => {
  const { data } = useSubscribeDevicesPercentStatsQuery();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const stats: StatsPayload[] = (Array.isArray(data) ? data : [])
    .slice()
    .sort((a, b) => Number(b.messages || 0) - Number(a.messages || 0))
    .slice(0, 10);
  const series = stats.map((item) => Number(item.messages || 0));
  const labels = stats.map((item) => item.device_id || "Unknown");
  // Top 10 center displays the sum of all shown devices (or fewer if unavailable).
  const topTenTotal = stats.reduce((sum, item) => sum + Number(item.messages || 0), 0);
  const selected = stats.find((item) => item.device_id === selectedDeviceId);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      animations: { enabled: false },
      events: {
        dataPointSelection: (_event, _chart, config) => {
          const index = config.dataPointIndex;
          if (index < 0 || index >= stats.length) return;
          const id = stats[index].device_id;
          setSelectedDeviceId((previous) => previous === id ? null : id);
        },
      },
    },
    labels,
    colors: SLICE_COLORS,
    legend: { position: "bottom", fontSize: "10px", markers: { size: 4 }, itemMargin: { horizontal: 5, vertical: 2 } },
    stroke: { width: 2, colors: ["#ffffff"] },
    dataLabels: { enabled: false },
    tooltip: {
      custom: ({ series: values, seriesIndex }) => {
        const item = stats[seriesIndex];
        if (!item) return "";
        const background = SLICE_COLORS[seriesIndex % SLICE_COLORS.length];
        const foreground = contrastText(background);
        const count = Number(values[seriesIndex] || 0).toLocaleString();
        const percent = Number(item.percent || 0).toFixed(1);
        return `<div class="donut-device-tooltip" style="background-color:${background} !important;color:${foreground} !important">` +
          `<div class="donut-device-tooltip__name" style="color:${foreground} !important">${escapeHtml(item.device_id || "Unknown")}</div>` +
          `<div style="color:${foreground} !important">${count} messages · ${percent}%</div></div>`;
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: { show: false },
        },
      },
    },
  };

  return (
    <section className="donut-card">
      <div className="donut-card__header">
        <div>
          <span>Sources</span>
          <h2>Top devices</h2>
          <p>Message share by the busiest devices in the last 24 hours.</p>
        </div>
      </div>
      <div className="donut-card__chart">
        <ReactApexChart type="donut" options={options} series={series} height={238} />
        <div className="donut-card__center" aria-live="polite">
          {!selected && <span className="donut-card__center-label">Top 10</span>}
          <strong className="donut-card__center-value">
            {Number(selected ? selected.messages : topTenTotal).toLocaleString()}
          </strong>
        </div>
      </div>
    </section>
  );
};

export default ApexChartLeft;
