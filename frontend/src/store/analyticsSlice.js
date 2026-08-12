import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchAnalytics = createAsyncThunk('analytics/fetch', async (params={}, { rejectWithValue }) => {
  try { const res = await api.get(`/analytics?${new URLSearchParams(params)}`); return res.data.data; }
  catch(e) { return rejectWithValue(e.response?.data?.message); }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: { data: null, loading: false, error: null },
  reducers: {},
  extraReducers: b => {
    b.addCase(fetchAnalytics.pending, s => { s.loading=true; s.error=null; })
     .addCase(fetchAnalytics.fulfilled, (s,a) => { s.loading=false; s.data=a.payload; })
     .addCase(fetchAnalytics.rejected, (s,a) => { s.loading=false; s.error=a.payload; });
  },
});
export default analyticsSlice.reducer;
