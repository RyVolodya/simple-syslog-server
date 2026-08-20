-- Тестовий скрипт для перевірки роботи тригера та NOTIFY
-- Виконайте цей SQL в PostgreSQL для тестування

-- 1. Спочатку переконайтеся, що тригер оновлено:
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'notify_new_event';

-- 2. Перевірте, чи існує тригер:
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'systemevents_notify';

-- 3. Тестовий INSERT для перевірки NOTIFY:
INSERT INTO systemevents (priority, fromhost, message) 
VALUES (5, 'test-host', 'Test message for NOTIFY trigger');

-- Після виконання INSERT ви маєте побачити NOTIFY на каналах:
-- - systemevents_insert
-- - table_size_updates
-- - stats_channel
-- - log_updates

-- 4. Перевірте, чи є активні LISTEN підключення (в іншому терміналі psql):
-- SELECT * FROM pg_stat_activity WHERE state = 'active';

