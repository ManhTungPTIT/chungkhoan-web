import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import './admin.scss';
import { LoginAdminService } from './services/loginAdminService';

function Admin() {
  const { logout } = LoginAdminService();
  // Mở sẵn trên desktop, đóng sẵn trên điện thoại
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > 640,
  );

  return (
    <div className="admin_container">
      <div className="admin_header">
        <button
          type="button"
          className="sidebar-toggle"
          aria-label="Ẩn/hiện menu"
          onClick={() => setSidebarOpen((o) => !o)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            style={{ width: '1.6rem', height: '1.6rem' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
            />
          </svg>
        </button>
        <img
          src="https://images.pexels.com/photos/18101841/pexels-photo-18101841.jpeg"
          alt="Anh"
        />
        <button onClick={logout}>Logout</button>
      </div>
      <div className="admin_body">
        <div className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
          <Link
            className="sidebar_item"
            to="/admin/user"
            onClick={() => {
              if (window.innerWidth <= 640) setSidebarOpen(false);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              style={{ width: '1.5rem', height: '1.5rem' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            Quản lý người dùng
          </Link>
        </div>
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className="container">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Admin;
