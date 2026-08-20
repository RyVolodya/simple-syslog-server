import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DbState {
  value: number | null;
  unit: string | null;
}

const initialState: DbState = {
  value: null,
  unit: null,
};

const dbSlice = createSlice({
  name: "db",
  initialState,
  reducers: {
    setDbSize(state, action: PayloadAction<{ value: number; unit: string }>) {
      state.value = action.payload.value;
      state.unit = action.payload.unit;
    },
  },
});

export const { setDbSize } = dbSlice.actions;
export default dbSlice.reducer;
