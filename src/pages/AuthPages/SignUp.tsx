import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GridShape from "../../components/common/GridShape";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Checkbox from "../../components/form/input/Checkbox";
import PageMeta from "../../components/common/PageMeta";

export default function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("Client"); // "Client" or "Therapist"
  const [therapistCode, setTherapistCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [zoneId, setZoneId] = useState("UTC"); // Default to UTC

  // UI state
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});
    
    // Validate form
    const errors: Record<string, string> = {};
    
    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    }
    
    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
    }
    
    if (!password.trim()) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    if (userType === "Client" && !therapistCode.trim()) {
      errors.therapistCode = "Therapist code is required for clients";
    }
    
    // Note: inviteCode is optional for Therapists, so no validation required
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setLoading(true);

    // Prepare data for API
    const payload: any = {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password: password.trim(),
      type: userType,
      zoneId: zoneId || "UTC" // Default to UTC if not provided
    };

    // Add therapistCode only if it's provided and user is a Client
    if (therapistCode.trim() && userType === "Client") {
      payload.therapistCode = therapistCode.trim();
    }
    
    // Add inviteCode only if it's provided and user is a Therapist
    if (inviteCode.trim() && userType === "Therapist") {
      payload.inviteCode = inviteCode.trim();
    }
    
    console.log("Submitting registration with payload:", payload);

    try {
      const response = await fetch("https://api.akesomind.com/api/public/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      console.log('SignUp: Response status:', response.status);
      
      // Log the raw response text for debugging
      const responseText = await response.text();
      console.log('SignUp: Raw response:', responseText);
      
      if (response.ok) {
        // Set a flag in sessionStorage to indicate successful registration
        sessionStorage.setItem('justRegistered', 'true');
        
        // Redirect to Sign In page after a slight delay to allow state to settle
        setTimeout(() => {
          navigate("/signin");
        }, 100);
      } else {
        let errorMessage = "Sign up failed";
        try {
          // Try to parse the response as JSON if possible
          const errorData = JSON.parse(responseText);
          console.log('SignUp: Parsed error data:', errorData);
          
          // Check specifically for "User already exists" error
          if (errorData.detail === "User already exists") {
            errorMessage = "An account with this email already exists.";
            // Set a specific validation error for the email field
            setValidationErrors({
              ...validationErrors,
              email: "This email is already registered. Please sign in instead."
            });
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            // Some APIs return errors as an array
            errorMessage = errorData.errors.map((err: any) => 
              err.message || err.field + ': ' + err.defaultMessage || JSON.stringify(err)
            ).join(', ');
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (parseErr) {
          // If we can't parse the JSON, use the raw response text
          console.error('SignUp: Error parsing response:', parseErr);
          errorMessage = responseText || `Registration failed: ${response.statusText || response.status}`;
        }
        console.error('SignUp: Error response:', errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('SignUp: Error during registration:', err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
        <PageMeta
            title="AkesoMind - Registration"
            description="Register your CRM for Mental Health Specialists."
        />
        <div className="relative flex w-full min-h-screen bg-white z-1 dark:bg-gray-900">
          <div className="flex flex-col flex-1 p-6 rounded-2xl sm:rounded-none sm:border-0 sm:p-8 overflow-y-auto">
            <div className="w-full max-w-md pt-5 mx-auto sm:py-10">
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
                  Sign Up
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter your details to create an account.
                </p>
              </div>
              <div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                  {/* Example Social SignUp Buttons */}
                  <button className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                    {/* Google Icon */}
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                          d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                          fill="#4285F4"
                      />
                      <path
                          d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                          fill="#34A853"
                      />
                      <path
                          d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                          fill="#FBBC05"
                      />
                      <path
                          d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                          fill="#EB4335"
                      />
                    </svg>
                    Sign up with Google
                  </button>
                  <button className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                    {/* X Icon */}
                    <svg
                        width="21"
                        height="20"
                        viewBox="0 0 21 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="fill-current"
                    >
                      <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
                    </svg>
                    Sign up with X
                  </button>
                </div>
                <div className="relative py-3 sm:py-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                  <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                    Or
                  </span>
                  </div>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {/* First Name */}
                      <div className="sm:col-span-1">
                        <Label>
                          First Name<span className="text-error-500">*</span>
                        </Label>
                        <Input
                            type="text"
                            id="fname"
                            name="fname"
                            placeholder="Enter your first name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className={validationErrors.firstName ? "border-error-500" : ""}
                        />
                        {validationErrors.firstName && (
                          <p className="mt-1 text-xs text-error-500">{validationErrors.firstName}</p>
                        )}
                      </div>
                      {/* Last Name */}
                      <div className="sm:col-span-1">
                        <Label>
                          Last Name<span className="text-error-500">*</span>
                        </Label>
                        <Input
                            type="text"
                            id="lname"
                            name="lname"
                            placeholder="Enter your last name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className={validationErrors.lastName ? "border-error-500" : ""}
                        />
                        {validationErrors.lastName && (
                          <p className="mt-1 text-xs text-error-500">{validationErrors.lastName}</p>
                        )}
                      </div>
                    </div>
                    {/* Email */}
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
                          className={validationErrors.email ? "border-error-500" : ""}
                      />
                      {validationErrors.email && (
                        <p className="mt-1 text-xs text-error-500">
                          {validationErrors.email.includes("already registered") ? (
                            <>
                              {validationErrors.email.split(".")[0]}. 
                              <Link to="/signin" className="font-medium text-brand-500 hover:underline">
                                Sign in here
                              </Link>.
                            </>
                          ) : (
                            validationErrors.email
                          )}
                        </p>
                      )}
                    </div>
                    {/* Password */}
                    <div>
                      <Label>
                        Password<span className="text-error-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                            placeholder="Enter your password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={validationErrors.password ? "border-error-500" : ""}
                        />
                        <span
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                        >
                        {showPassword ? (
                            <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                        ) : (
                            <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                        )}
                        </span>
                      </div>
                      {validationErrors.password && (
                        <p className="mt-1 text-xs text-error-500">{validationErrors.password}</p>
                      )}
                    </div>
                    {/* User Type Selector */}
                    <div>
                      <Label>
                        User Type<span className="text-error-500">*</span>
                      </Label>
                      <select
                          value={userType}
                          onChange={(e) => setUserType(e.target.value)}
                          className="w-full p-2 border rounded"
                      >
                        <option value="Client">Client</option>
                        <option value="Therapist">Therapist</option>
                      </select>
                    </div>
                    {/* Therapist Code: Only if Client is selected */}
                    {userType === "Client" && (
                        <div>
                          <Label>
                            Therapist Code<span className="text-error-500">*</span>
                          </Label>
                          <Input
                              type="text"
                              id="therapistCode"
                              name="therapistCode"
                              placeholder="Enter therapist code"
                              value={therapistCode}
                              onChange={(e) => setTherapistCode(e.target.value)}
                              className={validationErrors.therapistCode ? "border-error-500" : ""}
                          />
                          {validationErrors.therapistCode && (
                            <p className="mt-1 text-xs text-error-500">{validationErrors.therapistCode}</p>
                          )}
                        </div>
                    )}
                    {/* Invite Code: Only if Therapist is selected */}
                    {userType === "Therapist" && (
                        <div>
                          <Label>
                            Invite Code
                          </Label>
                          <Input
                              type="text"
                              id="inviteCode"
                              name="inviteCode"
                              placeholder="Enter invite code (optional)"
                              value={inviteCode}
                              onChange={(e) => setInviteCode(e.target.value)}
                              className={validationErrors.inviteCode ? "border-error-500" : ""}
                          />
                          {validationErrors.inviteCode && (
                            <p className="mt-1 text-xs text-error-500">{validationErrors.inviteCode}</p>
                          )}
                        </div>
                    )}
                    {/* Zone ID (Optional) */}
                    <div>
                      <Label>Time Zone</Label>
                      <select
                          className="w-full p-2 border rounded text-sm text-gray-800 bg-white border-gray-300 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10"
                          value={zoneId || "UTC"}
                          onChange={(e) => setZoneId(e.target.value)}
                      >
                          <option value="UTC">UTC</option>
                          <option value="Europe/London">Europe/London</option>
                          <option value="Europe/Paris">Europe/Paris</option>
                          <option value="Europe/Berlin">Europe/Berlin</option>
                          <option value="America/New_York">America/New_York</option>
                          <option value="America/Chicago">America/Chicago</option>
                          <option value="America/Los_Angeles">America/Los_Angeles</option>
                          <option value="Asia/Tokyo">Asia/Tokyo</option>
                          <option value="Asia/Shanghai">Asia/Shanghai</option>
                          <option value="Australia/Sydney">Australia/Sydney</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Select your timezone
                      </p>
                    </div>
                    {/* Checkbox */}
                    <div className="flex items-center gap-3">
                      <Checkbox
                          className="w-5 h-5"
                          checked={isChecked}
                          onChange={setIsChecked}
                      />
                      <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                        By creating an account you agree to our{" "}
                        <span className="text-gray-800 dark:text-white/90">
                        Terms and Conditions,
                      </span>{" "}
                        and{" "}
                        <span className="text-gray-800 dark:text-white">
                        Privacy Policy
                      </span>
                      </p>
                    </div>
                    {/* Submit Button */}
                    <div>
                      <button
                          type="submit"
                          className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                          disabled={loading}
                      >
                        {loading ? "Signing Up..." : "Sign Up"}
                      </button>
                    </div>
                    {/* Error Message */}
                    {error && (
                        <div className="text-red-500 text-sm">
                          {error}
                        </div>
                    )}
                  </div>
                </form>
                <div className="mt-5">
                  <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                    Already have an account?{" "}
                    <Link
                        to="/signin"
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative items-center justify-center flex-1 hidden p-8 z-1 bg-brand-950 dark:bg-white/5 lg:flex">
            <GridShape />
            <div className="flex flex-col items-center max-w-sm">
              <Link to="/index.html" className="block mb-4">
                <img src="./images/logo/auth-logo.svg" alt="Logo" />
              </Link>
              <p className="text-center text-gray-400 dark:text-white/60">
                CRM for Mental Health Specialists
              </p>
            </div>
          </div>
        </div>
      </>
  );
}