// types.ts
export interface MessageForm {
  type: "information" | "warning" | "error";
  content: string;
  timestamp: {
    year: number;
    month: number;
    week: number;
    day: number;
  };
}

export interface Device {
  id: number;
  name: string;
  ip: string;
  alias: string | null;
  reportedHostname: string | null;
  reportedHostnameValid: boolean;
  firstSeen?: string;
  lastSeen?: string;
  messages?: MessageForm[];
}

export interface MessageFilter {
  device?: string;
  type?: string;
  fromTime?: string;
  toTime?: string;
}

export type MessageType = "error" | "warning" | "information";

export interface Message {
  id: number;
  device: string;
  time: string;
  type: MessageType;
  content: string;
}
export interface MessageLimit {
  time: string;
  deviceId: string | null;
  message: string;
}
