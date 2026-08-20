import "./MessagesChart.scss";
import { useGetStatsQuery } from "../../services/messages/createApiMessChart";
import { useEffect, useMemo, useState } from "react";
import { formatServerHour, useServerTimeZone } from "../../timezone/ServerTimeZoneContext";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface StatsPoint {
  hour: string;
  total: number;
}

export default function MessagesChart() {
  const serverTimeZone = useServerTimeZone();
  const { data } = useGetStatsQuery();
  const [liveData, setLiveData] = useState<StatsPoint[]>([]);

  useEffect(() => {
    if (data) {
      setLiveData(data.map((x: any) => ({ hour: x.hour, total: Number(x.total) })));
    }
  }, [data]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "last24h_stats" && Array.isArray(msg.data)) {
          setLiveData(msg.data.map((x: any) => ({ hour: x.hour, total: Number(x.total) })));
        }
      } catch (error) {
        console.error("[MessagesChart] WebSocket parse error", error);
      }
    };

    return () => ws.close();
  }, []);

  const total24h = useMemo(
    () => liveData.reduce((sum, point) => sum + Number(point.total || 0), 0),
    [liveData],
  );

  const formatHour = (value: string) => formatServerHour(value, serverTimeZone);

  return (
    <section className="messages-chart-card">
      <div className="messages-chart-card__header">
        <div>
          <span className="messages-chart-card__eyebrow">Traffic</span>
          <h2>Messages over the last 24 hours</h2>
          <p>Hourly syslog event volume with live updates.</p>
        </div>
        <div className="messages-chart-card__metric">
          <span>24h total</span>
          <strong>{total24h.toLocaleString()}</strong>
        </div>
      </div>

      <div className="messages-chart-card__chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={liveData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#edf1f6" />
            <XAxis
              dataKey="hour"
              tickFormatter={formatHour}
              tick={{ fill: "#7f8ca0", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={26}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#7f8ca0", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              labelFormatter={(label) => formatHour(String(label))}
              formatter={(value: number) => [Number(value).toLocaleString(), "Messages"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #e7ecf3", boxShadow: "0 10px 24px rgba(30,45,75,.10)" }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#246bfd"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
