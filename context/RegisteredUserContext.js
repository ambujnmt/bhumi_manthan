import { createContext, useContext, useState } from "react";

const RegisteredUserContext = createContext();

export const RegisteredUserProvider = ({ children }) => {
  const [registeredUserEmail, setRegisteredUserEmail] = useState("");

  // Function to set registered email in the context
  const setRegisteredUser = (email) => {
    setRegisteredUserEmail(email); // This updates the email
  };

  return (
    <RegisteredUserContext.Provider value={{ registeredUserEmail, setRegisteredUser }}>
      {children}
    </RegisteredUserContext.Provider>
  );
};

export const useRegisteredUser = () => useContext(RegisteredUserContext);
