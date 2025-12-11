const AuthForm = ({ children }) => (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div style={{ width: "100%", maxWidth: 22.5 + "rem" }}>
            {children}
        </div>
    </div>
);

export default AuthForm;
