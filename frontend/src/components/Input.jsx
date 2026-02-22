import React from 'react';
import './Input.css';

const Input = ({ label, type = 'text', id, placeholder, ...props }) => {
    return (
        <div className="input-group">
            {label && <label htmlFor={id} className="input-label">{label}</label>}
            <input
                type={type}
                id={id}
                className="input-field"
                placeholder={placeholder}
                {...props}
            />
        </div>
    );
};

export default Input;
