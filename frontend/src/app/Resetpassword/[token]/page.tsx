"use client";

import React, { useState, useEffect} from "react";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import axios from "axios";
import { useToast } from "../../ToastContext";
import { cn } from "@/lib/utils";
import { useRouter, useParams } from "next/navigation";
import { IconEye, IconEyeOff, IconLoader } from "@tabler/icons-react";

export default function ResetPassword() {
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [passwordReset, setPasswordReset] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // Added loading state
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordMessage, setPasswordMessage] = useState<string>("");

  // Simulate loading effect on initial render
  useEffect(() => {
    setTimeout(() => setLoading(false), 1000); // Simulated delay
  }, []);

  // Load last selected form type on mount
  useEffect(() => {
    const savedFormState = localStorage.getItem("formState");
    if (savedFormState) {
      const { passwordReset } = JSON.parse(savedFormState);
      setPasswordReset(passwordReset);
    }
  }, []);

    // Save current form state whenever it changes
  useEffect(() => {
    localStorage.setItem("formState", JSON.stringify({ passwordReset }));
  }, [passwordReset]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    // Check if the password meets the strong password criteria
    if (!isPasswordStrong(password)) {
      showToast("Password does not meet the requirements", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/v1/user/reset-password/${token}`,
        { password }
      );

      if (response.data.success) {
        setPasswordReset(true);
      } else {
        showToast(response.data.message || "Password reset failed", "error");
      }
    } catch (error) {
      console.error("Failed to reset password",error);
      showToast("Failed to reset password","error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordStrong = (password: string): boolean => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[\W_]/.test(password);

    return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      setPasswordMessage("Password must be at least 8 characters long.");
    } else if (!/[A-Z]/.test(password)) {
      setPasswordMessage("Password must contain at least one uppercase letter.");
    } else if (!/[a-z]/.test(password)) {
      setPasswordMessage("Password must contain at least one lowercase letter.");
    } else if (!/[0-9]/.test(password)) {
      setPasswordMessage("Password must contain at least one number.");
    } else if (!/[\W_]/.test(password)) {
      setPasswordMessage("Password must contain at least one special character.");
    } else {
      setPasswordMessage("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            {loading ? (
        <div className="flex items-center justify-center">
          <IconLoader className="animate-spin text-gray-600 dark:text-gray-300" size={50} />
        </div>
      ) : (
      <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-8 md:p-8 shadow-input bg-white dark:bg-black">
        {passwordReset ? (
          <div className="text-center">
            <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
              Password successfully reset!
            </h2>
            <p className="text-neutral-600 text-sm mt-2 dark:text-neutral-300">
              Your password has been changed successfully!
            </p>
            <p
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mt-4"
              onClick={() => router.push("/")}
            >
              Back to Login
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
              Reset Password
            </h2>
            <p className="text-neutral-600 text-sm mt-2 dark:text-neutral-300">
              Enter your new password below.
            </p>
            <form onSubmit={handleResetPassword} className="my-8">
              {/* New Password */}
              <LabelInputContainer className="mb-4">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    placeholder="Enter new password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validatePassword(e.target.value);
                    }}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <IconEye size={20} /> : <IconEyeOff size={20} />}
                  </button>
                </div>
                {passwordMessage && (
                  <p className="text-sm text-red-500 mt-1">{passwordMessage}</p>
                )}
              </LabelInputContainer>

              {/* Confirm Password */}
              <LabelInputContainer className="mb-8">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    placeholder="Confirm New Password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <IconEye size={20} /> : <IconEyeOff size={20} />}
                  </button>
                </div>
              </LabelInputContainer>

              <button
                className="bg-gradient-to-br from-black to-neutral-600 block w-full text-white rounded-md h-10 font-medium shadow-lg"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
      )}
    </div>
  );
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};