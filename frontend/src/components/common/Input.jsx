const Input = ({ icon, ...props }) => (
    <div className="input-group">
        {icon && (
            <span className="input-group-text">
                <i className={icon}></i>
            </span>
        )}
        <input className="form-control" {...props} />
    </div>
);

export default Input;
