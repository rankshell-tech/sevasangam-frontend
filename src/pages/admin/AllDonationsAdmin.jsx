import axios from "axios";
import React, { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/Auth";
import { CSVLink } from 'react-csv';
import HashLoader from "react-spinners/HashLoader";
import compress from "compress-base64";
import LoadingSpinner from "../../components/loadingSpinner/LoadingSpinner";

const AllDonationsAdmin = () => {
  const api = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();
  const [auth] = useAuth();
  const [donations, setDonations] = useState([]);

  const [temples, setTemples] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState({
    temple: searchParams.get("temple") || "",
    payId: searchParams.get("payId") || "",
    templeCreatedBy: searchParams.get("templeCreatedBy") || "",
    donateUser: searchParams.get("donateUser") || "",
    paymentMethod: searchParams.get("paymentMethod") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  });


  const resetFilters = () => {
    setFilters(null)
  }
  const fetchAllDonationsAdmin = async () => {
    try {
      const res = await axios.post(`${api}/donation/fetch-donations-by-admin`, {
        user_id: auth.user._id,
      });
      console.log(res);
      setDonations(res.data.donations);
    } catch (error) {
      console.error(error);
      // Handle error, e.g., display a toast message
    }
  };

  const handleUpload80GCertificate = async (id, e) => {
    e.preventDefault();
    try {


      const res = await axios.post(
        `${api}/donation/upload-80-certificate`,
        { id, certificate: file }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchAllDonationsAdmin();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate80GCertificate = async (id, e) => {
    e.preventDefault();
    try {

      const res = await axios.put(
        `${api}/donation/update-80-certificate`,
        { id: id, certificate: file }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        fetchAllDonationsAdmin();
      }
    } catch (error) {
      console.error(error);
    }
  };

  function convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.onload = (event) => {
        resolve(event.target.result);
      };

      fileReader.readAsDataURL(file);

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  }



  const handleFileChange = async (e) => {

    const selectedFile = e.target.files[0];
    try {
      setImgLoading(true);

      setFilePreview(URL.createObjectURL(selectedFile));


      const compressedImage = await convertToBase64(selectedFile);
      setFile(compressedImage);
      console.log("done for PDF")


    } catch (error) {
      console.log(error);
    } finally {
      setImgLoading(false);
    }
  };


  // Function to handle scroll event
  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    if (scrollTop + clientHeight >= scrollHeight - 5 && !loading) {
      fetchAllDonationsAdmin(); // Fetch more temples when scrolled to the bottom
    }
  };

  // Add event listener when component mounts
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll); // Remove event listener on unmount
  }, [loading]);

  // Fetch temples when filters or sortOption change
  useEffect(() => {
    fetchAllDonationsAdmin(true);
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // const handleSortOption = (option) => {
  //     setSortOption(option);
  // };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const newSearchParams = new URLSearchParams();

    // Check if there are any filter values or sort options
    const hasFilterValues = Object.values(filters).some((value) => value);

    if (hasFilterValues) {
      for (const key in filters) {
        if (filters[key]) {
          newSearchParams.set(key, filters[key]);
        }
      }
      setSearchParams(newSearchParams);
      window.scrollTo(0, 0);
      navigate({
        search: newSearchParams.toString(),
      });
    } else {
      // If neither filters nor sort option are set, clear the search parameters
      setSearchParams("");
      window.scrollTo(0, 0);
      navigate({
        search: "",
      });
    }
  };

  const getUniqueObjects = (array, key) => {
    const uniqueKeys = new Set();
    return array.filter((item) => {
      const keyValue = item[key];
      if (!uniqueKeys.has(keyValue)) {
        uniqueKeys.add(keyValue);
        return true;
      }
      return false;
    });
  };
  const fetchAllTemples = async () => {
    try {
      const res = await axios.get(`${api}/temple/get-temples`);
      setTemples(res.data.data.temples);
      // const creators = temples.map((temple) => temple.createdBy);
      // const uniqueCreators = getUniqueObjects(creators, "_id");
      // setTempleCreator(uniqueCreators);
    } catch (error) {
      console.error(error);
      // Handle error, e.g., display a toast message
    }
  };

  // CSV Data Preparation
  const csvData = donations.map((donation, index) => {
    const formattedDate = new Date(donation.created_at * 1000).toLocaleDateString("en-GB");
    const donateUser = donation.donateUser ? JSON.parse(donation.donateUser) : { name: "Anonymous", email: "", phone: "" };
    const temple = temples.find(temp => temp._id === donation.temple)?.templeName || "Unknown";
    return {
      "S. No": index + 1,
      "Payment Id": donation.id,
      "Temple": temple,
      "Date of Donation": formattedDate,
      "Donation by User": `${donateUser.name} (${donateUser.email}, ${donateUser.phone})`,
      "Amount": donation.currency !== "INR" ? `${donation.currency} ${donation.amount}` : `₹ ${donation.amount}`,
      "Payment Method": donation.method,
      "80G Certificate": donation.certificate ? "Available" : "Not Available"
    };
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      await fetchAllDonationsAdmin();
      await fetchAllTemples();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout>
      <section>
        <div className="section-heading">All Donations</div>
        <div className="filter-container my-4">
          <form className="row g-4" onSubmit={handleFilterSubmit}>
            <div className="col-md-2">
              <select
                className="form-select"
                name="temple"
                value={filters.temple}
                onChange={handleFilterChange}
              >
                <option value="">Select Temple</option>
                {temples.map((temple, index) => (
                  <option key={index} value={temple._id}>
                    {temple.templeName}
                  </option>
                ))}
              </select>
            </div>
            {/* <div className="col-md-3">
              <select
                className="form-select"
                name="temple"
                value={filters.templeCreatedBy}
                onChange={handleFilterChange}
              >
                <option value="">Select Temple Created By</option>
                {templeCreator &&
                  templeCreator.map((creator, index) => (
                    <option key={index} value={creator._id}>
                      {creator.name}
                    </option>
                  ))}
              </select>
            </div> */}

            <div className="col-md-2">
              <input
                type="text"
                className="form-control"
                name="donateUser"
                placeholder="Donate User"
                value={filters.donateUser}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <input
                type="text"
                className="form-control"
                name="payId"
                placeholder="Payment Id"
                value={filters.payId}
                onChange={handleFilterChange}
              />
            </div>

            <div className="col-md-2">
              <select
                className="form-select"
                name="paymentMethod"
                value={filters.paymentMethod}
                onChange={handleFilterChange}
              >
                <option value="">Select Payment Method</option>
                {paymentMethod.map((method, index) => (
                  <option key={index} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="mx-2">Date From</label>
              <input
                type="date"
                className="form-control"
                name="dateFrom"
                placeholder="Date From"
                value={filters.dateFrom}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <label className="mx-2">Date To</label>
              <input
                type="date"
                className="form-control"
                name="dateTo"
                placeholder="Date To"
                value={filters.dateTo}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-1">
              <div className="d-flex justify-content-end m-0 p-0">
                <button type="submit" className="btn btn-theme-primary">
                  <i className="fa-solid fa-filter"></i>
                </button>
              </div>
            </div>
          </form>
        </div>
        <div className="d-flex justify-content-end">
          <CSVLink
            data={csvData}
            filename={"donations.csv"}
            className="btn btn-theme-primary mb-3"
          >
            <i className="fa-solid fa-file-excel"></i> Download as CSV
          </CSVLink>
        </div>

        <div className="table-responsive">
          <table className="table table-light table-bordered table-striped">
            <thead>
              <tr>
                <td>
                  <p className="fw-bold text-primary">S. No</p>
                </td>
                <td>
                  <p className="fw-bold text-primary">Payment Id</p>
                </td>
                <td>
                  <p className="fw-bold text-primary">Temple</p>
                </td>

                <td>
                  <p className="fw-bold text-primary">Date of Donation</p>
                </td>
                <td>
                  <p className="fw-bold text-primary">Donation by User</p>
                </td>
                <td>
                  <p className="fw-bold text-primary">Amount</p>
                </td>
                <td>
                  <p className="fw-bold text-primary">Payment Method</p>
                </td>
                <td>
                  <p className="fw-bold text-primary">80G Certificate</p>
                </td>
              </tr>
            </thead>
            <tbody>
              {donations &&
                donations.map((donation, index) => {
                  // const formattedDate = new Date(
                  //   donation.created_at * 1000
                  // ).toLocaleDateString("en-GB");
                  const donateUser = donation.donateUser
                    ? JSON.parse(donation.donateUser)
                    : null;


                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{donation.razorpay_payment_id}</td>
                      <td>
                        {
                          temples.find(
                            (temp) => temp._id === donation.temple
                          )?.templeName
                        }
                      </td>

                      <td>{new Date(donation.date).toDateString()}</td>
                      {donateUser !== null ? (
                        <td>{`${donateUser.name} (${donateUser.email}, ${donateUser.phone}) `}</td>
                      ) : (
                        <td>Anonymous</td>
                      )}
                      <td>
                        {donation.currency !== "INR" ? donation.currency : "₹"}{" "}
                        {donation.amount}
                      </td>
                      <td>{donation.method}</td>
                      <td>
                        {donation.is80CertificateRequested ? (
                          <>
                            {donation.certificate ? (
                              <>
                                <div className="file-preview">
                                  {/* <a
                                    className="fw-bold"
                                    style={{ color: "green", textDecoration: "underline" }}
                                    target="_blank"
                                    // rel="noopener noreferrer"
                                    href={donation.certificate}
                                  >
                                    View Certificate
                                  </a> */}
                                  <a
                                    className="fw-bold"
                                    style={{ color: "green", textDecoration: "underline" }}
                                    target="_blank"
                                    // rel="noopener noreferrer"
                                    href={donation.certificate} download
                                  >
                                    Download Certificate & View
                                  </a>
                                </div>
                                <div className="fw-bold text-danger">Request Received Again</div>
                                <form
                                  onSubmit={(e) => handleUpdate80GCertificate(donation._id, e)}
                                >
                                  <input
                                    onChange={handleFileChange}
                                    type="file"
                                  />
                                  <button
                                    type="submit"
                                    className="m-2 btn btn-theme-primary"
                                    title="View Temple"
                                  >
                                    Update Certificate
                                  </button>
                                  {filePreview && (
                                    <div className="file-preview">
                                      {/* <a
                                        className="fw-bold"
                                        style={{ color: "green", textDecoration: "underline" }}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        href={filePreview}
                                      >
                                        View Preview
                                      </a> */}
                                      <a
                                        className="fw-bold"
                                        style={{ color: "green", textDecoration: "underline" }}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        href={filePreview} download
                                      >
                                        Preview Certificate
                                      </a>
                                    </div>
                                  )}
                                </form>

                              </>
                            ) : (
                              <>
                                <form
                                  onSubmit={(e) => handleUpload80GCertificate(donation._id, e)}
                                >
                                  <label className="mb-2" style={{ color: "red" }}>
                                    80G Certificate Requested:
                                  </label>
                                  <input
                                    placeholder="upload certificate"
                                    onChange={handleFileChange}
                                    type="file"
                                  />
                                  <button
                                    disabled={!file}
                                    type="submit"
                                    className="m-2 btn btn-theme-primary"
                                  >
                                    Upload
                                  </button>
                                </form>
                                {filePreview && (
                                  <div className="file-preview">
                                    <a
                                      className="fw-bold"
                                      style={{ color: "green", textDecoration: "underline" }}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      href={filePreview}
                                    >
                                      View Preview
                                    </a>
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {donation.certificate ? (
                              <div className="file-preview">
                                {/* <a
                                  className="fw-bold"
                                  style={{ color: "green", textDecoration: "underline" }}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  href={donation.certificate}
                                >
                                  View Certificate
                                </a> */}
                                <a
                                  className="fw-bold"
                                  style={{ color: "green", textDecoration: "underline" }}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  href={donation.certificate} download
                                >
                                  Download Uploaded Certificate
                                </a>
                              </div>
                            ) : (
                              <div>No request</div>
                            )}
                          </>
                        )}
                      </td>

                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>


      {
        imgLoading && (
          <LoadingSpinner text={"Have Patience, Loading your Pdf."} />
        )
      }

      {loading && (
        <section className="d-flex m-auto">
          <HashLoader color={"#ff395c"} />
        </section>
      )}

    </Layout>
  );
};

export default AllDonationsAdmin;
