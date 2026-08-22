import "./Home.scss";
import "../Message/Message.scss";
import React from "react";
import { LuActivity, LuDatabase, LuMessageSquareText, LuServer } from "react-icons/lu";
import { useSubscribeStatsQuery } from "../../common/services/StatsDevices/StatsDevices";
import { useGetFilteredMessagesQuery } from "../../common/services/FilterMessages/FilterMessages";
import MessagesChart from "../../common/components/MessagesChart/MessagesChart";
import ApexChartLeft from "../../common/components/ApexChart/ApexChartLeft";
import { formatServerDateTime, useServerTimeZone } from "../../common/timezone/ServerTimeZoneContext";
import { useAppSelector } from "../../hooks/hooks";

const Dashboard: React.FC = () => {
  const { data } = useSubscribeStatsQuery();
  const { value, unit } = useAppSelector((state) => state.db);
  const serverTimeZone = useServerTimeZone();

  const {
    data: latestData,
    isLoading: latestLoading,
    isError: latestError,
  } = useGetFilteredMessagesQuery(
    { page: 1, limit: 10 },
    { pollingInterval: 10000 },
  );

  const latestMessages = latestData?.items ?? [];
  const formatDate = (value: string) => formatServerDateTime(value, serverTimeZone);

  return (
    <section className="dashboard-page">
      <div className="dashboard-kpis">
        <article className="dashboard-kpi dashboard-kpi--devices">
          <div className="dashboard-kpi__icon"><LuServer size={22} /></div>
          <div className="dashboard-kpi__body">
            <span className="dashboard-kpi__label">Devices</span>
            <strong className="dashboard-kpi__value">{data?.devices ?? 0}</strong>
            <span className="dashboard-kpi__meta">Known syslog sources</span>
          </div>
        </article>

        <article className="dashboard-kpi dashboard-kpi--messages">
          <div className="dashboard-kpi__icon"><LuMessageSquareText size={22} /></div>
          <div className="dashboard-kpi__body">
            <span className="dashboard-kpi__label">Messages</span>
            <strong className="dashboard-kpi__value">{(data?.messages ?? 0).toLocaleString()}</strong>
            <span className="dashboard-kpi__meta">Stored events</span>
          </div>
        </article>

        <article className="dashboard-kpi dashboard-kpi--database">
          <div className="dashboard-kpi__icon"><LuDatabase size={22} /></div>
          <div className="dashboard-kpi__body">
            <span className="dashboard-kpi__label">Database</span>
            <strong className="dashboard-kpi__value">
              {value ?? 0} <small>{unit ?? "B"}</small>
            </strong>
            <span className="dashboard-kpi__meta">systemevents table</span>
          </div>
        </article>

        <article className="dashboard-kpi dashboard-kpi--status">
          <div className="dashboard-kpi__icon"><LuActivity size={22} /></div>
          <div className="dashboard-kpi__body">
            <span className="dashboard-kpi__label">Collector</span>
            <strong className="dashboard-kpi__value dashboard-kpi__value--status">Online</strong>
            <span className="dashboard-kpi__meta">Realtime channel active</span>
          </div>
        </article>
      </div>

      <div className="dashboard-primary-grid">
        <ApexChartLeft />
        <MessagesChart />
      </div>

      <div className="dashboard-latest">
        <div className="messages-table-card">
          <div className="messages-table-card__header">
            <div>
              <span className="messages-table-card__eyebrow">Event log</span>
              <h2>Latest 10 messages</h2>
              <p>Automatically refreshed from the collector</p>
            </div>
          </div>

          <div className="messages-table-wrap">
            <table className="messages-table">
              <thead>
                <tr>
                  <th>Date &amp; time</th>
                  <th>Device</th>
                  <th>Severity</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {latestLoading && !latestData ? (
                  <tr>
                    <td colSpan={4} className="messages-table__state">
                      <LuActivity className="spin" /> Loading messages...
                    </td>
                  </tr>
                ) : latestError && !latestData ? (
                  <tr>
                    <td colSpan={4} className="messages-table__state messages-table__state--error">
                      Unable to load messages.
                    </td>
                  </tr>
                ) : latestMessages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="messages-table__state">No messages received yet.</td>
                  </tr>
                ) : (
                  latestMessages.map((message) => (
                    <tr key={message.id}>
                      <td className="messages-table__time">{formatDate(message.time)}</td>
                      <td><span className="device-pill">{message.deviceId || "Unknown"}</span></td>
                      <td>
                        <span className={`severity-badge severity-badge--${message.severity}`}>
                          <i />
                          {message.severityLabel}
                        </span>
                      </td>
                      <td className="messages-table__message">{message.message}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
