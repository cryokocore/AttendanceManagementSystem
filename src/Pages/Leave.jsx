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
} from "@ant-design/icons";
import { saveAs } from "file-saver";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);

dayjs.extend(timezone);
dayjs.extend(utc);

const { Option } = Select;
const { RangePicker } = DatePicker;

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
  const [formLayout, setFormLayout] = useState("vertical");
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

  const fetchLeaveBalance = async () => {
    try {
      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbx1Xh73i6EdM0D2GaE6xCHL2irnPXpRpLbZiL2u8_vTM6oxzu_t7SxoAmUp6ilBQQVw/exec?action=leaveBalance&employeeId=${employeeId}`
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
  }, [employeeId]); // Re-run whenever employeeId changes

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
        <FontAwesomeIcon icon={faCalendarXmark} style={{ color: "#faad14" }} />
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
          `https://script.google.com/macros/s/AKfycbx1Xh73i6EdM0D2GaE6xCHL2irnPXpRpLbZiL2u8_vTM6oxzu_t7SxoAmUp6ilBQQVw/exec?action=holidayindia&employeeId=${employeeId}`
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

  const handleSubmitLeave = async () => {
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
        "https://script.google.com/macros/s/AKfycbx1Xh73i6EdM0D2GaE6xCHL2irnPXpRpLbZiL2u8_vTM6oxzu_t7SxoAmUp6ilBQQVw/exec",
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
        form.resetFields();
        await fetchLeaveBalance();
      } else {
        message.error("Failed to submit leave request!");
      }
    } catch (error) {
      console.error(error);
      message.error("Please fill all fields correctly!");
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
    <div
      className="container py-2 border border-danger"
      style={{ maxWidth: "1200px", margin: "0 auto", minHeight: "100vh" }}
    >
      <h2 className="text-center ms-1 m-0 p-0">Leave Balance/Request</h2>
      <p className="text-center m-0 p-0" style={{ fontSize: "14px" }}>
        Manage your leave requests and balances
      </p>
      <div className="row mt-3 mt-lg-5">
      <h3>
              <FontAwesomeIcon icon={faCalendar} />
              <span className="ms-1">Leave Summary</span>
            </h3>  {leaveStats.map((stat, index) => (
    <Col
      key={stat.title}
      xs={24}
      sm={12}
      md={12}
      lg={6}
      className="mb-4" // Adding margin-bottom to each column for spacing
    >
      <Card
        className="shadow hover-card"
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
            <div style={{ fontSize: 16, fontWeight: "bold" }}>
              {stat.title}
            </div>
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



      <div className="row mt-5">
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

                <Form.Item label="Today No. of Days">
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
                    rows={8}
                  />
                </Form.Item>

                <Button
                  type="primary"
                  size="large"
                  className="mt-2"
                  onClick={handleSubmitLeave}
                >
                  Submit leave request
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
    </div>
  );
}
