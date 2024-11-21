import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

import iconSearch from '../../assets/media/icon-search.png';

const SearchResult = ({ user, onClick }) => {
    return (
        <li onClick={onClick}>
            <NavLink to={`/account/profile/${user._id}`}>{user.username}</NavLink>
        </li>
    );
};

export default function Searchbar() {
    const [query, setQuery] = useState('');
    const [showSearchbar, setShowSearchbar] = useState(false);
    const [searchresults, setSearchresults] = useState([]);

    const onChange = async e => {
        const value = e.target.value;
        setQuery(value);
        if (value.trim().length > 1) {
            const users = await (
                await fetch('/api/account/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: value,
                    }),
                })
            ).json();
            setSearchresults(users);
        }
    };

    const onClick = async () => {
        setShowSearchbar(!showSearchbar);
    };

    return (
        <>
            <li className={`icons${showSearchbar ? ' showSearchbar' : ''}`} id="search">
                <input
                    type="text"
                    id="searchText"
                    value={query}
                    onChange={onChange}
                    style={{ display: showSearchbar ? 'block' : 'none' }}
                    placeholder="Search..."
                />
                <input
                    type="button"
                    value=""
                    onClick={onClick}
                    className="icon"
                    style={{ backgroundImage: `url(${iconSearch})` }}
                />
                <ul
                    id="searchresults"
                    style={{ display: showSearchbar && searchresults ? 'block' : 'none' }}
                >
                    {searchresults &&
                        searchresults.map(s => (
                            <SearchResult key={s._id} user={s} onClick={onClick} />
                        ))}
                </ul>
            </li>
        </>
    );
}
