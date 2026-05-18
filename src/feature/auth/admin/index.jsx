import { useState } from "react";
import "./admin.scss";
import KycAdmin from "./layouts/KycAdmin_1";
import ManagerUser from "./layouts/managerUser";

function Admin() {
  const [chorse, setChorse] = useState("user");

  return (
    <div className="admin_container">
      <div className="admin_header">
        <img
          src="https://images.pexels.com/photos/18101841/pexels-photo-18101841.jpeg"
          alt="Anh"
        />
        <button>Logout</button>
      </div>
      <div className="admin_body">
        <div className="sidebar">
          <div className="sidebar_item" onClick={() => setChorse("user")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
              style={{
                width: "1.5rem",
                height: "1.5rem",
              }}
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            Quản lý người dùng
          </div>
          <div className="sidebar_item" onClick={() => setChorse("account")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
              style={{
                width: "1.5rem",
                height: "1.5rem",
              }}
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
            Quản lý tài khoản
          </div>
          <div className="sidebar_item" onClick={() => setChorse("")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6"
              style={{
                width: "1.5rem",
                height: "1.5rem",
              }}
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            Quản lý lệnh
          </div>
        </div>
        <div className="container">
          {chorse === "user" ? (
            <ManagerUser />
          ) : chorse === "account" ? (
            <KycAdmin />
          ) : (
            <img
              src="https://images.pexels.com/photos/18101841/pexels-photo-18101841.jpeg"
              alt="Anh"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
