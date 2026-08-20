import { createAsyncThunk } from "@reduxjs/toolkit";
import { Message, MessageFilter } from "../../types/form.type";

export interface MessageFilters {
  id: string;
  fromhost: string;
  message: string;
  priority: string;
  receivedat: string;
}

export default createAsyncThunk<Message[], MessageFilter>("messages/fetch", async (filters) => {
  const res = await fetch("/api/messages?...");
  const rows = await res.json();

  return rows.map((row: MessageFilters) => ({
    id: row.id,
    device: row.fromhost,
    time: row.receivedat,
    type: row.priority,
    content: row.message,
  }));
});
