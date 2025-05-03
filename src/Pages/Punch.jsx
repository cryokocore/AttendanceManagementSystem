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
  Tag
} from "antd";
import { getDistance } from "geolib";
import dayjs from "dayjs";
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
} from "@ant-design/icons";
import { saveAs } from "file-saver";
message.config({
  maxCount: 2,
});
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

  console.log(employeeId, employeeLocation, user);
  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

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

  // const handlePunch = (type) => {
  //   if (!location || !user) return;

  //   const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

  //   const data = {
  //     employeeId: user.employeeId,
  //     employeeName: user.username,
  //     designation: user.designation,
  //     location: `${location.latitude}, ${location.longitude}`,
  //     punchType: type,
  //     timestamp: now,
  //     remarks: remarks.trim() || "N/A",
  //   };

  //   const formBody = new URLSearchParams(data).toString();

  //   fetch(
  //     "https://script.google.com/macros/s/AKfycbwkd74t2keEBxOyD1thKA4mXV6xSVA3ILr9T_Xu8qPyzlEICjfNfDBGCsRE9sZcld0D/exec",
  //     {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/x-www-form-urlencoded",
  //       },
  //       body: formBody,
  //     }
  //   )
  //     .then(() => {
  //       message.success(`${type} recorded at ${now}`);
  //       setLastPunchType(type);
  //       setLastPunchTime(now);
  //       setRemarks("");
  //       fetchAttendance();
  //     })
  //     .catch(() => {
  //       message.error("Failed to record punch.");
  //     });
  // };

  const exportToExcel = () => {
    const exportData = data
      .filter((item) => {
        const normalize = (str) =>
          (str || "").toLowerCase().replace(/\s+/g, "");
        const searchString = normalize(searchText);
        console.log(item);

        return (
          normalize(
            dayjs(item.punchIn).isValid()
              ? dayjs(item.punchIn).format("MMMM D, YYYY - HH:mm:ss")
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
          normalize(item.status).includes(searchString)
        );
      })
      .map((item) => ({
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
        "Punch In Remark": item.punchedInRemark,
        "Punch Out Remark": item.punchedOutRemark,
        Status: item.status,
      }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Style the headers
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          font: {
            name: "Arial",
            sz: R === 0 ? 14 : 10, // Larger for header
            bold: R === 0 ? true : false,
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

    // Set column widths to improve spacing
    worksheet["!cols"] = [
      { wch: 20 }, // Employee ID
      { wch: 20 }, // Employee Name
      { wch: 25 }, // Designation
      { wch: 25 }, // Location
      { wch: 25 }, // Punch In
      { wch: 25 }, // Punch Out
      { wch: 15 }, // Total Hours
      { wch: 40 }, // Punch In Remark
      { wch: 40 }, // Punch Out Remark
      { wch: 20 }, // Status
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
    saveAs(dataBlob, `${employeeId}_${employeeName}_Attendance Report.xlsx`);
    console.log(exportData);
  };

  const handlePunch = (type) => {
    setdisableButton(true);
    if (!location || !user) {
      setdisableButton(false);
      return;
    }

    // Adjust time based on the employee's location
    let now = dayjs();

    if (user.location === "UAE") {
      now = now.tz("Asia/Dubai"); // Set UAE time
    } else if (user.location === "India") {
      now = now.tz("Asia/Kolkata"); // Set India time
    }

    // Format the adjusted time
    const formattedTime = now.format("YYYY-MM-DD HH:mm:ss");

    // Prepare the data for sending
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
      "https://script.google.com/macros/s/AKfycbyTd8zIqsbuXN0xdCgQiy2lTMBmc9MP_FZWz08_vyLv9k3r5l7JRSA5EoS_X7bd-Gx3/exec",
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
        `https://script.google.com/macros/s/AKfycbyTd8zIqsbuXN0xdCgQiy2lTMBmc9MP_FZWz08_vyLv9k3r5l7JRSA5EoS_X7bd-Gx3/exec?employeeId=${employeeId}&action=attendance`
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
          "Less than 9 hr": "error",
          "Invalid Time": "warning",
          Incomplete: "orange",
          Absent: "red",
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
      }
      
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

            {lastPunchType && lastPunchTime && (
              <div className=" rounded-3 p-3 mt-3 hover-status">
                <Text style={{ fontSize: "16px" }}>
                  <strong>Last {lastPunchType}:</strong>{" "}
                  {/* {dayjs(lastPunchTime).format("MMMM D, YYYY - hh:mm A")} */}
                  {dayjs(lastPunchTime).isValid()
                    ? dayjs(lastPunchTime).format("MMMM D, YYYY - hh:mm A")
                    : "-"}
                </Text>
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
                dateFullCellRender={(date) => {
                  const event = getHolidayEvent(date);
                  const isHoliday = !!event;
                  const isSunday = date.day() === 0;
                  return (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "4px 0",
                        height: "100%",
                        backgroundColor: isHoliday
                          ? "rgb(255, 223, 220)"
                          : undefined,
                        borderRadius: "8px",
                        marginLeft: "2px",
                        marginRight: "2px",
                      }}
                    >
                      <div
                        style={{
                          color: isHoliday || isSunday ? "red" : "inherit",
                          fontWeight: "bold",
                        }}
                      >
                        {date.date()}
                      </div>
                      {event && (
                        <Tooltip title={event} color="red">
                          <div
                            style={{
                              color: "blue",
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
              {/* Search Input */}
              <div className="col-12 col-lg-6 mb-2 mb-lg-0">
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

              {/* Refresh Button */}
              <div className="col-12 col-lg-6">
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
              dataSource={data.filter((item) => {
                const normalize = (str) =>
                  (str || "").toLowerCase().replace(/\s+/g, ""); // lower case + remove all spaces
                const searchString = normalize(searchText);

                return (
                  normalize(
                    dayjs(item.punchIn).isValid()
                      ? dayjs(item.punchIn).format("MMMM D, YYYY - HH:mm")
                      : ""
                  )?.includes(searchString) ||
                  normalize(
                    dayjs(item.punchOut).isValid()
                      ? dayjs(item.punchOut).format("MMMM D, YYYY - HH:mm")
                      : ""
                  )?.includes(searchString) ||
                  normalize(item.location)?.includes(searchString) ||
                  normalize(item.total)?.includes(searchString) ||
                  normalize(item.punchedInRemark)?.includes(searchString) ||
                  normalize(item.punchedOutRemark)?.includes(searchString) ||
                  normalize(item.status)?.includes(searchString)
                );
              })}
              pagination={{ pageSize: 3 }}
              rowKey="key"
              scroll={{ x: "max-content" }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
