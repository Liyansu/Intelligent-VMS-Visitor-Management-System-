import Link from "next/link";

import ThemeSelector from "./ThemeSelector";
import useAuth from "../store/authStore";

const Navbar = () => {
    const navlinks = useAuth((state) => {
        return state.navLinks;
    })();
    const token = useAuth((state) => {
        return state.decodedToken;
    })();

    return (
        <nav className="navbar w-full bg-neutral sm:rounded-xl">
            <div className="navbar-start">
                <Link href="/">
                    <a className="navIcon btn btn-ghost text-xl normal-case">
                        <svg
                            className="icon"
                            width="76"
                            height="24"
                            viewBox="0 0 76 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M44.1619 22.8182L38.8885 6.24148H38.6861L33.402 22.8182L28.2884 22.8182L35.8097 1H41.7543L49.2862 22.8182H44.1619Z"
                                stroke="white"
                                strokeWidth="2"
                                className="path"
                            />
                            <path
                                d="M63.2678 16.5433C63.353 17.4027 63.7187 18.0703 64.3651 18.5462C65.0114 19.022 65.8885 19.2599 66.9964 19.2599C67.7493 19.2599 68.3849 19.1534 68.9034 18.9403C69.4219 18.7344 69.8196 18.4467 70.0966 18.0774C70.3665 17.7081 70.5014 17.2891 70.5014 16.8203C70.5156 16.4297 70.4339 16.0888 70.2564 15.7976C70.0717 15.5064 69.8196 15.2543 69.5 15.0412C69.1804 14.8352 68.8111 14.6541 68.392 14.4979C67.973 14.3487 67.5256 14.2209 67.0497 14.1143L65.0895 13.6456C64.1378 13.4325 63.2642 13.1484 62.4688 12.7933C61.6733 12.4382 60.9844 12.0014 60.402 11.483C59.8196 10.9645 59.3686 10.3537 59.049 9.65057C58.7223 8.94744 58.5554 8.14134 58.5483 7.23224C58.5554 5.89702 58.8963 4.73935 59.571 3.75923C60.2386 2.78622 61.2045 2.02983 62.4688 1.49006C63.7259 0.957386 65.2422 0.691051 67.0178 0.691051C68.7791 0.691051 70.3132 0.960938 71.62 1.50071C72.9197 2.04048 73.9354 2.83949 74.6669 3.89773C75.3913 4.96307 75.7713 6.28054 75.8068 7.85014H71.343C71.2933 7.11861 71.0838 6.50781 70.7145 6.01776C70.3381 5.5348 69.8374 5.16903 69.2124 4.92045C68.5803 4.67898 67.8665 4.55824 67.071 4.55824C66.2898 4.55824 65.6115 4.67188 65.0362 4.89915C64.4538 5.12642 64.0028 5.44247 63.6832 5.8473C63.3636 6.25213 63.2038 6.71733 63.2038 7.2429C63.2038 7.73295 63.3494 8.14489 63.6406 8.47869C63.9247 8.8125 64.3437 9.09659 64.8977 9.33097C65.4446 9.56534 66.1158 9.77841 66.9112 9.97017L69.2869 10.5668C71.1264 11.0142 72.5788 11.7138 73.6442 12.6655C74.7095 13.6172 75.2386 14.8991 75.2315 16.5114C75.2386 17.8324 74.8871 18.9865 74.1768 19.9737C73.4595 20.9609 72.4759 21.7315 71.2259 22.2855C69.9759 22.8395 68.5554 23.1165 66.9645 23.1165C65.3452 23.1165 63.9318 22.8395 62.7244 22.2855C61.5099 21.7315 60.5653 20.9609 59.8906 19.9737C59.2159 18.9865 58.8679 17.843 58.8466 16.5433H63.2678Z"
                                fill="white"
                                className="path"
                            />
                            <path
                                d="M5.83807 1.18182L11.1115 17.7585H11.3139L16.598 1.18182H21.7116L14.1903 23H8.24574L0.713778 1.18182H5.83807Z"
                                fill="white"
                                className="path"
                            />
                        </svg>
                    </a>
                </Link>
            </div>
            <div className="navbar-end text-xs text-neutral-content md:text-sm">
                {token && (
                    <Link href="/visitorDashboard">
                        <a className="link">
                            <div className="avatar placeholder">
                                <div className="text-primary-content rounded-full w-10">
                                    <span className="text-xl">{token ? token.name[0] : ""}</span>
                                </div>
                            </div>
                        </a>
                    </Link>
                )}
                <div>
                    <ThemeSelector />
                </div>
                <div className="dropdown dropdown-end">
                    <label tabIndex="0" className="menuIcon btn btn-ghost">
                        <svg
                            width="16"
                            height="12"
                            viewBox="0 0 16 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect
                                className="menuPath"
                                width="16"
                                height="2"
                                rx="1"
                                fill="#D9D9D9"
                            />
                            <rect
                                className="menuPath"
                                y="5"
                                width="16"
                                height="2"
                                rx="1"
                                fill="#D9D9D9"
                            />
                            <rect
                                className="menuPath"
                                y="10"
                                width="16"
                                height="2"
                                rx="1"
                                fill="#D9D9D9"
                            />
                        </svg>
                    </label>
                    <ul
                        tabIndex="0"
                        className="dropdown-content menu rounded-box menu-compact mt-3 w-52 bg-neutral p-2 text-neutral-content shadow"
                    >
                        {navlinks.map((link, idx) => {
                            return (
                                <Link key={idx} href={link.path}>
                                    <a
                                        className="btn btn-ghost"
                                        onClick={link.onClick && link.onClick}
                                    >
                                        {link.content}
                                    </a>
                                </Link>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
