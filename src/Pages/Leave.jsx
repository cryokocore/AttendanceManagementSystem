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

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch(
          `https://script.google.com/macros/s/AKfycbzCIfCGRyBgRA1qADr38Xk2biMxT0hU8kKUuWKVwUbftf3tUOQtbNeY08lDQ0iqCd5x/exec?action=holidayindia&employeeId=${employeeId}`
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

//   const handleSubmitLeave = async () => {
//     try {
//       const values = await form.validateFields(); // Get form values
//       const payload = {
//         action: "submitleave",
//         employeeId,
//         employeeName,
//         employeeDesignation,
//         employeeLocation,
//         leaveType: values["Leave Type"],
//         dateRange: values["Date Range"].map(date => date.format("YYYY-MM-DD HH:mm")).join(","),
//         reason: values["Reason for leave"],
//         status: "Pending", // Always pending initially
//       };
  
//       // Encode the payload into a URL-encoded format
//       const encodedPayload = new URLSearchParams(payload).toString();
  
//       const response = await fetch(
//         "https://script.google.com/macros/s/AKfycbzRd9Mg6mb8ljVWfe-UvRUGYQe_fX-yr3E0EzSIxi87F3d1NOYNNa44ZkJyFpAhKHri/exec",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//           },
//           body: encodedPayload,  // Send as URL-encoded
//         }
//       );
  
//       const result = await response.json();
  
//       if (result.success) {
//         message.success("Leave request submitted successfully!");
//         form.resetFields();
//       } else {
//         message.error("Failed to submit leave request!");
//       }
//     } catch (error) {
//       console.error(error);
//       message.error("Please fill all fields correctly!");
//     }
//   };
  
const handleSubmitLeave = async () => {
    try {
      const values = await form.validateFields(); // Get form values
      const payload = {
        action: "submitleave",
        employeeId,
        employeeName,
        employeeDesignation,
        employeeLocation,
        leaveType: values["Leave Type"],
        dateRange: values["Date Range"].map(date => date.format("YYYY-MM-DD HH:mm")).join(","),
        reason: values["Reason for leave"],
        status: "Pending", // Leave request status is always pending initially
      };
  
      // Encode the payload into a URL-encoded format
      const encodedPayload = new URLSearchParams(payload).toString();
  
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzCIfCGRyBgRA1qADr38Xk2biMxT0hU8kKUuWKVwUbftf3tUOQtbNeY08lDQ0iqCd5x/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: encodedPayload,  // Send as URL-encoded
        }
      );
  
      const result = await response.json();
  
      if (result.success) {
        message.success("Leave request submitted successfully!");
        form.resetFields();
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
      <div className="row mt-lg-5">
        <div className="col-12 col-lg-3 col-md-6 mt-4 mt-lg-0">
          <Card
            className="shadow hover-card"
            style={{
              height: "100%",
              borderLeft: "10px solid #34e134bd",
            }}
          >
            <h6>Total Leave Available</h6>
            <p>1</p>
          </Card>
        </div>
        <div className="col-12 col-lg-3 col-md-6 mt-4 mt-lg-0">
          <Card
            className="shadow hover-card"
            style={{
              height: "100%",
              borderLeft: "10px solid #fe00008f",
            }}
          >
            <h6>Total Leave Taken</h6>
            <p>1</p>
          </Card>
        </div>
        <div className="col-12 col-lg-3 col-md-6 mt-4 mt-lg-0">
          <Card
            className="shadow hover-card"
            style={{
              height: "100%",
              borderLeft: "10px solid #faad14b5",
            }}
          >
            <h6>Earned Leave Available</h6>
            <p>1</p>
          </Card>
        </div>
        <div className="col-12 col-lg-3 col-md-6 mt-4 mt-lg-0">
          <Card
            className="shadow hover-card "
            style={{
              height: "100%",
              borderLeft: "10px solid #0d6efdad",
            }}
          >
            <h6>Personal/Sick Leave Available</h6>
            <p>1</p>
          </Card>
        </div>

        <div className="col-12 col-lg-3 col-md-6 mt-4 mt-lg-4">
          <Card
            className="shadow hover-card"
            style={{
              height: "100%",
              borderLeft: "10px solid #b54dff ",
            }}
          >
            <h6>Personal/Sick Leave Taken</h6>
            <p>1</p>
          </Card>
        </div>
        <div className="col-12 col-lg-3 col-md-6 mt-4">
          <Card
            className="shadow hover-card"
            style={{
              height: "100%",
              borderLeft: "10px solid #008080b0",
            }}
          >
            <h6>Unpaid Leave Taken</h6>
            <p>1</p>
          </Card>
        </div>
        <div className="col-12 col-lg-3 col-md-6 mt-4">
          <Card
            className="shadow hover-card"
            style={{
              height: "100%",
              borderLeft: "10px solid #91caff",
            }}
          >
            <h6>Earned Leave Taken</h6>
            <p>1</p>
          </Card>
        </div>
        <div className="col-12 col-lg-3 col-md-6 mt-4">
          <Card
            className="shadow hover-card"
            style={{
              height: "100%",
              borderLeft: "10px solid #fe00b2",
            }}
          >
            <h6>Compoff Leave Taken</h6>
            <p>1</p>
          </Card>
        </div>
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
                    <Option value="Personal/sick leave">
                      Personal/sick leave
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
                  />
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
                    placeholder="Enter the reason for leave"
                    allowClear
                    rows={8}
                  />
                </Form.Item>

                <Button type="primary" size="large" className="mt-2"   onClick={handleSubmitLeave}>
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
