import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(false);

    useEffect(() => {
        getTheme();
    }, []);

    useLayoutEffect(() => {
        changeTheme();
    }, [theme]);

    const changeTheme = () => {
        const root = document.querySelector(':root');
        const tempTheme = theme;

        if (tempTheme !== 'light' && tempTheme !== 'dark') {
            try {
                const prefTheme = window?.matchMedia('(prefers-color-scheme: dark)')?.matches
                    ? 'dark'
                    : 'light';
                setTheme(prefTheme);
            } catch {
                setTheme('light');
            }
            return;
        }
        root.style.setProperty('color-scheme', theme);
        const sets = [
            'body-bg',
            'body-color',
            'body-txt',
            'header-icon-bg',
            'hover-bg',
            'hover-txt',
            'a-txt',
            'l-opaque',
            'll-opaque',
            'lll-opaque',
            'h-opaque',
            'bg-opaque',
            'input-bg',
            'input-txt',
            'shadow',
            'icon-invert',
        ];
        sets.forEach(s => {
            const color = getComputedStyle(root).getPropertyValue(`--${theme}-${s}`);
            root.style.setProperty(`--${s}`, color);
        });
    };

    const getTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            if (savedTheme !== 'light' && savedTheme !== 'dark') {
                return;
            }
            setTheme(savedTheme);
        }
    };

    return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
    return useContext(ThemeContext);
}
