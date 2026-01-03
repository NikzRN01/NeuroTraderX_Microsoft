
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "../services/api";

export function useAuth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(username, password);
      
      // Save auth state
      localStorage.setItem("authenticated", "true");
      localStorage.setItem("userId", response.user_id.toString());
      localStorage.setItem("isNewUser", "false");
      
      toast.success("Successfully signed in!");
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      await authApi.register(username, password);
      
      // After successful registration, log the user in
      const loginResponse = await authApi.login(username, password);
      
      // Save auth state
      localStorage.setItem("authenticated", "true");
      localStorage.setItem("userId", loginResponse.user_id.toString());
      localStorage.setItem("isNewUser", "true");
      
      toast.success("Account created successfully!");
      navigate("/onboarding");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    // Clear auth state
    localStorage.removeItem("authenticated");
    localStorage.removeItem("userId");
    localStorage.removeItem("isNewUser");
    
    toast.success("You have been signed out");
    navigate("/landing");
  };

  const updateUserPreferences = async (preferences: any) => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User not authenticated");
      
      await authApi.updatePreferences(parseInt(userId), preferences);
      
      // Update new user status
      localStorage.setItem("isNewUser", "false");
      
      toast.success("Preferences updated successfully!");
      navigate("/");
    } catch (error) {
      console.error("Update preferences error:", error);
      toast.error("Failed to update preferences");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    signIn,
    signUp,
    signOut,
    updateUserPreferences,
  };
}
