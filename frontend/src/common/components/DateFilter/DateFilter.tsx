//import React, { useState } from "react";
//import { DateRangePicker } from "react-date-range";
//import { addMonths } from "date-fns";
//import { useGetIntervalQuery } from "../../services/IntervalMessages/IntervalMessages";

/*const DateFilter: React.FC<{ onSelect: (range: any) => void }> = ({ onSelect }) => {
  const { data, isLoading } = useGetIntervalQuery();
  const retentionPeriod = data?.period ?? 3;

  const [state, setState] = useState([
    {
      startDate: addMonths(new Date(), -retentionPeriod),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const handleChange = (item: any) => {
    setState([item.selection]);
    onSelect({
      startDate: item.selection.startDate,
      endDate: item.selection.endDate,
    });
  };

  if (isLoading) return <p>Завантаження...</p>;

  return (
    <DateRangePicker
      ranges={state}
      onChange={handleChange}
      maxDate={new Date()}
      minDate={addMonths(new Date(), -retentionPeriod)}
      dateDisplayFormat="MMM d, yyyy"
    />
  );
};*/
import "./DateFilter.scss";
import React, { useEffect, useRef, useState } from "react";
import { DateRangePicker, Range, RangeKeyDict } from "react-date-range";
import { format, subDays } from "date-fns";
import { useGetIntervalQuery } from "../../services/IntervalMessages/IntervalMessages";

const DateFilter: React.FC<{ onSelect?: (range: { startDate: Date; endDate: Date }) => void }> = ({
  onSelect,
}) => {
  // ✅ Отримуємо період збереження з бекенду
  const { data, isLoading } = useGetIntervalQuery();
  const retentionPeriod = data?.days ?? 365;

  // ✅ Обчислюємо дати за замовчуванням
  const today = new Date();
  const defaultStart = subDays(today, retentionPeriod);
  const defaultEnd = today;

  // ✅ Стан вибраного діапазону
  const [range, setRange] = useState<Range[]>([
    {
      startDate: defaultStart,
      endDate: defaultEnd,
      key: "selection",
    },
  ]);

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // ✅ Якщо retentionPeriod змінюється (наприклад, коли прийшли дані з бекенду)
  // оновлюємо діапазон дат
  useEffect(() => {
    if (!isLoading && data) {
      const newStart = subDays(new Date(), retentionPeriod);
      const newEnd = new Date();
      setRange([{ startDate: newStart, endDate: newEnd, key: "selection" }]);
    }
  }, [data, isLoading, retentionPeriod]);

  // ✅ Обробка вибору діапазону
  const handleSelect = (ranges: RangeKeyDict) => {
    const { startDate, endDate } = ranges.selection;
    setRange([{ startDate, endDate, key: "selection" }]);
    onSelect?.({ startDate: startDate!, endDate: endDate! });
  };

  const start = range[0].startDate ?? new Date();
  const end = range[0].endDate ?? new Date();

  // ✅ Закривання при кліку поза модалкою
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Початок перетягування
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    document.body.style.userSelect = "none";
  };

  // ✅ Рух миші під час перетягування
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - offsetRef.current.x,
          y: e.clientY - offsetRef.current.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = "auto";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // ✅ Вивід JSX
  return (
    <div className="form__time">
      <input
        type="text"
        readOnly
        value={`${format(start, "MM/dd/yyyy")} - ${format(end, "MM/dd/yyyy")}`}
        onClick={() => setOpen(true)}
        className="form__date-input"
      />

      {open && (
        <div className="calendar-modal-overlay">
          <div
            ref={modalRef}
            className={`calendar-modal ${isDragging ? "dragging" : ""}`}
            style={{
              position: "absolute",
              top: `${position.y}px`,
              left: `${position.x}px`,
            }}
          >
            <div
              className="calendar-modal-header"
              onMouseDown={handleMouseDown}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
              📅 Перетягни мене
            </div>

            <DateRangePicker
              ranges={range}
              onChange={handleSelect}
              moveRangeOnFirstSelection={false}
              rangeColors={["#3b82f6"]}
              direction="horizontal"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateFilter;
