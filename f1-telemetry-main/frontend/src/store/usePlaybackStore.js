import { create } from 'zustand';

const usePlaybackStore = create((set) => ({
  // Time and Playback State
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
  minTime: 0,
  maxTime: 0,
  
  // Selected Data
  selectedRace: null,
  selectedDrivers: [],
  followDriverId: null,
  
  // Camera State
  cameraMode: 'free', // 'free', 'follow', 'top'

  // Actions
  setPlaybackTime: (time) => set({ currentTime: time }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  
  selectRace: (race) => set({ selectedRace: race, currentTime: 0 }),
  setSelectedDrivers: (drivers) => set({ selectedDrivers: drivers }),
  
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setFollowDriver: (driverId) => set({ followDriverId: driverId, cameraMode: 'follow' }),
  
  setMinTime: (time) => set({ minTime: time }),
  setMaxTime: (time) => set({ maxTime: time }),
}));

export default usePlaybackStore;
