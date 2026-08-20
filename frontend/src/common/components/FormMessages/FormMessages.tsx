import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./FormMessages.scss";
import React, { useEffect, useRef, useState } from "react";
import { DateRange, RangeKeyDict } from "react-date-range";
import { useGetDevicesQuery } from "../../services/FilterMessages/FilterMessages";

interface MessageFilterFormProps {
  onSearch: (filters: {
    device?: string;
    type?: string;
    fromTime?: string;
    toTime?: string;
  }) => void;
}

const MessageFilterForm: React.FC<MessageFilterFormProps> = ({ onSearch }) => {
  const { data: devices = [], isLoading: isDevicesLoading } = useGetDevicesQuery();

  const [device, setDevice] = useState("");
  const [type, setType] = useState("");

  const [showCalendar, setShowCalendar] = useState(false);
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");

  const calendarRef = useRef<HTMLDivElement | null>(null);

  // Закриття календаря при кліку поза ним
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCalendar]);

  // Вибір діапазону дат
  const handleSelect = (ranges: RangeKeyDict) => {
    const selection = ranges.selection;

    setRange([
      {
        startDate: selection.startDate ?? new Date(),
        endDate: selection.endDate ?? new Date(),
        key: "selection",
      },
    ]);

    if (selection.startDate && selection.endDate) {
      setTimeout(() => setShowCalendar(false), 200);
    }
  };

  // Сабміт
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const start = new Date(range[0].startDate ?? new Date());
    const end = new Date(range[0].endDate ?? new Date());

    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);

    start.setHours(sh, sm);
    end.setHours(eh, em);

    onSearch({
      device: device || undefined,
      type: type || undefined,
      fromTime: start.toISOString(),
      toTime: end.toISOString(),
    });
  };

  return (
    <div className="form-wrapper">
      <form className="form" onSubmit={handleSubmit}>
        {/* Вибір пристрою */}
        <select
          className="form__input"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          disabled={isDevicesLoading}
        >
          <option value="">Виберіть пристрій</option>
          {devices.length > 0
            ? devices.map((d) => (
                <option key={d.id} value={d.id.toString()}>
                  {d.name}
                </option>
              ))
            : null}
        </select>

        {/* Вибір типу повідомлення */}
        <select className="form__input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Виберіть тип</option>
          <option value="0">Emergency</option>
          <option value="1">Alert</option>
          <option value="2">Critical</option>
          <option value="3">Error</option>
          <option value="4">Warning</option>
          <option value="5">Notice</option>
          <option value="6">Informational</option>
          <option value="7">Debug</option>
        </select>

        {/* Календар */}
        <div className="form__date-range" style={{ position: "relative" }}>
          <input
            type="text"
            readOnly
            className="form__input"
            value={`${range[0].startDate.toLocaleDateString()} ${startTime} — ${range[0].endDate.toLocaleDateString()} ${endTime}`}
            onClick={() => setShowCalendar((prev) => !prev)}
          />

          {showCalendar && (
            <div
              ref={calendarRef}
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                background: "white",
                borderRadius: "8px",
                padding: "10px",
                zIndex: 999,
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}
            >
              <DateRange ranges={range} onChange={handleSelect} moveRangeOnFirstSelection={false} />

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <div>
                  <label>Від:</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div>
                  <label>До:</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        <button className="form__button" type="submit">
          Знайти
        </button>
      </form>
    </div>
  );
};

export default MessageFilterForm;
