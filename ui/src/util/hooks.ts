export interface LocalStorageAccessor<T> {
    get: () => T;
    set: (value: T) => void;
}
export function createLocalStorageAccessor<T>(storageKey: string, defaultValue: T): LocalStorageAccessor<T> {
    return {
        get: () => {
            const storedString = window.localStorage.getItem(storageKey);
            if (storedString !== null) {
                return JSON.parse(storedString);
            } else {
                return defaultValue;
            }
        },
        set: (newValue: T) => {
            window.localStorage.setItem(storageKey, JSON.stringify(newValue));
        },
    };
}
