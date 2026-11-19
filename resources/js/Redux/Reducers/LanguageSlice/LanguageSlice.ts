import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {RootState} from "@/Redux/Store/store";
import Language from "@/models/language/Language";

const getInitialLocale = (): { language: string; direction: 'rtl' | 'ltr' } => {
    if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.startsWith('/ar/') || path === '/ar') {
            return { language: 'ar', direction: 'rtl' };
        }
        const cookieMatch = document.cookie.match(/(^|;)\s*locale\s*=\s*([^;]+)/);
        if (cookieMatch && cookieMatch[2] === 'ar') {
            return { language: 'ar', direction: 'rtl' };
        }
        const stored = localStorage.getItem('i18nextLng');
        if (stored === 'ar') {
            return { language: 'ar', direction: 'rtl' };
        }
    }
    return { language: 'en', direction: 'ltr' };
};

const initialLocale = getInitialLocale();

const dummyLanguages: {languages: Language[], language: string, direction: 'rtl' | 'ltr'} = {
    languages: [],
    language: initialLocale.language,
    direction: initialLocale.direction,
}

const initialState = dummyLanguages;

const languageSlice = createSlice({
    name: "languages",
    initialState,
    reducers: {
        setLanguages: (state, action: PayloadAction<Language[]>) => {
            state.languages = [...action.payload];
        },

        setLanguage: (state, action: PayloadAction<string>) => {
            state.language = action.payload;
        },

        setDirection: (state, action: PayloadAction<'ltr' | 'rtl'>) => {
            state.direction = action.payload;
        },
    }
})

export const {
    setLanguages,
    setLanguage,
    setDirection,
} = languageSlice.actions;

export const currentLanguage = (state) => state.languages.languages;

export default languageSlice.reducer;
