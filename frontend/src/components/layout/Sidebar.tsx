import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const navigation = [
  { label: "Dashboard", path: "/", icon: "◈", end: true },
  { label: "Shipments", path: "/shipments", icon: "▤", end: false },
  { label: "Analytics", path: "/analytics", icon: "▥", end: false },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`app-sidebar${isCollapsed ? " collapsed" : ""}`}
      aria-label="Application sidebar"
    >
      {/* Brand */}
      <div className="sidebar-top">
        <NavLink
          to="/"
          end
          className="sidebar-brand"
          aria-label="AETHER/SHIP Dashboard"
          title={isCollapsed ? "AETHER/SHIP Dashboard" : undefined}
        >
          <span className="brand-mark">A</span>

          {!isCollapsed && (
            <span className="brand-copy">
              <strong>AETHER/SHIP</strong>
              <small>SHIPMENT INTELLIGENCE</small>
            </span>
          )}
        </NavLink>
      </div>

      {/* Navigation */}
      {!isCollapsed && (
        <div className="sidebar-section-label">WORKSPACE</div>
      )}

      <nav className="sidebar-navigation" aria-label="Main navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            title={isCollapsed ? item.label : undefined}
            aria-label={item.label}
            className={({ isActive }) =>
              `sidebar-link${isActive ? " active" : ""}`
            }
          >
            <span className="sidebar-icon" aria-hidden="true">
              {item.icon}
            </span>

            {!isCollapsed && (
              <span className="sidebar-link-label">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-collapse-button"
          onClick={() => setIsCollapsed((previous) => !previous)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {isCollapsed ? (
              <path d="m9 18 6-6-6-6" />
            ) : (
              <path d="m15 18-6-6 6-6" />
            )}
          </svg>

          {!isCollapsed && <span>Collapse sidebar</span>}
        </button>

        <div className="sidebar-footer">
          <span className="status-indicator" />
          {!isCollapsed && <span>Operations online</span>}
        </div>
      </div>
    </aside>
  );
}
