import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useStoreToast } from "./toast";
import { useStoreLoader } from "./loader";
import { useStoreDialog } from "./dialog";
import { useStoreSnackbar } from "./snackbar";
const baseUrl = "https://iesmaster.institute.org.in";
export const useStoreLogin = create(
  persist(
    (set) => ({
      user: null,
      authToken: null,
      login: async (userData) => {
        const { username, password } = userData;

        if (!username || !password) {
          useStoreSnackbar.getState().showSnackbar({
            description: "Username & Password are required",
            title: "Required",
            color: "danger",
          });
          return;
        }
        useStoreLoader.getState().setLoading(true);

        try {
          let response = await fetch(
            `${baseUrl}/api/auth/signin`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(userData),
            }
          );
          if (!response.ok) {
            useStoreSnackbar.getState().showSnackbar({
              description: "Invalid Username or password",
              title: "Invalid",
              color: "danger",
            });
            response = await response.json();
            return;
          } else {
            response = await response.json();
            set({ user: response.user, authToken: response.token });
            useStoreDialog.getState().setVisible(false);
            useStoreSnackbar.getState().showSnackbar({
              description: "You have successfully Logged In",
              title: "Successfully login",
              color: "success",
            });
          }
        } catch (error) {
          useStoreSnackbar.getState().showSnackbar({
            description: "Error in Login",
            title: error,
            color: "danger",
          });
        } finally {
          useStoreLoader.getState().setLoading(false);
        }
      },
      getLoginOtp: async (userData) => {
        return new Promise(async (resolve, reject) => {
          if (!userData.username) {
            useStoreToast
              .getState()
              .setShowToast("Mobile is required", "Invalid Input", "error");
            return;
          }
          const regex = /^(?:\+91|91)?[6-9]\d{9}$/;
          if (!regex.test(userData.username)) {
            useStoreToast
              .getState()
              .setShowToast(
                "Enter Valid Mobile Number",
                "Invalid Input",
                "error"
              );
          }
          useStoreLoader.getState().setLoading(true);

          let response;
          try {
            response = await fetch(
              `${baseUrl}/api/public/send-otp`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
              }
            );
            if (!response.ok) {
              response = await response.json();
              throw new Error(response.message);
            } else {
              response = await response.json();
              resolve(response);
            }
          } catch (error) {
            useStoreToast
              .getState()
              .setShowToast(error.message, "Error", "error");

            reject(error?.message || "Error Occured");
          } finally {
            useStoreLoader.getState().setLoading(false);
          }
        });
      },
      verifyLoginOtp: async (userData) => {
        if (!userData.otp) {
          useStoreToast
            .getState()
            .setShowToast("Otp is required", "Invalid Input", "error");
          return;
        }
        if (!userData.id) {
          useStoreToast
            .getState()
            .setShowToast("Otp id is required", "Invalid Input", "error");
          return;
        }
        if (!userData.mobile) {
          useStoreToast
            .getState()
            .setShowToast("mobile is required", "Invalid Input", "error");
          return;
        }
        if (!userData.user) {
          useStoreToast
            .getState()
            .setShowToast("user is required", "Invalid Input", "error");
          return;
        }
        useStoreLoader.getState().setLoading(true);
        let response;
        try {
          response = await fetch(
            `${baseUrl}/api/public/varify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(userData),
            }
          );
          if (!response.ok) {
            response = await response.json();
            throw new Error(response.message);
          } else {
            response = await response.json();
            set({ user: response.user, authToken: response.token });
            useStoreDialog.getState().setVisible(false);
          }
        } catch (error) {
          useStoreToast
            .getState()
            .setShowToast(error.message, "Error", "error");
        } finally {
          useStoreLoader.getState().setLoading(false);
        }
      },
      logout: () => set({ user: null, authToken: null }),
    }),
    {
      name: "bears-storage",
    }
  )
);
