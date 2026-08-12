import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Load persisted user from localStorage
const storedUser = (() => {
  try { return JSON.parse(localStorage.getItem('sd_user')); } catch { return null; }
})();

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', credentials);
    const { user, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('sd_user', JSON.stringify(user));
    localStorage.setItem('sd_token', accessToken);
    localStorage.setItem('sd_refresh', refreshToken);
    return { user, accessToken };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data);
    const { user, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('sd_user', JSON.stringify(user));
    localStorage.setItem('sd_token', accessToken);
    localStorage.setItem('sd_refresh', refreshToken);
    return { user, accessToken };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser || null,
    token: localStorage.getItem('sd_token') || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('sd_user');
      localStorage.removeItem('sd_token');
      localStorage.removeItem('sd_refresh');
    },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => { state.loading = true; state.error = null; };
    const handleFulfilled = (state, action) => {
      state.loading = false;
      state.user = action.payload.user || action.payload;
      if (action.payload.accessToken) state.token = action.payload.accessToken;
    };
    const handleRejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, handleFulfilled)
      .addCase(loginUser.rejected, handleRejected)
      .addCase(registerUser.pending, handlePending)
      .addCase(registerUser.fulfilled, handleFulfilled)
      .addCase(registerUser.rejected, handleRejected)
      .addCase(fetchMe.fulfilled, (state, action) => { state.user = action.payload; })
      .addCase(fetchMe.rejected, (state) => { state.user = null; state.token = null; });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
