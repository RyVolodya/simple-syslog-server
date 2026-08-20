import "./TableMessage.scss";
import SelectCountMessages from "../SelectCountMessage/SelectCountMessage";
import { MessageLimit } from "../../types/form.type";
interface MessageTableProps {
  messages: MessageLimit[];
  loading: boolean;
  error: any;
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
}

const MessageTable: React.FC<MessageTableProps> = ({
  messages,
  loading,
  error,
  limit,
  setLimit,
}) => {
  // ✅ ФУНКЦІЯ ФОРМАТУВАННЯ ДАТИ
  const formatDate = (value: string) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? "—" : date.toLocaleString("uk-UA");
  };

  if (loading) return <p>Іде завантаження ...</p>;
  if (error) return <p>Помилка завантаження!</p>;
  if (messages.length === 0) return <p>Список повідомлень пустий!</p>;

  return (
    <>
      <div className="header__messages">
        <h3 className="page__title">Останні {limit} повідомлень</h3>
        <SelectCountMessages limit={limit} setLimit={setLimit} />
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Дата та час</th>
              <th>Пристрій</th>
              <th>Повідомлення</th>
            </tr>
          </thead>

          <tbody>
            {messages.map((msg, index) => {
              return (
                <tr key={`${msg.time}-${index}`}>
                  <td>{formatDate(msg.time)}</td>
                  <td>{msg.deviceId}</td>
                  <td>{msg.message}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default MessageTable;
