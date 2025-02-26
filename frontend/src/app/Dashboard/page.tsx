"use client";
import Navbar from "@/components/Navbar";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  Rectangle,
  XAxis,
} from "recharts";
import React, { useEffect, useMemo, useState } from "react";
import reactElementToJSXString from "react-element-to-jsx-string";
import { toast } from "sonner";
import { ButtonsCard } from "@/components/ui/tailwindcss-buttons";
import { SiGoogleanalytics } from "react-icons/si";
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/react";
import axios from "axios";
import { DataGrid, GridRenderCellParams } from "@mui/x-data-grid";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { MdCancel } from "react-icons/md";
import Image from "next/image";

interface ButtonData {
  code?: string;
  component: React.ReactNode;
}

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
  }),
}));

const task = [
  { field: "subject", headerName: "Subject", flex: 1 },
  { field: "relatedTo", headerName: "RelatedTo", flex: 1 },
  { field: "name", headerName: "Name", flex: 1 },
  { field: "dueDate", headerName: "Due Date", flex: 1 },
];

const complaint = [
  { field: "complainerName", headerName: "Customer Name", flex: 1 },
  { field: "contactNumber", headerName: "Contact Number", flex: 1 },
  { field: "subject", headerName: "Subject", flex: 1 },
  { field: "caseStatus", headerName: "Case Status", flex: 1 },
  { field: "priority", headerName: "Priority", flex: 1 },
  {
    field: "date",
    headerName: "Date",
    flex: 1,
    renderCell: (params: GridRenderCellParams<{ date: string }>) => {  // ✅ Properly typed
      const date = new Date(params.value); // Convert to Date object
      if (isNaN(date.getTime())) {
        return "Invalid Date"; // Handle invalid date
      }
      return date.toISOString().split("T")[0]; // Format as YYYY/MM/DD
    },
  },
  { field: "time", headerName: "Time", flex: 1 },
];

const reminder = [
  { field: "companyName", headerName: "Company Name", flex: 1 },
  { field: "customerName", headerName: "Customer Name", flex: 1 },
  {
    field: "date",
    headerName: "Last Reminder Date",
    flex: 1,
    renderCell: (params: GridRenderCellParams<{ date: string }>) => {
      const date = new Date(params.value);
      return isNaN(date.getTime())
        ? "Invalid Date"
        : date.toISOString().split("T")[0];
    },
  },
  { field: "amount", headerName: "Remaining Amount (₹)", flex: 1 },
];

const chartData: Record<string, string> = {
  Proposal: "#2662d9",
  New: "#e23670",
  Discussion: "#e88c30",
  Demo: "#af57db",
  Decided: "#2eb88a",
};

const chartConfig = {
  visitors: {
    label: "Leads",
  },
  Proposal: {
    label: "Proposal",
    color: "hsl(var(--chart-1))",
  },
  New: {
    label: "New",
    color: "hsl(var(--chart-2))",
  },
  Demo: {
    label: "Demo",
    color: "hsl(var(--chart-3))",
  },
  Discussion: {
    label: "Discussion",
    color: "hsl(var(--chart-4))",
  },
  Decided: {
    label: "Decided",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

const titleColors = {
  Proposal: "#FF7F3E",
  New: "#FF7F3E",
  Discussion: "#FF7F3E",
  Demo: "#FF7F3E",
  Decided: "#FF7F3E",
};

interface Lead {
  _id: string;
  companyName: string;
  customerName: string;
  amount: number;
  productName: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  notes: string;
  date: string;
  endDate: string;
  status: string;
  isActive: boolean;
}
interface Task {
  _id: string;
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

interface UnpaidInvoice {
  _id: string;
  companyName: string;
  customerName: string;
  contactNumber: string;
  emailAddress: string;
  productName: string;
  remainingAmount: number;
  date: string;
}

interface CategorizedLeads {
  [key: string]: 
  Lead[];
}
interface ApiResponse {
  success: boolean;
  data: Lead[];
  message?: string; // Optional field
}


export default function Home() {
  // const formatDate = (dateString: string): string => {
  //   const date = new Date(dateString);
  //   return date.toISOString().split("T")[0];
  // };
  const backdrops: Array<"transparent" | "opaque" | "blur"> = ["opaque"];
  const [categorizedLeads, setCategorizedLeads] = useState<CategorizedLeads>(
    {}
  );

  const [leads, setLeads] = useState<Lead[]>([]);
  console.log("leads", leads);

  const [isLoading, setIsLoading] = useState(true);
  const allStatuses: Array<keyof typeof titleColors> = ["Proposal", "New", "Discussion", "Demo", "Decided"];
  const [tasks, setTasks] = useState<Task[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]); // Array of complaints
  const dynamicChartData = useMemo(() => {
    return Object.entries(categorizedLeads).map(([status, leads]) => ({
      browser: status,
      visitors: leads.length,
      fill: chartData[status] || "#ccc",
    }));
  }, [categorizedLeads]);

  const [selectedChart, setSelectedChart] = useState("Pie Chart");
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLead(null);
  };

  const renderChart = () => {
    if (selectedChart === "Pie Chart") {
      return (
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Leads Chart</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[383px] [&_.recharts-text]:fill-background"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="browser" />}
                />
                <Pie
                  data={dynamicChartData}
                  dataKey="visitors"
                  label
                  nameKey="browser"
                  className="cursor-pointer"
                  style={{ color: "#FF7F3E" }}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="browser" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }

    if (selectedChart === "Radial Chart") {
      return (
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Radial Chart - Label</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <RadialBarChart
                data={dynamicChartData}
                startAngle={-90}
                endAngle={380}
                innerRadius={30}
                outerRadius={110}
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="browser" />}
                />
                <RadialBar dataKey="visitors" background>
                  <LabelList
                    position="insideStart"
                    dataKey="browser"
                    className="fill-white capitalize mix-blend-luminosity"
                    fontSize={11}
                  />
                </RadialBar>
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }

    if (selectedChart === "Bar Chart") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Lead Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart accessibilityLayer data={dynamicChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="browser"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) =>
                    chartConfig[value as keyof typeof chartConfig]?.label
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="visitors"
                  strokeWidth={2}
                  radius={8}
                  activeBar={({ ...props }) => {
                    return (
                      <Rectangle
                        {...props}
                        fillOpacity={0.8}
                        stroke={props.payload.fill}
                        strokeDasharray={4}
                        strokeDashoffset={4}
                      />
                    );
                  }}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }
  };
  const copy = (button: ButtonData) => {
      if (button.code) {
      copyToClipboard(button.code);
      return;
    }
    const  buttonString = reactElementToJSXString(button.component);
    console.log("buttonString", buttonString);

    if (buttonString) {
      const textToCopy = buttonString;
      copyToClipboard(textToCopy);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Text copied to clipboard:", text);
        toast.success("Copied to clipboard");
      })
      .catch((err) => {
        console.error("Error copying text to clipboard:", err);
        toast.error("Error copying to clipboard");
      });
  };

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/lead/getAllLeads");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data: ApiResponse = await response.json(); // Use ApiResponse type
    
        if (data.success) {
          setLeads(data.data);
    
          const categorized: CategorizedLeads = data.data.reduce((acc, lead) => {
            if (!acc[lead.status]) acc[lead.status] = [];
            acc[lead.status].push(lead);
            return acc;
          }, {} as CategorizedLeads);
    
          setCategorizedLeads(categorized);
        } else {
          console.error("Error fetching leads:", data.message || "Unknown error"); // Avoids undefined access
        }
      } catch (error) {
        console.error("Error fetching leads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v1/task/getAllTasks"
      );
      setTasks(response.data.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/api/v1/complaint/getAllComplaints"
      );
      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchComplaints();
  }, []);

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
      }
    };
    fetchData();
  }, []);


  const handleDragStart = (
    e: React.DragEvent,
    lead: Lead,
    fromStatus: string
  ) => {
    e.dataTransfer.setData("lead", JSON.stringify(lead));
    e.dataTransfer.setData("fromStatus", fromStatus);
  };

  const handleDrop = async (e: React.DragEvent, toStatus: string) => {
    e.preventDefault();
    const lead: Lead = JSON.parse(e.dataTransfer.getData("lead"));
    const fromStatus: string = e.dataTransfer.getData("fromStatus");

    // Prevent dropping into the same status
    if (fromStatus === toStatus) {
      console.warn("Cannot drop into the same category.");
      return;
    }

    setCategorizedLeads((prev) => {
      const fromLeads = prev[fromStatus].filter((l) => l._id !== lead._id);
      const toLeads = [
        ...(prev[toStatus] || []),
        { ...lead, status: toStatus },
      ];
      return {
        ...prev,
        [fromStatus]: fromLeads,
        [toStatus]: toLeads,
      };
    });

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/lead/updateLeadStatus",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            leadId: lead._id,
            status: toStatus,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        console.error("Error updating lead status:", data.message);
        setCategorizedLeads((prev) => {
          const toLeads = prev[toStatus].filter((l) => l._id !== lead._id);
          const fromLeads = [...(prev[fromStatus] || []), lead];
          return {
            ...prev,
            [fromStatus]: fromLeads,
            [toStatus]: toLeads,
          };
        });
      }
    } catch (error) {
      console.error("Error updating lead status:", error);
      setCategorizedLeads((prev) => {
        const toLeads = prev[toStatus].filter((l) => l._id !== lead._id);
        const fromLeads = [...(prev[fromStatus] || []), lead];
        return {
          ...prev,
          [fromStatus]: fromLeads,
          [toStatus]: toLeads,
        };
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const calculateTotal = (leadsData: Lead[]): number =>
    leadsData.reduce((total, lead) => total + lead.amount, 0);

  const totalLeadsCount = Object.values(categorizedLeads).flat().length;
  const totalDealsAmount = Object.values(categorizedLeads).reduce(
    (total, leads) => total + calculateTotal(leads),
    0
  );

  const content = (
    <div className="popoverContent">
      <PopoverContent
        className="w-[350px] h-[300px] backdrop-blur bg-opacity-50"
        style={{ zIndex: 100 }}
      >
        {(titleProps) => (
          <div className="summeryBox  px-1 py-2 w-full">
            <p className="overp font-bold text-foreground" {...titleProps}>
              Overall Summary
            </p>
            <br />
            <div className="flex  flex-col gap-2 w-full">
              <p className="summaryp font-bold text-foreground">Total Leads</p>
              <p className="summaryp2 font-bold text-foreground">
                {totalLeadsCount}
              </p>
              <p className="summaryp font-bold text-foreground">Total Amount</p>
              <p className="summaryp2 font-bold text-foreground">
                ₹{totalDealsAmount}
              </p>
            </div>
          </div>
        )}
      </PopoverContent>
    </div>
  );

  const buttons = [
    {
      name: "Sketch",
      description: "Sketch button for your website",

      component: (
        <button
          className="px-4 py-2 border border-black bg-transparent text-black dark:border-white relative group transition duration-200"
          style={{ borderRadius: "1rem" }}
        >
          <div
            className="absolute -bottom-2 -right-2 bg-yellow-300 h-full w-full -z-10 group-hover:bottom-0 group-hover:right-0 transition-all duration-200"
            style={{ borderRadius: "1rem" }}
          />
          <span className="relative">
            <SiGoogleanalytics />
          </span>
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="icon-container">
        <Navbar/>
        <div className="flex flex-wrap gap-4">
          {backdrops.map((backdrop) => (
            <Popover
              key={backdrop}
              showArrow
              backdrop={backdrop}
              offset={10}
              placement="bottom"
              className="backdrop-blur-sm"
            >
              <PopoverTrigger>
                <div>
                  {buttons.map((button, idx) => (
                    <ButtonsCard key={idx} onClick={() => copy(button)}>
                      {button.component}
                    </ButtonsCard>
                  ))}
                </div>
              </PopoverTrigger>
              {content}
            </Popover>
          ))}
        </div>
      </div>

      <div className="mainContainer" style={{ marginTop: "8rem" }}>
        <br />
        <div
          className="cardContainer"
          style={{
            maxHeight: "auto"
          }}
        >
          {allStatuses.map((status) => {
            const leadsData = categorizedLeads[status] || [];
            const totalAmount = calculateTotal(leadsData);
            const titleColor = titleColors[status] || "#ccc";

            return (
              <div
                key={status}
                className="card"
                onDrop={(e) => handleDrop(e, status)}
                onDragOver={handleDragOver}
              >
                <h3
                  className="cardTitle"
                  style={{ backgroundColor: titleColor }}
                >
                  {status}
                </h3>
                {leadsData.length === 0 ? (
                  <p className="totalleadcard">No leads available</p>
                ) : (
                  <>
                    <div className="totalleadcard">
                      <p className="leadSummary">
                        <strong>Total Leads:</strong> {leadsData.length}
                      </p>
                      <p className="leadSummary">
                        <strong>Total Amount:</strong> ₹{totalAmount}
                      </p>
                    </div>
                    <div className="leadList scrollable">
                      {leadsData.map((lead, index) => (
                        <div
                          key={lead._id || `lead-${index}`}
                          className="leadCard"
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead, status)}
                          onClick={() => handleLeadClick(lead)} // Open detailed view on click
                        >
                          <div className="leadInfo">
                            <p>
                              <strong>Company Name:</strong> {lead.companyName}
                            </p>
                            <p>
                              <strong>Product:</strong> {lead.productName}
                            </p>
                            <p>
                              <strong>Next Date:</strong>{" "}
                              {/* {formatDate(lead.endDate)} */}
                            </p>
                          </div>
                          <div className="leadAmount">
                            <strong>Amount:</strong> ₹{lead.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {isLoading && (
          <div className="loader">
            <Image src="/1500px.png" alt="Loading..." className="loader-image" width={150} height={150} />
            <p>Loading...</p>
          </div>
        )}
      </div>

      {isModalOpen && selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="modal-content p-6 rounded-md shadow-lg w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Lead Details
              </h2>
              <button
                onClick={closeModal}
                className="text-xl font-semibold text-gray-600 hover:text-red-600"
              >
                <MdCancel />
              </button>
            </div>
            <div className="form-content grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
              {Object.entries(selectedLead)
                .filter(
                  ([key]) =>
                    !["_id", "isActive", "createdAt", "updatedAt"].includes(key)
                ) // Exclude _id, isActive, createdAt, updatedAt
                .map(([key, value]) => (
                  <p key={key} className="mb-4">
                    <strong>
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </strong>{" "}
                    {key === "date" || key === "endDate"
                      ? value
                        ? new Date(value).toLocaleDateString()
                        : "N/A"
                      : value || "N/A"}
                  </p>
                ))}
            </div>
          </div>
        </div>
      )}

      <Box sx={{ width: "100%" }}>
        <Grid container rowSpacing={5} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Item>
              <div>
                <FormControl fullWidth>
                  <InputLabel id="chart-select-label">Select Chart</InputLabel>
                  <Select
                    labelId="chart-select-label"
                    value={selectedChart}
                    onChange={(e) => setSelectedChart(e.target.value)}
                    label="Select Chart"
                  >
                    <MenuItem value="Pie Chart">Pie Chart</MenuItem>
                    <MenuItem value="Radial Chart">Radial Chart</MenuItem>
                    <MenuItem value="Bar Chart">Bar Chart</MenuItem>
                  </Select>
                </FormControl>

                {/* Render Selected Chart */}
                <div className="mt-4">{renderChart()}</div>
              </div>
            </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Item>
              <h1
                style={{
                  textAlign: "center",
                  marginBottom: "1rem",
                  marginTop: "1rem",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "black",
                }}
              >
                Task
              </h1>
              {tasks.length > 0 ? (
                <DataGrid
                  rows={tasks}
                  columns={task}
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
                  No Tasks Available.
                </Typography>
              )}
            </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Item>
              <h1
                style={{
                  textAlign: "center",
                  marginBottom: "1rem",
                  marginTop: "1rem",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "black",
                }}
              >
                Complaint
              </h1>
              {complaints.length > 0 ? (
                <DataGrid
                  rows={complaints}
                  columns={complaint}
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
                  No complaints Available.
                </Typography>
              )}
            </Item>
          </Grid>
          <Grid item xs={12} sm={6} md={6} lg={6}>
            <Item>
              <h1
                style={{
                  textAlign: "center",
                  marginBottom: "1rem",
                  marginTop: "1rem",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "black",
                }}
              >
                Reminder
              </h1>
              {tasks.length > 0 ? (
                <DataGrid
                  rows={unpaidInvoices}
                  columns={reminder}
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
                  No Reminders Available.
                </Typography>
              )}
            </Item>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
