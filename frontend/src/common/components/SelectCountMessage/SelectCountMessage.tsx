//ОТРИМУЄМО ОСТАННІ КІЛЬКІСТЬ ПОВІДОМЛЕНЬ 10 25 50
import React from "react";
import "./SelectCountMessage.scss";
interface SelectCountMessagesProps {
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
}
const SelectCountMessages: React.FC<SelectCountMessagesProps> = ({ limit, setLimit }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
  };

  return (
    <div className="wrap-select-mess">
      <label htmlFor="messages-limit" className="label-select">
        Оберіть кількість повідомлень:
      </label>
      <select
        id="messages-limit"
        value={limit}
        onChange={handleChange}
        className="border rounded-md px-2 py-1"
      >
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
      </select>
    </div>
  );
};

export default SelectCountMessages;
