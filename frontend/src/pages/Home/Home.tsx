import "./Home.scss";
import React from "react";
import { LuMessageSquareText, LuActivity, LuServer, LuDatabase } from "react-icons/lu";
import { useSubscribeStatsQuery } from "../../common/services/StatsDevices/StatsDevices";
import MessagesChart from "../../common/components/MessagesChart/MessagesChart";
import ApexChart from "../../common/components/ApexChart/ApexChart";
import ApexChartLeft from "../../common/components/ApexChart/ApexChartLeft";
import { EventHealthChart, SourceConcentrationChart } from "../../common/components/ApexChart/AdditionalDonuts";
import { useAppSelector } from "../../hooks/hooks";

const Dashboard: React.FC = () => {
  const { data } = useSubscribeStatsQuery();
  const { value, unit } = useAppSelector((state) => state.db);

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

      <MessagesChart />

      <div className="dashboard-charts-grid">
        <ApexChartLeft />
        <ApexChart />
        <EventHealthChart />
        <SourceConcentrationChart />
      </div>
    </section>
  );
};

export default Dashboard;
