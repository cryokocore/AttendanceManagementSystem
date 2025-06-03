import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Typography,
  message,
  Table,
  Row,
  Col,
  Calendar,
  Space,
  Tooltip,
  Input,
  Form,
  Select,
  DatePicker,
  Statistic,
  TimePicker,
  Tag,
  Modal,
} from "antd";
import { getDistance } from "geolib";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as XLSX from "xlsx-js-style";
import {
  faCalendar,
  faCalendarCheck,
  faClock,
  faArrowRightFromBracket,
  faLocationDot,
  faCalendarDays,
  faTable,
  faCalendarWeek,
  faCalendarPlus,
  faPenToSquare,
  faList,
  faCalendarXmark,
  faUser,
  faCalendarMinus,
  faWallet,
  faCircleExclamation,
  faCircleMinus,
  faQuestionCircle,
  faGaugeSimpleHigh
} from "@fortawesome/free-solid-svg-icons";
import "../App.css"
import { useNavigate } from "react-router-dom";
import TextArea from "antd/es/input/TextArea";
import timezone from "dayjs/plugin/timezone"; // Required to handle timezones
import utc from "dayjs/plugin/utc";
import { width } from "@fortawesome/free-brands-svg-icons/fa42Group";
import { render } from "@testing-library/react";
import { icon, text } from "@fortawesome/fontawesome-svg-core";
import {
  SearchOutlined,
  ReloadOutlined,
  ArrowDownOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
  SyncOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import { saveAs } from "file-saver";
import "../App.css";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(timezone);
dayjs.extend(utc);

const { Option } = Select;
const { RangePicker } = DatePicker;
message.config({
  maxCount: 2,
});

export default function Dashboard({
  user,
  employeeId,
  employeeLocation,
  employeeName,
  employeeDesignation,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceRefreshing, setAttendanceRefreshing] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState({
    totalAvailable: 0,
    totalTaken: 0,
    earnedAvailable: 0,
    personalAvailable: 0,
    personalTaken: 0,
    unpaidTaken: 0,
    earnedTaken: 0,
    compoffTaken: 0,
  });
  const [data, setData] = useState([]);

  const attendanceIcons = {
    Present: (
      <FontAwesomeIcon icon={faCalendarCheck} style={{ color: "#34e134bd" }} />
    ),
    Absent: (
      <FontAwesomeIcon icon={faCalendarXmark} style={{ color: "#fe00008f" }} />
    ),

    Punched: <FontAwesomeIcon icon={faClock} style={{ color: "#0d6efdad" }} />,

    "Invalid Time": (
      <FontAwesomeIcon icon={faClock} style={{ color: "#faad14b5" }} />
    ),
    "Less than 9 hr": (
      <FontAwesomeIcon
        icon={faCircleExclamation}
        style={{ color: "#fe00008f" }}
      />
    ),
    Incomplete: (
      <FontAwesomeIcon icon={faCircleMinus} style={{ color: "#faad14b5" }} />
    ),
    Unknown: (
      <FontAwesomeIcon icon={faQuestionCircle} style={{ color: "gray" }} />
    ),
  };

  const defaultAttendanceStatuses = {
    Present: "-",
    Absent: "-",
    Punched: "-",
    "Invalid Time": "-",
    "Less than 9 hr": "-",

    Incomplete: "-",
    Unknown: "-",
  };

  const [attendanceSummary, setAttendanceSummary] = useState(
    defaultAttendanceStatuses
  );

  const [holidays, setHolidays] = useState([]);

  const leaveStats = [
  {
    title: "Total Leave Available",
    value: leaveBalances.totalAvailable ?? "-",
    icon: <FontAwesomeIcon icon={faCalendarDays} />,
    color: "#34e134", // main color
    backgroundColor: "rgba(52, 225, 52, 0.1)", // light green
  },
  {
    title: "Total Leave Taken",
    value: leaveBalances.totalTaken ?? "-",
    icon: <FontAwesomeIcon icon={faCalendarXmark} />,
    color: "#fe0000",
    backgroundColor: "rgba(254, 0, 0, 0.1)",
  },
  {
    title: "Earned Leave Available",
    value: leaveBalances.earnedAvailable ?? "-",
    icon: <FontAwesomeIcon icon={faCalendarPlus} />,
    color: "#faad14",
    backgroundColor: "rgba(250, 173, 20, 0.1)",
  },
  {
    title: "Personal/Sick Leave Available",
    value: leaveBalances.personalAvailable ?? "-",
    icon: <FontAwesomeIcon icon={faUser} />,
    color: "#0d6efd",
    backgroundColor: "rgba(13, 110, 253, 0.1)",
  },
  {
    title: "Personal/Sick Leave Taken",
    value: leaveBalances.personalTaken ?? "-",
    icon: <FontAwesomeIcon icon={faCalendarMinus} />,
    color: "#b54dff",
    backgroundColor: "rgba(181, 77, 255, 0.1)",
  },
  {
    title: "Unpaid Leave Taken",
    value: leaveBalances.unpaidTaken ?? "-",
    icon: <FontAwesomeIcon icon={faWallet} />,
    color: "#008080",
    backgroundColor: "rgba(0, 128, 128, 0.1)",
  },
  {
    title: "Earned Leave Taken",
    value: leaveBalances.earnedTaken ?? "-",
    icon: <FontAwesomeIcon icon={faCalendar} />,
    color: "#91caff",
    backgroundColor: "rgba(145, 202, 255, 0.2)",
  },
  {
    title: "Compoff Leave Taken",
    value: leaveBalances.compoffTaken ?? "-",
    icon: <FontAwesomeIcon icon={faCalendarWeek} />,
    color: "#fe00b2",
    backgroundColor: "rgba(254, 0, 178, 0.1)",
  },
];

const attendanceStats = Object.entries(attendanceSummary).map(
  ([status, count]) => {
    const colorMap = {
      Present: "#34e134",
      Punched: "#0d6efd",
      "Invalid Time": "#faad14",
      "Less than 9 hr": "#fe0000",
      Incomplete: "#faad14",
      Absent: "#fe0000",
      Unknown: "#888",
    };

    const bgMap = {
      Present: "rgba(52, 225, 52, 0.1)",
      Punched: "rgba(13, 110, 253, 0.1)",
      "Invalid Time": "rgba(250, 173, 20, 0.1)",
      "Less than 9 hr": "rgba(254, 0, 0, 0.1)",
      Incomplete: "rgba(250, 173, 20, 0.1)",
      Absent: "rgba(254, 0, 0, 0.1)",
      Unknown: "rgba(136, 136, 136, 0.1)",
    };

    return {
      title: status,
      value: count,
      icon: attendanceIcons[status] || (
        <FontAwesomeIcon icon={faQuestionCircle} />
      ),
      color: colorMap[status] || "#888",
      backgroundColor: bgMap[status] || "rgba(136, 136, 136, 0.1)",
    };
  }
);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch(
          `https://script.google.com/macros/s/AKfycbwjSiL8nUFomLkS1Th-GtOzj9OhsbuNmSKnTs4sK0MwdbaW61vqxWGJOxkvb8wpeS8V/exec?action=holidayindia&employeeId=${employeeId}`
        );
        const data = await response.json();
        // console.log("Holidays:", data);
        if (data.success) {
          setHolidays(data.holidays);
        }
      } catch (error) {
        // console.error("Error fetching holidays:", error);
      }
    };

    fetchHolidays();
  }, []);

  const fetchLeaveBalance = async () => {
    try {
      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbwjSiL8nUFomLkS1Th-GtOzj9OhsbuNmSKnTs4sK0MwdbaW61vqxWGJOxkvb8wpeS8V/exec?action=leaveBalance&employeeId=${employeeId}`
      );
      const data = await response.json();

      if (data.success && data.balance) {
        setLeaveBalances(data.balance);
      } else {
        console.error("Failed to get balance:", data.error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };
  useEffect(() => {
    fetchLeaveBalance();
    fetchAttendance();
  }, [employeeId]);

  const fetchAttendance = async () => {
    try {
      const res = await fetch(
        `https://script.google.com/macros/s/AKfycbwjSiL8nUFomLkS1Th-GtOzj9OhsbuNmSKnTs4sK0MwdbaW61vqxWGJOxkvb8wpeS8V/exec?employeeId=${employeeId}&action=attendance`
      );

      const data = await res.json();

      if (data.success) {
        const statusCounts = {};
        const cleaned = data.data.map((item, index) => {
          const status = item["Status"] || "Unknown";
          statusCounts[status] = (statusCounts[status] || 0) + 1;

          return {
            key: index,
            punchIn: item["Punch in"] || null,
            punchOut: item["Punch out"] || null,
            total: item["Total Hours"] || "-",
            punchedInRemark: item["Punch In Remark"] || "-",
            punchedOutRemark: item["Punch Out Remark"] || "-",
            location: item["Location"] || "-",
            status,
          };
        });
        const mergedSummary = { ...defaultAttendanceStatuses, ...statusCounts };

        setData(cleaned);
        setAttendanceSummary(mergedSummary);
      } else {
        message.error("Failed to fetch attendance data");
      }
    } catch (err) {
      message.error("Error fetching data");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaveBalance();
    setRefreshing(false);
    message.success("Showing updated leave summary data");
  };

  const handleAttendanceRefresh = async () => {
    setAttendanceRefreshing(true);
    await fetchAttendance();
    setAttendanceRefreshing(false);
    message.success("Showing updated attendance summary data");
  };
  return (
    <div
      className="container py-2"
      style={{ maxWidth: "1200px", margin: "0 auto", minHeight: "100vh" }}
    >
      <h2 className="text-center ms-1 m-0 p-0">{employeeName}'s Dashboard </h2>
      <p className="text-center m-0 p-0" style={{ fontSize: "14px" }}>
        Manage your leave requests and balances
      </p>
      <div className="row mt-3 mt-lg-5">
        <div className="d-flex justify-content-between ">
          <h3>
            <FontAwesomeIcon icon={faCalendar} />
            <span className="ms-1">Leave Summary</span>
          </h3>

          <Button
            color="primary"
            variant="filled"
            size="large"
            loading={refreshing}
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
     {leaveStats.map((stat) => (
  <Col key={stat.title} xs={24} sm={12} md={12} lg={6} className="mb-4 mt-3">
    <Card
      bordered={false}
      loading={refreshing}
            className="hoverDashboard-card"

      style={{
        backgroundColor: `${stat.color}20`, // Light transparent background
        borderLeft: `6px solid ${stat.color}`,
        borderRadius: "12px",
        height: "100%",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <div className="d-flex align-items-center">
        <div
          style={{
            minWidth: 50,
            minHeight: 50,
            borderRadius: "50%",
            backgroundColor: `${stat.color}33`, // slightly darker for icon bg
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
          }}
        >
          <div style={{ fontSize: 24, color: stat.color }}>{stat.icon}</div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#333" }}>
            {stat.title}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: stat.color,
              marginTop: 4,
            }}
          >
            {stat.value}
          </div>
        </div>
      </div>
    </Card>
  </Col>
))}

      </div>

      <div className="row mt-lg-3">
        <div className="d-flex justify-content-between ">
          <h3>
            <FontAwesomeIcon icon={faClock} />{" "}
            <span className="ms-1">Attendance Summary</span>
          </h3>
          <Button
            color="primary"
            variant="filled"
            size="large"
            loading={attendanceRefreshing}
            icon={<ReloadOutlined />}
            onClick={handleAttendanceRefresh}
          >
            {attendanceRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

     
     {attendanceStats.map((stat) => (
  <Col key={stat.title} xs={24} sm={12} md={8} lg={6} className="mb-4 mt-3">
    <Card
      hoverable
      bordered={false}
      loading={attendanceRefreshing}
      className="hoverDashboard-card"

      style={{
        backgroundColor: stat.backgroundColor,
        borderLeft: `6px solid ${stat.color}`,
        borderRadius: "12px",
        height: "100%",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <div className="d-flex align-items-center pt-lg-2 pb-lg-3 ">
        <div
          style={{
            minWidth: 50,
            minHeight: 50,
            borderRadius: "50%",
            backgroundColor: `${stat.color}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
          }}
        >
          <div style={{ fontSize: 24, color: stat.color }}>{stat.icon}</div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#333" }}>
            {stat.title}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: stat.color,
              marginTop: 4,
            }}
          >
            {stat.value}
          </div>
        </div>
      </div>
    </Card>
  </Col>
))}


      </div>
    </div>
  );
}
