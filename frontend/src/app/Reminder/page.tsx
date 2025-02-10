"use client";
import Navbar from "@/components/Navbar";
import React, { useEffect, useState } from "react";
import { useToast } from '../ToastContext'
import axios from 'axios';
import { io} from 'socket.io-client';
import { FaWhatsapp, FaEnvelope, FaPhone } from "react-icons/fa"; // WhatsApp, Mail, and Phone icons
import { DataGrid, GridRenderCellParams  } from "@mui/x-data-grid"; // Import DataGrid for displaying data
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { ToastContainer } from 'react-toastify';

// Connect to the backend
const socket = io('http://localhost:8000');

interface UnpaidInvoice {
  _id: string;
  companyName: string;
  customerName: string;
  contactNumber: string;
  emailAddress: string;
  productName: string;
  remainingAmount: number;
  date: string;
  customMessage?: string; 
}
const ReminderPage: React.FC = () => {
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const { showToast } = useToast();
  const [pageSize, setPageSize] = useState<number>(10);
    const [page, setPage] = useState<number>(0); // State for the current page
  const [selectedInvoice, setSelectedInvoice] = useState<UnpaidInvoice | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch unpaid invoices from the backend
        const response = await axios.get(
          "http://localhost:8000/api/v1/invoice/getUnpaidInvoices"
        );
        if (response.data.success) {
          setUnpaidInvoices(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch the data:", error);
        setError("Failed to fetch data. Please try again.");
      }
    };
    fetchData();
  }, []);

useEffect(() => {
    // Save the pageSize and density to local storage whenever it changes
    localStorage.setItem("pageSize", pageSize.toString());
  }, [pageSize,]);

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
  // // Listen for events from the server
  // socket.on('welcome', (data) => {
  //   console.log('Server says:', data.message);
  // });

  // // Emit a test event to the server
  // socket.emit('testClient', { message: 'Hello from the client!' });

  // // Handle server response
  // socket.on('response', (data) => {
  //   console.log('Server response:', data.message);
  // });

  // Function to handle WhatsApp link generation
  const createWhatsAppLink = (invoiceId: string) => {
    const invoice = unpaidInvoices.find((invoice) => invoice._id === invoiceId);

    if (invoice) {
      const { customerName, remainingAmount, contactNumber } = invoice;

      if (!contactNumber || !customerName || !remainingAmount) {
        console.error('Missing required fields in invoice:', invoice);
        return;
      }

      const message = `Hello ${customerName},\n\nThis is a reminder to pay your outstanding invoice of ₹${remainingAmount}. Please make the payment at your earliest convenience.`;
      const encodedMessage = encodeURIComponent(message);
      const whatsAppLink = `https://wa.me/${contactNumber}?text=${encodedMessage}`;

      console.log('Generated WhatsApp Link:', whatsAppLink);

      window.location.href = whatsAppLink; // Redirect to WhatsApp
    } else {
      console.error('Invoice not found for ID:', invoiceId);
    }
  };

  const openEmailModal = (unpaidInvoice: UnpaidInvoice) => {
    setSelectedInvoice(unpaidInvoice);

    // Check if customMessage is available, otherwise fallback to a default message
    setCustomMessage(unpaidInvoice.customMessage || `Dear ${unpaidInvoice.customerName},\n\nThis is a reminder that a payment of ₹${unpaidInvoice.remainingAmount} is still pending. Kindly clear the dues within 5 days.\n\nBest regards,\n${unpaidInvoice.companyName}`);

    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedInvoice) return;
  
    try {
      // Wait for the custom message to be saved before sending the email
      const savedMessage = await handleSaveMessage(customMessage); // Ensure message is saved before proceeding
    
      // Now send the email using the latest saved message
      await axios.post(
        `http://localhost:8000/api/v1/invoice/sendEmailReminder/${selectedInvoice._id}`,
        { message: savedMessage } // Send the saved message
      );
  
      showToast(`Email sent successfully to ${selectedInvoice.emailAddress}!`, "success");
      setIsEmailModalOpen(false); // Close the modal
    } catch (error) {
      console.error("Error sending email:", error);
      showToast(`Failed to send email to ${selectedInvoice.emailAddress}.`, "error");
    }
  };
  
  
  
  const handleSaveMessage = async (updatedMessage: string) => {
    if (!selectedInvoice) return;
  
    try {
      // Save the updated message to the backend
      const response = await axios.put(
        `http://localhost:8000/api/v1/invoice/updateCustomMessage/${selectedInvoice._id}`,
        { customMessage: updatedMessage } // Use the updated message
      );
  
      // Ensure that the customMessage is updated with the response from the backend
      const savedMessage = response.data.data.customMessage; // Get the saved message from the response
      setCustomMessage(savedMessage); // Sync the state with the updated message
  
      showToast("Message saved successfully!", "success");
      return savedMessage; // Return the saved message to be used in other parts (e.g., sending email)
    } catch (error) {
      console.error("Error saving message:", error);
      showToast("Failed to save message.", "error");
    }
  };

  // Function to handle Email reminder logic
  // const sendReminderEmail = async (invoiceId: string) => {
  //   const invoice = unpaidInvoices.find((invoice) => invoice._id === invoiceId);

  //   if (invoice) {
  //     try {
  //       await axios.post(
  //         `http://localhost:8000/api/v1/invoice/sendEmailReminder/${invoiceId}`,
  //         {
  //           email: invoice.emailAddress,
  //           remainingAmount: invoice.remainingAmount,
  //           customerName: invoice.customerName,
  //         }
  //       );
  //       alert(`Reminder email sent to ${invoice.customerName}`);
  //     } catch (error) {
  //       console.error("Error sending reminder email:", error);
  //       alert("Failed to send the reminder email. Please try again.");
  //     }
  //   }
  // };

  // Function to handle Call link generation
  const createCallLink = (invoiceId: string) => {
    const invoice = unpaidInvoices.find((invoice) => invoice._id === invoiceId);

    if (invoice) {

      const callLink = `tel:8347745081}`;
      window.location.href = callLink; // Open the phone dialer
    }
  };

  const columns = [
    { field: "companyName", headerName: "Company Name", flex: 1 },
    { field: "customerName", headerName: "Customer Name", flex: 1 },
    { field: "contactNumber", headerName: "Contact Number", flex: 1 },
    { field: "emailAddress", headerName: "Email Address", flex: 1 },
    {
      field: "date",
      headerName: "Last Reminder Date",
      flex: 1,
      renderCell: (params: GridRenderCellParams<UnpaidInvoice>) => {
        const date = new Date(params.value);
        return isNaN(date.getTime()) ? "Invalid Date" : date.toISOString().split("T")[0];
      },
    },
    { field: "productName", headerName: "Product Name", flex: 1 },
    { field: "remainingAmount", headerName: "Remaining Amount (₹)", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params: GridRenderCellParams<UnpaidInvoice>) => (
        <div style={iconContainerStyle}>
          <FaWhatsapp
            style={whatsAppIconStyle}
            onClick={() => createWhatsAppLink(params.row._id)}
          />
          <FaEnvelope
            style={mailIconStyle}
            onClick={() => openEmailModal(params.row)}
          />

          <FaPhone
            style={callIconStyle}
            onClick={() => createCallLink(params.row._id)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <ToastContainer />
      <Modal open={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)}>
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 600,
      bgcolor: 'white',
      p: 4,
      borderRadius: '8px',
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
      value={customMessage} // This will show the updated message
      onChange={(e)=>setCustomMessage(e.target.value)}      // Handle changes to the message
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
        className="py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600"
        onClick={() => handleSaveMessage(customMessage)} // ✅ Correct way to call the function
      >
        Save
      </button>
      <button
        className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        onClick={handleSendEmail} // Send email button
      >
        Send
      </button>
    </div>
  </Box>
</Modal>

      <div style={containerStyle}>
        <h1 style={headerStyle}>Reminder Page</h1>
        {error && <div style={errorStyle}>{error}</div>}
        <DataGrid
          rows={unpaidInvoices}
          columns={columns}
          getRowId={(row) => row._id}
          autoHeight
          disableRowSelectionOnClick
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
          style={tableStyle}
        />
      </div>
    </>


  );
};

// Styles
const containerStyle: React.CSSProperties = {
  padding: "40px",
  maxWidth: "2000px",
  width: "100%",
  margin: "80px auto",
  color: "#000",
};

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  fontSize: "3rem",
  color: "purple",
  marginBottom: "20px",
  fontWeight: "600",
};

const errorStyle: React.CSSProperties = {
  color: "#d9534f",
  backgroundColor: "#f2dede",
  padding: "15px",
  borderRadius: "8px",
  marginBottom: "20px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "1.5rem",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  marginTop: "20px",
  overflowX: "auto",
};

const iconContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "15px",
};

const whatsAppIconStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  cursor: "pointer",
};

const mailIconStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  cursor: "pointer",
};

const callIconStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  cursor: "pointer",
};

export default ReminderPage; 