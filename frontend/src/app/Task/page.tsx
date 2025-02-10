"use client";
import Navbar from "@/components/Navbar";
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "../ToastContext";
import axios from "axios";
import { CiEdit } from "react-icons/ci";
import { MdCancel, MdContactPhone, MdDelete } from "react-icons/md";
import { Button } from "@/components/ui/button";
import Box from "@mui/material/Box";
import { DataGrid, GridRenderCellParams  } from "@mui/x-data-grid";
import { Typography } from "@mui/material";
import { IoMdList, IoMdTime } from "react-icons/io";
import { io} from 'socket.io-client';
const socket = io('http://localhost:8000');
interface Task {
  _id?: string;
  subject: string;
  name: string;
  relatedTo: string;
  dueDate: string;
  status: string;
  priority: string;
  assigned: string;
  lastReminderDate: string;
  lastReminder: string;
}

const TaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<Task>({
    _id: "",
    subject: "",
    name: "",
    relatedTo: "",
    dueDate: "",
    status: "Pending", // Default value
    priority: "Medium", // Default value
    assigned: "",
    lastReminderDate: "",
    lastReminder: "",
  });
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [showResolved, setShowResolved] = useState<boolean>(false);

  // Validate the form before submitting
  const validateForm = () => {
    if (
      !newTask.subject ||
      !newTask.name ||
      !newTask.relatedTo ||
      !newTask.dueDate
    ) {
      setError("Please fill in all the required fields.");
      return false;
    }
    return true;
  };

  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v1/task/getAllTasks"
      );
      const allTasks = response.data.data;
  
      // Filter tasks based on the current state of showResolved
      const filtered = showResolved
      ? allTasks.filter((task: Task) => task.status === "Resolved")
      : allTasks.filter((task: Task) => task.status !== "Resolved");
    
  
      setTasks(allTasks); // Always store all tasks in the main state
      setFilteredTasks(filtered); // Update the filtered state
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Failed to fetch tasks.");
      showToast("Failed to fetch tasks.", "error");
    }
  }, [showResolved, showToast]); // ✅ Add dependencies (only updates when these change)
  
  // Handle Edit
  const handleEdit = (task: Task) => {
    setEditTask(task);
    setNewTask({ ...task });
    setIsFormVisible(true); // Show form when editing
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/v1/task/deleteTask/${id}`
      );
      console.log("Deleted Task:", response.data);
      fetchTasks(); // Refresh the task list after deletion
      showToast("Task deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task.");
      showToast("Failed to delete task.", "error");
    }
  };

  // Handle form submission for creating or updating tasks

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    const taskToSend = { ...newTask };
    if (!taskToSend._id) {
      delete taskToSend._id; // Prevent sending _id when creating a new task
    }

    try {
      if (newTask._id) {
        // If we are editing an existing task
        const response = await axios.put(
          `http://localhost:8000/api/v1/task/updateTask/${newTask._id}`,
          taskToSend
        );
        console.log("Updated Task:", response.data);
        showToast("Taak updated successfully!", "success");
      } else {
        // If we are creating a new task
        const response = await axios.post(
          "http://localhost:8000/api/v1/task/createTask",
          taskToSend
        );
        console.log("Created Task:", response.data);
        showToast("Task created successfully!", "success");
      }

      setNewTask({
        _id: "",
        subject: "",
        name: "",
        relatedTo: "",
        dueDate: "",
        status: "Pending",
        priority: "Medium",
        assigned: "",
        lastReminderDate: "",
        lastReminder: "",
      });

      fetchTasks(); // Refresh task list after operation
      setIsSubmitting(false);
      setError(null); // Reset error message
      setIsFormVisible(false); // Hide form after submission
    } catch (error) {
      console.error("Error saving task:", error);
      setError("Failed to save task.");
      showToast("Failed to save task.", "error");
      setIsSubmitting(false);
    }
  };

  // Fetch tasks when the component is mounted
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

        useEffect(() => {
          socket.on('connect', () => {
            console.log('Connected to server:', socket.id);
          });
  
          socket.on('reminder', (data) => {
            console.log('Reminder received:', data);
            showToast(
              `Unpaid Invoice Reminder Send to the ${data.customerName}`,
              'success'
              ); // Display the reminder as a toast notification
          }); 
  
          // Listen for reminders from the backend
          socket.on("calenderreminder", (data) => {
            console.log("Reminder received:", data);
            showToast(
             ` ${data.event} is scheduled soon!`,
              "success"
            );
          });;
        
          // Handle disconnection
          socket.on('disconnect', () => {
            console.log('Disconnected from server');
          });
        
          // Cleanup listener on component unmount
          return () => {
            socket.off('connect');
            socket.off('reminder');
            socket.off('disconnect');
          };
        }, [showToast]);

  const columns = [
    { field: "subject", headerName: "Subject", flex: 1 },
    { field: "relatedTo", headerName: "RelatedTo", flex: 1 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "assigned", headerName: "Assigned By", flex: 1 },
    { field: "lastReminder", headerName: "Last Reminder", flex: 1 },
    {
      field: "lastReminderDate",
      headerName: "Last Reminder Date",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Task>) => {
        const date = new Date(params.value); // Convert to Date object
        if (isNaN(date.getTime())) {
          return "Invalid Date"; // Handle invalid date
        }
        return date.toISOString().split("T")[0]; // Format as YYYY/MM/DD
      },
    },
    { field: "status", headerName: "Status", flex: 1 },
    { field: "priority", headerName: "Priority", flex: 1 },
    { field: "dueDate", headerName: "Due Date", flex: 1 },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Task>) => (
        <div className="flex justify-center items-center gap-3">
          <button
            className="p-2 text-green-600  rounded hover:bg-green-200"
            onClick={() => handleEdit(params.row)}
            aria-label="Edit Contact"
          >
            <CiEdit size={18} />
          </button>
          <button
            className="p-2 text-red-600 rounded hover:bg-red-100"
            onClick={() => params.row._id && handleDelete(params.row._id)}
            aria-label="Delete Contact"
          >
            <MdDelete size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className=" flex flex-col items-center justify-center bg-white py-4 ">
      <Navbar />
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        task Record
      </h2>
      <div className=" mb-4">
        <Button
          className="contactbtn shadow-[0_4px_14px_0_rgb(162,0,255,39%)] hover:shadow-[0_6px_20px_rgba(162,0,255,50%)] hover:bg-[rgba(162, 0, 255, 0.9)] px-8 py-2 bg-purple-500 rounded-md text-white font-light transition duration-200 ease-linear"
          color="primary"
          onClick={() => {
            setNewTask({
              _id: "",
              subject: "",
              name: "",
              relatedTo: "",
              dueDate: "",
              status: "Pending",
              priority: "Medium",
              assigned: "",
              lastReminderDate: "",
              lastReminder: "",
            });
            setEditTask(null);
            setIsFormVisible(true);
          }}
        >
          Add
          <MdContactPhone
            style={{ height: "20px", width: "20px", color: "#ff9b31" }}
          />
        </Button>
      </div>

      <div className="mb-5">
        <button
          className="py-2 px-6 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
          onClick={() => {
            setShowResolved(!showResolved); // Toggle resolved tasks visibility
            fetchTasks(); // Re-fetch tasks based on the new state
          }}
        >
          {showResolved ? (
            <>
              <IoMdList className="text-white" />
              Show All Tasks
            </>
          ) : (
            <>
              <IoMdTime className="text-white" />
              Show Resolved Tasks
            </>
          )}
        </button>
      </div>

      {/* Popup Modal */}
      {isFormVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {editTask ? "Edit Complaint" : "Add Complaint"}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormVisible(false)}
                className="text-gray-600 hover:text-red-500"
              >
                <MdCancel size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4  p-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject */}
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Subject"
                    name="subject"
                    value={newTask.subject}
                    onChange={(e) =>
                      setNewTask({ ...newTask, subject: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Related To
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Related To"
                    name="relatedTo"
                    value={newTask.relatedTo}
                    onChange={(e) =>
                      setNewTask({ ...newTask, relatedTo: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Name"
                    name="name"
                    value={newTask.name}
                    onChange={(e) =>
                      setNewTask({ ...newTask, name: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Assigned By
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Assigned By"
                    name="assigned"
                    value={newTask.assigned}
                    onChange={(e) =>
                      setNewTask({ ...newTask, assigned: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Last Reminder Date
                  </label>
                  <input
                    type="date"
                    name="lastReminderDate"
                    value={newTask.lastReminderDate}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        lastReminderDate: e.target.value,
                      })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Last Reminder
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Last Reminder"
                    name="lastReminder"
                    value={newTask.lastReminder}
                    onChange={(e) =>
                      setNewTask({ ...newTask, lastReminder: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newTask.status}
                    onChange={(e) =>
                      setNewTask({ ...newTask, status: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
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
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="submit"
                  className="py-2 px-4 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Submitting..."
                    : editTask
                    ? "Update Task"
                    : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {error && <div className="mt-4 text-red-600 text-xs">{error}</div>}

      {filteredTasks.length === 0 ? (
        <div className="text-center py-4 text-gray-600">No tasks available</div>
      ) : (
        <Box sx={{ height: 600, width: "100%" }}>
          {tasks.length > 0 ? (
            <DataGrid
              rows={filteredTasks}
              columns={columns}
              getRowId={(row) => row._id ?? ""}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                  },
                },
              }}
              pageSizeOptions={[5]}
              disableRowSelectionOnClick
              // slots={{ toolbar: GridToolbar }}
            />
          ) : (
            <Typography variant="h6" align="center">
              No Tasks Available.
            </Typography>
          )}
        </Box>
      )}
    </div>
  );
};

export default TaskPage;
