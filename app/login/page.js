"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Input, Button } from "antd";
import { useRouter } from "next/navigation";
import coreAxios from "@/utils/axiosInstance";
import { useState } from "react";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const Login = () => {
  const router = useRouter();
  const [buttonLoading, setButtonLoading] = useState(false);

  const validationSchema = Yup.object({
    loginID: Yup.string().required("User ID is required"),
    password: Yup.string()
      .min(4, "Password must be at least 4 characters")
      .required("Password is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true);
    setButtonLoading(true);
    try {
      const response = await coreAxios.post(`auth/login`, values);

      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userInfo", JSON.stringify(response.data.user));
        router.push("/dashboard");
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setSubmitting(false);
      setButtonLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Left Section with Branding */}
      <div
        className="relative flex w-full md:w-1/2 items-center justify-center p-6 md:p-0"
        style={{ backgroundColor: "#2B7490" }}>
        <div className="absolute inset-0 bg-black opacity-20 z-0"></div>
        <div className="z-10 text-center text-white px-4 md:px-10 space-y-3 md:space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">Welcome to HOKTOK</h1>
          <h3 className="text-xl md:text-2xl font-semibold">Admin Panel</h3>
          <p className="text-base md:text-lg font-light">
            Comprehensive management system for your HOKTOK platform
          </p>
        </div>
        <div className="absolute bottom-5 left-5 text-white z-10 hidden md:block">
          <p className="font-semibold">HOKTOK Management System</p>
          <p>Version 1.0</p>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 py-12 px-8 md:px-16">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg relative">
          <div
            className="absolute inset-0 border-2 border-transparent rounded-lg bg-clip-border p-1 z-[-1]"
            style={{ background: "#2B7490" }}></div>
          <div className="bg-white rounded-lg p-8">
            <h2 className="text-3xl font-semibold text-center text-gray-800 mb-8">
              Admin Login
            </h2>
            <Formik
              initialValues={{ loginID: "", password: "" }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}>
              {({ isSubmitting }) => (
                <Form className="space-y-6">
                  <div>
                    <label
                      htmlFor="loginID"
                      className="block text-gray-700 font-medium mb-2">
                      User ID
                    </label>
                    <Field
                      name="loginID"
                      type="text"
                      as={Input}
                      prefix={<UserOutlined />}
                      placeholder="Enter your User ID"
                      className="p-4 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent w-full"
                      size="large"
                    />
                    <ErrorMessage
                      name="loginID"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-gray-700 font-medium mb-2">
                      Password
                    </label>
                    <Field
                      name="password"
                      type="password"
                      as={Input.Password}
                      prefix={<LockOutlined />}
                      placeholder="Enter your password"
                      className="p-4 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent w-full"
                      size="large"
                    />
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={buttonLoading}
                    className="w-full py-4 text-white text-lg rounded-lg"
                    style={{
                      backgroundColor: "#2B7490",
                      borderColor: "#2B7490",
                    }}>
                    Login
                  </Button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
