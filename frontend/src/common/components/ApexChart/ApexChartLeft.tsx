import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";
import { useSubscribeDevicesPercentStatsQuery } from "../../services/DevicesPercent/DevicesPercent";
import "./ApexChart.scss";

export interface StatsPayload {
  device_id: string;
  messages: number;
  percent: number | string | null;
}

const ApexChartLeft: React.FC = () => {
  const { data } = useSubscribeDevicesPercentStatsQuery();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const stats: StatsPayload[] = Array.isArray(data) ? data : [];
  const series = stats.map((item) => Number(item.messages || 0));
  const labels = stats.map((item) => item.device_id || "Unknown");
  const total = series.reduce((sum, count) => sum + count, 0);
  const selectedIndex = selectedDevice === null ? -1 : labels.indexOf(selectedDevice);
  const selectedCount = selectedIndex >= 0 ? series[selectedIndex] : total;
  const centerLabel = selectedIndex >= 0 ? labels[selectedIndex] : "Top 10";

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      animations: { enabled: false },
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          const index = config.dataPointIndex;
          if (index < 0 || index >= labels.length) return;
          setSelectedDevice((previous) => previous === labels[index] ? null : labels[index]);
        },
      },
    },
    labels,
    legend: { position: "bottom", fontSize: "10px", markers: { size: 4 }, itemMargin: { horizontal: 5, vertical: 2 } },
    stroke: { width: 2, colors: ["#ffffff"] },
    dataLabels: { enabled: false },
    tooltip: {
      theme: "light",
      y: {
        formatter: (value: number, opts) => {
          const item = stats[opts.seriesIndex];
          const percent = Number(item?.percent || 0).toFixed(1);
          return `${value.toLocaleString()} messages · ${percent}%`;
        },
      },
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: { show: false },
            total: {
              show: true,
              showAlways: true,
              label: centerLabel,
              color: "var(--syslog-donut-label, #7b8798)",
              fontSize: "11px",
              formatter: () => selectedCount.toLocaleString(),
            },
            value: { show: false },
          },
        },
      },
    },
  };

  return (
    <section className="donut-card donut-card--devices">
      <div className="donut-card__header">
        <div>
          <span>Sources</span>
          <h2>Top devices</h2>
          <p>Message share by the busiest devices in the last 24 hours.</p>
        </div>
      </div>
      <div className="donut-card__chart">
        <ReactApexChart type="donut" options={options} series={series} height={238} />
      </div>
    </section>
  );
};

export default ApexChartLeft;
