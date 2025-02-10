"use client";
import Navbar from "@/components/Navbar";
import React, { useState, useEffect, useCallback  } from "react";
import axios from "axios";
import { useToast } from "../ToastContext";
import { MdCancel, MdDelete } from "react-icons/md";
// import { CiEdit } from "react-icons/ci";
import { Box, Typography } from "@mui/material";
import { CiEdit } from "react-icons/ci";
import { DataGrid, GridRenderCellParams  } from "@mui/x-data-grid";
import { Button } from "@nextui-org/react";
import { FaFileInvoiceDollar } from "react-icons/fa";
import { io } from "socket.io-client";

const socket = io("http://localhost:8000");

interface Invoice {
  _id: string;
  companyName: string;
  customerName: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  gstNumber: string;
  productName: string;
  amount: number;
  discount: number;
  gstRate: number;
  status: string;
  date: string;
  totalWithoutGst: number;
  totalWithGst: number;
  paidAmount: number;
  remainingAmount: number;
}

const InvoicePage: React.FC = () => {
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [newInvoice, setNewInvoice] = useState<Invoice>({
    _id: "",
    companyName: "",
    customerName: "",
    contactNumber: "",
    emailAddress: "",
    address: "",
    gstNumber: "",
    productName: "",
    amount: 0,
    discount: 0,
    gstRate: 0,
    status: "paid",
    date: "",
    totalWithoutGst: 0,
    totalWithGst: 0,
    paidAmount: 0,
    remainingAmount: 0,
  });
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const calculateGST = (
    amount: number,
    discount: number,
    gstRate: number,
    paidAmount: number
  ) => {
    // Subtract the discount from the amount to get the discounted amount
    const discountedAmount = amount - amount * (discount / 100);
    const gstAmount = discountedAmount * (gstRate / 100); // Calculate GST on the discounted amount
    const totalWithoutGst = discountedAmount;
    const totalWithGst = discountedAmount + gstAmount; // Add GST to the discounted amount
    const remainingAmount = totalWithGst - paidAmount; // Calculate the remaining amount

    return {
      totalWithoutGst,
      totalWithGst,
      remainingAmount,
    };
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updatedInvoice = { ...newInvoice, [name]: value };

    if (
      name === "amount" ||
      name === "discount" ||
      name === "gstRate" ||
      name === "paidAmount"
    ) {
      const { totalWithoutGst, totalWithGst, remainingAmount } = calculateGST(
        updatedInvoice.amount,
        updatedInvoice.discount,
        updatedInvoice.gstRate,
        updatedInvoice.paidAmount
      );

      setNewInvoice({
        ...updatedInvoice,
        totalWithoutGst,
        totalWithGst,
        remainingAmount,
      });
    } else {
      setNewInvoice(updatedInvoice);
    }
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    socket.on("reminder", (data) => {
      console.log("Reminder received:", data);
      showToast(
       ' Unpaid Invoice Reminder Send to the ${data.customerName}',
        "success"
      ); // Display the reminder as a toast notification
    });

    // Listen for reminders from the backend
    socket.on("calenderreminder", (data) => {
      console.log("Reminder received:", data);
      showToast(` ${data.event} is scheduled soon!`, "success");
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    // Cleanup listener on component unmount
    return () => {
      socket.off("connect");
      socket.off("reminder");
      socket.off("disconnect");
    };
  }, [showToast]);

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v1/invoice/getAllInvoices"
      );
      setInvoices(response.data.data);
    } catch {
      showToast("Failed to fetch invoices!", "error");
    }
  }, [showToast]); // Only depends on `showToast`

  const handleEdit = (invoice: Invoice) => {
    setEditInvoice(invoice);
    setNewInvoice({ ...invoice });
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await axios.delete(
    `http://localhost:8000/api/v1/invoice/deleteInvoice/${id}
`      );
      console.log("Deleted Invoice:", response.data);
      fetchInvoices(); // Refresh the invoice list after deletion
      showToast("Invoice deleted successfully!", "success");
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log("Invoice to submit:", newInvoice); // Log the invoice values
      if (newInvoice._id) {
        const response = await axios.put(
          `http://localhost:8000/api/v1/invoice/updateInvoice/${newInvoice._id}`,
          newInvoice
        );
        console.log("Updated Invoice:", response.data);
        showToast("Invoice updated successfully!", "success");
      } else {
        const response = await axios.post(
          "http://localhost:8000/api/v1/invoice/invoiceAdd",
          newInvoice
        );
        console.log("Created Invoice:", response.data);
        showToast("Invoice created successfully!", "success");
      }

      setNewInvoice({
        _id: "",
        companyName: "",
        customerName: "",
        contactNumber: "",
        emailAddress: "",
        address: "",
        gstNumber: "",
        productName: "",
        amount: 0,
        discount: 0,
        gstRate: 0,
        status: "Unpaid",
        date: "",
        totalWithoutGst: 0,
        totalWithGst: 0,
        paidAmount: 0,
        remainingAmount: 0,
      });

      fetchInvoices();
      setIsSubmitting(false);
      setIsFormVisible(false);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const columns = [
    { field: "companyName", headerName: "Company Name", flex: 1 },
    { field: "customerName", headerName: "Customer Name", flex: 1 },
    { field: "contactNumber", headerName: "Contact Number", flex: 1 },
    { field: "emailAddress", headerName: "Email Address", flex: 1 },
    { field: "address", headerName: "Address", flex: 1 },
    { field: "gstNumber", headerName: "Gst Number", flex: 1 },
    { field: "productName", headerName: "Product Name", flex: 1 },
    { field: "amount", headerName: "Amount", flex: 1 },
    { field: "discount", headerName: "Discount", flex: 1 },
    { field: "gstRate", headerName: "Gst Rate", flex: 1 },
    { field: "status", headerName: "Status", flex: 1 },
    {
      field: "date",
      headerName: "Date",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Invoice>) => {
        const date = new Date(params.value); // Convert to Date object
        if (isNaN(date.getTime())) {
          return "Invalid Date"; // Handle invalid date
        }
        return date.toISOString().split("T")[0]; // Format as YYYY/MM/DD
      },
    },
    { field: "totalWithGst", headerName: "Total With Gst", flex: 1 },
    { field: "paidAmount", headerName: "Paid Amount", flex: 1 },
    { field: "remainingAmount", headerName: "Remaining Amount", flex: 1 },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Invoice>) => (
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
        Invoice Management
      </h2>

      <div className=" mb-4">
        <Button
          className="contactbtn shadow-[0_4px_14px_0_rgb(162,0,255,39%)] hover:shadow-[0_6px_20px_rgba(162,0,255,50%)] hover:bg-[rgba(162, 0, 255, 0.9)] px-8 py-2 bg-purple-500 rounded-md text-white font-light transition duration-200 ease-linear"
          color="primary"
          onClick={() => {
            setNewInvoice({
              _id: "",
              companyName: "",
              customerName: "",
              contactNumber: "",
              emailAddress: "",
              address: "",
              gstNumber: "",
              productName: "",
              amount: 0,
              discount: 0,
              gstRate: 0,
              status: "paid",
              date: "",
              totalWithoutGst: 0,
              totalWithGst: 0,
              paidAmount: 0,
              remainingAmount: 0,
            });
            setEditInvoice(null);
            setIsFormVisible(true);
          }}
        >
          Add Invoice
          <FaFileInvoiceDollar
            style={{ height: "20px", width: "20px", color: "#ff9b31" }}
          />
        </Button>
      </div>

      {isFormVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {editInvoice ? "Edit Invoice" : "Add Invoice"}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormVisible(false)}
                className="text-gray-600 hover:text-red-500"
              >
                <MdCancel size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="form-group">
                  <label
                    htmlFor="companyName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    id="companyName"
                    placeholder="Enter Company Name"
                    value={newInvoice.companyName}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                {/* Customer Name */}
                <div className="form-group">
                  <label
                    htmlFor="customerName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    id="customerName"
                    placeholder="Enter Customer Name"
                    value={newInvoice.customerName}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                {/* Contact Number */}
                <div className="form-group">
                  <label
                    htmlFor="contactNumber"
                    className="text-sm font-medium text-gray-700"
                  >
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    id="contactNumber"
                    placeholder="Enter Contact Number"
                    value={newInvoice.contactNumber}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                  />
                </div>

                {/* Email Address */}
                <div className="form-group">
                  <label
                    htmlFor="emailAddress"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="emailAddress"
                    id="emailAddress"
                    placeholder="Enter Email Address"
                    value={newInvoice.emailAddress}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                  />
                </div>

                {/* Address */}
                <div className="form-group">
                  <label
                    htmlFor="address"
                    className="text-sm font-medium text-gray-700"
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    placeholder="Enter Address"
                    value={newInvoice.address}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                  />
                </div>

                {/* GST Number */}
                <div className="form-group">
                  <label
                    htmlFor="gstNumber"
                    className="text-sm font-medium text-gray-700"
                  >
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    id="gstNumber"
                    placeholder="Enter GST Number"
                    value={newInvoice.gstNumber}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                  />
                </div>

                {/* Product Name */}
                <div className="form-group">
                  <label
                    htmlFor="productName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="productName"
                    id="productName"
                    placeholder="Enter Product Name"
                    value={newInvoice.productName}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                  />
                </div>

                {/* Amount */}
                <div className="form-group">
                  <label
                    htmlFor="amount"
                    className="text-sm font-medium text-gray-700"
                  >
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    placeholder="Enter Amount"
                    value={newInvoice.amount}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                {/* Discount */}
                <div className="form-group">
                  <label
                    htmlFor="discount"
                    className="text-sm font-medium text-gray-700"
                  >
                    Discount
                  </label>
                  <input
                    type="number"
                    name="discount"
                    id="discount"
                    placeholder="Enter Discount"
                    value={newInvoice.discount}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                  />
                </div>

                {/* GST Rate (Dropdown) */}
                <div className="form-group">
                  <label
                    htmlFor="gstRate"
                    className="text-sm font-medium text-gray-700"
                  >
                    GST Rate (%)
                  </label>
                  <select
                    name="gstRate"
                    id="gstRate"
                    value={newInvoice.gstRate}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>

                {/* Status (Dropdown) */}
                <div className="form-group">
                  <label
                    htmlFor="status"
                    className="text-sm font-medium text-gray-700"
                  >
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    value={newInvoice.status}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    </select>
                </div>

                {/* Date */}
                <div className="form-group">
                  <label
                    htmlFor="date"
                    className="text-sm font-medium text-gray-700"
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    id="date"
                    value={newInvoice.date}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                {/* Paid Amount */}
                <div className="form-group">
                  <label
                    htmlFor="paidAmount"
                    className="text-sm font-medium text-gray-700"
                  >
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    id="paidAmount"
                    placeholder="Paid Amount"
                    value={newInvoice.paidAmount}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                  />
                </div>

                {/* Remaining Amount */}
                <div className="form-group">
                  <label
                    htmlFor="remainingAmount"
                    className="text-sm font-medium text-gray-700"
                  >
                    Remaining Amount
                  </label>
                  <input
                    type="number"
                    name="remainingAmount"
                    id="remainingAmount"
                    value={newInvoice.remainingAmount}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                    disabled
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Save Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table of Invoices */}
      <Box sx={{ height: 600, width: "100%" }}>
        {invoices.length > 0 ? (
          <DataGrid
            rows={invoices}
            columns={columns}
            getRowId={(row) => row._id} // Map the row id to _id
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
            No Invoice Available.
          </Typography>
        )}
      </Box>
    </div>
  );
};

export default InvoicePage;