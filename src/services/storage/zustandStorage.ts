import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type PersistStorage } from 'zustand/middleware';

export const zustandStorage = createJSONStorage(() => AsyncStorage) as PersistStorage<unknown>;

