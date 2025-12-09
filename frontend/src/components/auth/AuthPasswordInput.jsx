import { useState } from "react";

const AuthPasswordInput = ({ label, name, value, onChange, icon = "bi bi-lock", ...props }) => {
    const [show, setShow] = useState(false);

    return (
        <div className="mb-3">
            <label className="form-label">{label}</label>

            <div className="input-group">
                <span className="input-group-text">
                    <i className={icon}></i>
                </span>

                <input
                    type={show ? "text" : "password"}
                    className="form-control"
                    name={name}
                    value={value}
                    onChange={onChange}
                    {...props}
                />

                <span
                    className="input-group-text"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShow(!show)}
                >
                    <i className={show ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                </span>
            </div>
        </div>
    );
};

export default AuthPasswordInput;
