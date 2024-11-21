import React from 'react';
import '../assets/css/parts/slider.css';

export default function OnOffSlider({ id, checked, onChange }) {
    return (
        <label htmlFor={id} className="onOffSlider">
            <input id={id} name={id} type="checkbox" checked={checked} onChange={onChange}></input>
            <div className="slider"></div>
        </label>
    );
}
