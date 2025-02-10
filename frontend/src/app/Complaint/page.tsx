"use client";
import Navbar from "@/components/Navbar";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useToast } from "../ToastContext";
import { CiEdit } from "react-icons/ci";
import { MdCancel, MdContactPhone, MdDelete } from "react-icons/md";
import { IoMdList, IoMdTime } from "react-icons/io";
import { Button } from "@nextui-org/react";
import { Box, Typography } from "@mui/material";
import { DataGrid, GridRenderCellParams } from "@mui/x-data-grid";
import { io } from 'socket.io-client';

const socket = io('http://localhost:8000');

interface Complaint {
  _id: string;
  complainerName: string;
  contactNumber: string;
  caseStatus: string;
  caseOrigin: string;
  subject: string;
  priority: string;
  date: string;
  time: string;
}

const ComplaintPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [formData, setFormData] = useState<Complaint>({
    _id: "",
    complainerName: "",
    contactNumber: "",
    caseStatus: "Pending",
    caseOrigin: "",
    subject: "",
    priority: "Medium",
    date: "",
    time: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [showResolved, setShowResolved] = useState<boolean>(false);
  const { showToast } = useToast();

  const fetchComplaints = useCallback(async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v1/complaint/getAllComplaints"
      );
      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  }, []); 

  useEffect(() => {
    if (showResolved) {
      setFilteredComplaints(
        complaints.filter((complaint) => complaint.caseStatus === "Resolved")
      );
    } else {
      setFilteredComplaints(
        complaints.filter((complaint) => complaint.caseStatus !== "Resolved")
      );
    }
  }, [showResolved, complaints]);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });

    socket.on('reminder', (data) => {
      console.log('Reminder received:', data);
      showToast(
        `Unpaid Invoice Reminder Send to the ${data.customerName}`,
        'success'
      );
    });

    socket.on("calenderreminder", (data) => {
      console.log("Reminder received:", data);
      showToast(
        ` ${data.event} is scheduled soon!`,
        "success"
      );
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.off('connect');
      socket.off('reminder');
      socket.off('disconnect');
    };
  }, [showToast]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await axios.put(
          `http://localhost:8000/api/v1/complaint/updateComplaint/${formData._id}`,
          formData
        );
        showToast("Complaint updated successfully!", "success");
      } else {
        await axios.post(
          "http://localhost:8000/api/v1/complaint/createComplaint",
          formData
        );
        showToast("Complaint created successfully!", "success");
      }

      setFormData({
        _id: "",
        complainerName: "",
        contactNumber: "",
        caseStatus: "Pending",
        caseOrigin: "",
        subject: "",
        priority: "Medium",
        date: "",
        time: "",
      });
      setIsSubmitting(false);
      setIsEditing(false);
      setIsFormVisible(false);
      fetchComplaints();
    } catch (error) {
      console.error("Failed to save complaint.", error);
      showToast("Failed to save complaint.", "error");
      setIsSubmitting(false);
    }
  };

  const handleEdit = (complaint: Complaint) => {
    setFormData(complaint);
    setIsEditing(true);
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(
        `http://localhost:8000/api/v1/complaint/deleteComplaint/${id}`
      );
      fetchComplaints();
      showToast("Complaint deleted successfully!", "success");
    } catch (error) {
      console.error("Error updating complaint:", error); 
      showToast("Failed to delete complaint.", "error");
    }
  };

  const columns = [
    { field: "complainerName", headerName: "Customer Name", flex: 1 },
    { field: "contactNumber", headerName: "Contact Number", flex: 1 },
    { field: "subject", headerName: "Subject", flex: 1 },
    { field: "caseStatus", headerName: "Case Status", flex: 1 },
    { field: "priority", headerName: "Priority", flex: 1 },
    { field: "date", headerName: "Date", flex: 1 },
    { field: "time", headerName: "Time", flex: 1 },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <div className="flex justify-center items-center gap-3">
          <button
            className="p-2 text-green-600  rounded hover:bg-green-200"
            onClick={() => handleEdit(params.row)}
            aria-label="Edit Contact"
          >
            <CiEdit size={18} />
          </button>
          <button
            className="p-2 text-red-600  rounded hover:bg-red-100"
            onClick={() => handleDelete(params.row._id)}
            aria-label="Delete Contact"
          >
            <MdDelete size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center bg-white py-4">
      <Navbar />
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        Contact Record
      </h2>
      <div className=" mb-4">
        <Button
          className="contactbtn shadow-[0_4px_14px_0_rgb(162,0,255,39%)] hover:shadow-[0_6px_20px_rgba(162,0,255,50%)] hover:bg-[rgba(162, 0, 255, 0.9)] px-8 py-2 bg-purple-500 rounded-md text-white font-light transition duration-200 ease-linear"
          color="primary"
          onClick={() => {
            setFormData({
              _id: "",
              complainerName: "",
              contactNumber: "",
              caseStatus: "",
              caseOrigin: "",
              subject: "",
              priority: "Medium",
              date: "",
              time: "",
            });
            setIsEditing(false);
            setIsFormVisible(true);
          }}
        >
          Add Complaint
          <MdContactPhone
            style={{ height: "20px", width: "20px", color: "#ff9b31" }}
          />
        </Button>
      </div>

      <div className="mb-5">
        <button
          className="py-2 px-6 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
          onClick={() => setShowResolved(!showResolved)}
        >
          {showResolved ? (
            <IoMdList className="text-white" />
          ) : (
            <IoMdTime className="text-white" />
          )}
        </button>
      </div>

      {isFormVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {isEditing ? "Edit Complaint" : "Add Complaint"}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormVisible(false)}
                className="text-gray-600 hover:text-red-500"
              >
                <MdCancel size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Your Name"
                    name="complainerName"
                    value={formData.complainerName}
                    onChange={handleChange}
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Contact Details
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Your Contact Number"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Your Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Problem
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Your Problem"
                    name="caseOrigin"
                    value={formData.caseOrigin}
                    onChange={handleChange}
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="caseStatus"
                    value={formData.caseStatus}
                    onChange={handleChange}
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Resolved">Resolved</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>

                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  className="label py-2 px-6 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Submitting..."
                    : isEditing
                    ? "Update Complaint"
                    : "Add Complaint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredComplaints.length === 0 ? (
        <div className="text-center py-4 text-gray-600">
          No Complaints available
        </div>
      ) : (
        <Box sx={{ height: 600, width: "100%" }}>
          {complaints.length > 0 ? (
            <DataGrid
              rows={filteredComplaints}
              columns={columns}
              getRowId={(row) => row._id}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                  },
                },
              }}
              pageSizeOptions={[5]}
              disableRowSelectionOnClick
            />
          ) : (
            <Typography variant="h6" align="center">
              No Complaints Available.
            </Typography>
          )}
        </Box>
      )}
    </div>
  );
};

export default ComplaintPage;