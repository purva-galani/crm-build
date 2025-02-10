"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { MdCancel } from 'react-icons/md';
import Image from "next/image";

interface Owner {
  _id: string;
  logo: string;
  companyName: string;
  ownerName: string;
  contactNumber: string;
  emailAddress: string;
  website: string;
  businessRegistration: "Sole proprietorship" | "One person Company" | "Partnership" | "Private Limited";
  companyType: string;
  employeeSize: "1-10" | "11-50" | "51-100" | ">100";
  panNumber: string;
  documentType: "GST Number" | "UdhayamAadhar Number" | "State Certificate" | "Certificate of Incorporation";
  gstNumber: string;
  udhayamAadhar: string;
  stateCertificate: string;
  incorporationCertificate: string;
}

const OwnersListPage: React.FC = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editOwner, setEditOwner] = useState<Owner | null>(null); // State for editing an owner
  const [isEditing, setIsEditing] = useState<boolean>(false); // Toggle for form visibility

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/v1/owner/getAllOwners");
        setOwners(response.data.data);
      } catch (error) {
        console.error("Failed to fetch owners",error);
      } finally {
        setLoading(false);
      }
    };

    fetchOwners();
  }, []);

  useEffect(() => {
    const emailFromStorage = localStorage.getItem("userEmail");
    if (emailFromStorage) {
      const filteredData = owners.filter((owner) => owner.emailAddress === emailFromStorage);
      setFilteredOwners(filteredData);
    }
  }, [owners]);

  const handleEditClick = (owner: Owner): void => {
    setEditOwner(owner);
    setIsEditing(true);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (editOwner) {
      const { name, value } = e.target;
      setEditOwner((prev) => {
        if (!prev) return null; // Ensure prev is not null
        return {
          ...prev,
          [name]: value as keyof Owner,
        };
      });
    }
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editOwner) {
      try {
        await axios.put(`http://localhost:8000/api/v1/owner/updateOwner/${editOwner._id}`, editOwner);
        setIsEditing(false);
        setEditOwner(null);
        // After updating, fetch the updated list of owners
        const response = await axios.get("http://localhost:8000/api/v1/owner/getAllOwners");
        setOwners(response.data.data);
        setFilteredOwners(response.data.data.filter((owner: { emailAddress: string | null; }) => owner.emailAddress === localStorage.getItem("userEmail")));
      } catch (error) {
        console.error("Failed to update owner",error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">

      {isEditing && editOwner ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-center">Edit Owner</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  placeholder="Enter Company Name"
                  value={editOwner.companyName}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-black"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ownerName" className="text-sm font-medium text-gray-700">
                  Owner Name
                </label>
                <input
                  type="text"
                  name="ownerName"
                  id="ownerName"
                  placeholder="Enter Owner Name"
                  value={editOwner.ownerName}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-black"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactNumber" className="text-sm font-medium text-gray-700">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="contactNumber"
                  id="contactNumber"
                  placeholder="Enter Contact Number"
                  value={editOwner.contactNumber}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-black"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="emailAddress" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="emailAddress"
                  id="emailAddress"
                  placeholder="Enter Email Address"
                  value={editOwner.emailAddress}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-black cursor-not-allowed"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="website" className="text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="text"
                  name="website"
                  id="website"
                  placeholder="Enter Website"
                  value={editOwner.website}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-black"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="businessRegistration" className="text-sm font-medium text-gray-700">
                  Business Registration
                </label>
                <select
                  name="businessRegistration"
                  id="businessRegistration"
                  value={editOwner.businessRegistration}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-black"
                >
                  <option value="Sole proprietorship">Sole proprietorship</option>
                  <option value="One person Company">One person Company</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Private Limited">Private Limited</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="companyType" className="text-sm font-medium text-gray-700">
                  Company Type
                </label>
                <input
                  type="text"
                  name="companyType"
                  id="companyType"
                  placeholder="Enter Company Type"
                  value={editOwner.companyType}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-black"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="employeeSize" className="text-sm font-medium text-gray-700">
                  Employee Size
                </label>
                <select
                  name="employeeSize"
                  id="employeeSize"
                  value={editOwner.employeeSize}
                  onChange={handleFormChange}
                  className="w-full p-3 border border-gray-300 rounded-md text-black"
                >
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-100">51-100</option>
                  <option value=">100">{`>`}100</option>
                </select>
              </div>

              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">Document Type</label>
                <input
                  type="text"
                  value={editOwner.documentType}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-black cursor-not-allowed"
                />
              </div>

              {editOwner.documentType === "GST Number" && (
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">GST Number</label>
                  <input
                    type="text"
                    value={editOwner.gstNumber}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-black cursor-not-allowed"
                  />
                </div>
              )}
              {editOwner.documentType === "UdhayamAadhar Number" && (
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Udhayam Aadhar</label>
                  <input
                    type="text"
                    value={editOwner.udhayamAadhar}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-black cursor-not-allowed"
                  />
                </div>
              )}
              {editOwner.documentType === "State Certificate" && (
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">State Certificate</label>
                  <input
                    type="text"
                    value={editOwner.stateCertificate}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-black cursor-not-allowed"
                  />
                </div>
              )}
              {editOwner.documentType === "Certificate of Incorporation" && (
                <div className="form-group">
                  <label className="text-sm font-medium text-gray-700">Incorporation Certificate</label>
                  <input
                    type="text"
                    value={editOwner.incorporationCertificate}
                    readOnly
                    className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-black cursor-not-allowed"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">Pan Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={editOwner.panNumber}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-md bg-gray-100 text-black cursor-not-allowed"
                  required
                />
              </div>

              {/* Add other fields as necessary */}
            </div>

            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-300"
              >
                Edit Profile 
              </button>
              <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setEditOwner(null);
          }}
          className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-300"
        >
          Cancel
        </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="container mx-auto p-4" >
  <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Owner Profile</h1>
  
  <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6">
 
    {filteredOwners.length > 0 ? (
      filteredOwners.map((owner) => (
        <div key={owner._id} className="border border-gray-200 rounded-lg shadow-lg p-6 bg-white hover:shadow-xl transition-shadow duration-300">
          <button
                type="button"
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-red-500"
              >
                <MdCancel size={24} />
              </button>
          <div className="flex items-center justify-center mb-6">
            {owner.logo ? (
              <Image src={owner.logo} alt="Logo" className="w-24 h-24 object-contain rounded-full border border-gray-300" />
            ) : (
              <div className="w-24 h-24 bg-gray-300 flex items-center justify-center text-gray-700 rounded-full border border-gray-300">
                No Logo
              </div>
            )}
          </div>

          <div className="space-y-3 text-gray-700">
            <p className="text-lg font-medium"><strong>Company Name:</strong> {owner.companyName}</p>
            <p><strong>Owner Name:</strong> {owner.ownerName}</p>
            <p><strong>Email:</strong> {owner.emailAddress}</p>
            <p><strong>Contact:</strong> {owner.contactNumber}</p>
            <p>
              <strong>Website:</strong>{" "}
              <a href={owner.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">
                {owner.website}
              </a>
            </p>
            <p><strong>Business Registration:</strong> {owner.businessRegistration}</p>
            <p><strong>Company Type:</strong> {owner.companyType}</p>
            <p><strong>Employee Size:</strong> {owner.employeeSize}</p>
            <p><strong>PAN Number:</strong> {owner.panNumber}</p>

            {owner.documentType === "GST Number" && <p><strong>GST Number:</strong> {owner.gstNumber}</p>}
            {owner.documentType === "UdhayamAadhar Number" && <p><strong>Udhayam Aadhar:</strong> {owner.udhayamAadhar}</p>}
            {owner.documentType === "State Certificate" && <p><strong>State Certificate:</strong> {owner.stateCertificate}</p>}
            {owner.documentType === "Certificate of Incorporation" && (
              <p><strong>Incorporation Certificate:</strong> {owner.incorporationCertificate}</p>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => handleEditClick(owner)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      ))
    ) : (
      <p className="text-center text-gray-600 text-lg">No owners found for the given email.</p>
    )}
  </div>
</div>

      )}
    </div>
  );
};

export default OwnersListPage;