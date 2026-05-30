import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const Signup = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState({
    email: "",
    password: "",
    username: "",
  });
  const { email, password, username } = inputValue;
  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInputValue({
      ...inputValue,
      [name]: value,
    });
  };

  const handleError = (err) =>
    toast.error(err, {
      position: "bottom-left",
    });
  const handleSuccess = (msg) =>
    toast.success(msg, {
      position: "bottom-right",
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(
        "/signup",
        {
          ...inputValue,
        }
      );
      const { success, message } = data;
      if (success) {
        handleSuccess(message);
        setTimeout(() => {
          window.location.href = process.env.REACT_APP_DASHBOARD_URL || "http://localhost:3000";
        }, 2000);
      } else {
        handleError(message);
      }
    } catch (error) {
      console.log(error);
      const errorMessage = error.response?.data?.message || "Something went wrong. Please try again.";
      handleError(errorMessage);
    }
    setInputValue({
      ...inputValue,
      email: "",
      password: "",
      username: "",
    });
  };

  return (
    <div className='container py-5 mt-5'>
        <div className='row justify-content-center'>
            <div className='col-lg-5 col-md-8'>
                <div className='ao-card p-5' style={{ background: '#fff' }}>
                    <h1 className='display-6 text-center mb-4' style={{ fontWeight: 800 }}>Signup now</h1>
                    <form onSubmit={handleSubmit}>
                        <div className='mb-4'>
                            <label htmlFor="email" className="form-label">Email address</label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                placeholder="Enter your email"
                                onChange={handleOnChange}
                                className="form-control"
                                required
                            />
                        </div>
                        <div className='mb-4'>
                            <label htmlFor="username" className="form-label">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={username}
                                placeholder="Enter your username"
                                onChange={handleOnChange}
                                className="form-control"
                                required
                            />
                        </div>
                        <div className='mb-4'>
                            <label htmlFor="password" className="form-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                placeholder="Enter your password"
                                onChange={handleOnChange}
                                className="form-control"
                                required
                            />
                        </div>
                        <button type="submit" className="hero-cta w-100 mt-3">Submit</button>
                        <p className="mt-4 text-center text-muted small">
                            Already have an account? <Link to="/login">Login</Link>
                        </p>
                    </form>
                    <ToastContainer />
                </div>
            </div>
        </div>
    </div>
  );
};

export default Signup;