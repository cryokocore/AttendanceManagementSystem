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
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as XLSX from "xlsx-js-style";
import { faTableList } from "@fortawesome/free-solid-svg-icons";

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

  const [tableRefresh, setTableRefresh] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchLeaveRequests();
  }, [tableRefresh]);

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbwdQY2gSFk-A1lhQDHzomrBekDS_lvu535RU0rcWHIzVwRPKcSvXG5CYVbXyxze3VU0/exec?action=leaveRequests`
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

  // const updateRequestStatus = async (record, action, rejectionReason) => {
  //   setTableRefresh(true);

  //   const payload = {
  //     action: "updateLeaveRequest",
  //     timestamp: new Date(record.timestamp).toISOString(),
  //     employeeId: record.employeeId,
  //     status: action === "approve" ? "Approved" : "Denied",
  //     rejectionReason: action === "deny" ? rejectionReason : "", // Only pass rejectionReason if denying
  //   };

  //   try {
  //     const res = await fetch(
  //       "https://script.google.com/macros/s/AKfycbwdQY2gSFk-A1lhQDHzomrBekDS_lvu535RU0rcWHIzVwRPKcSvXG5CYVbXyxze3VU0/exec",
  //       {
  //         method: "POST",
  //         headers: { "Content-Type": "application/x-www-form-urlencoded" },
  //         body: new URLSearchParams(payload).toString(),
  //       }
  //     );
  //     const result = await res.json();
  //     if (result.success) {
  //       message.success(
  //         `Leave ${action === "approve" ? "approved" : "denied"}`
  //       );
  //       setTableRefresh(false);
  //     } else {
  //       message.error("Failed to update status");
  //     }
  //   } catch (err) {
  //     message.error("Error updating request");
  //   }
  // };

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

    try {
      const res = await fetch(
        "https://script.google.com/macros/s/AKfycbwdQY2gSFk-A1lhQDHzomrBekDS_lvu535RU0rcWHIzVwRPKcSvXG5CYVbXyxze3VU0/exec",
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

  const openEditModal = (record) => {
    setEditModal({ visible: true, record });

    form.setFieldsValue({
      rejectionReason: record.reasonForRejection || "-", // Set rejectionReason value
      employeeName: record.employeeName,
      leaveType: record.leaveType,
      reason: record.reason,
      status: record.status,
      dateRange: record.dateRange, // Start Date & End Date combined
      leaveDuration: record.leaveDuration,
      designation: record.designation,
      location: record.location,
    });
  };

  const openViewModal = (record) => {
    setViewModal({ visible: true, record });
    setRejectionReason(record.reasonForRejection || "-");
  };

  const columns = [
    { title: "Employee ID", dataIndex: "employeeId", width: 200 },
    { title: "Employee Name", dataIndex: "employeeName", width: 200 },
    { title: "Designation", dataIndex: "designation", width: 200 },
    { title: "Location", dataIndex: "location", width: 200 },
    { title: "Leave Type", dataIndex: "leaveType", width: 200 },
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
    { title: "Reason", dataIndex: "reason", width: 200 },
    { title: "Leave Duration", dataIndex: "leaveDuration", width: 200 },
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
      width: 200,
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
                  icon={<CheckOutlined />}
                  onClick={() => handleAction(record, "approve")}
                />
                <Button
                  type="primary"
                  style={{
                    backgroundColor: "#ff4d4fc4",
                    borderColor: "#ff4d4fc4",
                  }}
                  icon={<CloseOutlined />}
                  onClick={() => handleAction(record, "deny")}
                />
              </>
            )}
            <Button
              type="primary"
              style={{ backgroundColor: "#5bacf6", borderColor: "#5bacf6" }} // info
              icon={<EyeOutlined />}
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
                onClick={() => openEditModal(record)}
              />
            )}
          </Space>
        );
      },
    },
  ];

  const handleEditModalSubmit = async (actionType) => {
    try {
      const values = await form.validateFields();
      const reason = actionType === "approve" ? "-" : values.rejectionReason;
      await updateRequestStatus(editModal.record, actionType, reason);
      setEditModal({ visible: false, record: null });
      form.resetFields(); // Reset the form fields after submitting
    } catch (err) {
      message.error("Error submitting the form");
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
      <div className="row">
        <div className="col-12 mt-5">
          <Card
            bordered={false}
            className="shadow hover-card"
            style={{ borderRadius: 16 }}
          >
            <h3>
              <FontAwesomeIcon icon={faTableList} />
              <span className="ms-1">Employee Leave Requests</span>
            </h3>
            <Table
              columns={columns}
              dataSource={leaveRequests}
              rowKey="timestamp"
              loading={tableRefresh}
              pagination={{ pageSize: 5 }}
              scroll={{ x: "max-content" }}
              className="mt-3"
            />

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
                form.resetFields(); // Reset the form fields when closing the modal
              }}
              footer={null}
              style={{ top: 20 }}
            >
              <h3 className="text-center">Edit Leave Request</h3>
              <Form layout="vertical" form={form}>
                {/* Employee Name */}
                <Form.Item label="Employee Name">
                  <Input value={editModal.record?.employeeName} disabled />
                </Form.Item>

                {/* Leave Type */}
                <Form.Item label="Leave Type">
                  <Input value={editModal.record?.leaveType} disabled />
                </Form.Item>

                {/* Reason */}
                <Form.Item label="Reason">
                  <Input.TextArea
                    value={editModal.record?.reason}
                    disabled
                    autoSize
                  />
                </Form.Item>

                {/* Status */}
                <Form.Item label="Status">
                  <Input value={editModal.record?.status} disabled />
                </Form.Item>

                {/* Start Date */}
                <Form.Item label="Start Date">
                  <Input
                    value={
                      dayjs(
                        editModal.record?.dateRange?.split(",")[0]?.trim()
                      ).isValid()
                        ? dayjs(
                            editModal.record?.dateRange?.split(",")[0]?.trim()
                          ).format("MMM D, YYYY HH:mm")
                        : "-"
                    }
                    disabled
                  />
                </Form.Item>

                {/* End Date */}
                <Form.Item label="End Date">
                  <Input
                    value={
                      dayjs(
                        editModal.record?.dateRange?.split(",")[1]?.trim()
                      ).isValid()
                        ? dayjs(
                            editModal.record?.dateRange?.split(",")[1]?.trim()
                          ).format("MMM D, YYYY HH:mm")
                        : "-"
                    }
                    disabled
                  />
                </Form.Item>

                {/* Leave Duration */}
                <Form.Item label="Leave Duration">
                  <Input value={editModal.record?.leaveDuration} disabled />
                </Form.Item>

                {/* Designation */}
                <Form.Item label="Designation">
                  <Input value={editModal.record?.designation} disabled />
                </Form.Item>

                {/* Location */}
                <Form.Item label="Location">
                  <Input value={editModal.record?.location} disabled />
                </Form.Item>

                {/* Reason for Rejection */}
                {editModal.record?.status?.toLowerCase() !== "pending" && (
                  <Form.Item
                    label="Reason for Rejection"
                    name="rejectionReason"
                    rules={[
                      {
                        required: true,
                        message: "Please enter a reason for rejection",
                      },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Update reason for rejection"
                    />
                  </Form.Item>
                )}

                {/* Action Buttons */}
                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      onClick={() => handleEditModalSubmit("approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      danger
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
              style={{ top: 20 }}
            >
              <h3 className="text-center">View Leave Request</h3>
              <Form layout="vertical">
                <Form.Item label="Employee Name">
                  <Input value={viewModal.record?.employeeName} />
                </Form.Item>

                <Form.Item label="Leave Type">
                  <Input value={viewModal.record?.leaveType} />
                </Form.Item>

                <Form.Item label="Reason">
                  <Input.TextArea value={viewModal.record?.reason} autoSize />
                </Form.Item>

                <Form.Item label="Status">
                  <Input value={viewModal.record?.status} />
                </Form.Item>

                {viewModal.record?.status?.toLowerCase() !== "pending" && (
                  <Form.Item label="Reason for Rejection">
                    <TextArea
                      rows={4}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Update reason for rejection"
                    />
                  </Form.Item>
                )}
              </Form>
            </Modal>
          </Card>
        </div>
      </div>
    </div>
  );
}
