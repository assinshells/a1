import React from "react";
import reactLogo from '../../assets/react.svg';


export default function Logo() {
    return (
        <div className="navbar-brand-box text-center mb-4">
            <a className="logo">
                <span className="logo-sm">
                    <img src={reactLogo} alt="" height="30" />
                </span>
            </a>
        </div>
    );
}