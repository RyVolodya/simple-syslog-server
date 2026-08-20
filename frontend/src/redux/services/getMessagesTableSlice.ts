import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Message {
  id: number;
  device: string;
  content: string;
  type: number;
  time: string;
}

interface MessagesState {
  messages: Message[];
  loading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  messages: [],
  loading: false,
  error: null,
};

export const messagesTableSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setMessages(state, action: PayloadAction<Message[]>) {
      state.messages = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading(state) {
      state.loading = true;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setMessages, setLoading, setError } = messagesTableSlice.actions;
export default messagesTableSlice.reducer;
