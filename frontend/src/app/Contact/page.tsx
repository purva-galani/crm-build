"use client";
import Navbar from "@/components/Navbar";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../ToastContext";
import { CiEdit } from "react-icons/ci";
import { MdCancel, MdContactPhone, MdDelete } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { DataGrid, GridRenderCellParams   } from "@mui/x-data-grid";
import { useCallback } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@nextui-org/react";
import { Input } from "@nextui-org/react";
import { FaSearch } from "react-icons/fa";


import { io} from 'socket.io-client';
const socket = io('http://localhost:8000');
interface Contact {
  _id: string;
  companyName: string;
  customerName: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  gstNumber: string;
  description: string;
}

const ContactPage: React.FC = () => {
  const [pageSize, setPageSize] = useState<number>(10);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // Store the search term
  const [newContact, setNewContact] = useState<Contact>({
    _id: "",
    companyName: "",
    customerName: "",
    contactNumber: "",
    emailAddress: "",
    address: "",
    gstNumber: "",
    description: "",
  });
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const [page, setPage] = useState<number>(0);

  const filterContacts = (contacts: Contact[], searchTerm: string) => {
    return contacts.filter((contact) => {
      const {
        companyName = "",
        customerName = "",
        contactNumber = "",
        emailAddress = "",
        address = "",
        gstNumber = "",
        description = "",
      } = contact; // Use default empty strings for undefined properties

      return (
        companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contactNumber.includes(searchTerm) ||
        emailAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gstNumber.includes(searchTerm) ||
        description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const fetchContacts = useCallback(async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v1/contact/getAllContacts"
      );
      setContacts(response.data.data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      showToast("Failed to fetch contacts!", "error");
    }
  }, [showToast]);
  
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);
  

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
  
  const handleEdit = (contact: Contact) => {
    setEditContact(contact);
    setNewContact({ ...contact });
    setIsFormVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(
        `http://localhost:8000/api/v1/contact/deleteContact/${id}`
      );
      fetchContacts();
      showToast("Contact deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting contact:", error);
      setError("Failed to delete contact.");
      showToast("Failed to delete contact!", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = newContact._id
        ? `http://localhost:8000/api/v1/contact/updateContact/${newContact._id}`
        : "http://localhost:8000/api/v1/contact/createContact";
      const method = newContact._id ? axios.put : axios.post;
      await method(url, newContact);
      showToast(
        `Contact ${newContact._id ? "updated" : "created"} successfully!`,
        "success"
      );

      // Optimistic update
      if (!newContact._id) {
        setContacts([...contacts, newContact]);
      } else {
        setContacts(
          contacts.map((contact) =>
            contact._id === newContact._id ? newContact : contact
          )
        );
      }

      setNewContact({
        _id: "",
        companyName: "",
        customerName: "",
        contactNumber: "",
        emailAddress: "",
        address: "",
        gstNumber: "",
        description: "",
      });
      fetchContacts();
      setIsFormVisible(false);
    } catch (error) {
      console.error("Error saving contact:", error);
      showToast("Failed to save contact!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createWhatsAppLink = (contact: Contact) => {
    // Check if contact and contactNumber are valid
    if (!contact || !contact.contactNumber) {
      alert("Contact information or phone number is missing.");
      return;
    }

    // Ensure phoneNumber starts with "91" or add it
    const phoneNumber = contact.contactNumber.startsWith("91")
      ? contact.contactNumber
      : `91${contact.contactNumber}`;

    // Remove non-numeric characters from the phone number
    const validPhoneNumber = phoneNumber.replace(/\D/g, "");

    // Validate the cleaned phone number
    if (!/^\d{10,15}$/.test(validPhoneNumber)) {
      alert("Invalid phone number.");
      return;
    }

    // Construct the message
    let message;
    if (contact.customerName) {
      message = `Hello ${contact.customerName},\n\nThis is a reminder to pay your outstanding invoice. Please make the payment at your earliest convenience.`;
    } else {
      message = `Hello,\n\nThis is a reminder to pay your outstanding invoice.`;
    }

    // Encode the message to handle special characters
    const encodedMessage = encodeURIComponent(message);

    // Generate the WhatsApp link
    const whatsAppLink = `https://wa.me/${validPhoneNumber}?text=${encodedMessage}`;

    // Redirect to the WhatsApp link
    window.location.href = whatsAppLink;
  };

  const createCallLink = (contactNumber: string) => {
    const validPhoneNumber = contactNumber.replace(/\D/g, "");
    if (!/^\+?\d{10,15}$/.test(validPhoneNumber)) {
      alert("Invalid phone number.");
      return;
    }
    window.location.href = `tel:${validPhoneNumber}`;
  };

  const openEmailModal = (contact: Contact) => {
    setSelectedContact(contact);
    // setCustomMessage(`Dear ${contact.name},\n\nThis is a reminder that a payment of Rs. 1000 is still pending. Kindly clear the dues within 5 days.\nThank you.\n\nBest regards,\n${contact.companyname}`); //Pre-filled message
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedContact) return;
    try {
      await axios.post(
        `http://localhost:8000/api/v1/contact/sendEmailReminder/${selectedContact._id}`,
        { message: customMessage }
      );
      showToast(
        `Email sent successfully to ${selectedContact.emailAddress}!`,
        "success"
      );
      setIsEmailModalOpen(false);
    } catch (error) {
      console.error("Error sending email:", error);
      showToast(
        `Failed to send email to ${selectedContact.emailAddress}.`,
        "error"
      );
    }
  };

  const columns = [
    { field: "companyName", headerName: "Company Name", flex: 1 },
    { field: "customerName", headerName: "Customer Name", flex: 1 },
    { field: "contactNumber", headerName: "Contact Number", flex: 1 },
    { field: "emailAddress", headerName: "Email Address", flex: 1 },
    { field: "address", headerName: "Company Address", flex: 1 },
    { field: "gstNumber", headerName: "GST Number", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Contact>) => (
        <div className="relative flex justify-end items-center gap-2">
          <button
            className="py-3 text-gray-600 rounded hover:bg-gray-200"
            onClick={() => handleEdit(params.row)}
            aria-label="Edit Contact"
          >
            <CiEdit size={18} />
          </button>
          <button
            className="py-3 text-red-600 rounded hover:bg-red-100"
            onClick={() => handleDelete(params.row._id)}
            aria-label="Delete Contact"
          >
            <MdDelete size={18} />
          </button>
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="solid"
                className="text-black transition-all duration-150"
              >
                <BsThreeDotsVertical className="text-black text-gray-600 rounded hover:bg-gray-200" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu className="bg-white border border-gray-300 shadow-lg rounded-md py-2 w-40">
              {/* <DropdownItem key="reminder">Reminder</DropdownItem>{" "} */}
              {/* Add reminder logic here if needed */}
              <DropdownItem
                key="call"
                onClick={() => createCallLink(params.row.contactNumber)}
                >
                Call
              </DropdownItem>
              <DropdownItem
                key="mail"
                onClick={() => openEmailModal(params.row)}
              >
                Email
              </DropdownItem>
              <DropdownItem
                key="whatsup"
                onClick={() => createWhatsAppLink(params.row)}
              >
                WhatsApp
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
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
      <div className="mb-4">
        <Button
          className="contactbtn shadow-[0_4px_14px_0_rgb(162,0,255,39%)] hover:shadow-[0_6px_20px_rgba(162,0,255,50%)] hover:bg-[rgba(162, 0, 255, 0.9)] px-8 py-2 bg-purple-500 rounded-md text-white font-light transition duration-200 ease-linear"
          color="primary"
          onClick={() => {
            setNewContact({
              _id: "",
              companyName: "",
              customerName: "",
              contactNumber: "",
              emailAddress: "",
              address: "",
              gstNumber: "",
              description: "",
            });
            setEditContact(null); // Reset editTask
            setIsFormVisible(true); // Toggle form visibility
          }}
        >
          Add
          <MdContactPhone
            style={{ height: "20px", width: "20px", color: "#ff9b31" }}
          />
        </Button>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "1rem",
            marginLeft: "30%",
          }}
        >
          <Input
            placeholder="Type to search..."
            size="sm"
            startContent={<FaSearch size={18} />}
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Update the search term
            style={{
              maxWidth: "300px",
              height: "40px",
              textAlign: "left",
            }}
          />
        </div>
      </div>

      {isFormVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-opaq-sm">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {editContact ? "Edit Contact" : "Add Contact"}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    placeholder="Enter Company Name"
                    value={newContact.companyName}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        companyName: e.target.value,
                      })
                    }
                    className="w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    placeholder="Enter Customer Name"
                    value={newContact.customerName}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        customerName: e.target.value,
                      })
                    }
                    className="w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="contactNumber"
                    placeholder="Enter Contact Number"
                    value={newContact.contactNumber}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        contactNumber: e.target.value,
                      })
                    }
                    className="w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="emailAddress"
                    placeholder="Enter Email"
                    value={newContact.emailAddress}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        emailAddress: e.target.value,
                      })
                    }
                    className="w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter Address"
                    value={newContact.address}
                    onChange={(e) =>
                      setNewContact({ ...newContact, address: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    placeholder="Enter GST Number"
                    value={newContact.gstNumber}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        gstNumber: e.target.value,
                      })
                    }
                    className="w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newContact.description}
                    placeholder="Enter Description"
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2 text-sm border border-gray-300 rounded-md text-black resize-none"
                    required
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="submit"
                  className="py-2 px-6 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Submitting..."
                    : editContact
                    ? "Update Contact"
                    : "Create Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {error && (
        <div className="mt-4 text-red-600 text-sm text-center">{error}</div>
      )}

      <Modal open={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "white",
            p: 4,
            borderRadius: "8px",
            boxShadow: 24,
          }}
        >
          <h3 className="text-xl font-semibold mb-4">Send Email</h3>
          <textarea
            id="message"
            name="message"
            rows={6}
            cols={50}
            required
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded-md text-black resize-none"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              className="py-2 px-4 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              onClick={() => setIsEmailModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={handleSendEmail}
            >
              Send
            </button>
          </div>
        </Box>
      </Modal>

      <Box
        sx={{
          height: 600,
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DataGrid
          rows={filterContacts(contacts, searchTerm)}
          columns={columns}
          getRowId={(row) => row._id}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pagination
          pageSizeOptions={[5, 10, 20, 30, 40, 50]}
          sx={{ flexGrow: 1 }}
        />
      </Box>
    </div>
  );
};

export default ContactPage;
