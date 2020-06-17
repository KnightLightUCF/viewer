/**
 * @file Slice of the state object that stores the settings of the current drone
 * show being executed.
 */

import { createSlice } from '@reduxjs/toolkit';

import { loadShow } from './async';

const { actions, reducer } = createSlice({
  name: 'show',

  initialState: {
    data: null,
    loading: false,
    error: null,
  },

  reducers: {
    clearLoadedShow: (state) => {
      state.data = null;
      state.error = null;
    },

    requestToLoadShow: () => {
      /* nothing to do, the loader saga will pick this up and take care of
       * everything */
    },
  },

  extraReducers: {
    [loadShow.fulfilled]: (state, action) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },

    [loadShow.pending]: (state) => {
      state.loading = true;
    },

    [loadShow.rejected]: (state) => {
      state.loading = false;
      state.error = 'Failed to load drone show.';
    },
  },
});

export const { clearLoadedShow, requestToLoadShow } = actions;

export default reducer;
