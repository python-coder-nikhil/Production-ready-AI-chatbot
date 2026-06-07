import { createContext, useContext, useState } from "react";

const ConversationContext = createContext();

export const ConversationProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);

  return (
    <ConversationContext.Provider value={{ conversations, setConversations }}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversations = () => useContext(ConversationContext);
