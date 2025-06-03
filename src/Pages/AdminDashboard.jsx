import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  message,
  Space,
  Input,
  Card,
  Tag,
  Form,
  Col,
  Row,
  DatePicker,
  Select,
  Statistic,
  Skeleton
} from "antd";
import { saveAs } from "file-saver";
import {
  ScheduleOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as XLSX from "xlsx-js-style";
import { faTableList, faListCheck } from "@fortawesome/free-solid-svg-icons";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(timezone);
dayjs.extend(utc);

const { TextArea } = Input;

export default function AdminDashboard() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [rejectModal, setRejectModal] = useState({
    visible: false,
    record: null,
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const [editModal, setEditModal] = useState({ visible: false, record: null });
  const [viewModal, setViewModal] = useState({ visible: false, record: null });
  const [editButtonDisable, setEditButtonDisable] = useState(false);
  const [tableRefresh, setTableRefresh] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [form] = Form.useForm();
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
const [leaveBalance, setLeaveBalance] = useState(null);
  useEffect(() => {
    fetchLeaveRequests();
  }, [tableRefresh]);

  useEffect(() => {
    fetchEmployeeOptions();
  }, []);

  const fetchEmployeeOptions = async () => {
    try {
      const res = await fetch(
        `https://script.google.com/macros/s/AKfycbwjSiL8nUFomLkS1Th-GtOzj9OhsbuNmSKnTs4sK0MwdbaW61vqxWGJOxkvb8wpeS8V/exec?action=getEmployees`
      );
      const result = await res.json();
      if (result.success) {
        setEmployeeOptions(result.data);
      }
    } catch (error) {
      message.error("Failed to fetch employees");
    }
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  // const handleTableRefresh = async () => {
  //   setTableRefresh(true);
  //   await fetchLeaveRequests();
  //   setTableRefresh(false);
  //   message.success("Leave request table updated");
  // };
  const handleTableRefresh = async () => {
    setSearchText("");
    setStartDateFilter(null);
    setEndDateFilter(null);
    setSelectedEmployeeId(null);
    setSelectedStatus(null); // <-- Reset status filter too
    setTableRefresh(true);

    await fetchLeaveRequests();

    setTableRefresh(false);
    message.success("Leave request table updated");
  };

  const getCardClass = (status) => {
    return selectedStatus && selectedStatus !== status ? "card-faded" : "";
  };

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesSearch =
      searchText === "" ||
      Object.values(request).some((val) =>
        String(val).toLowerCase().includes(searchText)
      );

    const matchesEmployee =
      !selectedEmployeeId || request.employeeId === selectedEmployeeId;

    const requestDate = dayjs(request.dateRange?.split(",")[0]?.trim());
    const matchesDateRange =
      (!startDateFilter || requestDate.isSameOrAfter(startDateFilter, "day")) &&
      (!endDateFilter || requestDate.isSameOrBefore(endDateFilter, "day"));

    const matchesStatus =
      !selectedStatus ||
      request.status?.toLowerCase() === selectedStatus?.toLowerCase();

    return (
      matchesSearch && matchesEmployee && matchesDateRange && matchesStatus
    );
  });

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbwjSiL8nUFomLkS1Th-GtOzj9OhsbuNmSKnTs4sK0MwdbaW61vqxWGJOxkvb8wpeS8V/exec?action=leaveRequests`
      );
      const result = await response.json();
      if (result.success) {
        setLeaveRequests(result.data);
      }
    } catch (err) {
      message.error("Failed to fetch leave requests.");
    }
  };

  const handleAction = async (record, action) => {
    if (action === "deny") {
      setRejectModal({ visible: true, record });
      return;
    }
    await updateRequestStatus(record, action);
  };

  const updateRequestStatus = async (record, action, reason = "") => {
    setTableRefresh(true);

    const payload = {
      action: "updateLeaveRequest",
      timestamp: new Date(record.timestamp).toISOString(),
      employeeId: record.employeeId,
      status: action === "approve" ? "Approved" : "Denied",
      // rejectionReason: action === "deny" ? reason : "-",
      rejectionReason: reason || "-",
    };
    console.log("Payload being sent to backend:", payload); // ← Add this

    try {
      const res = await fetch(
        "https://script.google.com/macros/s/AKfycbwjSiL8nUFomLkS1Th-GtOzj9OhsbuNmSKnTs4sK0MwdbaW61vqxWGJOxkvb8wpeS8V/exec",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(payload).toString(),
        }
      );
      const result = await res.json();
      if (result.success) {
        message.success(
          `Leave ${action === "approve" ? "approved" : "denied"}`
        );
        setTableRefresh(false);
      } else {
        message.error("Failed to update status");
      }
    } catch (err) {
      message.error("Error updating request");
    }
  };


  const fetchAttendance = async (employeeId) => {
  try {
    const res = await fetch(
      `https://script.google.com/macros/s/AKfycbwjSiL8nUFomLkS1Th-GtOzj9OhsbuNmSKnTs4sK0MwdbaW61vqxWGJOxkvb8wpeS8V/exec?action=attendance&employeeId=${employeeId}`
    );
    const result = await res.json();
    if (result.success) {
      setAttendanceRecords(result.data);
    }
  } catch (err) {
    message.error("Failed to fetch attendance data");
  }
};

const fetchLeaveBalance = async (employeeId) => {
  try {
    const res = await fetch(
      `https://script.google.com/macros/s/AKfycbwjSiL8nUFomLkS1Th-GtOzj9OhsbuNmSKnTs4sK0MwdbaW61vqxWGJOxkvb8wpeS8V/exec?action=leaveBalance&employeeId=${employeeId}`
    );
    const result = await res.json();
    if (result.success) {
      setLeaveBalance(result.balance);
      console.log(result)
    }
  } catch (err) {
    message.error("Failed to fetch leave balance");
  }
};


  const openEditModal = (record) => {
    setEditModal({ visible: true, record });

    form.setFieldsValue({
      rejectionReason: record.reasonForRejection || "-",
      employeeName: record.employeeName,
      employeeId: record.employeeId,
      leaveType: record.leaveType,
      reason: record.reason,
      status: record.status,
      dateRange: record.dateRange,
      leaveDuration: record.leaveDuration,
      designation: record.designation,
      location: record.location,
    });
  };

  const openViewModal = (record) => {
    setViewModal({ visible: true, record });
    setRejectionReason(record.reasonForRejection || "-");
  };

  const totalCount = leaveRequests.length;
  const pendingCount = leaveRequests.filter(
    (req) => req.status?.toLowerCase() === "pending"
  ).length;
  const approvedCount = leaveRequests.filter(
    (req) => req.status?.toLowerCase() === "approved"
  ).length;
  const deniedCount = leaveRequests.filter(
    (req) => req.status?.toLowerCase() === "denied"
  ).length;

  const exportToExcel = () => {
    if (!filteredRequests.length) {
      message.warning("No data to export.");
      return;
    }

    const exportData = filteredRequests.map((item) => {
      const [fromRaw, toRaw] = (item.dateRange || "").split(",");
      const fromDate = dayjs(fromRaw).isValid()
        ? dayjs(fromRaw).format("MMM D, YYYY HH:mm:ss")
        : "-";
      const toDate = dayjs(toRaw).isValid()
        ? dayjs(toRaw).format("MMM D, YYYY HH:mm:ss")
        : "-";

      return {
        "Employee ID": item.employeeId || "-",
        "Employee Name": item.employeeName || "-",
        Designation: item.designation || "-",
        Location: item.location || "-",
        "Leave Type": item.leaveType || "-",
        "From Date": fromDate,
        "To Date": toDate,
        Reason: item.reason || "-",
        "Leave Duration": item.leaveDuration || "-",
        Status: item.status || "-",
        "Rejection Reason": item.reasonForRejection || "-",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Apply styling
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          font: {
            name: "Arial",
            sz: R === 0 ? 12 : 10,
            bold: R === 0,
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
              ? { fgColor: { rgb: "FFFFAA" } } // Light yellow for headers
              : undefined,
        };
      }
    }

    worksheet["!cols"] = [
      { wch: 15 }, // Employee ID
      { wch: 20 }, // Employee Name
      { wch: 20 }, // Designation
      { wch: 15 }, // Location
      { wch: 15 }, // Leave Type
      { wch: 22 }, // From Date
      { wch: 22 }, // To Date
      { wch: 40 }, // Reason
      { wch: 18 }, // Leave Duration
      { wch: 15 }, // Status
      { wch: 40 }, // Rejection Reason
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

    const fileName = `Employee_Leave_Request_Report_${dayjs().format(
      "YYYY-MM-DD_HH-mm"
    )}.xlsx`;
    saveAs(blob, fileName);
  };

  const columns = [
    { title: "Employee ID", dataIndex: "employeeId", width: 120 },
    { title: "Employee Name", dataIndex: "employeeName", width: 200 },
    { title: "Designation", dataIndex: "designation", width: 200 },
    { title: "Location", dataIndex: "location", width: 100 },
    { title: "Leave Type", dataIndex: "leaveType", width: 150 },
    {
      title: "Start Date",
      dataIndex: "dateRange",
      width: 200,
      render: (text) => {
        const start = text?.split(",")[0]?.trim();
        return dayjs(start).isValid()
          ? dayjs(start).format("MMM D, YYYY HH:mm")
          : "-";
      },
    },
    {
      title: "End Date",
      dataIndex: "dateRange",
      width: 200,
      render: (text) => {
        const end = text?.split(",")[1]?.trim();
        return dayjs(end).isValid()
          ? dayjs(end).format("MMM D, YYYY HH:mm")
          : "-";
      },
    },
    { title: "Reason", dataIndex: "reason", width: 300 },
    { title: "Leave Duration", dataIndex: "leaveDuration", width: 130 },
    {
      title: "Reason for rejection",
      dataIndex: "reasonForRejection",
      width: 300,
      ellipsis: true,
      render: (text) => <span>{text?.trim() ? text : "-"}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 200,
      render: (status) => {
        const statusLower = status?.toLowerCase();
        let color = "default";
        let statusIcon = null;

        if (statusLower === "pending") {
          color = "warning";
          statusIcon = <SyncOutlined spin />;
        } else if (statusLower === "approved") {
          color = "success";
          statusIcon = <CheckCircleOutlined />;
        } else if (statusLower === "denied") {
          color = "error";
          statusIcon = <CloseCircleOutlined />;
        }

        return (
          <Tag
            color={color}
            style={{
              textTransform: "capitalize",
              fontSize: "16px",
              padding: "4px 12px",
              height: "auto",
            }}
          >
            {statusIcon} <span style={{ marginLeft: 4 }}>{status || "-"}</span>
          </Tag>
        );
      },
    },
    {
      title: "Action",
      fixed: "right",
      width: 130,
      render: (_, record) => {
        const status = record.status?.toLowerCase();
        const isPending = status === "pending";

        return (
          <Space>
            {isPending && (
              <>
                <Button
                  type="primary"
                  style={{
                    backgroundColor: "#61c41abd",
                    borderColor: "#61c41abd",
                  }} // success
                  className="action-button approve-button"
                  icon={<CheckOutlined />}
                  onClick={() => handleAction(record, "approve")}
                />
                <Button
                  type="primary"
                  style={{
                    backgroundColor: "#ff4d4fc4",
                    borderColor: "#ff4d4fc4",
                  }}
                  className="action-button deny-button"
                  icon={<CloseOutlined />}
                  onClick={() => handleAction(record, "deny")}
                />
              </>
            )}
            <Button
              type="primary"
              style={{ backgroundColor: "#5bacf6", borderColor: "#5bacf6" }} // info
              icon={<EyeOutlined />}
              className="action-button view-button"
              onClick={() => openViewModal(record)}
            />
            {!isPending && (
              <Button
                type="primary"
                style={{
                  backgroundColor: "#faad14bd",
                  borderColor: "#faad14bd",
                }} // warning
                icon={<EditOutlined />}
                className="action-button edit-button"
                onClick={() => openEditModal(record)}
              />
            )}
          </Space>
        );
      },
    },
  ];

  const handleEditModalSubmit = async (actionType) => {
    setEditButtonDisable(true);
    try {
      console.log("Form submit action:", actionType);

      if (actionType === "approve") {
        console.log("Setting rejectionReason = 'Not applicable'");
        form.setFieldsValue({ rejectionReason: "Not applicable" });
      }

      const values = await form.validateFields();
      console.log("Validated form values:", values);

      const reason = values.rejectionReason;
      console.log("Reason being sent to updateRequestStatus:", reason);

      await updateRequestStatus(editModal.record, actionType, reason);

      setEditModal({ visible: false, record: null });
      form.resetFields();
    } catch (err) {
      console.error("Form submit error:", err);
      message.error("Error submitting the form");
    } finally {
      setEditButtonDisable(false);
    }
  };

  return (
    <div
      className="container py-2"
      style={{ maxWidth: "1200px", margin: "0 auto", minHeight: "100vh" }}
    >
      <h2 className="text-center m-0 p-0">
        <span className="ms-1 text-center">Admin Dashboard</span>
      </h2>

      <p className="text-center m-0 p-0" style={{ fontSize: "14px" }}>
        Approve or deny employee leave request
      </p>
      <div className="row mt-4">
        <div className="col-12 col-md-3 mb-3">
          <Card
            bordered={false}
            hoverable
            onClick={() => setSelectedStatus(null)}
            className={getCardClass()}
            style={{
              background: "#e6f7ff",
              borderLeft: "6px solid #1890ff",
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            <h5 className="text-primary m-0">
              <FontAwesomeIcon icon={faTableList} className="me-2" />
              Total Requests
            </h5>
            <h2 className="text-dark">{totalCount}</h2>
          </Card>
        </div>

        <div className="col-12 col-md-3 mb-3">
          <Card
            bordered={false}
            hoverable
            onClick={() => setSelectedStatus("pending")}
            className={getCardClass("pending")}
            style={{
              background: "#fffbe6",
              borderLeft: "6px solid #faad14",
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            <h5 className="text-warning m-0">
              <ClockCircleOutlined className="me-2" />
              Pending
            </h5>
            <h2 className="text-dark">{pendingCount}</h2>
          </Card>
        </div>

        <div className="col-12 col-md-3 mb-3">
          <Card
            bordered={false}
            hoverable
            onClick={() => setSelectedStatus("approved")}
            className={getCardClass("approved")}
            style={{
              background: "#f6ffed",
              borderLeft: "6px solid #52c41a",
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            <h5 className="text-success m-0">
              <CheckCircleOutlined className="me-2" />
              Approved
            </h5>
            <h2 className="text-dark">{approvedCount}</h2>
          </Card>
        </div>

        <div className="col-12 col-md-3 mb-3">
          <Card
            bordered={false}
            hoverable
            onClick={() => setSelectedStatus("denied")}
            className={getCardClass("denied")}
            style={{
              background: "#fff1f0",
              borderLeft: "6px solid #ff4d4f",
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            <h5 className="text-danger m-0">
              <CloseCircleOutlined className="me-2" />
              Denied
            </h5>
            <h2 className="text-dark">{deniedCount}</h2>
          </Card>
        </div>
      </div>

      <div className="row">
        <div className="col-12 mt-2">
          <Card
            bordered={false}
            className="shadow hover-card"
            style={{ borderRadius: 16 }}
          >
            {" "}
            <div className="row">
              <div className="col-12 col-lg-6">
                <h3>
                  <FontAwesomeIcon icon={faTableList} />
                  <span className="ms-1">Employee Leave Requests</span>
                </h3>
              </div>
              <div className="col-12 col-lg-6 mt-lg-2 d-none d-lg-block">
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
                    // disabled={exportDisable}
                  >
                    Export
                  </Button>
                </div>
              </div>
            </div>
            <div className="row align-items-center mt-3">
              <div className="col-12 col-lg-5 col-xl-4 mb-2 mb-lg-0">
                <DatePicker
                  placeholder="From Date"
                  size="large"
                  value={startDateFilter}
                  onChange={(date) => {
                    setStartDateFilter(date);
                    setSearchText("");

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
                  className="mt-2 mt-lg-0 ms-md-2 ms-lg-2"
                />
              </div>

              <div className="col-12 col-lg-3 col-xl-4 mb-2 mb-lg-0 ">
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
              <div className="col-12 col-lg-4 mb-2 mb-lg-0">
                <Select
                  showSearch
                  allowClear
                  placeholder="Filter by Employee"
                  optionFilterProp="children"
                  size="large"
                  value={selectedEmployeeId}
                  // onChange={(value) => setSelectedEmployeeId(value)}
                  onChange={async (value) => {
  setSelectedEmployeeId(value);
  await fetchAttendance(value);
  await fetchLeaveBalance(value);
}}

                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                  style={{ width: "100%" }}
                >
                  {employeeOptions.map((emp) => (
                    <Select.Option key={emp.employeeId} value={emp.employeeId}>
                      {`${emp.employeeName} - ${emp.employeeId} - ${emp.designation}`}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* Refresh Button */}
              {/* <div className="col-12 col-lg-12 mt-lg-2">
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
                    // onClick={exportToExcel}
                    // disabled={exportDisable}
                  >
                    Export
                  </Button>
                </div>
              </div> */}
              <div className="d-flex justify-content-lg-end gap-2 d-lg-none d-sm-block">
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
                  // disabled={exportDisable}
                >
                  Export
                </Button>
              </div>
            </div>
            <Table
              columns={columns}
              dataSource={filteredRequests}
              rowKey="timestamp"
              loading={tableRefresh}
              pagination={{ pageSize: 5 }}
              scroll={{ x: "max-content" }}
              className="mt-3"
            />

              {selectedEmployeeId && (
  // <Card className="mt-4 shadow" style={{ borderRadius: "12px" }}>
  //   <h4>
  //     <UserOutlined className="me-2" />
  //     Employee Details - <strong>{selectedEmployeeId}</strong>
  //   </h4>

  //   {leaveBalance && (
  //     <Row gutter={16} className="mt-3">
  //       <Col span={6}>
  //         <Card bordered={false} style={{ background: "#f6ffed" }}>
  //           <h5 className="text-success">PSL Available</h5>
  //           <p>{leaveBalance.personalAvailable}</p>
  //         </Card>
  //       </Col>
  //       <Col span={6}>
  //         <Card bordered={false} style={{ background: "#fff1f0" }}>
  //           <h5 className="text-danger">PSL Taken</h5>
  //           <p>{leaveBalance.personalTaken}</p>
  //         </Card>
  //       </Col>
  //       <Col span={6}>
  //         <Card bordered={false} style={{ background: "#e6f7ff" }}>
  //           <h5 className="text-info">Earned Available</h5>
  //           <p>{leaveBalance.earnedAvailable}</p>
  //         </Card>
  //       </Col>
  //       <Col span={6}>
  //         <Card bordered={false} style={{ background: "#fffbe6" }}>
  //           <h5 className="text-warning">Unpaid Taken</h5>
  //           <p>{leaveBalance.unpaidTaken}</p>
  //         </Card>
  //       </Col>
  //     </Row>
  //   )}

  //   {attendanceRecords.length > 0 && (
  //     <div className="mt-4">
  //       <h5>Last 5 Attendance Records:</h5>
  //       <Table
  //         dataSource={attendanceRecords.slice(-5).reverse()}
  //         columns={[
  //           {
  //             title: "Date",
  //             dataIndex: "Punch in",
  //             render: (val) =>
  //               val ? dayjs(val).format("MMM D, YYYY") : "-",
  //           },
  //           {
  //             title: "Punch In",
  //             dataIndex: "Punch in",
  //             render: (val) =>
  //               val ? dayjs(val).format("HH:mm") : "-",
  //           },
  //           {
  //             title: "Punch Out",
  //             dataIndex: "Punch out",
  //             render: (val) =>
  //               val ? dayjs(val).format("HH:mm") : "-",
  //           },
  //           { title: "Status", dataIndex: "Status" },
  //         ]}
  //         pagination={false}
  //         size="small"
  //         rowKey={(record, index) => index}
  //       />
  //     </div>
  //   )}
  // </Card>

//   <Card className="mt-4 shadow" style={{ borderRadius: "12px" }}>
//   <h4>
//     <UserOutlined className="me-2" />
//     Employee Details – <strong>{selectedEmployeeId}</strong>
//   </h4>

//   {leaveBalance && (
//   <Row gutter={[16, 16]} className="mt-3">
//     <Col span={6}>
//       <Statistic title="PSL Available" value={leaveBalance.personalAvailable} valueStyle={{ color: "#52c41a" }} />
//     </Col>
//     <Col span={6}>
//       <Statistic title="PSL Taken" value={leaveBalance.personalTaken} valueStyle={{ color: "#ff4d4f" }} />
//     </Col>
//     <Col span={6}>
//       <Statistic title="Earned Available" value={leaveBalance.earnedAvailable} valueStyle={{ color: "#1890ff" }} />
//     </Col>
//     <Col span={6}>
//       <Statistic title="Unpaid Taken" value={leaveBalance.unpaidTaken} valueStyle={{ color: "#faad14" }} />
//     </Col>
//     <Col span={6}>
//       <Statistic title="Total Leave Available" value={leaveBalance.totalLeave} valueStyle={{ color: "#faad14" }} />
//     </Col>
//     <Col span={6}>
//       <Statistic title="Total Leave Taken" value={leaveBalance.totalLeaveTaken} valueStyle={{ color: "#faad14" }} />
//     </Col>
//   </Row>
// )}

// </Card>

<Card className="mt-4 shadow" style={{ borderRadius: "12px" }}>
  <h4>
    <UserOutlined className="me-2" />
    Leave Balance Summary – <strong>{selectedEmployeeId}</strong>
  </h4>

  {leaveBalance ? (
    <Row gutter={[16, 16]} className="mt-3">
      <Col span={6}><Statistic title="Total Leave Available" value={leaveBalance.totalAvailable} /></Col>
      <Col span={6}><Statistic title="Total Leave Taken" value={leaveBalance.totalTaken} /></Col>
      <Col span={6}><Statistic title="Earned Leave Available" value={leaveBalance.earnedAvailable} valueStyle={{ color: "#1890ff" }} /></Col>
      <Col span={6}><Statistic title="PSL Available" value={leaveBalance.personalAvailable} valueStyle={{ color: "#52c41a" }} /></Col>
      <Col span={6}><Statistic title="PSL Taken" value={leaveBalance.personalTaken} valueStyle={{ color: "#ff4d4f" }} /></Col>
      <Col span={6}><Statistic title="Unpaid Leave Taken" value={leaveBalance.unpaidTaken} valueStyle={{ color: "#faad14" }} /></Col>
      <Col span={6}><Statistic title="Compoff Leave Taken" value={leaveBalance.compoffTaken} valueStyle={{ color: "#722ed1" }} /></Col>
    </Row>
  ) : (
    <Skeleton active />
  )}
</Card>

)}

<Card className="mt-4 shadow" style={{ borderRadius: "12px" }}>
  <h4>
    <ScheduleOutlined className="me-2" />
    Full Attendance Records
  </h4>

  <Table
    dataSource={attendanceRecords}
    columns={[
      {
        title: "Date",
        dataIndex: "Punch in",
        render: (val) => val ? dayjs(val).format("MMM D, YYYY") : "-",
      },
      {
        title: "Punch In",
        dataIndex: "Punch in",
        render: (val) => val ? dayjs(val).format("HH:mm") : "-",
      },
      {
        title: "Punch Out",
        dataIndex: "Punch out",
        render: (val) => val ? dayjs(val).format("HH:mm") : "-",
      },
      {
        title: "Hours",
        dataIndex: "Working Hours", // optional if calculated
        render: (_, row) => {
          const punchIn = row["Punch in"];
          const punchOut = row["Punch out"];
          if (punchIn && punchOut) {
            const diff = dayjs(punchOut).diff(dayjs(punchIn), "minute");
            const hrs = Math.floor(diff / 60);
            const min = diff % 60;
            return `${hrs}h ${min}m`;
          }
          return "-";
        },
      },
      { title: "Status", dataIndex: "Status" },
    ]}
    rowKey={(record, index) => index}
    pagination={{ pageSize: 10 }}
    scroll={{ x: "max-content" }}
  />
</Card>



            {/* Deny Modal */}
            <Modal
              title="Enter reason for denial"
              open={rejectModal.visible}
              onOk={async () => {
                await updateRequestStatus(
                  rejectModal.record,
                  "deny",
                  rejectionReason
                );
                setRejectModal({ visible: false, record: null });
                setRejectionReason("");
              }}
              onCancel={() => {
                setRejectModal({ visible: false, record: null });
                setRejectionReason("");
              }}
            >
              <TextArea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejecting leave"
              />
            </Modal>
            {/* Edit Modal */}
            <Modal
              open={editModal.visible}
              onCancel={() => {
                setEditModal({ visible: false, record: null });
                form.resetFields();
              }}
              footer={null}
              style={{ top: 2 }}
              width={800}
            >
              <h3 className="text-center">Edit Leave Request</h3>
              <Form layout="vertical" form={form}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Employee Name">
                      <Input value={editModal.record?.employeeName} disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Employee ID">
                      <Input value={editModal.record?.employeeId} disabled />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Designation">
                      <Input value={editModal.record?.designation} disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Location">
                      <Input value={editModal.record?.location} disabled />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Start Date">
                      <Input
                        value={
                          dayjs(
                            editModal.record?.dateRange?.split(",")[0]?.trim()
                          ).isValid()
                            ? dayjs(
                                editModal.record?.dateRange
                                  ?.split(",")[0]
                                  ?.trim()
                              ).format("MMM D, YYYY HH:mm")
                            : "-"
                        }
                        disabled
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="End Date">
                      <Input
                        value={
                          dayjs(
                            editModal.record?.dateRange?.split(",")[1]?.trim()
                          ).isValid()
                            ? dayjs(
                                editModal.record?.dateRange
                                  ?.split(",")[1]
                                  ?.trim()
                              ).format("MMM D, YYYY HH:mm")
                            : "-"
                        }
                        disabled
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Leave Type">
                      <Input value={editModal.record?.leaveType} disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Leave Duration">
                      <Input value={editModal.record?.leaveDuration} disabled />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Reason">
                  <TextArea
                    value={editModal.record?.reason}
                    disabled
                    rows={3}
                  />
                </Form.Item>

                {/* <Form.Item label="Status">
                  <Input value={editModal.record?.status} disabled />
                </Form.Item> */}
                <Form.Item label="Status">
                  {/* Handle the dynamic rendering of the tag color and icon */}
                  {(() => {
                    let statusColor = "default"; // Default color
                    let statusIcon = null; // Default icon

                    // Check the status and update the color and icon
                    if (editModal.record?.status === "Approved") {
                      statusColor = "success"; // Green color for approved
                      statusIcon = <CheckCircleOutlined />;
                    } else if (editModal.record?.status === "Denied") {
                      statusColor = "error"; // Red color for denied
                      statusIcon = <CloseCircleOutlined />;
                    } else if (editModal.record?.status === "Pending") {
                      statusColor = "warning"; // Yellow color for pending
                      statusIcon = <SyncOutlined spin />;
                    }

                    return (
                      <div>
                        <Tag
                          color={statusColor}
                          style={{ fontSize: "16px", padding: "4px 12px" }}
                        >
                          {statusIcon}{" "}
                          <span style={{ marginLeft: 4 }}>
                            {editModal.record?.status || "-"}
                          </span>
                        </Tag>
                      </div>
                    );
                  })()}
                </Form.Item>

                <Form.Item
                  label={
                    <div className="m-0 p-0">
                      <div className="m-0 p-0">Reason for Rejection</div>
                      <div
                        className="m-0 p-0"
                        style={{ fontSize: "14px", color: "red" }}
                      >
                        (Only applicable when denying leave. Please input your
                        reason before the Deny button is clicked.)
                      </div>
                    </div>
                  }
                  name="rejectionReason"
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const status = editModal.record?.status?.toLowerCase();
                        if (status !== "pending" && !value) {
                          return Promise.reject(
                            "Please enter a reason for rejection"
                          );
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                  style={{
                    display:
                      editModal.record?.status?.toLowerCase() !== "pending"
                        ? "block"
                        : "none",
                  }}
                >
                  <TextArea
                    rows={4}
                    placeholder="Update reason for rejection"
                  />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => handleEditModalSubmit("approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      color="danger"
                      variant="solid"
                      size="large"
                      onClick={() => handleEditModalSubmit("deny")}
                    >
                      Deny
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Modal>
            {/*View Modal */}
            <Modal
              open={viewModal.visible}
              onCancel={() => {
                setViewModal({ visible: false, record: null });
                setRejectionReason("");
              }}
              footer={null}
              style={{ top: 2 }}
              width={800}
            >
              <h3 className="text-center">View Leave Request</h3>
              <Form layout="vertical" form={form}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Employee Name">
                      <Input value={viewModal.record?.employeeName} readOnly />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Employee ID">
                      <Input value={viewModal.record?.employeeId} readOnly />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Designation">
                      <Input value={viewModal.record?.designation} readOnly />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Location">
                      <Input value={viewModal.record?.location} readOnly />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Start Date">
                      <Input
                        value={
                          dayjs(
                            viewModal.record?.dateRange?.split(",")[0]?.trim()
                          ).isValid()
                            ? dayjs(
                                viewModal.record?.dateRange
                                  ?.split(",")[0]
                                  ?.trim()
                              ).format("MMM D, YYYY HH:mm")
                            : "-"
                        }
                        readOnly
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="End Date">
                      <Input
                        value={
                          dayjs(
                            viewModal.record?.dateRange?.split(",")[1]?.trim()
                          ).isValid()
                            ? dayjs(
                                viewModal.record?.dateRange
                                  ?.split(",")[1]
                                  ?.trim()
                              ).format("MMM D, YYYY HH:mm")
                            : "-"
                        }
                        readOnly
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Leave Type">
                      <Input value={viewModal.record?.leaveType} readOnly />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Leave Duration">
                      <Input value={viewModal.record?.leaveDuration} readOnly />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Reason">
                  <TextArea
                    value={viewModal.record?.reason}
                    readOnly
                    rows={3}
                  />
                </Form.Item>

                <Form.Item label="Status">
                  {(() => {
                    let statusColor = "default";
                    let statusIcon = null;

                    // Check the status and update the color and icon
                    if (viewModal.record?.status === "Approved") {
                      statusColor = "success"; // Green color for approved
                      statusIcon = <CheckCircleOutlined />;
                    } else if (viewModal.record?.status === "Denied") {
                      statusColor = "error"; // Red color for denied
                      statusIcon = <CloseCircleOutlined />;
                    } else if (viewModal.record?.status === "Pending") {
                      statusColor = "warning"; // Yellow color for pending
                      statusIcon = <SyncOutlined spin />;
                    }

                    return (
                      <Tag
                        color={statusColor}
                        style={{ fontSize: "16px", padding: "4px 12px" }}
                      >
                        {statusIcon}{" "}
                        <span style={{ marginLeft: 4 }}>
                          {viewModal.record?.status || "-"}
                        </span>
                      </Tag>
                    );
                  })()}
                </Form.Item>

                <Form.Item label="Reason for Rejection (Not Applicable for approved request)">
                  <TextArea
                    rows={4}
                    value={viewModal.record?.reasonForRejection || "-"}
                    readOnly
                  />
                </Form.Item>
              </Form>
            </Modal>
          </Card>
        </div>
      </div>
    </div>
  );
}
