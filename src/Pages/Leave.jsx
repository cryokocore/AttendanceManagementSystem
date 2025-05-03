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
export default function Leave({
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
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [formLayout, setFormLayout] = useState("vertical");
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [exportDisable, setExportDisable] = useState(false);
  const [leaveDuration, setLeaveDuration] = useState(null);
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
  const [tableRefresh, setTableRefresh] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const handleView = (record) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };
  useEffect(() => {
    if (selectedRecord) {
      form.setFieldsValue({
        leaveType: selectedRecord.leaveType,
        dateRange: selectedRecord.dateRange
          ? selectedRecord.dateRange.split(",").map((d) => dayjs(d.trim()))
          : [],
        reason: selectedRecord.reason,
      });
      setLeaveDuration(selectedRecord.leaveDuration);
    }
  }, [selectedRecord, form]);

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedRecord(null);
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

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

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbyTd8zIqsbuXN0xdCgQiy2lTMBmc9MP_FZWz08_vyLv9k3r5l7JRSA5EoS_X7bd-Gx3/exec?action=leaveRequests&employeeId=${employeeId}`
      );
      const data = await response.json();
      console.log("Leave request:", data);

      if (data.success && Array.isArray(data.data)) {
        setLeaveRequests(data.data);
      } else {
        console.error(
          "Failed to get leave requests:",
          data.error || "Unknown error"
        );
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchLeaveBalance();
    fetchLeaveRequests();
  }, [employeeId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaveBalance();
    setRefreshing(false);
    message.success("Table updated successfully");
  };

  const handleTableRefresh = async () => {
    setTableRefresh(true);
    await fetchLeaveRequests();
    setTableRefresh(false);
  };

  const exportToExcel = () => {
    const filteredData = leaveRequests.filter((item) => {
      const [fromDateStr = "", toDateStr = ""] =
        item.dateRange?.split(",")?.map((s) => s.trim()) || [];

      const fromDate = dayjs(fromDateStr);
      const toDate = dayjs(toDateStr);

      console.log("Item:", item);
      console.log(
        "From Date String:",
        fromDateStr,
        "| Parsed:",
        fromDate.format(),
        "| Valid:",
        fromDate.isValid()
      );
      console.log(
        "To Date String:",
        toDateStr,
        "| Parsed:",
        toDate.format(),
        "| Valid:",
        toDate.isValid()
      );
      console.log(
        "Start Filter:",
        startDateFilter,
        "| End Filter:",
        endDateFilter
      );

      const valuesToSearch = [
        item.leaveType,
        item.reason,
        item.duration,
        item.status,
        fromDateStr,
        toDateStr,
      ];

      const searchMatch =
        !searchText ||
        valuesToSearch.some((value) =>
          normalize(value).includes(normalize(searchText))
        );

      const dateMatch =
        !startDateFilter ||
        !endDateFilter ||
        (fromDate.isValid() &&
          toDate.isValid() &&
          dayjs(toDate).isSameOrAfter(dayjs(startDateFilter), "day") &&
          dayjs(fromDate).isSameOrBefore(dayjs(endDateFilter), "day"));

      console.log("searchMatch:", searchMatch, "| dateMatch:", dateMatch);

      return searchMatch && dateMatch;
    });

    console.log("Raw leaveRequests:", leaveRequests);
    console.log("Filtered export data:", filteredData);

    if (!filteredData.length) {
      console.warn("No data to export.");
      return;
    }

    const exportData = filteredData.map((item) => {
      const [fromRaw, toRaw] = (item.dateRange || "").split(",");
      const fromDate = dayjs(fromRaw).isValid()
        ? dayjs(fromRaw).format("MMM D, YYYY HH:mm:ss")
        : "-";
      const toDate = dayjs(toRaw).isValid()
        ? dayjs(toRaw).format("MMM D, YYYY HH:mm:ss")
        : "-";

      return {
        "Employee ID": employeeId || "-",
        "Employee Name": employeeName || "-",
        Designation: employeeDesignation || "-",
        Location: employeeLocation || "-",
        "Leave Type": item.leaveType || "-",
        "From Date": fromDate,
        "To Date": toDate,
        Reason: item.reason || "-",
        "Leave Duration": item.leaveDuration || "-",
        Status: item.status || "-",
      };
    });

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

    worksheet["!cols"] = [
      { wch: 20 }, // Employee ID
      { wch: 25 }, // Employee Name
      { wch: 25 }, // Designation
      { wch: 20 }, // Location
      { wch: 20 }, // Leave Type
      { wch: 25 }, // From Date
      { wch: 25 }, // To Date
      { wch: 100 }, // Reason
      { wch: 20 }, // Leave Duration
      { wch: 20 }, // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Report");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, `${employeeId}_${employeeName}_Leave_Report.xlsx`);
  };

  const leaveStats = [
    {
      title: "Total Leave Available",
      value: leaveBalances.totalAvailable || 0,
      icon: (
        <FontAwesomeIcon icon={faCalendarDays} style={{ color: "#34e134bd" }} />
      ),
      color: "#34e134bd",
    },
    {
      title: "Total Leave Taken",
      value: leaveBalances.totalTaken || 0,
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
      value: leaveBalances.earnedAvailable || 0,
      icon: (
        <FontAwesomeIcon icon={faCalendarPlus} style={{ color: "#faad14" }} />
      ),
      color: "#faad14b5",
    },
    {
      title: "Personal/Sick Leave Available",
      value: leaveBalances.personalAvailable || 0,
      icon: <FontAwesomeIcon icon={faUser} style={{ color: "#0d6efdad" }} />,
      color: "#0d6efdad",
    },
    {
      title: "Personal/Sick Leave Taken",
      value: leaveBalances.personalTaken || 0,
      icon: (
        <FontAwesomeIcon icon={faCalendarMinus} style={{ color: "#b54dff" }} />
      ),
      color: "#b54dff",
    },
    {
      title: "Unpaid Leave Taken",
      value: leaveBalances.unpaidTaken || 0,
      icon: <FontAwesomeIcon icon={faWallet} style={{ color: "#008080b0" }} />,
      color: "#008080b0",
    },
    {
      title: "Earned Leave Taken",
      value: leaveBalances.earnedTaken || 0,
      icon: <FontAwesomeIcon icon={faCalendar} style={{ color: "#91caff" }} />,
      color: "#91caff",
    },
    {
      title: "Compoff Leave Taken",
      value: leaveBalances.compoffTaken || 0,
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

  useEffect(() => {
    const values = form.getFieldsValue();
    const dateRange = values["Date Range"];
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      const duration = calculateLeaveDuration(startDate, endDate);
      setLeaveDuration(duration);
    }
  }, [form.getFieldValue("Date Range")]);

  const calculateLeaveDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;

    const holidayDates = holidays.map((holiday) =>
      dayjs(holiday.date).format("YYYY-MM-DD")
    );

    let totalLeave = 0;
    let current = startDate.clone().startOf("day");

    while (current.isSameOrBefore(endDate, "day")) {
      const isSunday = current.day() === 0;
      const isHoliday = holidayDates.includes(current.format("YYYY-MM-DD"));

      if (!isSunday && !isHoliday) {
        let leaveForTheDay = 0;

        if (
          current.isSame(startDate, "day") &&
          current.isSame(endDate, "day")
        ) {
          // Same-day leave
          const hours = endDate.diff(startDate, "minute") / 60;
          leaveForTheDay = hours >= 4 && hours < 8 ? 0.5 : hours >= 8 ? 1 : 0;
        } else if (current.isSame(startDate, "day")) {
          // First day of range
          const endOfDay = current.endOf("day");
          const hours = endOfDay.diff(startDate, "minute") / 60;
          leaveForTheDay = hours >= 4 && hours < 8 ? 0.5 : hours >= 8 ? 1 : 0;
        } else if (current.isSame(endDate, "day")) {
          // Last day of range
          const startOfDay = current.startOf("day");
          const hours = endDate.diff(startOfDay, "minute") / 60;
          leaveForTheDay = hours >= 4 && hours < 8 ? 0.5 : hours >= 8 ? 1 : 0;
        } else {
          // Full day in between
          leaveForTheDay = 1;
        }

        totalLeave += leaveForTheDay;
      }

      current = current.add(1, "day");
    }

    return totalLeave;
  };

  const normalize = (text) => String(text).toLowerCase().replace(/\s+/g, "");

  const filteredData = leaveRequests.filter((item) => {
    const [fromDateStr = "", toDateStr = ""] =
      item.dateRange?.split(",")?.map((s) => s.trim()) || [];

    const fromDate = dayjs(fromDateStr);
    const toDate = dayjs(toDateStr);

    console.log("Item:", item);
    console.log(
      "From Date String:",
      fromDateStr,
      "| Parsed:",
      fromDate.format(),
      "| Valid:",
      fromDate.isValid()
    );
    console.log(
      "To Date String:",
      toDateStr,
      "| Parsed:",
      toDate.format(),
      "| Valid:",
      toDate.isValid()
    );
    console.log(
      "Start Filter:",
      startDateFilter,
      "| End Filter:",
      endDateFilter
    );

    const valuesToSearch = [
      item.leaveType,
      item.reason,
      item.duration,
      item.status,
      fromDateStr,
      toDateStr,
    ];

    const searchMatch =
      !searchText ||
      valuesToSearch.some((value) =>
        normalize(value).includes(normalize(searchText))
      );

    const dateMatch =
      !startDateFilter ||
      !endDateFilter ||
      (fromDate.isValid() &&
        toDate.isValid() &&
        dayjs(toDate).isSameOrAfter(dayjs(startDateFilter), "day") &&
        dayjs(fromDate).isSameOrBefore(dayjs(endDateFilter), "day"));

    console.log("searchMatch:", searchMatch, "| dateMatch:", dateMatch);

    return searchMatch && dateMatch;
  });

  useEffect(() => {
    if ((startDateFilter || endDateFilter) && filteredData.length === 0) {
      message.error("No data found for the selected date");
      setExportDisable(true);
    } else if (searchText && filteredData.length === 0) {
      message.error("No data found for your search");
      setExportDisable(true);
    } else {
      setExportDisable(false);
    }
  }, [searchText, startDateFilter, endDateFilter, filteredData]);

  const columns = [
    // {
    //   title: "Leave Submitted Date",
    //   dataIndex: "timestamp",
    //   width: 200,
    //   ellipsis: true,
    //   render: (text) => {
    //     const formattedText = dayjs(text).isValid()
    //       ? dayjs(text).format("MMMM D, YYYY - HH:mm:ss")
    //       : "-";
    //     return (
    //       <Tooltip title={formattedText}>
    //         <span>{formattedText}</span>
    //       </Tooltip>
    //     );
    //   },
    // },

    {
      title: "Leave Type",
      dataIndex: "leaveType",
      width: 150,
      ellipsis: true,
      render: (text) => (
        // <Tooltip title={text}>
          <span>{text}</span>
        // </Tooltip>
      ),
    },
    {
      title: "From Date",
      dataIndex: "dateRange",
      width: 200,
      ellipsis: true,
      render: (text) => {
        const fromDate = text?.split(",")[0]?.trim();
        const formatted = dayjs(fromDate).isValid()
          ? dayjs(fromDate).format("MMM D, YYYY HH:mm")
          : "-";
        return (
          // <Tooltip title={formatted}>
            <span>{formatted}</span>
          // </Tooltip>
        );
      },
    },
    {
      title: "To Date",
      dataIndex: "dateRange",
      width: 200,
      ellipsis: true,
      render: (text) => {
        const toDate = text?.split(",")[1]?.trim();
        const formatted = dayjs(toDate).isValid()
          ? dayjs(toDate).format("MMM D, YYYY HH:mm")
          : "-";
        return (
          // <Tooltip title={formatted}>
          <span>{formatted}</span>
          // </Tooltip>
        );
      },
    },
    {
      title: "Reason",
      dataIndex: "reason",
      width: 300,
      ellipsis: true,
      render: (text) =>
        // <Tooltip
        //   title={
        //     <div
        //       style={{
        //         maxWidth: 100,
        //         whiteSpace: "normal",
        //         wordBreak: "break-word",
        //       }}
        //     >
        //       {text}
        //     </div>
        //   }
        // >
        //   <span
        //     style={{
        //       display: "inline-block",
        //       width: "100%",
        //       overflow: "hidden",
        //       textOverflow: "ellipsis",
        //       whiteSpace: "nowrap",
        //       verticalAlign: "middle",
        //     }}
        //   >
        //     {text}
        //   </span>
        // </Tooltip>

        <span>{text}</span>
      },
    {
      title: "Leave Duration",
      dataIndex: "leaveDuration",
      width: 130,
      ellipsis: true,
      render: (text) => (
        // <Tooltip title={text}>
          <span>{text}</span>
        // </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 150,
      ellipsis: true,
      render: (text) => {
        let color = "default";
        let icon = null;

        const status = text?.toLowerCase();

        if (status === "pending") {
          color = "warning";
          icon = <SyncOutlined spin />;
        } else if (status === "approved") {
          color = "success";
          icon = <CheckCircleOutlined />;
        } else if (status === "denied") {
          color = "error";
          icon = <CloseCircleOutlined />;
        }

        return (
          // <Tooltip title={text}>
            <Tag
              color={color}
              icon={icon}
              style={{
                textTransform: "capitalize",
                fontSize: "16px",
                padding: "4px 12px",
                height: "auto",
              }}
            >
              {text}
            </Tag>
          // </Tooltip>
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

  const styl = `.ant-picker-large {
    padding: 5px;
}`;

  const handleSubmitLeave = async () => {
    if (leaveDuration === 0) {
      message.warning("Please select a valid date range");
      return;
    }
    setLoading(true);
    try {
      const values = await form.validateFields(); // Get form values
      const dateRange = values["Date Range"];
      const payload = {
        action: "submitleave",
        employeeId,
        employeeName,
        employeeDesignation,
        employeeLocation,
        leaveType: values["Leave Type"],
        dateRange: dateRange
          .map((date) => date.format("YYYY-MM-DD HH:mm"))
          .join(","),
        reason: values["Reason for leave"],
        status: "Pending", // Leave request status is always pending
      };

      // Validate the leave duration
      const [startDate, endDate] = dateRange;
      const durationInHours = calculateLeaveDuration(startDate, endDate);

      // if (durationInHours < 4.5) {
      //   message.error("Please select a valid date range (minimum 4.5 hours).");
      //   return;
      // }

      payload.leaveDuration = durationInHours;

      // Encode the payload into a URL-encoded format
      const encodedPayload = new URLSearchParams(payload).toString();

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbyTd8zIqsbuXN0xdCgQiy2lTMBmc9MP_FZWz08_vyLv9k3r5l7JRSA5EoS_X7bd-Gx3/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: encodedPayload, // Send as URL-encoded
        }
      );

      const result = await response.json();

      if (result.success) {
        message.success("Leave request submitted successfully!");
        setLeaveDuration(0);
        form.resetFields();
        await fetchLeaveBalance();
      } else {
        message.error("Failed to submit leave request!");
      }
    } catch (error) {
      console.error(error);
      message.error("Please fill all fields correctly!");
    } finally {
      setLoading(false);
    }
  };

  const getHolidayEvent = (date) => {
    const dateString = date.format("YYYY-MM-DD");
    const holiday = holidays.find((holiday) =>
      dayjs(holiday.date).isSame(date, "day")
    );
    return holiday ? holiday.event : null;
  };
  return (
    <>
      <style>{styl}</style>

      <div
        className="container py-2"
        style={{ maxWidth: "1200px", margin: "0 auto", minHeight: "100vh" }}
      >
        <h2 className="text-center ms-1 m-0 p-0">Leave Balance/Request</h2>
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
          <div className="col-12 col-lg-6 mt-5 mt-lg-0">
            <Card
              className="shadow hover-card "
              style={{ borderRadius: 16, height: "100%" }}
            >
              <h3>
                <FontAwesomeIcon icon={faCalendarPlus} />
                <span className="ms-1">Leave Request</span>
              </h3>
              <Form layout={formLayout} form={form}>
                <div className="col-12 ">
                  <Form.Item
                    label={
                      <span>
                        <FontAwesomeIcon
                          icon={faList}
                          style={{ marginRight: "2px" }}
                        />
                        Leave Type
                      </span>
                    }
                    name="Leave Type"
                    rules={[
                      {
                        required: true,
                        message: "Please select leave type",
                      },
                    ]}
                  >
                    <Select size="large" placeholder="Select leave type">
                      <Option
                        value="Personal/sick leave"
                        disabled={leaveBalances.personalAvailable === 0}
                      >
                        Personal/sick leave
                      </Option>

                      <Option
                        value="Earned leave"
                        disabled={leaveBalances.earnedAvailable === 0}
                      >
                        Earned leave
                      </Option>
                      <Option value="Unpaid leave">Unpaid leave</Option>
                      <Option value="Compoff leave">Compoff leave</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label={
                      <span>
                        <FontAwesomeIcon
                          icon={faClock}
                          style={{ marginRight: "2px" }}
                        />
                        Date Range
                      </span>
                    }
                    name="Date Range"
                    rules={[
                      {
                        required: true,
                        message: "Please select date range",
                      },
                    ]}
                  >
                    <RangePicker
                      showTime
                      size="large"
                      style={{ width: "100%" }}
                      onChange={(dates) => {
                        if (dates && dates.length === 2) {
                          const [startDate, endDate] = dates;
                          const duration = calculateLeaveDuration(
                            startDate,
                            endDate
                          );
                          setLeaveDuration(duration);
                        } else {
                          setLeaveDuration(null);
                        }
                      }}
                    />
                  </Form.Item>

                  <Form.Item label="Total No. of Days">
                    <Input size="large" value={leaveDuration} disabled />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span>
                        <FontAwesomeIcon
                          icon={faPenToSquare}
                          style={{ marginRight: "2px" }}
                        />
                        Reason for leave
                      </span>
                    }
                    name="Reason for leave"
                    rules={[
                      {
                        required: true,
                        message: "Please enter the reason for leave",
                      },
                    ]}
                  >
                    <TextArea
                      placeholder={
                        form.getFieldValue("Leave Type") === "Compoff leave"
                          ? "Please enter the dates that you worked on to take comp off"
                          : "Enter the reason for leave"
                      }
                      allowClear
                      rows={5}
                    />
                  </Form.Item>

                  <Button
                    type="primary"
                    size="large"
                    className="mt-2"
                    onClick={handleSubmitLeave}
                    disabled={loading}
                    loading={loading}
                  >
                    {loading
                      ? "Submitting Leave Request..."
                      : "Submit Leave Request"}
                  </Button>
                </div>
              </Form>
            </Card>
          </div>
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
                  className="rounded-3 mt-3 p-lg-2"
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
        <div className="row">
          <div className="col-12 mt-5">
            <Card
              bordered={false}
              className="shadow hover-card "
              style={{ borderRadius: 16 }}
            >
              <h3>
                <FontAwesomeIcon icon={faCalendarPlus} />
                <span className="ms-1">Leave Request Report</span>
              </h3>
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

                {/* Refresh Button */}
                <div className="col-12 col-lg-4">
                  <div className="d-flex justify-content-lg-end gap-2">
                    <Button
                      type="primary"
                      size="large"
                      loading={tableRefresh}
                      icon={<ReloadOutlined />}
                      onClick={handleTableRefresh}
                    >
                      {tableRefresh ? "Refreshing..." : "Refresh"}
                    </Button>
                    <Button
                      variant="solid"
                      color="danger"
                      size="large"
                      icon={<ArrowDownOutlined />}
                      onClick={exportToExcel}
                      disabled={exportDisable}
                    >
                      Export
                    </Button>
                  </div>
                </div>
              </div>
              <Table
                columns={columns}
                dataSource={filteredData}
                rowKey={(record, index) => index}
                loading={tableRefresh}
                pagination={{ pageSize: 5 }}
                scroll={{ x: "max-content" }}
                className="mt-3"
              />
            </Card>
            <Modal
              open={isModalVisible}
              onCancel={handleCloseModal}
              footer={null}
            >
              <h4>Leave Request Details</h4>
              <Form layout={formLayout} form={form}>
                <Form.Item
                  label="Leave Type"
                  name="leaveType"
                  rules={[
                    { required: true, message: "Please select leave type" },
                  ]}
                >
                  <Select size="large" placeholder="Select leave type">
                    <Option
                      value="Personal/sick leave"
                      disabled={leaveBalances.personalAvailable === 0}
                    >
                      Personal/sick leave
                    </Option>
                    <Option
                      value="Earned leave"
                      disabled={leaveBalances.earnedAvailable === 0}
                    >
                      Earned leave
                    </Option>
                    <Option value="Unpaid leave">Unpaid leave</Option>
                    <Option value="Compoff leave">Compoff leave</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Date Range"
                  name="dateRange"
                  rules={[
                    { required: true, message: "Please select date range" },
                  ]}
                >
                  <RangePicker
                    showTime
                    size="large"
                    style={{ width: "100%" }}
                    onChange={(dates) => {
                      if (dates && dates.length === 2) {
                        const [startDate, endDate] = dates;
                        const duration = calculateLeaveDuration(
                          startDate,
                          endDate
                        );
                        setLeaveDuration(duration);
                      } else {
                        setLeaveDuration(null);
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item label="Total No. of Days">
                  <Input size="large" value={leaveDuration} disabled />
                </Form.Item>

                <Form.Item
                  label="Reason for leave"
                  name="reason"
                  rules={[
                    {
                      required: true,
                      message: "Please enter the reason for leave",
                    },
                  ]}
                >
                  <TextArea
                    rows={5}
                    allowClear
                    placeholder={
                      form.getFieldValue("leaveType") === "Compoff leave"
                        ? "Please enter the dates that you worked on to take comp off"
                        : "Enter the reason for leave"
                    }
                  />
                </Form.Item>
              </Form>
            </Modal>
          </div>
        </div>
      </div>
    </>
  );
}
