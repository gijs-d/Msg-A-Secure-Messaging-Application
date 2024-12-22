import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

import eyeSvg from '../../assets/media/eye.svg';
import eyeLineSvg from '../../assets/media/eye-line.svg';

import { contexts } from '../../providers';
const { useUserLogdinContext } = contexts;

export default function Register() {
    const { userLogdin, setUserLogdin } = useUserLogdinContext();

    const [data, setData] = useState({ username: '', email: '', password: '' });
    const [rPassword, setRPassword] = useState('');
    const [error, setError] = useState('');
    const [pwdVisibile, setPwdVisibile] = useState(false);

    const onSubmit = async e => {
        e.preventDefault();
        if (!data.email || !data.password || !data.username || !rPassword) {
            setError('Please fill in all fields');
            return;
        }
        if (data.password !== rPassword) {
            setError('Passwords do not match');
            return;
        }
        //let sendData = data;
        //let md = forge.md.sha512.create();
        //md.update(sendData.password);
        //let hashPassword = md.digest().toHex()
        //sendData['password'] = hashPassword;
        const logdin = await (
            await fetch('/api/login/register', {
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
        setData({ ...data, [e.target.name]: e.target.value });
    };
    const onChangeRepeat = async e => {
        setRPassword(e.target.value);
    };
    const togglePwdVisibility = e => {
        e.target.parentNode.previousElementSibling.focus();
        setPwdVisibile(!pwdVisibile);
    };

    return (
        <section>
            <form onSubmit={onSubmit}>
                <h2>Register</h2>
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={data.username}
                    onChange={onChange}
                    required
                />
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
                <label htmlFor="rPassword">Repeat Password</label>
                <input
                    type="password"
                    id="rPassword"
                    value={rPassword}
                    onChange={onChangeRepeat}
                    required
                />
                {error && <p className="formError">{error}</p>}
                <input value="Register" type="submit" />
                <p>
                    Already registered?
                    <NavLink to="/login">Login here.</NavLink>
                </p>
            </form>
        </section>
    );
}
