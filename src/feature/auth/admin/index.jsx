import { Outlet, Link } from 'react-router-dom';
import './admin.scss';
import { LoginAdminService } from './services/loginAdminService';

function Admin() {
  const { logout } = LoginAdminService();

  return (
    <div className="admin_container">
      <div className="admin_header">
        <img
          src="https://images.pexels.com/photos/18101841/pexels-photo-18101841.jpeg"
          alt="Anh"
        />
        <button onClick={logout}>Logout</button>
      </div>
      <div className="admin_body">
        <div className="sidebar">
          <Link className="sidebar_item" to="/admin/user">
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
        <div className="container">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Admin;
