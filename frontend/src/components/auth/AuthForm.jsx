const AuthForm = ({ children }) => (
    <div className="container py-5">
        <div className="min-vh-100 row justify-content-center align-items-center">

            <div className="col-md-6 mb-4 d-none d-md-block">
                <img
                    src="images/fb_logo.svg"
                    className="img-fluid mb-3"
                    style={{ maxWidth: "300px" }}
                    alt="Logo"
                />
                <h2
                    className="fw-normal px-3"
                    style={{ fontSize: "26px", lineHeight: "32px" }}
                >
                    Facebook helps you connect and share with the people
                    in your life.
                </h2>
            </div>


            <div className="col-md-4">
                <div className="card shadow-sm p-4 mb-3">
                    {children}
                </div>
                <p className="text-center" style={{ fontSize: "14px" }}>
                    <a
                        href="/"
                        className="fw-bold text-dark text-decoration-none"
                    >
                        Create a Page
                    </a>{" "}
                    for a celebrity, brand or business.
                </p>
            </div>

        </div>
    </div>
);

export default AuthForm;
