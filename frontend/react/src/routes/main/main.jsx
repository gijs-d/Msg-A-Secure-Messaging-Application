import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import * as forge from 'node-forge';
import { NavLink } from 'react-router-dom';

export default function Login() {
    const [data, setData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const onSubmit = async e => {
        e.preventDefault();
        if (!data.email || !data.password) {
            setError('Please fill in all fields');
            return;
        }
        const sendData = data;
        const md = forge.md.sha512.create();
        md.update(sendData.password);
        const hashPassword = md.digest().toHex();
        sendData['password'] = hashPassword;
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
        navigate('/');
    };

    const onChange = async e => {
        const newdata = data;
        newdata[e.target.name] = e.target.value;
        setData({ ...newdata });
    };

    return (
        <section>
            <form onSubmit={onSubmit}>
                <h2>Login</h2>
                <label htmlFor="email">email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={data.email}
                    onChange={onChange}
                    required
                />
                <label htmlFor="password">password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={data.password}
                    onChange={onChange}
                    required
                />
                {error && <p>{error}</p>}
                <input value="login" type="submit" />
                <p>
                    Don&apos;t have an account yet?
                    <NavLink to="/login/register">Register here.</NavLink>
                </p>
            </form>
        </section>
    );
}
