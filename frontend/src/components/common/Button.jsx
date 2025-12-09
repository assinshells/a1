const Button = ({ loading, children, className = "", ...props }) => {
    return (
        <button
            className={`btn btn-primary w-100 py-2 mb-3 ${className}`}
            disabled={loading}
            {...props}
        >
            {loading && <span className="spinner-border spinner-border-sm me-2" />}
            {children}
        </button>
    );
};

export default Button;
