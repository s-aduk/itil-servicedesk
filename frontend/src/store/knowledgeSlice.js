import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchArticles = createAsyncThunk('kb/fetchAll', async (params={}, { rejectWithValue }) => {
  try { const res = await api.get(`/knowledge?${new URLSearchParams(params)}`); return res.data; }
  catch(e) { return rejectWithValue(e.response?.data?.message); }
});
export const fetchArticle = createAsyncThunk('kb/fetchOne', async (id, { rejectWithValue }) => {
  try { const res = await api.get(`/knowledge/${id}`); return res.data; }
  catch(e) { return rejectWithValue(e.response?.data?.message); }
});
export const createArticle = createAsyncThunk('kb/create', async (data, { rejectWithValue }) => {
  try { const res = await api.post('/knowledge', data); return res.data.data; }
  catch(e) { return rejectWithValue(e.response?.data?.message); }
});
export const updateArticle = createAsyncThunk('kb/update', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await api.patch(`/knowledge/${id}`, data); return res.data.data; }
  catch(e) { return rejectWithValue(e.response?.data?.message); }
});
export const deleteArticle = createAsyncThunk('kb/delete', async (id, { rejectWithValue }) => {
  try { await api.delete(`/knowledge/${id}`); return id; }
  catch(e) { return rejectWithValue(e.response?.data?.message); }
});
export const voteArticle = createAsyncThunk('kb/vote', async ({ id, helpful }, { rejectWithValue }) => {
  try { const res = await api.post(`/knowledge/${id}/vote`, { helpful }); return res.data.data; }
  catch(e) { return rejectWithValue(e.response?.data?.message); }
});
export const fetchAiSuggestion = createAsyncThunk('kb/aiSuggest', async (ticketId, { rejectWithValue }) => {
  try { const res = await api.get(`/knowledge/ai/suggest/${ticketId}`); return res.data.data; }
  catch(e) { return rejectWithValue(e.response?.data?.message); }
});

const kbSlice = createSlice({
  name: 'knowledge',
  initialState: { list: [], current: null, related: [], pagination: null, loading: false, submitting: false, error: null, aiSuggestion: null, aiLoading: false, aiError: null },
  reducers: { clearCurrent: s => { s.current=null; s.related=[]; }, clearAi: s => { s.aiSuggestion=null; s.aiError=null; } },
  extraReducers: b => {
    b.addCase(fetchArticles.pending, s => { s.loading=true; s.error=null; })
     .addCase(fetchArticles.fulfilled, (s,a) => { s.loading=false; s.list=a.payload.articles; s.pagination=a.payload.pagination; })
     .addCase(fetchArticles.rejected, (s,a) => { s.loading=false; s.error=a.payload; })
     .addCase(fetchArticle.pending, s => { s.loading=true; })
     .addCase(fetchArticle.fulfilled, (s,a) => { s.loading=false; s.current=a.payload.data; s.related=a.payload.related; })
     .addCase(fetchArticle.rejected, (s,a) => { s.loading=false; s.error=a.payload; })
     .addCase(createArticle.pending, s => { s.submitting=true; })
     .addCase(createArticle.fulfilled, (s,a) => { s.submitting=false; s.list=[a.payload,...s.list]; })
     .addCase(createArticle.rejected, (s,a) => { s.submitting=false; s.error=a.payload; })
     .addCase(deleteArticle.fulfilled, (s,a) => { s.list=s.list.filter(x=>x._id!==a.payload); })
     .addCase(fetchAiSuggestion.pending, s => { s.aiLoading=true; s.aiError=null; s.aiSuggestion=null; })
     .addCase(fetchAiSuggestion.fulfilled, (s,a) => { s.aiLoading=false; s.aiSuggestion=a.payload; })
     .addCase(fetchAiSuggestion.rejected, (s,a) => { s.aiLoading=false; s.aiError=a.payload; });
  },
});
export const { clearCurrent, clearAi } = kbSlice.actions;
export default kbSlice.reducer;
