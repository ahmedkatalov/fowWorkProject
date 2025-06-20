import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    uid: null,
    email: null,
    role: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.uid = action.payload.uid;
      state.email = action.payload.email;
      state.role = action.payload.role;
    },
    logout: (state) => {
      state.uid = null;
      state.email = null;
      state.role = null;
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
