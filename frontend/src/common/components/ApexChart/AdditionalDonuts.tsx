import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { useSubscribeMessageStatsQuery } from "../../services/MessagePercent/MessagePercent";
import { useSubscribeDevicesPercentStatsQuery } from "../../services/DevicesPercent/DevicesPercent";
import "./ApexChart.scss";

const baseOptions = (
  labels: string[],
  totalLabel: string,
  totalValue: string,
  tooltipFormatter: (value: number) => string,
  valueFormatter: (value: number) => string = (value) => Number(value).toLocaleString(),
  colors?: string[],
): ApexCharts.ApexOptions => ({
  chart: {
    type: "donut",
    toolbar: { show: false },
    animations: { enabled: false },
    sparkline: { enabled: false },
  },
  labels,
  ...(colors ? { colors } : {}),
  legend: {
    position: "bottom",
    fontSize: "10px",
    markers: { size: 4 },
    itemMargin: { horizontal: 5, vertical: 2 },
  },
  stroke: { width: 2, colors: ["#ffffff"] },
  dataLabels: { enabled: false },
  tooltip: { y: { formatter: tooltipFormatter } },
  plotOptions: {
    pie: {
      donut: {
        size: "70%",
        labels: {
          show: true,
          name: { show: true, color: "#7b8798", fontSize: "10px" },
          value: {
            show: true,
            color: "#14213d",
            fontSize: "18px",
            fontWeight: 700,
            formatter: valueFormatter,
          },
          total: {
            show: true,
            label: totalLabel,
            color: "#7b8798",
            fontSize: "10px",
            formatter: () => totalValue,
          },
        },
      },
    },
  },
});

export const EventHealthChart: React.FC = () => {
  const { data } = useSubscribeMessageStatsQuery();

  const grouped = useMemo(() => {
    const stats = Array.isArray(data) ? data : [];
    let critical = 0;
    let warning = 0;
    let normal = 0;

    for (const item of stats) {
      const severity = Number(item.message_type);
      const count = Number(item.count ?? 0);
      if (severity >= 0 && severity <= 3) critical += count;
      else if (severity === 4) warning += count;
      else normal += count;
    }

    return { critical, warning, normal, total: critical + warning + normal };
  }, [data]);

  const toPercent = (value: number) =>
    grouped.total > 0 ? (value * 100) / grouped.total : 0;

  const formatPercent = (value: number) =>
    `${new Intl.NumberFormat("uk-UA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value))}%`;

  const series = [
    toPercent(grouped.critical),
    toPercent(grouped.warning),
    toPercent(grouped.normal),
  ];

  const options = baseOptions(
    ["Critical / Error", "Warning", "Normal"],
    "Health",
    grouped.total > 0 ? "100%" : "0%",
    (value) => formatPercent(value),
    formatPercent,
    ["#a855f7", "#ef4444", "#16a34a"],
  );

  return (
    <section className="donut-card">
      <div className="donut-card__header">
        <div>
          <span>Health</span>
          <h2>Event health</h2>
          <p>Actionable versus normal events in the last 24 hours.</p>
        </div>
      </div>
      <div className="donut-card__chart">
        <ReactApexChart type="donut" options={options} series={series} height={238} />
      </div>
    </section>
  );
};

export const SourceConcentrationChart: React.FC = () => {
  const { data } = useSubscribeDevicesPercentStatsQuery();

  const stats = useMemo(
    () => (Array.isArray(data) ? data.slice(0, 10) : []),
    [data],
  );

  const formatPercent = (value: number) =>
    `${new Intl.NumberFormat("uk-UA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value))}%`;

  const labels = stats.map((item) => item.device_id || "Unknown");
  const topTenMessages = stats.reduce(
    (sum, item) => sum + Number(item.messages ?? 0),
    0,
  );
  const totalMessages = Math.max(
    topTenMessages,
    Number(stats[0]?.total_messages ?? 0),
  );

  // Calculate from raw message counts instead of summing already-rounded
  // percentages. This prevents values such as Top 10 = 100.01%.
  const topTenSeries = stats.map((item) =>
    totalMessages > 0 ? (Number(item.messages ?? 0) * 100) / totalMessages : 0,
  );
  const topTenPercent =
    totalMessages > 0 ? Math.min(100, (topTenMessages * 100) / totalMessages) : 0;
  const otherPercent = Math.max(0, 100 - topTenPercent);

  const series = otherPercent > 0.005
    ? [...topTenSeries, otherPercent]
    : topTenSeries;

  const chartLabels = otherPercent > 0.005
    ? [...labels, "Other devices"]
    : labels;

  const options = baseOptions(
    chartLabels,
    "Top 10",
    formatPercent(topTenPercent),
    (value) => `${formatPercent(value)} of messages`,
    formatPercent,
  );

  return (
    <section className="donut-card">
      <div className="donut-card__header">
        <div>
          <span>Sources</span>
          <h2>Traffic concentration</h2>
          <p>Traffic share for each Top 10 device, plus all remaining devices.</p>
        </div>
      </div>
      <div className="donut-card__chart">
        <ReactApexChart type="donut" options={options} series={series} height={238} />
      </div>
    </section>
  );
};
