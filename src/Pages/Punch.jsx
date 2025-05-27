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
  Tag,
  Form,
  Modal,
  DatePicker,
} from "antd";
import { getDistance } from "geolib";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

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
} from "@fortawesome/free-solid-svg-icons";
import "../App.css";
import { useNavigate } from "react-router-dom";
import TextArea from "antd/es/input/TextArea";
import timezone from "dayjs/plugin/timezone"; // Required to handle timezones
import utc from "dayjs/plugin/utc";
import { width } from "@fortawesome/free-brands-svg-icons/fa42Group";
import { render } from "@testing-library/react";
import { text } from "@fortawesome/fontawesome-svg-core";
import {
  SearchOutlined,
  ReloadOutlined,
  ArrowDownOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import { saveAs } from "file-saver";
message.config({
  maxCount: 2,
});
dayjs.extend(duration);
dayjs.extend(timezone);
dayjs.extend(utc);


const { Title, Text } = Typography;
const OFFICE_LAT = 11.024337591862132;
const OFFICE_LNG = 76.93617472853956;
const MAX_DISTANCE_KM = 0.5;

export default function Punch({
  user,
  employeeId,
  employeeLocation,
  employeeName,
  employeeDesignation,
}) {
  const [isNearby, setIsNearby] = useState(false);
  const [location, setLocation] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs().format("HH:mm:ss"));
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [lastPunchType, setLastPunchType] = useState(null);
  const [lastPunchTime, setLastPunchTime] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [disableButton, setdisableButton] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [formLayout, setFormLayout] = useState("vertical");
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [durationSincePunchIn, setDurationSincePunchIn] = useState(null);
  const handleView = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };
  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };
  const getFilteredData = () => {
    return data.filter((item) => {
      const normalize = (str) => (str || "").toLowerCase().replace(/\s+/g, "");

      const searchString = normalize(searchText);

      const punchInDate = dayjs(item.punchIn);

      const isWithinDateRange =
        (!startDateFilter ||
          punchInDate.isSameOrAfter(startDateFilter, "day")) &&
        (!endDateFilter || punchInDate.isSameOrBefore(endDateFilter, "day"));

      const matchesSearch =
        normalize(
          punchInDate.isValid()
            ? punchInDate.format("MMMM D, YYYY - HH:mm:ss")
            : ""
        ).includes(searchString) ||
        normalize(
          dayjs(item.punchOut).isValid()
            ? dayjs(item.punchOut).format("MMMM D, YYYY - HH:mm:ss")
            : ""
        ).includes(searchString) ||
        normalize(item.location).includes(searchString) ||
        normalize(item.total).includes(searchString) ||
        normalize(item.punchedInRemark).includes(searchString) ||
        normalize(item.punchedOutRemark).includes(searchString) ||
        normalize(item.status).includes(searchString);

      return isWithinDateRange && matchesSearch;
    });
  };

  useEffect(() => {
  let interval = null;

  if (lastPunchType === "Punch In" && lastPunchTime && dayjs(lastPunchTime).isValid()) {
    const updateDuration = () => {
      const now = dayjs();
      const diff = dayjs(now).diff(dayjs(lastPunchTime));
      const durationObj = dayjs.duration(diff);
      const formatted = `${String(durationObj.hours()).padStart(2, "0")}:${String(
        durationObj.minutes()
      ).padStart(2, "0")}:${String(durationObj.seconds()).padStart(2, "0")}`;
      setDurationSincePunchIn(formatted);
    };

    updateDuration(); // initial call
    interval = setInterval(updateDuration, 1000);
  } else {
    setDurationSincePunchIn(null); // reset if not Punch In
  }

  return () => clearInterval(interval);
}, [lastPunchType, lastPunchTime]);

  useEffect(() => {
    if (selectedRecord) {
      form.setFieldsValue({
        punchIn: dayjs(selectedRecord.punchIn).isValid()
          ? dayjs(selectedRecord.punchIn).format("MMMM D, YYYY - HH:mm:ss")
          : "-",
        punchOut: dayjs(selectedRecord.punchOut).isValid()
          ? dayjs(selectedRecord.punchOut).format("MMMM D, YYYY - HH:mm:ss")
          : "-",
        location: selectedRecord.location,
        total: selectedRecord.total,
        punchedInRemark: selectedRecord.punchedInRemark,
        punchedOutRemark: selectedRecord.punchedOutRemark,
        status: selectedRecord.status,
      });
    }
  }, [selectedRecord, form]);

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedRecord(null);
  };

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch(
          `https://script.google.com/macros/s/AKfycbyswppht_KPNgMUwgiZXu47ooXgXfO0RPQ1oyhmhljtrndfiauSURdt0soO_qzeV42O/exec?action=holidayindia&employeeId=${employeeId}`
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
  // console.log("employeeLocation", employeeLocation);

  useEffect(() => {
    const timer = setInterval(() => {
      let current = dayjs();

      // Log the current time first
      // console.log("Before Timezone Adjustment:", current.format("HH:mm:ss"));

      // Check the employee's location and set the correct timezone
      if (employeeLocation === "UAE") {
        current = current.tz("Asia/Dubai"); // Set UAE time
        // console.log("UAE Time:", current.format("HH:mm:ss")); // Log the UAE time
      } else if (employeeLocation === "India") {
        current = current.tz("Asia/Kolkata"); // Set India time
        // console.log("India Time:", current.format("HH:mm:ss")); // Log the India time
      }

      setCurrentTime(current.format("HH:mm:ss"));
    }, 1000);

    // Cleanup the interval when component unmounts
    return () => clearInterval(timer);
  }, [employeeLocation]);

  useEffect(() => {
    const updateDistance = (coords) => {
      const { latitude, longitude } = coords;
      const distance = getDistance(
        { latitude, longitude },
        { latitude: OFFICE_LAT, longitude: OFFICE_LNG }
      );
      setIsNearby(distance <= MAX_DISTANCE_KM * 1000);
      setLocation({ latitude, longitude });
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateDistance(position.coords);
      },
      () => message.error("Unable to access your location")
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const distance = getDistance(
          { latitude, longitude },
          { latitude: OFFICE_LAT, longitude: OFFICE_LNG }
        );
        setIsNearby(distance <= MAX_DISTANCE_KM * 1000);
        setLocation({ latitude, longitude });

        if (accuracy > 250) {
          message.warning(
            `Low location accuracy (${Math.round(
              accuracy
            )}m). Try moving near a window or open area.`
          );
        }
      },
      () => message.error("Unable to access your location"),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

 
 
  const exportToExcel = () => {
  const filteredData = getFilteredData(); 

  const exportData = filteredData.map((item) => ({
    "Employee ID": employeeId,
    "Employee Name": employeeName,
    Designation: employeeDesignation,
    Location: employeeLocation,
    "Punch In": dayjs(item.punchIn).isValid()
      ? dayjs(item.punchIn).format("MMM D, YYYY - HH:mm:ss")
      : "-",
    "Punch Out": dayjs(item.punchOut).isValid()
      ? dayjs(item.punchOut).format("MMM D, YYYY - HH:mm:ss")
      : "-",
    "Total Hours": item.total,
    "Punch In Remark": item.punchedInRemark || "-",
    "Punch Out Remark": item.punchedOutRemark || "-",
    Status: item.status || "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Apply header styling and border like in Leave.jsx
  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        font: {
          name: "Arial",
          sz: R === 0 ? 14 : 10,
          bold: R === 0,
          color: { rgb: "000000" },
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
        fill:
          R === 0
            ? { fgColor: { rgb: "FFFF00" } } // Yellow background for header
            : undefined,
      };
    }
  }

  // Optional: set column widths
  worksheet["!cols"] = [
    { wch: 20 }, // Employee ID
    { wch: 25 }, // Employee Name
    { wch: 25 }, // Designation
    { wch: 20 }, // Location
    { wch: 30 }, // Punch In
    { wch: 30 }, // Punch Out
    { wch: 15 }, // Total Hours
    { wch: 30 }, // Punch In Remark
    { wch: 30 }, // Punch Out Remark
    { wch: 15 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance History");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const dataBlob = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });

  saveAs(dataBlob, `${employeeId}_${employeeName}_Attendance_Report.xlsx`);
};

  

  const handlePunch = (type) => {
    setdisableButton(true);
    if (!location || !user) {
      setdisableButton(false);
      return;
    }

   
    let now = dayjs();

    if (user.location === "UAE") {
      now = now.tz("Asia/Dubai"); // Set UAE time
    } else if (user.location === "India") {
      now = now.tz("Asia/Kolkata"); // Set India time
    }


    const formattedTime = now.format("YYYY-MM-DD HH:mm:ss");


    const data = {
      employeeId: user.employeeId,
      employeeName: user.username,
      designation: user.designation,
      location: `${location.latitude}, ${location.longitude}`,
      punchType: type,
      timestamp: formattedTime, // Use the adjusted time
      remarks: remarks.trim() || "N/A",
    };

    const formBody = new URLSearchParams(data).toString();

    // Send the data to the server via POST request
    fetch(
      "https://script.google.com/macros/s/AKfycbyswppht_KPNgMUwgiZXu47ooXgXfO0RPQ1oyhmhljtrndfiauSURdt0soO_qzeV42O/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody,
      }
    )
      .then(() => {
        message.success(`${type} recorded at ${formattedTime}`);
        setLastPunchType(type);
        setLastPunchTime(formattedTime);
        setRemarks("");
        fetchAttendance();
      })
      .catch(() => {
        message.error("Failed to record punch.");
      })
      .finally(() => {
        setdisableButton(false);
      });
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch(
        `https://script.google.com/macros/s/AKfycbyswppht_KPNgMUwgiZXu47ooXgXfO0RPQ1oyhmhljtrndfiauSURdt0soO_qzeV42O/exec?employeeId=${employeeId}&action=attendance`
      );

      const data = await res.json();
      // console.log(data);

      if (data.success) {
        const cleaned = data.data.map((item, index) => {
          const punchIn = item["Punch in"] || null;
          const punchOut = item["Punch out"] || null;
          const total = item["Total Hours"] || "-";
          const punchedInRemark = item["Punch In Remark"] || "-";
          const punchedOutRemark = item["Punch Out Remark"] || "-";
          const location = item["Location"] || "-";
          const status = item["Status"] || "-";

          if (punchIn && punchOut && new Date(punchOut) < new Date(punchIn)) {
            message.warning(
              `Warning: Punch Out time is earlier than Punch In for ${dayjs(
                punchIn
              ).format("MMMM D, YYYY")}`
            );
          }

          return {
            key: index,
            punchIn,
            punchOut,
            total,
            punchedInRemark,
            punchedOutRemark,
            location,
            status,
          };
        });

        // Sort data by most recent punchIn first
        const sortedCleaned = cleaned.sort(
          (a, b) =>
            new Date(b.punchIn).getTime() - new Date(a.punchIn).getTime()
        );

        setData(sortedCleaned);

        // Combine and sort all punches to find last
        const allPunches = data.data.flatMap((item) => {
          const punches = [];
          if (item["Punch in"] && item["Punch in"] !== "-") {
            punches.push({
              type: "Punch In",
              time: item["Punch in"],
            });
          }

          if (item["Punch out"] && item["Punch out"] !== "-") {
            punches.push({
              type: "Punch Out",
              time: item["Punch out"],
            });
          }
          return punches;
        });

        const sorted = allPunches.sort(
          (a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf()
        );

        if (sorted.length > 0 && dayjs(sorted[0].time).isValid()) {
          setLastPunchType(sorted[0].type);
          setLastPunchTime(sorted[0].time);
        } else {
          setLastPunchType(null);
          setLastPunchTime(null);
        }
      } else {
        message.error("Failed to fetch attendance data");
      }
    } catch (err) {
      // console.error(err);
      message.error("Error fetching data");
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchAttendance();
    }
  }, [employeeId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setSearchText(null);
    await fetchAttendance();
    setRefreshing(false);
    message.success("Table updated successfully");
  };

  const columns = [
    {
      title: "Punch In",
      dataIndex: "punchIn",
      width: 200,
      ellipsis: true,
      sorter: (a, b) => dayjs(a.punchIn).valueOf() - dayjs(b.punchIn).valueOf(),
      render: (text) => {
        const formattedText = dayjs(text).isValid()
          ? dayjs(text).format("MMMM D, YYYY - HH:mm")
          : "-";
        return (
          <Tooltip title={formattedText}>
            <span>{formattedText}</span>
          </Tooltip>
        );
      },
    },
    {
      title: "Punch Out",
      dataIndex: "punchOut",
      width: 200,
      ellipsis: true,
      sorter: (a, b) =>
        dayjs(a.punchOut).valueOf() - dayjs(b.punchOut).valueOf(),
      render: (text) => {
        const formattedText = dayjs(text).isValid()
          ? dayjs(text).format("MMMM D, YYYY - HH:mm")
          : "-";
        return (
          <Tooltip title={formattedText}>
            <span>{formattedText}</span>
          </Tooltip>
        );
      },
    },
    {
      title: "Location",
      dataIndex: "location",
      width: 200,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          {" "}
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Total Hours",
      dataIndex: "total",
      width: 150,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Punch In Remark",
      dataIndex: "punchedInRemark",
      width: 300,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Punch Out Remark",
      dataIndex: "punchedOutRemark",
      width: 300,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 180,
      ellipsis: true,
      render: (text) => {
        const colorMap = {
          Present: "success",
          Punched: "processing",
          "Invalid Time": "warning",
          "Less than 9 hr": "warning",
          Incomplete: "orange",
          Absent: "error",
          Unknown: "gray",
        };

        const color = colorMap[text] || "gray";

        return (
          <Tag
            color={color}
            style={{
              fontWeight: "bold",
              fontSize: "13px",
              padding: "4px 10px",
              textTransform: "capitalize",
            }}
          >
            {text || "-"}
          </Tag>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Button
          color="purple"
          variant="filled"
          size="large"
          onClick={() => handleView(record)}
        >
          <EyeTwoTone /> View
        </Button>
      ),
    },
  ];

  const getHolidayEvent = (date) => {
    const dateString = date.format("YYYY-MM-DD");
    const holiday = holidays.find((holiday) =>
      dayjs(holiday.date).isSame(date, "day")
    );
    return holiday ? holiday.event : null;
  };

  return (
    <div
      className="container py-2"
      style={{ maxWidth: "1200px", margin: "0 auto", minHeight: "100vh" }}
    >
      <h2 className="text-center ms-1">Punch In/Out Time Tracking</h2>

      <div className="row mt-3">
        {/* Current Status Card */}
        <div className="col-12 col-lg-6">
          <Card
            bordered={false}
            className="shadow hover-card "
            style={{ borderRadius: 16, height: "100%" }}
          >
            <div className="d-flex flex-column flex-lg-row justify-content-between">
              <h4>
                <FontAwesomeIcon icon={faCalendarWeek} />
                <span className="ms-1">Current Status</span>
              </h4>
              <Text className="mt-lg-2 text-primary">
                {dayjs().format("dddd, MMMM D, YYYY")}
              </Text>
            </div>
            <div style={{ fontSize: 40, fontWeight: "bold" }}>
              <FontAwesomeIcon icon={faClock} style={{ color: "#faad14" }} />{" "}
              {currentTime}
            </div>

            <div
              className="rounded-3 p-3 mt-2 hover-status"
              style={{ backgroundColor: "#91caff3d" }}
            >
              <Text style={{ fontSize: "16px" }}>
                <strong>Location:</strong>{" "}
                {location
                  ? `${location.latitude}, ${location.longitude}`
                  : "Loading..."}
              </Text>
              <br />
              <Text style={{ fontSize: "16px" }}>
                <strong>Status:</strong>{" "}
                {isNearby ? (
                  <Text type="success" className="ms-1">
                    <FontAwesomeIcon icon={faLocationDot} fade /> Within office
                    area
                  </Text>
                ) : (
                  <Text type="danger" className="ms-1">
                    <FontAwesomeIcon icon={faLocationDot} fade /> Outside office
                    area
                  </Text>
                )}
              </Text>
            </div>

            {/* {lastPunchType && lastPunchTime && (
              <div className=" rounded-3 p-3 mt-3 hover-status">
                <Text style={{ fontSize: "16px" }}>
                  <strong>Last {lastPunchType}:</strong>{" "}
                  {dayjs(lastPunchTime).isValid()
                    ? dayjs(lastPunchTime).format("MMMM D, YYYY - hh:mm A")
                    : "-"}
                </Text>
              </div>
            )} */}

            {/* {lastPunchType === "Punch In" && durationSincePunchIn && (
  <div className="rounded-3 ps-3 pe-3 pb-3 pt-2 hover-status mt-2">
    <Text style={{ fontSize: "16px" }}>
      <strong>Duration:</strong>{" "}
      <Text type="secondary" className="ms-1">
        {durationSincePunchIn}
      </Text>
    </Text>
  </div>
)} */}

{lastPunchType && lastPunchTime && (
  <div className="rounded-3 p-3 mt-3 hover-status">
    <Text style={{ fontSize: "16px" }}>
      <strong>Last {lastPunchType}:</strong>{" "}
      {dayjs(lastPunchTime).isValid()
        ? dayjs(lastPunchTime).format("MMMM D, YYYY - hh:mm:ss A")
        : "-"}
    </Text>

    {lastPunchType === "Punch In" && durationSincePunchIn && (
      <div style={{ marginTop: "6px" }}>
        <Text style={{ fontSize: "16px" }}>
          <strong>Duration:</strong>{" "}
          <Text  className="ms-1 text-primary" style={{ fontSize: "16px", fontWeight:"bold" }}>
            {durationSincePunchIn}
          </Text>
        </Text>
      </div>
    )}
  </div>
)}


            <div className=" rounded-3 ps-3 pe-3 pb-3 mt-3 hover-status ">
              <Space.Compact style={{ width: "100%" }} className="mt-3">
                <TextArea
                  placeholder="Add remarks for late login or permissions"
                  className="form-control"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </Space.Compact>

              <Space wrap className="mt-3">
                <Button
                  type="primary"
                  size="large"
                  onClick={() => handlePunch("Punch In")}
                  disabled={!isNearby || disableButton}
                >
                  <FontAwesomeIcon icon={faCalendar} /> Punch In
                </Button>
                <Button
                  color="danger"
                  variant="solid"
                  size="large"
                  onClick={() => handlePunch("Punch Out")}
                  disabled={!isNearby || disableButton}
                >
                  <FontAwesomeIcon icon={faArrowRightFromBracket} /> Punch Out
                </Button>
              </Space>
            </div>
          </Card>
        </div>

        {/* Calendar Card */}
        <div className="col-12 col-lg-6 mt-5 mt-lg-0">
          <Card
            bordered={false}
            className="shadow hover-card "
            style={{ borderRadius: 16, height: "100%" }}
          >
            <h3>
              <FontAwesomeIcon icon={faCalendarDays} />
              <span className="ms-1">Holiday Calendar</span>
            </h3>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Calendar
                fullscreen={false}
                value={selectedDate}
                onSelect={(value) => setSelectedDate(value)}
                className="rounded-3 mt-2 p-lg-2"
                fullCellRender={(date) => {
                  const event = getHolidayEvent(date);
                  const isHoliday = !!event;
                  const isSunday = date.day() === 0;
                  const isToday = date.isSame(dayjs(), "day");

                  const backgroundColor = isToday
                    ? "#cce5ff"
                    : isHoliday
                    ? "rgb(255, 223, 220)"
                    : undefined;

                  const textColor = isToday
                    ? "blue"
                    : isHoliday || isSunday
                    ? "red"
                    : "inherit";

                  return (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "4px 0",
                        height: "100%",
                        backgroundColor,
                        borderRadius: "8px",
                        marginLeft: "2px",
                        marginRight: "2px",
                      }}
                    >
                      <div
                        style={{
                          color: textColor,
                          fontWeight: "bold",
                        }}
                      >
                        {date.date()}
                      </div>
                      {event && (
                        <Tooltip title={event} color="red">
                          <div
                            style={{
                              color: isToday ? "#ffffff" : "blue",
                              fontSize: "10px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "100%",
                              padding: "4px",
                            }}
                          >
                            {event}
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  );
                }}
              />

              <div className="rounded-3 mt-1 text-center hover-status">
                <Button
                  type="link"
                  icon={<FontAwesomeIcon icon={faCalendarCheck} />}
                  onClick={() => setSelectedDate(dayjs())}
                  style={{ fontSize: "18px" }}
                >
                  Today
                </Button>
              </div>
            </Space>
          </Card>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="row">
        <div className="col-12 mt-5 mb-3 mb-lg-0">
          <Card
            bordered={false}
            className="shadow hover-card "
            style={{ borderRadius: 16 }}
          >
            <h3>
              <FontAwesomeIcon icon={faTable} />
              <span className="ms-1">Attendance History</span>
            </h3>{" "}
            <div className="row align-items-center mt-3">
              <div className="col-12 col-lg-4 mb-2 mb-lg-0">
                <DatePicker
                  placeholder="From Date"
                  size="large"
                  value={startDateFilter}
                  onChange={(date) => {
                    setStartDateFilter(date);
                    setSearchText("");
                    // setIsSearchActive(false);
                    // setSelectedStatus(null);
                    if (
                      endDateFilter &&
                      date &&
                      date.isAfter(endDateFilter, "day") // Compare with day precision
                    ) {
                      message.error("Start date cannot be after end date.");
                    }
                  }}
                  // disabled={isSearchActive || selectedStatus !== null}
                />

                <DatePicker
                  placeholder="To Date"
                  size="large"
                  value={endDateFilter}
                  onChange={(date) => {
                    setEndDateFilter(date);
                    setSearchText("");
                    // setIsSearchActive(false);
                    // setSelectedStatus(null);
                    if (
                      startDateFilter &&
                      date &&
                      date.isBefore(startDateFilter, "day") // Compare with day precision
                    ) {
                      message.error("End date cannot be before start date.");
                    }
                  }}
                  style={{ marginRight: 16 }}
                  // disabled={isSearchActive || selectedStatus !== null}
                  className="mt-2 mt-lg-0 ms-0 ms-lg-2"
                />
              </div>
              <div className="col-12 col-lg-4 mb-2 mb-lg-0">
                <Input
                  placeholder="Search"
                  prefix={<SearchOutlined />}
                  allowClear
                  value={searchText}
                  onChange={handleSearch}
                  style={{ width: "100%" }}
                  size="large"
                />
              </div>
              <div className="col-12 col-lg-4">
                <div className="d-flex justify-content-lg-end gap-2">
                  <Button
                    type="primary"
                    size="large"
                    loading={refreshing}
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                  >
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </Button>
                  <Button
                    variant="solid"
                    color="danger"
                    size="large"
                    icon={<ArrowDownOutlined />}
                    onClick={exportToExcel}
                  >
                    Export
                  </Button>
                </div>
              </div>
            </div>
            <Table
              columns={columns}
              loading={refreshing}
              className="mt-3"
              dataSource={getFilteredData()}
              pagination={{ pageSize: 3 }}
              rowKey="key"
              scroll={{ x: "max-content" }}
            />
          </Card>
        </div>
      </div>
      <Modal open={isModalVisible} onCancel={handleCloseModal} footer={null}   style={{ top: 2 }} >
        <h4>Attendance Details</h4>
        <Form layout={formLayout} form={form}>
          <Form.Item label="Punch In" name="punchIn">
            <Input />
          </Form.Item>
          <Form.Item label="Punch Out" name="punchOut">
            <Input />
          </Form.Item>
          <Form.Item label="Location" name="location">
            <Input />
          </Form.Item>
          <Form.Item label="Total Hours" name="total">
            <Input />
          </Form.Item>
          <Form.Item label="Punch In Remark" name="punchedInRemark">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Punch Out Remark" name="punchedOutRemark">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item shouldUpdate>
            {() => {
              const status = form.getFieldValue("status");
              const colorMap = {
                Present: "success",
                Punched: "processing",
                "Invalid Time": "warning",
                "Less than 9 hr": "warning",
                Incomplete: "orange",
                Absent: "error",
                Unknown: "gray",
              };
              return (
                <Form.Item label="Status">
                  <Tag
                    color={colorMap[status] || "default"}
                    style={{
                      fontWeight: "bold",
                      fontSize: "16px",
                      padding: "4px 10px",
                      textTransform: "capitalize",
                    }}
                  >
                    {status || "-"}
                  </Tag>
                </Form.Item>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
