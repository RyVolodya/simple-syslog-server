export interface Message {
  id: string;
  type: "information" | "warning" | "error";
  contexts: string;
  dataTime: Date;
}
export interface Device {
  id: string;
  name: string;
  ip: string;
  messages: Message[];
}
