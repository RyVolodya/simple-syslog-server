import { getStats } from "./listenLogs";
import { listenLast24 } from "./listenLast-24h";
import { listenTableSize } from "./listenTableSize";
import { listenDeviceStats } from "./listenStatDevice";
import { listenMessageStats } from "./listenMessageStats";
export async function listenLogs() {
  await getStats();
  await listenLast24();
  await listenTableSize();
  await listenDeviceStats();
  await listenMessageStats();
}

//client	окреме підключення до бази
//LISTEN channel  	підписка на канал
//  NOTIFY channel, 'msg'	база надсилає повідомлення
// notification	подія у Node.js, яка спрацьовує, коли БД шле NOTIFY

//client.on("notification", (msg) => {     повідомлення яке приходить з БД
//  console.log(msg.channel); //      "table_size_updates" канал по якому приходять дані
//  console.log(msg.payload); //     "hello"   самі дані
//});
