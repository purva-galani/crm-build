"use client";
import Navbar from "@/components/Navbar";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import { CiEdit } from "react-icons/ci";
import { useToast } from "../ToastContext";
import { MdCancel, MdContactPhone, MdDelete } from "react-icons/md";
import {
  DataGrid,
  GridDensity,
  GridFilterModel,
  GridRenderCellParams,
  GridSortItem
} from "@mui/x-data-grid";
import {
  Button,
} from "@nextui-org/react";
import { IoMdAddCircle, IoMdAirplane } from "react-icons/io";
import { io } from 'socket.io-client';


// Connect to the backend
const socket = io('http://localhost:8000');

interface Lead {
  _id: string;
  companyName: string;
  customerName: string;
  contactNumber?: string;
  emailAddress: string;
  address: string;
  productName: string;
  amount: number;
  gstNumber: string;
  status: string;
  date: string;
  endDate?: string;
  notes: string;
}

interface Contact {
  companyName: string;
  customerName: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  gstNumber?: string;
  description?: string;
}

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

const LeadPage: React.FC = () => {
  const [pageSize, setPageSize] = useState<number>(10);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [newLead, setNewLead] = useState<Lead>({
    _id: "",
    companyName: "",
    customerName: "",
    contactNumber: "",
    emailAddress: "",
    address: "",
    productName: "",
    amount: 0,
    gstNumber: "",
    status: "New",
    date: "",
    endDate: "",
    notes: "",
  });

  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [density, setDensity] = useState<GridDensity>("standard"); // State for density
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<
    Record<string, boolean>
  >({});
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  }); // Add filter model state
  const { showToast } = useToast();
  const [page, setPage] = useState<number>(0); // State for the current page
  const [isContactFormVisible, setIsContactFormVisible] = useState(false);
  const [isInvoiceFormVisible, setIsInvoiceFormVisible] = useState(false);
  const [sortModel, setSortModel] = useState<GridSortItem[]>([]); 

  const [newInvoice, setNewInvoice] = useState<Invoice>({
    _id: "",
    companyName: "",
    customerName: "",
    contactNumber: "",
    emailAddress: "",
    address: "",
    gstNumber: "",
    productName: "",
    amount: 0, // Initialize as a number
    discount: 0, // Initialize as a number
    gstRate: 0, // Initialize as a number
    status: "",
    date: "",
    totalWithGst: 0, // Initialize as a number
    totalWithoutGst: 0, // Initialize as a number
    paidAmount: 0, // Initialize as a number
    remainingAmount: 0, // Initialize as a number
  });

  const [newContact, setNewContact] = useState<Contact>({
    companyName: "",
    customerName: "",
    contactNumber: "",
    emailAddress: "",
    address: "",
    gstNumber: "",
    description: "",
  });
  useEffect(() => {
    const savedPageSize = localStorage.getItem("pageSize");
    const savedDensity = localStorage.getItem("density") as GridDensity;
    const savedColumnVisibility = localStorage.getItem("columnVisibilityModel");
    const savedFilterModel = localStorage.getItem("filterModel");
    const savedSortModel = localStorage.getItem("sortModel");

    if (savedPageSize) setPageSize(parseInt(savedPageSize, 10));
    if (savedDensity) setDensity(savedDensity);
    if (savedColumnVisibility)
      setColumnVisibilityModel(JSON.parse(savedColumnVisibility));
    if (savedFilterModel) setFilterModel(JSON.parse(savedFilterModel)); // Load filters
    if (savedSortModel) setSortModel(JSON.parse(savedSortModel));
  }, []);

  useEffect(() => {
    // Save the pageSize and density to local storage whenever it changes
    localStorage.setItem("pageSize", pageSize.toString());
    localStorage.setItem("density", density);
    localStorage.setItem(
      "columnVisibilityModel",
      JSON.stringify(columnVisibilityModel)
    );
    localStorage.setItem("filterModel", JSON.stringify(filterModel)); // Save filters
    localStorage.setItem("sortModel", JSON.stringify(sortModel));
  }, [pageSize, columnVisibilityModel, filterModel, sortModel, density]); // Add density here

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

         const fetchLeads = useCallback(async () => {
          try {
            const response = await axios.get(
              "http://localhost:8000/api/v1/lead/getAllLeads"
            );
            setLeads(response.data.data);
          } catch(error){
            console.error("Error fetching leads", error);
          }
        }, []);
        
        useEffect(() => {
          fetchLeads();
        }, [fetchLeads]);

  const handleEdit = (lead: Lead) => {
    setEditLead(lead);
    setNewLead({ ...lead });
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/v1/lead/deleteLead/${id}`
      );
      console.log("Deleted Lead:", response.data);
      setLeads((prevLeads) => prevLeads.filter((lead) => lead._id !== id));

      // fetchLeads(); // Refresh the leads list after deletion
      showToast("Lead deleted successfully!", "success");
    } catch {
      showToast("Failed to delete lead!", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (newLead._id) {
        // If we are editing an existing lead
        const response = await axios.put(
          `http://localhost:8000/api/v1/lead/updateLead/${newLead._id}`,
          newLead
        );
        console.log("Updated Lead:", response.data);
        showToast("Lead updated successfully!", "success");
      } else {
        // If we are creating a new lead
        const response = await axios.post(
          "http://localhost:8000/api/v1/lead/createLead",
          newLead
        );
        console.log("Created Lead:", response.data);
        showToast("Lead created successfully!", "success");
      }

      setNewLead({
        _id: "",
        companyName: "",
        customerName: "",
        contactNumber: "",
        emailAddress: "",
        address: "",
        productName: "",
        amount: 0,
        gstNumber: "",
        status: "New",
        date: "",
        endDate: "",
        notes: "",
      });

      fetchLeads();
      setIsSubmitting(false);
      setIsFormVisible(false);
    } catch (error) {
      console.error("Failed to save lead!", error);
      setIsSubmitting(false);
    }
  };
  const handleAddContactClick = (lead: Lead) => {
    setIsContactFormVisible(true);

    // Pre-populate the contact form with the lead's information
    setNewContact({
      companyName: lead.companyName,
      customerName: lead.customerName,
      contactNumber: lead.contactNumber || "", // Default to empty if not available
      emailAddress: lead.emailAddress,
      address: lead.address,
      gstNumber: lead.gstNumber, // Optional, you can leave this empty or populate based on your needs
      description: "", // Optional, same as above
    });
  };
  const handleAddInvoice = (lead: Lead) => {
    setIsInvoiceFormVisible(true);

    // Pre-populate the contact form with the lead's information
    setNewInvoice({
      _id: "", // Default empty string, assuming this will be set later
      companyName: lead.companyName,
      customerName: lead.customerName,
      contactNumber: lead.contactNumber || "", // Default to empty if not available
      emailAddress: lead.emailAddress,
      address: lead.address,
      gstNumber: lead.gstNumber,
      productName: lead.productName,
      amount: lead.amount, // Default to 0 (since amount is a number)
      discount: 0, // Default to 0 (since discount is a number)
      gstRate: 0, // Default to 0 (since gstRate is a number)
      status: "", // Default empty string for status
      date: "", // Default empty string for date
      totalWithGst: 0, // Default to 0 (since totalWithGst is a number)
      totalWithoutGst: 0, // Default to 0 (since totalWithoutGst is a number)
      paidAmount: 0, // Default to 0 (since paidAmount is a number)
      remainingAmount: 0, // Default to 0 (since remainingAmount is a number)
    });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation: Check if any required field is empty
    const {
      companyName,
      customerName,
      contactNumber,
      emailAddress,
      address,
      gstNumber,
      description,
    } = newContact;

    if (
      !companyName ||
      !customerName ||
      !contactNumber ||
      !emailAddress ||
      !address ||
      !gstNumber ||
      !description
    ) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    try {
      // Assuming you have an endpoint for saving contacts
      await axios.post(
        "http://localhost:8000/api/v1/contact/createContact",
        newContact
      );
      setIsContactFormVisible(false);
      setNewContact({
        companyName: "",
        customerName: "",
        contactNumber: "",
        emailAddress: "",
        address: "",
        gstNumber: "",
        description: "",
      });
      showToast("Contact saved successfully!", "success");
    } catch {
      showToast("Failed to save contact.", "error");
    }
  };

  const handleInvocieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation: Check if any required field is empty
    const {
      companyName,
      customerName,
      contactNumber,
      emailAddress,
      address,
      gstNumber,
    } = newInvoice;

    if (
      !companyName ||
      !customerName ||
      !contactNumber ||
      !emailAddress ||
      !address ||
      !gstNumber
    ) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    try {
      // Assuming you have an endpoint for saving contacts
      await axios.post(
        "http://localhost:8000/api/v1/invoice/invoiceAdd",
        newInvoice
      );
      setIsInvoiceFormVisible(false);
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

      showToast("Invocie saved successfully!", "success");
    } catch {
      showToast("Failed to save contact.", "error");
    }
  };

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

  const columns = [
    { field: "companyName", headerName: "Company Name", flex: 1 },
    { field: "customerName", headerName: "Customer Name", flex: 1 },
    { field: "contactNumber", headerName: "Contact Number", flex: 1 },
    { field: "emailAddress", headerName: "Email Address", flex: 1 },
    // { field: "address", headerName: "Company Address", flex: 1 },
    { field: "productName", headerName: "Product Name", flex: 1 },
    { field: "amount", headerName: "Product Amount", flex: 1 },
    // { field: "gstNumber", headerName: "GST Number", flex: 1 },
    { field: "notes", headerName: "Notes", flex: 1 },
    {
      field: "date",
      headerName: "Lead Date",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Lead>) => {
        const date = new Date(params.value);
        if (isNaN(date.getTime())) {
          return "Invalid Date";
        }
        return date.toISOString().split("T")[0];
      },
    },
    {
      field: "End Date",
      headerName: "Next / End Date",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Lead>) => {
        const date = new Date(params.value);
        if (isNaN(date.getTime())) {
          return "Invalid Date";
        }
        return date.toISOString().split("T")[0];
      },
    },
    { field: "status", headerName: "Lead Status", flex: 1 },
    {
      field: "action",
      headerName: "Action",
      flex: 1,

      renderCell: (params: GridRenderCellParams<Lead>) => (
        <div className="flex justify-center items-center gap-3">
          <button
            className="p-2 text-gray-600  rounded hover:bg-gray-200"
            onClick={() => handleEdit(params.row)}
            aria-label="Edit Contact"
          >
            <CiEdit size={18} />
          </button>
          <button
            className=" p-2 text-red-600  rounded hover:bg-red-100"
            onClick={() => handleDelete(params.row._id)}
            aria-label="Delete Contact"
          >
            <MdDelete size={18} />
          </button>
          <button
            className="text-red-500 hover:text-red-700"
            onClick={() => handleAddContactClick(params.row)}
          >
            <IoMdAddCircle size={20} />
          </button>
          <button
            className="text-red-500 hover:text-red-700"
            onClick={() => handleAddInvoice(params.row)}
          >
            <IoMdAirplane size={20} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center bg-white py-4">
    <Navbar />
      {/* <div className="container mx-auto px-4"> */}
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        Lead Management
      </h2>
      <div className=" mb-4">
        <Button
          className="contactbtn shadow-[0_4px_14px_0_rgb(162,0,255,39%)] hover:shadow-[0_6px_20px_rgba(162,0,255,50%)] hover:bg-[rgba(162, 0, 255, 0.9)] px-8 py-2 bg-purple-500 rounded-md text-white font-light transition duration-200 ease-linear"
          color="primary"
          onClick={() => {
            setNewLead({
              _id: "",
              companyName: "",
              customerName: "",
              contactNumber: "",
              emailAddress: "",
              address: "",
              productName: "",
              amount: 0,
              gstNumber: "",
              status: "New",
              date: "",
              endDate: "",
              notes: "",
            });
            setEditLead(null); // Reset editTask
            setIsFormVisible(true); // Toggle form visibility
          }}
        >
          Add
          <MdContactPhone
            style={{ height: "20px", width: "20px", color: "#ff9b31" }}
          />
        </Button>
      </div>
      {isInvoiceFormVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-3xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Add Invoice
            </h3>
            <form
              onSubmit={handleInvocieSubmit}
              className="space-y-6 p-6 w-full"
            >
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
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        companyName: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        customerName: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        contactNumber: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                    required
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
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        emailAddress: e.target.value,
                      })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                    required
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
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, address: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                    required
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
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        gstNumber: e.target.value,
                      })
                    }
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
                    onChange={(e) =>
                      setNewInvoice({
                        ...newInvoice,
                        productName: e.target.value,
                      })
                    }
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
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                    onChange={handleChange}
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
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, status: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                  >
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="pending">Pending</option>
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
                    onChange={(e) =>
                      setNewInvoice({ ...newInvoice, date: e.target.value })
                    }
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
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md text-black"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
                >
                  Add Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isContactFormVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-3xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Add Contact
            </h3>
            <form
              onSubmit={handleContactSubmit}
              className="space-y-4 p-6 w-full"
            >
              {/* Contact Form Fields */}
              <input
                type="text"
                placeholder="Company Name"
                value={newContact.companyName}
                onChange={(e) =>
                  setNewContact({ ...newContact, companyName: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Customer Name"
                value={newContact.customerName}
                onChange={(e) =>
                  setNewContact({ ...newContact, customerName: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Contact Number"
                value={newContact.contactNumber}
                onChange={(e) =>
                  setNewContact({
                    ...newContact,
                    contactNumber: e.target.value,
                  })
                }
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                value={newContact.emailAddress}
                onChange={(e) =>
                  setNewContact({ ...newContact, emailAddress: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Address"
                value={newContact.address}
                onChange={(e) =>
                  setNewContact({ ...newContact, address: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="GST Number"
                value={newContact.gstNumber}
                onChange={(e) =>
                  setNewContact({ ...newContact, gstNumber: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
              <textarea
                placeholder="Description"
                value={newContact.description}
                onChange={(e) =>
                  setNewContact({ ...newContact, description: e.target.value })
                }
                className="w-full p-2 border rounded"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Add Contact
              </button>
            </form>
          </div>
        </div>
      )}

      {isFormVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-opaq-sm ">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {editLead ? "Edit Complaint" : "Add Complaint"}
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
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    placeholder="Enter Company Name"
                    value={newLead.companyName}
                    onChange={(e) =>
                      setNewLead({ ...newLead, companyName: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    placeholder="Enter Customer Name"
                    value={newLead.customerName}
                    onChange={(e) =>
                      setNewLead({ ...newLead, customerName: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    placeholder="Enter Contact Number"
                    value={newLead.contactNumber}
                    onChange={(e) =>
                      setNewLead({ ...newLead, contactNumber: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                  />
                </div>
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="emailAddress"
                    placeholder="Enter Email Address"
                    value={newLead.emailAddress}
                    onChange={(e) =>
                      setNewLead({ ...newLead, emailAddress: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Company Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter Company Full Address"
                    value={newLead.address}
                    onChange={(e) =>
                      setNewLead({ ...newLead, address: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="productName"
                    placeholder="Enter Product Name"
                    value={newLead.productName}
                    onChange={(e) =>
                      setNewLead({ ...newLead, productName: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Product Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Enter Amount"
                    value={newLead.amount}
                    onChange={(e) =>
                      setNewLead({ ...newLead, amount: Number(e.target.value) })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Company GST Number
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    placeholder="Enter GST Number"
                    value={newLead.gstNumber}
                    onChange={(e) =>
                      setNewLead({ ...newLead, gstNumber: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Lead Status
                  </label>
                  <select
                    name="status"
                    value={newLead.status}
                    onChange={(e) =>
                      setNewLead({ ...newLead, status: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                  >
                    <option value="Proposal">Proposal</option>
                    <option value="New">New</option>
                    <option value="Discussion">Discussion</option>
                    <option value="Demo">Demo</option>
                    <option value="Decided">Decided</option>
                  </select>
                </div>
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Lead Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={newLead.date}
                    onChange={(e) =>
                      setNewLead({ ...newLead, date: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Next / End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={newLead.endDate}
                    onChange={(e) =>
                      setNewLead({ ...newLead, endDate: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                  />
                </div>
                <div className="col-span-2">
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={newLead.notes}
                    onChange={(e) =>
                      setNewLead({ ...newLead, notes: e.target.value })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black resize-none"
                    placeholder="Enter Other Details"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="submit"
                  className=" label py-2 px-6 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Submitting..."
                    : editLead
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={leads}
          columns={columns}
          getRowId={(row) => row._id}
          paginationModel={{
            page: page,
            pageSize: pageSize,
          }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pagination
          pageSizeOptions={[5, 10, 20, 30, 40, 50]}
          density={density}
          onDensityChange={(newDensity) => setDensity(newDensity)}
          //   checkboxSelection
          //   disableRowSelectionOnClick
          //   slots={{ toolbar: GridToolbar }}
          filterModel={filterModel}
          onFilterModelChange={(model) => setFilterModel(model)}
          sx={{ flexGrow: 1 }}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(model) =>
            setColumnVisibilityModel(model)
          }
          sortModel={sortModel}
          onSortModelChange={(newSortModel) => {
            const filteredSortModel = newSortModel.map((item) => ({
              ...item,
              sort: item.sort ?? "asc", // Default to "asc" if undefined
            }));
            setSortModel(filteredSortModel);
          }}                  />
      </Box>
    </div>
  );
};

export default LeadPage;
