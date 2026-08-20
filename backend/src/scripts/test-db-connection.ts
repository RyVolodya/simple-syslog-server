// Скрипт для тестування підключення до БД та перевірки тригера
// Запустіть: npx ts-node src/scripts/test-db-connection.ts

import { pool } from "../db/pool";

async function testConnection() {
  try {
    console.log("🔍 Тестування підключення до PostgreSQL...");

    const client = await pool.connect();
    console.log("✅ Підключення успішне!");

    // Перевірка тригера
    const triggerCheck = await client.query(`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname = 'notify_new_event'
    `);

    if (triggerCheck.rows.length === 0) {
      console.error("❌ Функція notify_new_event не знайдена!");
      console.log("💡 Виконайте SQL з файлу src/sql/update_trigger.sql");
    } else {
      console.log("✅ Функція notify_new_event знайдена");
      const funcSource = triggerCheck.rows[0].prosrc;

      // Перевірка, чи є всі потрібні канали
      const channels = ["table_size_updates", "stats_channel", "log_updates"];
      const missingChannels = channels.filter((ch) => !funcSource.includes(ch));

      if (missingChannels.length > 0) {
        console.error(`❌ В функції відсутні канали: ${missingChannels.join(", ")}`);
        console.log("💡 Оновіть тригер через src/sql/update_trigger.sql");
      } else {
        console.log("✅ Всі потрібні канали присутні в тригері");
      }
    }

    // Перевірка тригера на таблиці
    const triggerExists = await client.query(`
      SELECT tgname 
      FROM pg_trigger 
      WHERE tgname = 'systemevents_notify'
    `);

    if (triggerExists.rows.length === 0) {
      console.warn("⚠️ Тригер systemevents_notify не знайдений!");
      console.log("🔧 Створюю тригер автоматично...");

      try {
        // Створюємо функцію
        await client.query(`
          CREATE OR REPLACE FUNCTION notify_new_event()
          RETURNS trigger AS $$
          BEGIN
            PERFORM pg_notify('systemevents_insert', row_to_json(NEW)::text);
            PERFORM pg_notify('table_size_updates', '');
            PERFORM pg_notify('stats_channel', '');
            PERFORM pg_notify('log_updates', '');
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `);

        // Створюємо тригер
        await client.query(`
          CREATE TRIGGER systemevents_notify
          AFTER INSERT ON systemevents
          FOR EACH ROW EXECUTE FUNCTION notify_new_event();
        `);

        console.log("✅ Тригер успішно створено!");
      } catch (createError: any) {
        console.error("❌ Помилка створення тригера:", createError.message);
        console.log("💡 Виконайте SQL вручну з файлу src/sql/create_trigger.sql");
      }
    } else {
      console.log("✅ Тригер systemevents_notify активний");
    }

    // Тестовий INSERT
    console.log("\n🧪 Виконую тестовий INSERT...");
    const testInsert = await client.query(`
      INSERT INTO systemevents (priority, fromhost, message) 
      VALUES (5, 'test-connection', 'Test message from connection script')
      RETURNING id
    `);
    console.log(`✅ Тестовий запис додано з ID: ${testInsert.rows[0].id}`);
    console.log("💡 Перевірте логи бекенду - мають з'явитися NOTIFICATION повідомлення");

    client.release();
    await pool.end();
    console.log("\n✅ Тестування завершено");
  } catch (error) {
    console.error("❌ Помилка:", error);
    process.exit(1);
  }
}

testConnection();
