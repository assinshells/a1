import React, { useState } from "react";
import Logo from "../components/common/Logo";
//import SettingsModal from "../chat/SettingsModal";

export default function LeftSidebar({ handleLogout }) {
    const [showSettings, setShowSettings] = useState(false);

    // Обработчик клика по Settings
    const handleSettingsClick = (e) => {
        e.preventDefault();
        setShowSettings(true);
    };

    // Обработчик клика по Logout
    const handleLogoutClick = (e) => {
        e.preventDefault();
        if (window.confirm("Вы уверены, что хотите выйти?")) {
            handleLogout();
        }
    };

    return (
        <>
            <div className="side-menu flex-lg-column me-lg-1 ms-lg-0">
                <Logo />
                <div className="flex-lg-column my-auto">
                    <ul className="nav side-menu-nav justify-content-center">
                        <li className="nav-item" title="">
                            <a className="nav-link" href="#" onClick={(e) => e.preventDefault()}>
                                <i className="bi bi-person"></i>
                            </a>
                        </li>

                        <li className="nav-item" title="">
                            <a className="nav-link" href="#" onClick={handleSettingsClick}>
                                <i className="bi bi-gear"></i>
                            </a>
                        </li>

                        {/* Mobile Dropdown */}
                        <li className="nav-item dropdown profile-user-dropdown d-inline-block d-lg-none">
                            <a
                                className="nav-link dropdown-toggle no-caret"
                                href="#"
                                data-bs-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
                                <i className="bi bi-three-dots"></i>
                            </a>
                            <div className="dropdown-menu">
                                <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                                    <i className="bi bi-person float-end text-muted"></i>
                                    Профиль
                                </a>
                                <a className="dropdown-item" href="#" onClick={handleSettingsClick}>
                                    <i className="bi bi-gear float-end text-muted"></i>
                                    Настройки
                                </a>
                                <div className="dropdown-divider"></div>
                                <a className="dropdown-item text-danger" href="#" onClick={handleLogoutClick}>
                                    <i className="bi bi-box-arrow-right float-end"></i>
                                    Выход
                                </a>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Desktop Bottom Menu */}
                <div className="flex-lg-column d-none d-lg-block">
                    <ul className="nav side-menu-nav justify-content-center">
                        <li className="nav-item btn-group dropup profile-user-dropdown">
                            <a
                                className="nav-link dropdown-toggle no-caret"
                                href="#"
                                data-bs-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                                title="Меню"
                            >
                                <i className="bi bi-three-dots"></i>
                            </a>
                            <div className="dropdown-menu">
                                <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                                    <i className="bi bi-person float-end text-muted"></i>
                                    Профиль
                                </a>
                                <a className="dropdown-item" href="#" onClick={handleSettingsClick}>
                                    <i className="bi bi-gear float-end text-muted"></i>
                                    Настройки
                                </a>
                                <div className="dropdown-divider"></div>
                                <a className="dropdown-item text-danger" href="#" onClick={handleLogoutClick}>
                                    <i className="bi bi-box-arrow-right float-end"></i>
                                    Выход
                                </a>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Settings Modal */}
            {/*<SettingsModal
                show={showSettings}
                onClose={() => setShowSettings(false)}
                theme={theme}
                toggleTheme={toggleTheme}
            />*/}
        </>
    );
}