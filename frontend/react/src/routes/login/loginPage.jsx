import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

import eyeSvg from '../../assets/media/eye.svg';
import eyeLineSvg from '../../assets/media/eye-line.svg';

import { contexts } from '../../providers';
const { useUserLogdinContext } = contexts;

export default function LoginPage() {
    const { userLogdin, setUserLogdin } = useUserLogdinContext();
    const [data, setData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [pwdVisibile, setPwdVisibile] = useState(false);

    const onSubmit = async e => {
        e.preventDefault();
        if (!data.email || !data.password) {
            setError('Please fill in all fields');
            return;
        }
        //let sendData = data;
        //let md = forge.md.sha512.create();
        //md.update(sendData.password);
        //let hashPassword = md.digest().toHex()
        //sendData['password'] = hashPassword;
        const logdin = await (
            await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
        ).json();
        if (logdin.error) {
            setError(logdin.error);
            return;
        }
        setUserLogdin(logdin.id);
    };
    const onChange = async e => {
        const newdata = data;
        newdata[e.target.name] = e.target.value;
        setData({ ...newdata });
    };
    const togglePwdVisibility = e => {
        e.target.parentNode.previousElementSibling.focus();
        setPwdVisibile(!pwdVisibile);
    };

    return (
        <section>
            <form onSubmit={onSubmit}>
                <h2>Login</h2>
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={data.email}
                    onChange={onChange}
                    required
                />
                <label htmlFor="password">Password</label>
                <div id="passwordWraper">
                    <input
                        type={pwdVisibile ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={data.password}
                        onChange={onChange}
                        required
                    />
                    <span id="showPwd">
                        <img src={eyeSvg} onClick={togglePwdVisibility} />
                    </span>
                    {pwdVisibile && (
                        <span id="hidePwd">
                            <img src={eyeLineSvg} />
                        </span>
                    )}
                </div>

                {error && <p className="formError">{error}</p>}
                <input value="Login" type="submit" />
                <p>
                    Don&apos;t have an account yet?
                    <NavLink to="/login/register">Register here.</NavLink>
                </p>
            </form>
        </section>
    );
}
