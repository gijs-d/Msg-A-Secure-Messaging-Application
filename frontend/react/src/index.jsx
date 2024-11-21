import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

import '../public/icon.png';
import { Providers } from './providers';

const domNode = document.getElementById('root');
const root = createRoot(domNode);

root.render(
    <BrowserRouter>
        <Providers>
            <App />
        </Providers>
    </BrowserRouter>
);
