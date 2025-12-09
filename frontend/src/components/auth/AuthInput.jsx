import Input from "../common/Input";

const AuthInput = ({ label, icon, ...props }) => (
    <div className="mb-3">
        <Input icon={icon} {...props} />
    </div>
);

export default AuthInput;
