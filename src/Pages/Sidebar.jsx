// import React, { useState, useEffect } from "react";
// import { Menu, Button, message, Avatar, Drawer  } from "antd";
// import { useNavigate } from "react-router-dom";
// import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faCalendar,
//   faCalendarCheck,
//   faClock,
//   faArrowRightFromBracket,
//   faIdBadge,
//   faUser,
// } from "@fortawesome/free-solid-svg-icons";
// import logo from "../Images/stratify-logo.png";
// import "../App.css";

// export default function Sidebar({ user, setUser, username, employeeId }) {
//   const navigate = useNavigate();
//   const [current, setCurrent] = useState("punchin/out");
//   const [collapsed, setCollapsed] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

//   const toggleCollapsed = () => {
//     setCollapsed(!collapsed);
//   };

//   const handleClick = (e) => {
//     setCurrent(e.key);
//     navigate(e.key === "dashboard" ? "/dashboard" : `/${e.key}`);
//     if (isMobile) setCollapsed(true); // auto-close sidebar on mobile after click
//   };

//   const handleLogout = () => {
//     setUser(null);
//     message.info(`See you soon ${username}. Take care!`);
//   };

//   const navItems = [
//     {
//       key: "dashboard",
//       icon: <FontAwesomeIcon icon={faCalendar} />,
//       label: "Dashboard",
//     },
//     {
//       key: "punchin/out",
//       icon: <FontAwesomeIcon icon={faClock} />,
//       label: "Punch In/Out",
//     },
//     {
//       key: "leave",
//       icon: <FontAwesomeIcon icon={faCalendarCheck} />,
//       label: "Leave Requests",
//     },
//   ];

//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth < 768;
//       setIsMobile(mobile);
//       if (!mobile) setCollapsed(false); // expand if switching to desktop
//     };
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   if (isMobile && collapsed) {
//     return (
//       <div style={{ padding: 0, position: "fixed", top: 4, left: 0, zIndex: 1001 }}>
//         <Button type="primary" onClick={toggleCollapsed} icon={<MenuUnfoldOutlined />}  style={{   background:"rgba(239, 47, 51, 0.73)", color:"white"  }}/>
//       </div>
//     );
//   }

//   return (
//     <>
//     <div
//       style={{
//         width: 280,
//         display: "flex",
//         flexDirection: "column",
//         position: "sticky",
//         top: 0,
//         backgroundColor: "#ffffff",
//         borderRight: "1px solid #f0f0f0",
//         fontFamily: "Segoe UI, sans-serif",
//         boxShadow: "2px 0 8px rgba(0, 0, 0, 0.04)",
//         zIndex: 1000,
//         height: "100vh",
//       }}
//     >
//       {isMobile && (
//         <Button
//           type="primary"
//           onClick={toggleCollapsed}
//           style={{ margin: 5, alignSelf: "flex-start", background:"rgba(239, 47, 51, 0.73)", color:"white" }}
//           icon={<MenuFoldOutlined />}
//         >
//         </Button>
//       )}

//       <div
//         style={{
//           padding: "24px",
//           background: "linear-gradient(135deg, #E6F4FF, #8abee5)",
//           textAlign: "center",
//           color: "#fff",
//           borderBottomLeftRadius: "20px",
//           borderBottomRightRadius: "20px",
//         }}
//       >
//         <img src={logo} alt="Logo" />
//         <h3 style={{ marginTop: 10, marginBottom: 0, fontWeight: "600" }}>
//           Attendance
//         </h3>
//         <span>Management System</span>
//         <div
//           style={{
//             marginTop: 20,
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             gap: 8,
//           }}
//         >
//           <Avatar
//             size={64}
//             style={{
//               backgroundColor: "#662D91",
//               fontSize: "22px",
//             }}
//           >
//             {username.slice(0, 2).toUpperCase()}
//           </Avatar>

//           <div style={{ color: "#fff", textAlign: "center" }}>
//             <p style={{ margin: 0, fontSize: 18 }}>
//               <FontAwesomeIcon icon={faUser} className="me-2" />
//               {username}
//             </p>
//             <p style={{ margin: 0, fontSize: 18 }}>
//               <FontAwesomeIcon icon={faIdBadge} className="me-2" />
//               {employeeId}
//             </p>
//           </div>
//         </div>
//       </div>

//       <div style={{ padding: "20px 24px", flexGrow: 1 }}>
//         <Menu
//           mode="vertical"
//           selectedKeys={[current]}
//           onClick={handleClick}
//           style={{ border: "none", backgroundColor: "transparent" }}
//           items={navItems.map((item) => ({
//             ...item,
//             label: (
//               <span style={{ fontWeight: 500, fontSize: 15 }}>
//                 {item.label}
//               </span>
//             ),
//             icon: (
//               <div style={{ fontSize: 17, color: "#444", width: 20 }}>
//                 {item.icon}
//               </div>
//             ),
//             style: {
//               borderRadius: 8,
//               paddingLeft: 12,
//               marginBottom: 6,
//               transition: "background 0.3s",
//             },
//           }))}
//         />
//       </div>

//       <div
//         style={{
//           padding: "20px 24px",
//           borderTop: "1px solid #f0f0f0",
//           backgroundColor: "#FFDFDC",
//           borderTopLeftRadius: "16px",
//           borderTopRightRadius: "16px",
//         }}
//       >
//         <Button
//           type="primary"
//           danger
//           block
//           icon={
//             <FontAwesomeIcon
//               icon={faArrowRightFromBracket}
//               style={{ marginRight: 8 }}
//             />
//           }
//           size="large"
//           style={{ borderRadius: 8, fontWeight: 600, padding: "6px 0" }}
//           onClick={handleLogout}
//           className="hover-logout"
//         >
//           Logout
//         </Button>
//       </div>
//     </div>
//     </>
//   );
// }

import React, { useState, useEffect } from "react";
import { Menu, Button, message, Avatar, Drawer } from "antd";
import { useNavigate } from "react-router-dom";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faCalendarCheck,
  faClock,
  faArrowRightFromBracket,
  faIdBadge,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import logo from "../Images/stratify-logo.png";
import "../App.css";

export default function Sidebar({ user, setUser, username, employeeId }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("punchin/out");
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 800);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const toggleCollapsed = () => {
    if (isMobile) {
      setDrawerVisible(!drawerVisible);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const handleClick = (e) => {
    setCurrent(e.key);
    navigate(e.key === "dashboard" ? "/dashboard" : `/${e.key}`);
    if (isMobile) setCollapsed(true); // auto-close sidebar on mobile after click
  };

  const handleDrawerMenuClick = (e) => {
    setCurrent(e.key);
    navigate(e.key === "dashboard" ? "/dashboard" : `/${e.key}`);
    if (isMobile) setCollapsed(true);
    setDrawerVisible(false);
  };

  const handleLogout = () => {
    setUser(null);
    message.info(`See you soon ${username}. Take care!`);
  };

  const navItems = [
    {
      key: "dashboard",
      icon: <FontAwesomeIcon icon={faCalendar} />,
      label: "Dashboard",
    },
    {
      key: "punchin/out",
      icon: <FontAwesomeIcon icon={faClock} />,
      label: "Punch In/Out",
    },
    {
      key: "leave",
      icon: <FontAwesomeIcon icon={faCalendarCheck} />,
      label: "Leave Requests",
    },
  ];

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (!mobile) setCollapsed(false); // expand if switching to desktop
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // {isMobile && !drawerVisible && (
  //   <div style={{ padding: 0, position: "fixed", top: 4, left: 0, zIndex: 1001 }}>
  //     <Button
  //       type="primary"
  //       onClick={toggleCollapsed}
  //       icon={<MenuUnfoldOutlined />}
  //       style={{
  //         background: "rgba(239, 47, 51, 0.73)",
  //         color: "white",
  //       }}
  //     />
  //   </div>
  // )}

  const styl = `.ant-drawer .ant-drawer-header {
    display: none;

}`;

  return (
    <>
      <style>{styl}</style>
      {isMobile && !drawerVisible && (
        <div
          style={{
            padding: 0,
            position: "fixed",
            top: 4,
            left: 0,
            zIndex: 1001,
          }}
        >
          <Button
            type="primary"
            onClick={toggleCollapsed}
            icon={<MenuUnfoldOutlined />}
            style={{
              background: "rgba(239, 47, 51, 0.73)",
              color: "white",
            }}
          />
        </div>
      )}
      {isMobile ? (
        <Drawer
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={280}
          bodyStyle={{ padding: 0 }}
        >
          <>
            <div
              style={{
                width: 280,
                display: "flex",
                flexDirection: "column",
                position: "sticky",
                top: 0,
                backgroundColor: "#ffffff",
                borderRight: "1px solid #f0f0f0",
                fontFamily: "Segoe UI, sans-serif",
                boxShadow: "2px 0 8px rgba(0, 0, 0, 0.04)",
                zIndex: 1000,
                height: "100vh",
              }}
            >
              <div
                style={{
                  padding: "5px",
                  background: "linear-gradient(135deg, #E6F4FF, #8abee5)",
                  textAlign: "center",
                  color: "#fff",
                  borderBottomLeftRadius: "20px",
                  borderBottomRightRadius: "20px",
                }}
              >
                <img src={logo} alt="Logo" />
                <h3
                  style={{ marginTop: 10, marginBottom: 0, fontWeight: "600" }}
                >
                  Attendance
                </h3>
                <span>Management System</span>
                <div
                  style={{
                    marginTop: 5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Avatar
                    size={50}
                    style={{
                      backgroundColor: "#662D91",
                      fontSize: "22px",
                    }}
                  >
                    {username.slice(0, 2).toUpperCase()}
                  </Avatar>

                  <div style={{ color: "#fff", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 18 }}>
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      {username}
                    </p>
                    <p style={{ margin: 0, fontSize: 18 }}>
                      <FontAwesomeIcon icon={faIdBadge} className="me-2" />
                      {employeeId}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ padding: "20px 24px", flexGrow: 1 }}>
                <Menu
                  mode="vertical"
                  selectedKeys={[current]}
                  onClick={handleDrawerMenuClick}
                  style={{ border: "none", backgroundColor: "transparent" }}
                  items={navItems.map((item) => ({
                    ...item,
                    label: (
                      <span style={{ fontWeight: 500, fontSize: 15 }}>
                        {item.label}
                      </span>
                    ),
                    icon: (
                      <div style={{ fontSize: 17, color: "#444", width: 20 }}>
                        {item.icon}
                      </div>
                    ),
                    style: {
                      borderRadius: 8,
                      paddingLeft: 12,
                      marginBottom: 6,
                      transition: "background 0.3s",
                    },
                  }))}
                />
              </div>

              <div
                style={{
                  padding: "20px 24px",
                  borderTop: "1px solid #f0f0f0",
                  backgroundColor: "#FFDFDC",
                  borderTopLeftRadius: "16px",
                  borderTopRightRadius: "16px",
                }}
              >
                <Button
                  type="primary"
                  danger
                  block
                  icon={
                    <FontAwesomeIcon
                      icon={faArrowRightFromBracket}
                      style={{ marginRight: 8 }}
                    />
                  }
                  size="large"
                  style={{ borderRadius: 8, fontWeight: 600, padding: "6px 0" }}
                  onClick={handleLogout}
                  className="hover-logout"
                >
                  Logout
                </Button>
              </div>
            </div>
          </>
        </Drawer>
      ) : (
        <div
          style={{
            width: 280,
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: 0,
            backgroundColor: "#ffffff",
            borderRight: "1px solid #f0f0f0",
            fontFamily: "Segoe UI, sans-serif",
            boxShadow: "2px 0 8px rgba(0, 0, 0, 0.04)",
            zIndex: 1000,
            height: "100vh",
          }}
        >
          <div
            style={{
              padding: "24px",
              background: "linear-gradient(135deg, #E6F4FF, #8abee5)",
              textAlign: "center",
              color: "#fff",
              borderBottomLeftRadius: "20px",
              borderBottomRightRadius: "20px",
            }}
          >
            <img src={logo} alt="Logo" />
            <h3 style={{ marginTop: 10, marginBottom: 0, fontWeight: "600" }}>
              Attendance
            </h3>
            <span>Management System</span>
            <div
              style={{
                marginTop: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Avatar
                size={64}
                style={{
                  backgroundColor: "#662D91",
                  fontSize: "22px",
                }}
              >
                {username.slice(0, 2).toUpperCase()}
              </Avatar>

              <div style={{ color: "#fff", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 18 }}>
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  {username}
                </p>
                <p style={{ margin: 0, fontSize: 18 }}>
                  <FontAwesomeIcon icon={faIdBadge} className="me-2" />
                  {employeeId}
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: "20px 24px", flexGrow: 1 }}>
            <Menu
              mode="vertical"
              selectedKeys={[current]}
              onClick={handleClick}
              style={{ border: "none", backgroundColor: "transparent" }}
              items={navItems.map((item) => ({
                ...item,
                label: (
                  <span style={{ fontWeight: 500, fontSize: 15 }}>
                    {item.label}
                  </span>
                ),
                icon: (
                  <div style={{ fontSize: 17, color: "#444", width: 20 }}>
                    {item.icon}
                  </div>
                ),
                style: {
                  borderRadius: 8,
                  paddingLeft: 12,
                  marginBottom: 6,
                  transition: "background 0.3s",
                },
              }))}
            />
          </div>

          <div
            style={{
              padding: "20px 24px",
              borderTop: "1px solid #f0f0f0",
              backgroundColor: "#FFDFDC",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
            }}
          >
            <Button
              type="primary"
              danger
              block
              icon={
                <FontAwesomeIcon
                  icon={faArrowRightFromBracket}
                  style={{ marginRight: 8 }}
                />
              }
              size="large"
              style={{ borderRadius: 8, fontWeight: 600, padding: "6px 0" }}
              onClick={handleLogout}
              className="hover-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
