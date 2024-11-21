import React from 'react';
import Router from './routes/router';
import Header from './parts/header/header';
import './assets/css/style.css';

import { useUserLogdinContext } from './providers';

const App = () => {
    const { userLogdin, setUserLogdin } = useUserLogdinContext();

    return (
        <>
            <figure id="fullscreenImageHolder">
                <a href="" download className="downloadFullscreenImage">
                    <input type="button" value="Save" />
                </a>
                <img></img>
                <input type="button" value="X" className="closeFullscreenImage" />
            </figure>
            <Header />
            {userLogdin !== undefined ? <Router /> : <main> </main>}
        </>
    );
};

export default App;
