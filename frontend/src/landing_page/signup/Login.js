import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState({
    email: "",
    password: "",
  });
  const { email, password } = inputValue;
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
      position: "bottom-left",
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(
        "/login",
        {
          ...inputValue,
        }
      );
      console.log(data);
      const { success, message } = data;
      if (success) {
        handleSuccess(message);
        setTimeout(() => {
          window.location.href = "http://localhost:3000"; // Go to dashboard
        }, 1000);
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
    });
  };

  return (
    <div className='container py-5 mt-5'>
        <div className='row justify-content-center'>
            <div className='col-lg-5 col-md-8'>
                <div className='ao-card p-5' style={{ background: '#fff' }}>
                    <h1 className='display-6 text-center mb-4' style={{ fontWeight: 800 }}>Login to ArthaOdha</h1>
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
                            Don't have an account? <Link to="/signup">Signup</Link>
                        </p>
                    </form>
                    <ToastContainer />
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;
