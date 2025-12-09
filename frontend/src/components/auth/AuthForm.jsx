const AuthForm = ({ icon, title, subtitle, children }) => (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow-lg border-0">
                        <div className="card-body p-5">
                            <div className="text-center mb-4">
                                <i className={`${icon} text-primary`} style={{ fontSize: '3rem' }}></i>
                                <h2 className="mt-3 mb-2">{title}</h2>
                                <p className="text-muted">{subtitle}</p>
                            </div>

                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default AuthForm;
