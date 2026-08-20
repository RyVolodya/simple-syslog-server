import { configureStore } from "@reduxjs/toolkit";
import messagesReducer from "./services/messagesSlice";
import { statsApi as statsDevicesApi } from "../common/services/StatsDevices/StatsDevices";
import { statsApi as statsDeviceApi } from "../common/services/DevicesPercent/DevicesPercent";
import { statsApi as messageStatsApi } from "../common/services/MessagePercent/MessagePercent";
import { statsApi as messagesChartApi } from "../common/services/messages/createApiMessChart";
import { messagesFilterApi } from "../common/services/FilterMessages/FilterMessages";
import { settingsApi } from "../common/services/IntervalMessages/IntervalMessages";
import { adminApi } from "../common/services/SettingAdmin/SettingAdmin";
import dbReducer from "../redux/services/getDbSize";
import { devicesApi } from "../common/services/DevicesName/DevicesName";
import { messagesLimitApi } from "../common/services/MessagesLimit/MessagesLimit";

export const store = configureStore({
  reducer: {
    db: dbReducer,
    messages: messagesReducer,
    [statsDevicesApi.reducerPath]: statsDevicesApi.reducer,
    [statsDeviceApi.reducerPath]: statsDeviceApi.reducer,
    [messageStatsApi.reducerPath]: messageStatsApi.reducer,
    [messagesChartApi.reducerPath]: messagesChartApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [messagesFilterApi.reducerPath]: messagesFilterApi.reducer,
    [devicesApi.reducerPath]: devicesApi.reducer,
    [messagesLimitApi.reducerPath]: messagesLimitApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      statsDevicesApi.middleware,
      statsDeviceApi.middleware,
      messageStatsApi.middleware,
      messagesChartApi.middleware,
      settingsApi.middleware,
      adminApi.middleware,
      messagesFilterApi.middleware,
      messagesLimitApi.middleware,
      devicesApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
