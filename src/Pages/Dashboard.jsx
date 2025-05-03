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
} from "@fortawesome/free-solid-svg-icons";
import "../App.css";
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
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(timezone);
dayjs.extend(utc);
message.config({
  maxCount: 2,
});
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

  const defaultAttendanceStatuses = {
    Present: "-",
    Punched: "-",
    "Less than 9 hr": "-",
    "Invalid Time": "-",
    Incomplete: "-",
    Absent: "-",
    Unknown: "-",
  };

  const [attendanceSummary, setAttendanceSummary] = useState(
    defaultAttendanceStatuses
  );

  const [holidays, setHolidays] = useState([]);

  const leaveStats = [
    {
      title: "Total Leave Available",
      value:
        leaveBalances.totalAvailable != null
          ? leaveBalances.totalAvailable
          : "-",
      icon: (
        <FontAwesomeIcon icon={faCalendarDays} style={{ color: "#34e134bd" }} />
      ),
      color: "#34e134bd",
    },
    {
      title: "Total Leave Taken",
      value: leaveBalances.totalTaken != null ? leaveBalances.totalTaken : "-",
      icon: (
        <FontAwesomeIcon
          icon={faCalendarXmark}
          style={{ color: "#fe00008f" }}
        />
      ),
      color: "#fe00008f",
    },
    {
      title: "Earned Leave Available",
      value:
        leaveBalances.earnedAvailable != null
          ? leaveBalances.earnedAvailable
          : "-",
      icon: (
        <FontAwesomeIcon icon={faCalendarPlus} style={{ color: "#faad14" }} />
      ),
      color: "#faad14b5",
    },
    {
      title: "Personal/Sick Leave Available",
      value:
        leaveBalances.personalAvailable != null
          ? leaveBalances.personalAvailable
          : "-",
      icon: <FontAwesomeIcon icon={faUser} style={{ color: "#0d6efdad" }} />,
      color: "#0d6efdad",
    },
    {
      title: "Personal/Sick Leave Taken",
      value:
        leaveBalances.personalTaken != null ? leaveBalances.personalTaken : "-",
      icon: (
        <FontAwesomeIcon icon={faCalendarMinus} style={{ color: "#b54dff" }} />
      ),
      color: "#b54dff",
    },
    {
      title: "Unpaid Leave Taken",
      value:
        leaveBalances.unpaidTaken != null ? leaveBalances.unpaidTaken : "-",
      icon: <FontAwesomeIcon icon={faWallet} style={{ color: "#008080b0" }} />,
      color: "#008080b0",
    },
    {
      title: "Earned Leave Taken",
      value:
        leaveBalances.earnedTaken != null ? leaveBalances.earnedTaken : "-",
      icon: <FontAwesomeIcon icon={faCalendar} style={{ color: "#91caff" }} />,
      color: "#91caff",
    },
    {
      title: "Compoff Leave Taken",
      value:
        leaveBalances.compoffTaken != null ? leaveBalances.compoffTaken : "-",
      icon: (
        <FontAwesomeIcon icon={faCalendarWeek} style={{ color: "#fe00b2" }} />
      ),
      color: "#fe00b2",
    },
  ];

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch(
          `https://script.google.com/macros/s/AKfycbyTd8zIqsbuXN0xdCgQiy2lTMBmc9MP_FZWz08_vyLv9k3r5l7JRSA5EoS_X7bd-Gx3/exec?action=holidayindia&employeeId=${employeeId}`
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
        `https://script.google.com/macros/s/AKfycbyTd8zIqsbuXN0xdCgQiy2lTMBmc9MP_FZWz08_vyLv9k3r5l7JRSA5EoS_X7bd-Gx3/exec?action=leaveBalance&employeeId=${employeeId}`
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
        `https://script.google.com/macros/s/AKfycbyTd8zIqsbuXN0xdCgQiy2lTMBmc9MP_FZWz08_vyLv9k3r5l7JRSA5EoS_X7bd-Gx3/exec?employeeId=${employeeId}&action=attendance`
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
    message.success("Table updated successfully");
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
        {leaveStats.map((stat, index) => (
          <Col
            key={stat.title}
            xs={24}
            sm={12}
            md={12}
            lg={6}
            className="mb-4 mt-3"
          >
            <Card
              className=" hover-leave-card"
              loading={refreshing}
              style={{
                borderTop: `4px solid ${stat.color}`,
                borderLeft: "none",
                borderRight: "none",
                borderBottom: "none",
                borderRadius: 4,
                height: "100%",
              }}
            >
              <div className="d-flex align-items-center justify-content-center flex-column">
                <div style={{ fontSize: 30 }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: 16 }}>{stat.title}</div>
                  <Statistic
                    value={stat.value}
                    valueStyle={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: stat.color,
                      textAlign: "center",
                    }}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </div>

      <div className="row mt-lg-5">
        <h3 className="mt-3">
          <FontAwesomeIcon icon={faClock} />{" "}
          <span className="ms-1">Attendance Summary</span>
        </h3>
        {Object.entries(attendanceSummary).map(([status, count]) => {
          const color =
            {
              Present: "green",
              Punched: "blue",
              "Less than 9 hr": "red",
              "Invalid Time": "orange",
              Incomplete: "orange",
              Absent: "red",
              Unknown: "gray",
            }[status] || "gray";

          return (
            <Col
              key={status}
              xs={24}
              sm={12}
              md={8}
              lg={6}
              className="mb-4 mt-3"
            >
              <Card
                className="hover-leave-card"
                style={{
                  borderTop: `4px solid ${color}`,
                  borderRadius: 4,
                  height: "100%",
                }}
              >
                <div className="d-flex align-items-center justify-content-center flex-column">
                  <Tag
                    color={color}
                    style={{ fontSize: 16, padding: "5px 10px" }}
                  >
                    {status}
                  </Tag>
                  <Statistic
                    value={count}
                    valueStyle={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: color,
                      textAlign: "center",
                    }}
                  />
                </div>
              </Card>
            </Col>
          );
        })}
      </div>
    </div>
  );
}
