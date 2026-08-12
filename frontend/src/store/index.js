import { configureStore } from '@reduxjs/toolkit';
import authReducer         from './authSlice';
import ticketReducer       from './ticketSlice';
import notificationReducer from './notificationSlice';
import knowledgeReducer    from './knowledgeSlice';
import analyticsReducer    from './analyticsSlice';
export const store = configureStore({
  reducer: { auth: authReducer, tickets: ticketReducer, notifications: notificationReducer, knowledge: knowledgeReducer, analytics: analyticsReducer },
});
