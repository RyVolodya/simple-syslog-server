import { server } from "./config/server";
import { migrateAuthAndSettings } from "./auth/migrate";

async function main() {
  await migrateAuthAndSettings();
  const port = Number(process.env.PORT || 5000);
  server.listen(port, "0.0.0.0", () => console.log(`Simple Syslog Server backend listening on :${port}`));
}
main().catch((e) => { console.error("Startup failed", e); process.exit(1); });
