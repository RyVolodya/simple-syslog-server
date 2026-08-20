-- Повний скрипт для створення тригера (якщо його немає)
-- Виконайте цей SQL в PostgreSQL

-- 1. Створюємо функцію для тригера
CREATE OR REPLACE FUNCTION notify_new_event()
RETURNS trigger AS $$
BEGIN
  -- Відправляємо NOTIFY на всі потрібні канали
  PERFORM pg_notify('systemevents_insert', row_to_json(NEW)::text);
  PERFORM pg_notify('table_size_updates', '');
  PERFORM pg_notify('stats_channel', '');
  PERFORM pg_notify('log_updates', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Видаляємо старий тригер, якщо він існує
DROP TRIGGER IF EXISTS systemevents_notify ON systemevents;

-- 3. Створюємо новий тригер
CREATE TRIGGER systemevents_notify
AFTER INSERT ON systemevents
FOR EACH ROW EXECUTE FUNCTION notify_new_event();

-- 4. Перевірка: переконайтеся, що тригер створений
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'systemevents_notify';

