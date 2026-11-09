import React from "react";
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
  const stats: StatsPayload[] = Array.isArray(data) ? data : [];
  const series = stats.map((item) => Number(item.messages || 0));
  const labels = stats.map((item) => item.device_id || "Unknown");
  const total = stats.reduce((sum, item) => sum + Number(item.messages || 0), 0);

  const options: ApexCharts.ApexOptions = {
    chart: { type: "donut", toolbar: { show: false }, animations: { enabled: false } },
    labels,
    legend: { position: "bottom", fontSize: "10px", markers: { size: 4 }, itemMargin: { horizontal: 5, vertical: 2 } },
    stroke: { width: 2, colors: ["#ffffff"] },
    dataLabels: { enabled: false },
    tooltip: {
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
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Top 10",
              color: "#7b8798",
              fontSize: "11px",
              formatter: () => total.toLocaleString(),
            },
            value: { show: true, color: "#14213d", fontSize: "14px", fontWeight: 700 },
          },
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
      </div>
    </section>
  );
};

export default ApexChartLeft;
