import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (params={}, { rejectWithValue }) => {
  try {
    const q = new URLSearchParams(params).toString();
    const res = await api.get(`/notifications?${q}`);
    return res.data;
  } catch(e){ return rejectWithValue(e.response?.data?.message); }
});
export const markRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try { await api.patch(`/notifications/${id}/read`); return id; }
  catch(e){ return rejectWithValue(e.response?.data?.message); }
});
export const markAllRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try { await api.patch('/notifications/read-all'); }
  catch(e){ return rejectWithValue(e.response?.data?.message); }
});

const notificationSlice = createSlice({
  name:'notifications',
  initialState:{ list:[], unreadCount:0, loading:false },
  reducers:{},
  extraReducers:(b) => {
    b.addCase(fetchNotifications.pending, s => { s.loading=true; })
     .addCase(fetchNotifications.fulfilled, (s,a) => {
       s.loading=false; s.list=a.payload.data; s.unreadCount=a.payload.unreadCount;
     })
     .addCase(markRead.fulfilled, (s,a) => {
       const n = s.list.find(x=>x._id===a.payload);
       if (n && !n.read){ n.read=true; s.unreadCount=Math.max(0,s.unreadCount-1); }
     })
     .addCase(markAllRead.fulfilled, s => {
       s.list.forEach(n=>{ n.read=true; }); s.unreadCount=0;
     });
  },
});
export default notificationSlice.reducer;
