import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchTickets = createAsyncThunk('tickets/fetchAll', async (params = {}, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/tickets?${query}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch tickets');
  }
});

export const fetchDashboard = createAsyncThunk('tickets/dashboard', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/tickets/dashboard');
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch dashboard');
  }
});

export const fetchTicketById = createAsyncThunk('tickets/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/tickets/${id}`);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Ticket not found');
  }
});

export const createTicket = createAsyncThunk('tickets/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/tickets', data);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create ticket');
  }
});

export const updateTicket = createAsyncThunk('tickets/update', async ({ id, updates }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/tickets/${id}`, updates);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update ticket');
  }
});

export const addNote = createAsyncThunk('tickets/addNote', async ({ id, content }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/tickets/${id}/notes`, { content });
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add note');
  }
});

const ticketSlice = createSlice({
  name: 'tickets',
  initialState: {
    list: [],
    current: null,
    pagination: null,
    stats: null,
    loading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearCurrent(state) { state.current = null; },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.tickets;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTickets.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchDashboard.fulfilled, (state, action) => { state.stats = action.payload; })

      .addCase(fetchTicketById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTicketById.fulfilled, (state, action) => { state.loading = false; state.current = action.payload; })
      .addCase(fetchTicketById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createTicket.pending, (state) => { state.submitting = true; state.error = null; })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.submitting = false;
        state.list = [action.payload, ...state.list];
      })
      .addCase(createTicket.rejected, (state, action) => { state.submitting = false; state.error = action.payload; })

      .addCase(updateTicket.fulfilled, (state, action) => {
        state.current = action.payload;
        state.list = state.list.map(t => t._id === action.payload._id ? action.payload : t);
      })
      .addCase(updateTicket.rejected, (state, action) => { state.error = action.payload; })

      .addCase(addNote.fulfilled, (state, action) => { state.current = action.payload; })
      .addCase(addNote.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearCurrent, clearError } = ticketSlice.actions;
export default ticketSlice.reducer;
