import { useEffect, useState } from "react";
import { Table, Button, Modal, message, Space, Input } from "antd";
const { TextArea } = Input;

export default function AdminDashboard() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [rejectModal, setRejectModal] = useState({ visible: false, record: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [tableRefresh, setTableRefresh] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, [tableRefresh]);

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbyJqDtmxw_5c4Nn5pZOMuhn45BJluImtSa46JE-YJFaAj2qp45tSnZGSQFeN04MRqI/exec?action=leaveRequests`
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

  const updateRequestStatus = async (record, action) => {
    setTableRefresh(true);

    const payload = {
      action: "updateLeaveRequest",
      timestamp: new Date(record.timestamp).toISOString(), 
      employeeId: record.employeeId,
      status: action === "approve" ? "Approved" : "Denied",
      rejectionReason: action === "deny" ? rejectionReason : "",
    };

    try {
      const res = await fetch("https://script.google.com/macros/s/AKfycbyJqDtmxw_5c4Nn5pZOMuhn45BJluImtSa46JE-YJFaAj2qp45tSnZGSQFeN04MRqI/exec", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(payload).toString(),
      });
      const result = await res.json();
      if (result.success) {
        message.success(`Leave ${action}d`);
        setTableRefresh(false);
      } else {
        message.error("Failed to update status");
      }
    } catch (err) {
      message.error("Error updating request");
    }
  };

  const columns = [
    { title: "Timestamp", dataIndex: "timestamp", width: 200 },
    { title: "Employee ID", dataIndex: "employeeId", width: 200 },
    { title: "Employee Name", dataIndex: "employeeName", width: 200 },
    { title: "Designation", dataIndex: "designation", width: 200 },
    { title: "Location", dataIndex: "location", width: 200 },
    { title: "Leave Type", dataIndex: "leaveType", width: 200 },
    { title: "Date Range", dataIndex: "dateRange", width: 200 },
    { title: "Reason", dataIndex: "reason", width: 200 },
    { title: "Status", dataIndex: "status", width: 200 },
    { title: "Leave Duration", dataIndex: "leaveDuration", width: 200 },
    {
      title: "Action",
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleAction(record, "approve")} type="primary">Approve</Button>
          <Button onClick={() => handleAction(record, "deny")} danger> Deny</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="container py-2" style={{ maxWidth: "1200px", margin: "0 auto", minHeight: "100vh" }}>
        <div className="row">
      <Table
        columns={columns}
        dataSource={leaveRequests}
        rowKey="timestamp"
        loading={tableRefresh}
        pagination={{ pageSize: 5 }}
        scroll={{ x: "max-content" }}
        className="mt-3"
      />

      <Modal
        title="Enter reason for denial"
        open={rejectModal.visible}
        onOk={async () => {
          await updateRequestStatus(rejectModal.record, "deny");
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
    </div>
    </div>
  );
}
