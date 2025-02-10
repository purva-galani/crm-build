"use client";
import React, { useState, useEffect,useCallback  } from "react";
import axios from "axios";
import { CiEdit } from "react-icons/ci";
import { MdContactPhone, MdDelete } from "react-icons/md";

import Box from "@mui/material/Box";
import { DataGrid, GridRenderCellParams  } from "@mui/x-data-grid";
import { useToast } from "../ToastContext";
import { Button } from "@nextui-org/react";
import { Typography } from "@mui/material";

interface Contact {
  _id: string;
  companyname: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  description: string;
}

const ContactPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContact, setNewContact] = useState<Contact>({
    _id: "",
    companyname: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    description: "",
  });
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();


  const fetchContacts = useCallback(async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v1/contact/getAllContacts"
      );
      setContacts(response.data.data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  }, []);

  // Handle Edit
  const handleEdit = (contact: Contact) => {
    setEditContact(contact);
    setNewContact({ ...contact });
    setIsFormVisible(true); // Show form when editing
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    try {
      const response = await axios.delete(
        `http://localhost:8000/api/v1/contact/deleteContact/${id}`
      );
      console.log("Deleted Contact:", response.data);
      fetchContacts(); // Refresh the contact list after deletion
      showToast("Contact deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting contact:", error);
      setError("Failed to delete contact.");
      showToast("Failed to delete contact!", "error");
    }
  };

  // Handle form submission for creating or updating contacts
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (newContact._id) {
        // If we are editing an existing contact
        const response = await axios.put(
          `http://localhost:8000/api/v1/contact/updateContact/${newContact._id}`,
          newContact
        );
        console.log("Updated Contact:", response.data);
        showToast("Contact updated successfully!", "success");
      } else {
        // If we are creating a new contact
        const response = await axios.post(
          "http://localhost:8000/api/v1/contact/createContact",
          newContact
        );
        console.log("Created Contact:", response.data);
        showToast("Contact created successfully!", "success");
      }

      setNewContact({
        _id: "",
        companyname: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        gstNumber: "",
        description: "",
      });

      fetchContacts(); // Refresh contact list after operation
      setIsSubmitting(false);
      setError(null); // Reset error message
      setIsFormVisible(false); // Hide form after submission
    } catch (error) {
      console.error("Error saving contact:", error);
      setError("Failed to save contact.");
      showToast("Failed to save contact!", "error");
      setIsSubmitting(false);
    }
  };

  // Fetch contacts when the component is mounted
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Prepare columns for DataGrid
  const columns = [
    { field: "companyname", headerName: "Company Name", flex: 1 },
    { field: "name", headerName: "Customer Name", flex: 1 },
    { field: "phone", headerName: "Contact Number", flex: 1 },
    { field: "email", headerName: "Email Address", flex: 1 },
    { field: "address", headerName: "Company Address", flex: 1 },
    { field: "gstNumber", headerName: "GST Number", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      renderCell: (params: GridRenderCellParams<Contact>) => (
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
      {/* <div className="container mx-auto px-4"> */}
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        Contact Record
      </h2>
      {/* Add Task Button */}
      <div className=" mb-4">
        <Button
          className="contactbtn shadow-[0_4px_14px_0_rgb(162,0,255,39%)] hover:shadow-[0_6px_20px_rgba(162,0,255,50%)] hover:bg-[rgba(162, 0, 255, 0.9)] px-8 py-2 bg-purple-500 rounded-md text-white font-light transition duration-200 ease-linear"
          color="primary"
          //   variant="shadow"
          //   style={{ boxShadow: "0px 1px 2px 1px rgba(0,0,0)" }}
          onClick={() => {
            setNewContact({
              _id: "",
              companyname: "",
              name: "",
              phone: "",
              email: "",
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
      </div>
      {/* Popup Modal */}
      {isFormVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-opaq-sm ">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-3xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {editContact ? "Edit Contact" : "Add Contact"}
            </h3>
            {/* Form for contact submission */}
            <form onSubmit={handleSubmit} className="space-y-4  p-6 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name */}
                <div>
                  <label className=" label block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyname"
                    placeholder="Enter Company Name"
                    value={newContact.companyname}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        companyname: e.target.value,
                      })
                    }
                    className="label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>
                {/* Customer Name */}
                <div>
                  <label className=" label block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter Customer Name"
                    value={newContact.name}
                    onChange={(e) =>
                      setNewContact({ ...newContact, name: e.target.value })
                    }
                    className=" label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className=" label block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter Contact Number"
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact({ ...newContact, phone: e.target.value })
                    }
                    className=" label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="label block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    placeholder="Enter Email"
                    value={newContact.email}
                    onChange={(e) =>
                      setNewContact({ ...newContact, email: e.target.value })
                    }
                    className=" label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                {/* Company Address */}
                <div>
                  <label className=" label block text-sm font-medium text-gray-700 mb-2">
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
                    className=" label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                {/* GST Number */}
                <div>
                  <label className=" label block text-sm font-medium text-gray-700 mb-2">
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
                    className=" label w-full p-2 text-sm border border-gray-300 rounded-md text-black"
                    required
                  />
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className=" label block text-sm font-medium text-gray-700 mb-2">
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
                    className=" label w-full p-2 text-sm border border-gray-300 rounded-md text-black resize-none"
                    required
                  ></textarea>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  className="py-2 px-4 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                  onClick={() => setIsFormVisible(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className=" label py-2 px-6 bg-purple-500 text-white rounded-md hover:bg-purple-600"
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

      <Box sx={{ height: 600, width: "100%" }}>
        {contacts.length > 0 ? (
          <DataGrid
            rows={contacts}
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
            No Contacts Available.
          </Typography>
        )}
      </Box>
    </div>
  );
};

export default ContactPage;
