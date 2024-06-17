import { useEffect, useState } from 'react';
import Tabs from '../../components/tabs/Tabs';
import Layout from '../../components/layout/Layout';
import { useDonate } from '../../context/Donate';
import axios from 'axios';
import './checkout.css';
import { Link, useSearchParams } from 'react-router-dom';
import defaultLogo from '../../assets/images/sevasangam-logo.png';
import { useAuth } from '../../context/Auth';
import getSymbolFromCurrency from 'currency-symbol-map';
import currencyCodes from 'currency-codes';


// import $ from 'jquery';
import { toast } from 'react-toastify';
import { type } from 'jquery';
const Checkout = () => {
    const api = import.meta.env.VITE_API_URL;
    const website_url = import.meta.env.VITE_WEBSITE_URL;
    const [donate, setDonate] = useDonate();
    const [temple, setTemple] = useState({});

    const [temples, setTemples] = useState([])
    const [auth] = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [currency, setCurrency] = useState(searchParams.get("currency"));
    const [currencySymbol, setCurrencySymbol] = useState(getSymbolFromCurrency(currency) || '₹');

    const currencySelectChange = (e) => {
        setCurrency(e.target.value);
        setSearchParams({ currency: e.target.value });
    }




    const fetchAllTemples = async () => {
        try {
            const response = await axios.get(`${api}/temple/get-temples`);
            if (response.data.success) {
                setTemples(response.data.data.temples);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error fetching temples:', error);
        }
    };



    const [donateUser, setDonateUser] = useState({
        name: auth.user?.name || "",
        email: auth.user?.email || "",
        phone: auth.user?.phone || ""
    });

    const [selectedPercentage, setSelectedPercentage] = useState('');
    const [customPercentage, setCustomPercentage] = useState(16);

    const handleSelectChange = (event) => {
        setSelectedPercentage(event.target.value);
        if (event.target.value !== 'other') {
            setCustomPercentage('');
        }
    };

    const handleDonateUserChange = (e) => {
        setDonateUser({ ...donateUser, [e.target.name]: e.target.value });
    }

    const handleCustomChange = (event) => {
        setCustomPercentage(event.target.value);
    };

    const handletempleToDonateMonthlyChange = (e) => {
        setDonate({ ...donate, templeId: e.target.value })
        localStorage.setItem('donate', JSON.stringify({ amount: donate.amount, templeId: e.target.value }))
        const newTemple = fetchTempleById(e.target.value)
        setTemple(newTemple)
    }

    const handletempleToDonateOnceChange = (e) => {
        setDonate({ ...donate, templeId: e.target.value })
        localStorage.setItem('donate', JSON.stringify({ amount: donate.amount, templeId: e.target.value }))
        const newTemple = fetchTempleById(e.target.value)
        setTemple(newTemple)
    }

    const fetchTemple = async () => {
        try {
            const res = await axios.get(`${api}/temple/get-temple/${donate.templeId}`);
            const { data } = res.data;
            setTemple(data);
        } catch (error) {
            console.error(error);
            // Handle error, e.g., display a toast message
        }
    };



    const fetchTempleById = async (id) => {
        try {
            const res = await axios.get(`${api}/temple/get-temple/${id}`);
            const { data } = res.data;
            setTemple(data);
        } catch (error) {
            console.error(error);
            // Handle error, e.g., display a toast message
        }
    };


    const handleDonate = async (e) => {
        e.preventDefault()
        // const { data: { key } } = await axios.get("http://www.localhost:4000/api/getkey")


        if (!donateUser.name) {
            toast.error('Name is required');
            return;
        }
        if (!donateUser.email) {
            toast.error('Email is required');
            return;
        }
        if (!donateUser.phone) {
            toast.error('Phone is required');
            return;
        }
        if (donate.amount < 1) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (donate.amount < 100) {
            toast.error('Minimum donation amount is ₹100');
            return;
        }
        if (donate.amount > 100000) {
            toast.error('Maximum donation amount is ₹100000');
            return;
        }

        try {
            // Get the order data first
            const orderResponse = await axios.post(`${api}/donation/checkout`, {
                amount: donate.amount,
                currency: currency,
                temple: donate.templeId,
                donateUser: {
                    name: donateUser.name,
                    email: donateUser.email,
                    phone: donateUser.phone,
                }
            });

            const { order } = orderResponse.data; // Extract order from the response

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: donate.amount * 100, // Corrected amount calculation
                currency: currency,
                name: "SevaSangam",
                description: `Donation for ${temple.templeName}`,
                image: defaultLogo,
                order_id: order.id,
                redirect: true,
                callback_url: `${api}/donation/payment-verification`,
                prefill: {
                    name: donateUser.name,
                    email: donateUser.email,
                    contact: donateUser.phone
                },
                notes: {
                    amount: donate.amount,
                    temple: donate.templeId,
                    donateUser: JSON.stringify(donateUser), // Store as a string
                },
                theme: {
                    "color": "var(--color-primary-color)"
                }
            };
            const razor = new window.Razorpay(options);
            razor.open();
        } catch (error) {
            console.error("Error handling donation:", error);
            toast.error('An error occurred while processing the donation. Please try again later.');
        }
    }

    const handleDonateMonthly = async (e) => {
        e.preventDefault();

        if (!donateUser.name) {
            toast.error('Name is required');
            return;
        }
        if (!donateUser.email) {
            toast.error('Email is required');
            return;
        }
        if (!donateUser.phone) {
            toast.error('Phone is required');
            return;
        }
        if (donate.amount < 1) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (donate.amount < 100) {
            toast.error('Minimum donation amount is ₹100');
            return;
        }
        if (donate.amount > 100000) {
            toast.error('Maximum donation amount is ₹100000');
            return;
        }

        try {
            // Create a subscription on the server
            const { data: { subscription } } = await axios.post(`${api}/subscription/create-subscription`, {
                amount: donate.amount,
                currency: currency,
                donationType: 'monthly',
                temple: donate.templeId,
                donateUser: {
                    name: donateUser.name,
                    email: donateUser.email,
                    phone: donateUser.phone,
                }
            }, {
                headers: {
                    Authorization: `Bearer ${auth.token}`
                }

            });
            // const currentDomain = 

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                subscription_id: subscription.id,
                name: "SevaSangam",
                description: `Subscription for ${temple.templeName}`,
                image: defaultLogo,
                redirect: false,
                callback_url: `${website_url}/temples`,
                prefill: {
                    name: donateUser.name,
                    email: donateUser.email,
                    contact: donateUser.phone
                },
                notes: {
                    amount: donate.amount,
                    temple: donate.templeId,
                    donateUser: JSON.stringify(donateUser), // Store as a string
                },
                theme: {
                    "color": "var(--color-primary-color)"
                }
            };

            const razor = new window.Razorpay(options);
            razor.open();
        } catch (error) {
            console.error('Error creating subscription:', error);
            toast.error('Failed to create subscription. Please try again.');
        }
    };

    const [setAmount] = useState('')

    const handleAddtoDonation = (e) => {
        const addedAmount = parseInt(e.target.textContent.replace(/[^\d]/g, '')); // Extract only the numeric value
        setDonate((prevDonate) => {
            const newAmount = Number(prevDonate.amount) + Number(addedAmount);
            const updatedDonation = {
                ...prevDonate,
                amount: newAmount,
                templeId: temple._id
            };
            // Save to localStorage
            localStorage.setItem('donate', JSON.stringify(updatedDonation));
            // Return the updated state
            return updatedDonation;
        });
    };

    const handleUpdateDonation = (e) => {
        setDonate({ ...donate, amount: e.target.value, templeId: temple._id })
        localStorage.setItem('donate', JSON.stringify({ amount: e.target.value, templeId: temple._id }))
        setAmount(e.target.value)
    }

    const handleUpdateAddDonation = () => {
        // Parse the custom amount as an integer


        const customAmount = parseInt(document.getElementById('addCustomAmount').value);

        // Ensure donate.amount is treated as a number
        const newAmount = Number(donate.amount) + customAmount;

        console.log(newAmount)
        if (newAmount < 1 || isNaN(newAmount)) {
            toast.error('Please enter a valid amount');
            return;
        }
        // Update the state and localStorage
        setDonate({ ...donate, amount: newAmount, templeId: temple._id });
        localStorage.setItem('donate', JSON.stringify({ amount: newAmount, templeId: temple._id }));

        // Update the amount state
        setAmount(newAmount);
    };
    useEffect(() => {
        fetchAllTemples();
    }, []);

    useEffect(() => {
        donate && fetchTemple();
    }, [donate]);

    useEffect(() => {
        setCurrencySymbol(getSymbolFromCurrency(currency) || '₹');
    }, [currency]);

    return (
        <Layout>
            <section>
                <Tabs />

                <div className='donate-once'>
                    <div className="row">
                        <div className="col-md-4">
                            <h3 style={{ fontSize: "20px" }} className='section-heading'>Add on Donation Amount</h3>
                            <div className='CurrencyContainer'>
                                <div className="currency-select">
                                    <select className="form-select" defaultValue={currency} onChange={currencySelectChange}>
                                        {
                                            currencyCodes.codes().map((code) => {
                                                return <option key={code} value={code}>{code}</option>
                                            })

                                        }
                                    </select>
                                </div>
                            </div>
                            <div className='temple-donation' style={{ boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;" }}>
                                <div style={{ gap: "10px" }} className='mt-2 my-4 d-flex flex-wrap align-items-center'>
                                    <span onClick={handleAddtoDonation} className='amount'>+ 500</span> <span onClick={handleAddtoDonation} className='amount'>+ 1000</span> <span onClick={handleAddtoDonation} className='amount'>+ 1500</span><span onClick={handleAddtoDonation} className='amount'>+ 2000</span>
                                    <input id="addCustomAmount" style={{ fontSize: "14px", padding: "4px", width: "130px", height: "35px" }} placeholder='Enter Amount' className='form-control' />
                                    <button onClick={handleUpdateAddDonation} style={{ fontSize: "14px", flex: "1", padding: "4px", width: "100%", height: "40px" }} className='btn btn-theme-primary'><i className='fa-solid fa-plus'></i></button>
                                </div>
                                <input onChange={handleUpdateDonation} value={donate.amount} style={{ fontSize: "14px", flex: "1", padding: "4px", width: "100%", height: "40px" }} placeholder='Enter Amount' className='mb-4 form-control' />

                                {temple ?
                                    (<div className='d-flex flex-wrap' style={{ background: "#eee", padding: '10px', borderRadius: "8px" }}>
                                        <div style={{ flexShrink: 0, borderRadius: "8px", overflow: "hidden", aspectRatio: "1/1", width: "50%", height: '200px' }} className="img-wrapper">
                                            <img
                                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                                src={temple.images?.templeBannerImage ? temple.images?.templeBannerImage : defaultLogo}
                                                alt="temple"
                                            />
                                        </div>
                                        <div className='px-2'>
                                            <h3 style={{ fontSize: "20px" }} className='mt-2 section-heading'>
                                                {temple?.templeName}
                                            </h3>
                                            <p style={{ fontSize: "14px", }} className='my-2'>
                                                {temple?.location?.address}, {temple?.location?.country}
                                            </p>
                                            <p style={{ fontSize: "14px", }} className='my-2'>
                                                {temple?.description?.length > 80 ? temple?.description.slice(0, 80) + '...' : temple?.description}
                                            </p>
                                        </div>
                                    </div>) : null


                                }


                                <p className='fw-bold text-primary'>Donate to Some other temple</p>
                                <select
                                    style={{ fontSize: "14px", backgroundColor: "#fff" }}
                                    className="form-select"
                                    name="templeName"

                                    onChange={handletempleToDonateMonthlyChange} // Assuming this function updates donate.templeId
                                >
                                    <option value="">Select Temple</option>
                                    {temples.map((temple) => (
                                        <option key={temple._id} value={temple._id}>{temple.templeName}</option>
                                    ))}
                                </select>

                            </div>
                        </div>
                        <div className="col-md-8">
                            <div className='mb-4 p-2' style={{ background: "#f5f5f5", padding: ' 10px ', borderRadius: "8px" }}>
                                <div className="d-flex align-items-center justify-content-center flex-wrap">
                                    <div style={{ borderRadius: "8px", overflow: "hidden", aspectRatio: "1/1", width: "160px", height: '100%' }} className="img-wrapper">
                                        <img style={{ width: "100%", height: "100%", objectFit: "contain" }} src={defaultLogo} alt="temple" />
                                    </div>
                                    <div className='p-3'>
                                        <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Incidunt accusantium asperiores placeat culpa optio repudiandae esse enim ducimus dicta voluptatum.</p>
                                        <p className='mt-1 fw-bold'>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Incidunt accusantium asperiores placeat culpa optio repudiandae esse enim ducimus dicta voluptatum.</p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center justify-content-between">
                                    <p>Support us by:</p>
                                    <div>
                                        <select
                                            value={selectedPercentage}
                                            onChange={handleSelectChange}
                                            className="form-select"
                                            style={{ marginRight: '10px', width: '160px', backgroundColor: "#fff", fontSize: "13.5px" }}
                                        >
                                            <option value="16">16% ({currencySymbol} {Math.round(donate.amount * 0.16)})</option>
                                            <option value="14">14% ({currencySymbol} {Math.round(donate.amount * 0.14)})</option>
                                            <option value="12">12% ({currencySymbol} {Math.round(donate.amount * 0.12)})</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {selectedPercentage === 'other' && (
                                            <div style={{ position: "relative", display: "inline-block", width: "160px" }}>
                                                <input
                                                    type="number"
                                                    value={customPercentage}
                                                    onChange={handleCustomChange}
                                                    placeholder="%"
                                                    className="form-control"
                                                    style={{ fontSize: "13.5px", width: '100%', paddingRight: '20px' }}
                                                />
                                                <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)" }}>%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {selectedPercentage == 'other' && customPercentage == 0 && (
                                    <div className='contribution'>
                                        <p className='mt-2 fw-bold'>By supporting Us, you are helping us reach out to more campaigns like this and scale our impact.</p>
                                        <div className='d-flex align-items-center' style={{ gap: "16px" }}>
                                            <div>Deduct 7% towards covering Sevasangams expenses (optional)</div>
                                            <div className="form-check d-flex justify-content-center align-items-center">
                                                <input defaultChecked className="form-check-input custom-checkbox" type="checkbox" id="flexCheckDefault1" />
                                                <label style={{ fontSize: "13.5px", color: "darkgrey" }} className="form-check-label" htmlFor="flexCheckDefault1"></label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ background: "#f5f5f5", padding: ' 10px ', borderRadius: "8px" }}>
                                <form>
                                    <h3 style={{ fontSize: "20px" }} className='mb-2 section-heading'>Please fill your Details</h3>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="form-group mb-3">
                                                <input value={donateUser?.name} style={{ background: "#fff", fontSize: "14px" }} type="text" className="form-control" name='name' onChange={handleDonateUserChange} id="name" placeholder="Name" />
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="form-group mb-3">
                                                <input onChange={handleDonateUserChange} value={donateUser?.email} style={{ background: "#fff", fontSize: "14px" }} name="email" type="email" className="form-control" id="email" placeholder="Email ID" />
                                            </div>
                                        </div>
                                        <div className="col-md-4">

                                            <div className="form-group mb-3">
                                                <input onChange={handleDonateUserChange} value={donateUser?.phone} style={{ background: "#fff", fontSize: "14px" }} name="phone" type="text" className="form-control" id="phone" placeholder="Mobile" />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                                <div style={{ gap: "16px" }} className='d-flex align-items-center justify-content-center flex-wrap'>
                                    <div className="form-check d-flex justify-content-center align-items-center">
                                        <input className="form-check-input custom-checkbox" type="checkbox" id="flexCheckDefault2" />
                                        <label style={{ fontSize: "13.5px", color: "darkgrey" }} className="form-check-label" htmlFor="flexCheckDefault2">
                                            Make my donations anonymous
                                        </label>
                                    </div>
                                    <div className="form-check d-flex justify-content-center align-items-center">
                                        <input className="form-check-input custom-checkbox" type="checkbox" id="flexCheckDefault3" />
                                        <label style={{ fontSize: "13.5px", color: "darkgrey" }} className="form-check-label" htmlFor="flexCheckDefault3">
                                            I want to receive donation updates on Whatsapp <i className="fa fa-whatsapp" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontSize: "13.5px", color: "darkgrey" }} className='mt-4 text-center'>By Continuing you are agreeing to <Link to='/terms-and-conditions'>Terms</Link> of use and <Link to='/privacy-policy'>Privacy Policy</Link></p>
                            <button disabled={donate.amount <= 0} onClick={handleDonate} className='btn btn-theme-primary m-3 w-100'> {donate.amount > 0 ? `Checkout (${currencySymbol} ${donate.amount})` : `Please add amount to Donate`}</button>
                        </div>
                    </div>
                </div>
                <div className="donate-monthly d-none">
                    <div className="row">

                        <div className="col-md-8 mx-auto">
                            <div className='CurrencyContainer mb-2'>
                                <div className="currency-select">
                                    <select className="form-select" defaultValue={currency} onChange={currencySelectChange}>
                                        {
                                            currencyCodes.codes().map((code) => {
                                                return <option key={code} value={code}>{code}</option>
                                            })

                                        }
                                    </select>
                                </div>
                            </div>
                            <div className='mb-4' style={{ background: "#f5f5f5", padding: ' 10px ', borderRadius: "8px" }}>
                                {temple ?
                                    (<div className='d-flex flex-wrap mb-3' style={{ background: "#eee", padding: '10px', borderRadius: "8px" }}>
                                        <div style={{ flexShrink: "0", borderRadius: "8px", overflow: "hidden", width: "200px", aspectRatio: '1/1' }} className="img-wrapper">
                                            <img
                                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                                src={temple.images?.templeBannerImage ? temple.images?.templeBannerImage : defaultLogo}
                                                alt="temple"
                                            />
                                        </div>
                                        <div className='px-4'>
                                            <h3 style={{ fontSize: "20px" }} className='mt-2 section-heading'>
                                                {temple?.templeName}
                                            </h3>
                                            <p className='my-2'>
                                                {temple?.location?.address}, {temple?.location?.country}
                                            </p>
                                            <p className='my-2'>
                                                {temple?.description}
                                            </p>
                                        </div>
                                    </div>) : null


                                }

                                {/* <div className="col-md-12">
                                    <select
                                        style={{ fontSize: "14px", backgroundColor: "#fff" }}
                                        className="form-select"
                                        name="templeName"
                                        value={temple}
                                        onChange={handletempleToDonateMonthlyChange}
                                    >
                                        <option value="">Select Temple</option>
                                        {temples.map((temple) => (

                                            <option key={temple._id} value={temple._id}>{temple.templeName}</option>
                                        ))}


                                    </select>
                                    <input onChange={handleUpdateDonation} value={donate.amount} style={{ fontSize: "14px", flex: "1", padding: "4px", width: "100%", height: "40px", backgroundColor: "#fff" }} placeholder='Monthly Donation Amount' className='mt-4 mb-3 form-control' />
                                </div> */}


                            </div>



                            <div style={{ background: "#f5f5f5", padding: ' 10px ', borderRadius: "8px" }}>
                                <form>
                                    <h3 style={{ fontSize: "20px" }} className='mb-2 section-heading'>Please fill your Details</h3>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="form-group mb-3">
                                                <input value={donateUser?.name} style={{ background: "#fff", fontSize: "14px" }} type="text" className="form-control" name='name' onChange={handleDonateUserChange} id="name" placeholder="Name" />
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="form-group mb-3">
                                                <input onChange={handleDonateUserChange} value={donateUser?.email} style={{ background: "#fff", fontSize: "14px" }} name="email" type="email" className="form-control" id="email" placeholder="Email ID" />
                                            </div>
                                        </div>
                                        <div className="col-md-4">

                                            <div className="form-group mb-3">
                                                <input onChange={handleDonateUserChange} value={donateUser?.phone} style={{ background: "#fff", fontSize: "14px" }} name="phone" type="text" className="form-control" id="phone" placeholder="Mobile" />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                                <div style={{ gap: "16px" }} className='d-flex align-items-center justify-content-center flex-wrap'>
                                    <div className="form-check d-flex justify-content-center align-items-center">
                                        <input className="form-check-input custom-checkbox" type="checkbox" id="flexCheckDefault2" />
                                        <label style={{ fontSize: "13.5px", color: "darkgrey" }} className="form-check-label" htmlFor="flexCheckDefault2">
                                            Make my donations anonymous
                                        </label>
                                    </div>
                                    <div className="form-check d-flex justify-content-center align-items-center">
                                        <input className="form-check-input custom-checkbox" type="checkbox" id="flexCheckDefault3" />
                                        <label style={{ fontSize: "13.5px", color: "darkgrey" }} className="form-check-label" htmlFor="flexCheckDefault3">
                                            I want to receive donation updates on Whatsapp <i className="fa fa-whatsapp" />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <p style={{ fontSize: "13.5px", color: "darkgrey" }} className='mt-4 text-center'>By Continuing you are agreeing to <Link to='/terms-and-conditions'>Terms</Link> of use and <Link to='/privacy-policy'>Privacy Policy</Link></p>


                            <button disabled={donate.amount <= 0} onClick={handleDonateMonthly} className='btn btn-theme-primary m-3 w-100'> {donate.amount > 0 ? `Checkout (${currencySymbol} ${donate.amount})` : `Please add amount to Donate`}</button>
                        </div>



















                    </div>
                </div>
            </section>
        </Layout >
    );
};

export default Checkout;
