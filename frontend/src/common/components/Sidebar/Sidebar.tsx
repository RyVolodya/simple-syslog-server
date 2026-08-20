import { NavLink } from "react-router-dom";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { IoSettingsOutline } from "react-icons/io5";
import { LuMessageSquareText } from "react-icons/lu";
import { PiHouse } from "react-icons/pi";
import { HiOutlineServerStack } from "react-icons/hi2";
import { FiX } from "react-icons/fi";
import "./Sidebar.scss";
import { useAuth } from "../../../auth/AuthContext";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: PiHouse },
  { to: "/message", label: "Messages", icon: LuMessageSquareText },
  { to: "/setting", label: "Settings", icon: IoSettingsOutline, adminOnly: true },
];

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || user?.role === "administrator");
  return (
    <>
      <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${mobileOpen ? "sidebar--mobile-open" : ""}`}>
        <div className="sidebar__brand">
          <div className="sidebar__brand-mark">
            <span aria-hidden="true">S</span>
          </div>
          {!collapsed && (
            <div className="sidebar__brand-copy">
              <strong>Simple Syslog</strong>
              <span>Server</span>
            </div>
          )}
          <button
            className="sidebar__mobile-close"
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <FiX size={21} />
          </button>
        </div>

        <div className="sidebar__section-label">{collapsed ? "" : "WORKSPACE"}</div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          {visibleNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
            >
              <span className="sidebar__link-icon"><Icon size={22} /></span>
              {!collapsed && <span className="sidebar__link-text">{label}</span>}
              {!collapsed && <span className="sidebar__active-indicator" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__system-card">
            <span className="sidebar__system-icon"><HiOutlineServerStack size={20} /></span>
            {!collapsed && (
              <div className="sidebar__system-copy">
                <strong>Syslog collector</strong>
                <span><i /> UDP / TCP 514</span>
              </div>
            )}
          </div>

          <button
            className="sidebar__collapse"
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <IoIosArrowForward size={18} /> : <IoIosArrowBack size={18} />}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-overlay" type="button" onClick={onCloseMobile} aria-label="Close navigation overlay" />}
    </>
  );
};

export default Sidebar;
