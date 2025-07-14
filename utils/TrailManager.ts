import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

const TRIAL_DURATION_DAYS = 7;
const TRIAL_START_KEY = 'trial_start';
const IS_ACTIVATED_KEY = 'is_activated';

export const TrialManager = {
  startTrial: async () => {
    const startTime = new Date().toISOString();
    await AsyncStorage.setItem(TRIAL_START_KEY, startTime);
    await AsyncStorage.setItem(IS_ACTIVATED_KEY, 'false');
  },

  getTrialDaysLeft: async (): Promise<number | null> => {
    const startTimeString = await AsyncStorage.getItem(TRIAL_START_KEY);
    if (!startTimeString) return null;

    const startTime = dayjs(startTimeString);
    const now = dayjs();

    const diff = now.diff(startTime, 'day'); // Difference in days
    const remaining = TRIAL_DURATION_DAYS - diff;
    return remaining >= 0 ? remaining : 0;
  },

  initAppCheck: async (): Promise<boolean> => {
    const activated = await AsyncStorage.getItem(IS_ACTIVATED_KEY);
    if (activated === 'true') return true;

    const startTime = await AsyncStorage.getItem(TRIAL_START_KEY);
    if (!startTime) {
      await TrialManager.startTrial(); // start the trial if it's the first time
      return true;
    }

    const daysLeft = await TrialManager.getTrialDaysLeft();
    return daysLeft !== null && daysLeft > 0;
  },

  activateApp: async () => {
    await AsyncStorage.setItem(IS_ACTIVATED_KEY, 'true');
  },

  resetTrial: async () => {
    await AsyncStorage.removeItem(TRIAL_START_KEY);
    await AsyncStorage.removeItem(IS_ACTIVATED_KEY);
  }
};
