import { useState } from "react";

const AuthPasswordInput = ({ label, name, value, onChange, icon = "bi bi-lock", ...props }) => {
    const [show, setShow] = useState(false);

    return (
        <div className="mb-3" style={{ position: "relative" }}>

            <input
                type={show ? "text" : "password"}
                className="form-control"
                name={name}
                value={value}
                onChange={onChange}
                {...props}
            />

            <span
                className=""
                onClick={() => setShow(!show)}
                style={{
                    position: "absolute",
                    top: "50%",
                    right: "20px",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#495057",
                }}
            >
                <i className={show ? "bi bi-eye-slash" : "bi bi-eye"}></i>
            </span>

        </div>
    );
};

export default AuthPasswordInput;
