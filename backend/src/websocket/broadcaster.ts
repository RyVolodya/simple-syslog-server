//універсальна, багаторазова функція

//1. створює і формує JSON-повідомлення виду
// "type": "some-type",
// "data": "some-data"

import WebSocket from "ws";

export const clients = new Set<WebSocket>();

export function broadcast(type: string, data: any) {
  const payload = JSON.stringify({ type, data });
  //2. Проходить по всіх клієнтах браузерах
  for (const ws of clients) {
    //3. Перевіряє, чи клієнт онлайн
    if (ws.readyState === WebSocket.OPEN) {
      //4. Надсилає повідомлення з беку всім клієнтам
      ws.send(payload);
    }
  }
}
