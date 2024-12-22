import React from 'react';

import { useUserLogdinContext, UserLogdinProvider } from './userLogdinProvider';
import { useNotificationContext, NotificationProvider } from './notificationProvider';
import { useThemeContext, ThemeProvider } from './themeProvider';
import { useCallContext, CallProvider } from './callProvider';

export const contexts = {
    useUserLogdinContext,
    useNotificationContext,
    useThemeContext,
    useCallContext,
};

const providers = [UserLogdinProvider, NotificationProvider, ThemeProvider, CallProvider];

export function Providers({ children }) {
    const wrapWithProviders = content => {
        return providers.reduceRight((acc, Provider) => <Provider>{acc}</Provider>, content);
    };

    return wrapWithProviders(children);
}
