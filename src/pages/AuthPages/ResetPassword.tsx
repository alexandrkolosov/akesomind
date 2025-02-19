import React, { useState } from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router-dom"; // Prefer react-router-dom for proper routing hooks
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import PageMeta from "../../components/common/PageMeta";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
          "https://api.akesomind.com/api/public/user/request-password-reset",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
          }
      );

      if (response.ok) {
        setMessage("Reset link sent to your email.");
      } else {
        // Attempt to extract error message from the response
        const data = await response.json();
        setError(data.message || "Failed to send reset link.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
        <PageMeta
            title="React.js Reset Password Dashboard | TailAdmin - Next.js Admin Dashboard Template"
            description="Reset your password by receiving a reset link via email."
        />
        <div className="relative flex w-full h-screen overflow-hidden z-1">
          <div className="flex flex-1 flex-col bg-white p-6 dark:bg-white/[0.03] sm:p-8">
            <div className="w-full max-w-md pt-10 mx-auto">
              <Link
                  to="/"
                  className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg
                    className="stroke-current"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                >
                  <path
                      d="M12.7083 5L7.5 10.2083L12.7083 15.4167"
                      stroke=""
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  />
                </svg>
                Back to dashboard
              </Link>
            </div>
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
              <div className="mb-5 sm:mb-8">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                  Forgot Your Password?
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter the email address linked to your account, and we’ll send
                  you a link to reset your password.
                </p>
              </div>
              <div>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-5">
                    {/* Email Field */}
                    <div>
                      <Label>
                        Email<span className="text-error-500">*</span>
                      </Label>
                      <Input
                          type="email"
                          id="email"
                          name="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {/* Submit Button */}
                    <div>
                      <button
                          type="submit"
                          className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                          disabled={loading}
                      >
                        {loading ? "Sending..." : "Send Reset Link"}
                      </button>
                    </div>
                    {/* Success or Error Messages */}
                    {message && (
                        <div className="text-green-500 text-sm">{message}</div>
                    )}
                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}
                  </div>
                </form>
                <div className="mt-5">
                  <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                    Wait, I remember my password...{" "}
                    <Link
                        to="/signin"
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Click here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative items-center justify-center flex-1 hidden p-8 z-1 bg-brand-950 dark:bg-white/5 lg:flex">
            {/* Common Grid Shape */}
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link to="/" className="block mb-4">
                <img src="./images/logo/auth-logo.svg" alt="Logo" />
              </Link>
              <p className="text-center text-gray-400 dark:text-white/60">
                CRM For Mental Health Specialists
              </p>
            </div>
          </div>
        </div>
      </>
  );
}