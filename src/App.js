// import logo from './logo.svg';
// import './App.css';
// import Sidebar from "./Pages/Sidebar.jsx"
// import "bootstrap/dist/css/bootstrap.min.css";
// import "antd/dist/reset.css";
// import Punch from './Pages/Punch.jsx';
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// function App() {
//   return (
// <Router>
//       <div style={{ display: "flex"}}>
//       <div style={{ width: "280px", flexShrink: 0, }}>
//     <Sidebar />
//   </div>
//   <div >          <Routes>
//             {/* <Route path="/" element={<Dashboard />} /> */}
//             <Route path="/punchin/out" element={<Punch />} />
//             {/* <Route path="/leave" element={<Leave />} /> */}
//           </Routes>
//         </div>
//       </div>
//     </Router>
//   );
// }

// export default App;

import {
  HashRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import AuthForm from "./Pages/Login.jsx";
import Punch from "./Pages/Punch.jsx";
import Sidebar from "./Pages/Sidebar.jsx";
import Leave from "./Pages/Leave.jsx";
import Dashboard from "./Pages/Dashboard.jsx";


function App() {
  const [user, setUser] = useState(null);
  console.log("Current user:", user);
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route
          path="/"
          element={
            <AuthForm
              user={user}
              setUser={setUser}
              username={user ? user.employeeName : ""}
            />
          }
        />

        {/* Protected Routes */}
        {user && (
          <Route
            path="/*"
            element={
              <div className="d-flex">
                <Sidebar
                  user={user}
                  setUser={setUser}
                  username={user.username}
                  employeeId={user.employeeId} 
                />
                <Routes>
                  <Route
                    path="punchin/out"
                    element={<Punch user={user} employeeId={user.employeeId} employeeLocation={user.location} employeeName={user.username} employeeDesignation={user.designation} />}
                  />
                    <Route
                    path="leave"
                    element={<Leave user={user} employeeId={user.employeeId} employeeLocation={user.location} employeeName={user.username} employeeDesignation={user.designation} />}
                  />
                        <Route
                    path="dashboard"
                    element={<Dashboard user={user} employeeId={user.employeeId} employeeLocation={user.location} employeeName={user.username} employeeDesignation={user.designation} />}
                  />
                </Routes>
              </div>
            }
          />
        )}

        {/* Redirect to login if not logged in */}
        {!user && <Route path="*" element={<Navigate to="/" replace />} />}
      </Routes>
    </Router>
  );
}

export default App;
