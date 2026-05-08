import axios from 'axios';

// ─── CONFIG ────────────────────────────────────────────────────────────────
// Change BASE_URL to your real backend when ready. That's the only change needed.
const BASE_URL = 'https://your-api.wastesmart.com/api';
const USE_MOCK = true; // Set false when backend is ready

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (config.token) {
    config.headers.Authorization = `Bearer ${config.token}`;
  }
  return config;
});

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK = {
  users: [
    { id: 1, name: 'Rahul Patil', email: 'student@hostel.com', password: '123456', role: 'student', floor: 3, credits: 245 },
    { id: 2, name: 'Anita Kulkarni', email: 'staff@hostel.com', password: '123456', role: 'staff', credits: 0 },
  ],

  bins: [
    { binId: 101, floor: 1, fillLevel: 38, location: 'Near staircase' },
    { binId: 102, floor: 2, fillLevel: 65, location: 'Common room' },
    { binId: 103, floor: 3, fillLevel: 42, location: 'Near staircase' },
    { binId: 104, floor: 4, fillLevel: 92, location: 'Common room' },
    { binId: 105, floor: 5, fillLevel: 57, location: 'Corridor end' },
    { binId: 106, floor: 6, fillLevel: 29, location: 'Near staircase' },
  ],

  tasks: [
    { taskId: 1, binId: 104, floor: 4, location: 'Common room', status: 'pending', assignedTo: 2, reportedAt: '2026-04-04T08:12:00Z', issue: 'Bin overflowing' },
    { taskId: 2, binId: 102, floor: 2, location: 'Common room', status: 'in_progress', assignedTo: 2, reportedAt: '2026-04-04T07:50:00Z', issue: 'Routine clean' },
    { taskId: 3, binId: 103, floor: 3, location: 'Near staircase', status: 'pending', assignedTo: 2, reportedAt: '2026-04-04T09:00:00Z', issue: 'Student complaint' },
    { taskId: 4, binId: 101, floor: 1, location: 'Near staircase', status: 'completed', assignedTo: 2, reportedAt: '2026-04-04T06:00:00Z', issue: 'Routine clean' },
  ],

  foodItems: [
    { foodId: 1, dish: 'Vegetable Curry', quantity: 12, expiry: '2026-04-04T19:00:00Z', postedBy: 'Mess Manager', status: 'available', emoji: '🍛' },
    { foodId: 2, dish: 'Steamed Rice', quantity: 20, expiry: '2026-04-04T19:00:00Z', postedBy: 'Mess Manager', status: 'available', emoji: '🍚' },
    { foodId: 3, dish: 'Chapati', quantity: 3, expiry: '2026-04-04T18:30:00Z', postedBy: 'Mess Manager', status: 'low', emoji: '🫓' },
    { foodId: 4, dish: 'Dal Tadka', quantity: 8, expiry: '2026-04-04T20:00:00Z', postedBy: 'Mess Manager', status: 'available', emoji: '🥘' },
  ],

  rewards: [
    { id: 1, type: 'recycling', description: 'Recycled plastic waste', credits: 10, date: '2026-04-04T07:00:00Z' },
    { id: 2, type: 'food_claim', description: 'Claimed surplus food', credits: 5, date: '2026-04-04T13:00:00Z' },
    { id: 3, type: 'recycling', description: 'Recycled paper waste', credits: 10, date: '2026-04-03T11:00:00Z' },
    { id: 4, type: 'food_claim', description: 'Claimed surplus food', credits: 5, date: '2026-04-03T13:30:00Z' },
  ],
};

// ─── AUTH ───────────────────────────────────────────────────────────────────
export const loginUser = async (email, password) => {
  if (USE_MOCK) {
    await delay(800);
    const user = MOCK.users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid email or password');
    const { password: _, ...safeUser } = user;
    return { token: 'mock_jwt_token_' + user.id, user: safeUser };
  }
  const res = await api.post('/login', { email, password });
  return res.data;
};

// ─── BINS ───────────────────────────────────────────────────────────────────
export const getBinStatus = async (token) => {
  if (USE_MOCK) {
    await delay(500);
    return MOCK.bins;
  }
  const res = await api.get('/bin-status', { token });
  return res.data;
};

// ─── CLEANING REQUESTS ──────────────────────────────────────────────────────
export const submitCleaningRequest = async (token, studentId, binId, issue) => {
  if (USE_MOCK) {
    await delay(600);
    return { requestId: Math.floor(Math.random() * 1000), status: 'pending' };
  }
  const res = await api.post('/cleaning-request', { studentId, binId, issue }, { token });
  return res.data;
};

// ─── TASKS (STAFF) ──────────────────────────────────────────────────────────
export const getStaffTasks = async (token, staffId) => {
  if (USE_MOCK) {
    await delay(500);
    return MOCK.tasks.filter(t => t.assignedTo === staffId);
  }
  const res = await api.get(`/tasks?staffId=${staffId}`, { token });
  return res.data;
};

export const updateTaskStatus = async (token, taskId, status) => {
  if (USE_MOCK) {
    await delay(600);
    const task = MOCK.tasks.find(t => t.taskId === taskId);
    if (task) task.status = status;
    return { taskId, status };
  }
  const res = await api.patch(`/tasks/${taskId}`, { status }, { token });
  return res.data;
};

// ─── FOOD ───────────────────────────────────────────────────────────────────
export const getFoodItems = async (token) => {
  if (USE_MOCK) {
    await delay(500);
    return MOCK.foodItems;
  }
  const res = await api.get('/food-items', { token });
  return res.data;
};

export const claimFood = async (token, studentId, foodId, qrCode) => {
  if (USE_MOCK) {
    await delay(800);
    if (qrCode !== 'MOCK_QR') throw new Error('Invalid QR code');
    const item = MOCK.foodItems.find(f => f.foodId === foodId);
    if (!item || item.quantity === 0) throw new Error('Item not available');
    item.quantity -= 1;
    return { claimed: true, creditsEarned: 5 };
  }
  const res = await api.post('/claim-food', { studentId, foodId, qrCode }, { token });
  return res.data;
};

// ─── REWARDS ────────────────────────────────────────────────────────────────
export const getRewards = async (token, studentId) => {
  if (USE_MOCK) {
    await delay(400);
    return { transactions: MOCK.rewards, totalCredits: 245 };
  }
  const res = await api.get(`/rewards/${studentId}`, { token });
  return res.data;
};

// ─── UTILS ──────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
