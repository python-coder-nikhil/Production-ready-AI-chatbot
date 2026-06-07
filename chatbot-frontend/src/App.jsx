import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Index from "./pages/Index";
import PrivateRoute from "./Routes/PrivateRoute";
import PublicRoute from "./Routes/PublicRoute";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ErrorPage from "./pages/ErrorPage";
import { ConversationProvider } from "./utils/ConversationContext";

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ConversationProvider>
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/new"
              element={
                <PrivateRoute>
                  <Index />
                </PrivateRoute>
              }
            />
            <Route
              path="/chat/:chatId"
              element={
                <PrivateRoute>
                  <Index />
                </PrivateRoute>
              }
            />
            <Route path="/404" element={<ErrorPage errorCode="404" />} />
            <Route path="/401" element={<ErrorPage errorCode="401" />} />
            <Route path="/403" element={<ErrorPage errorCode="403" />} />
            <Route path="/500" element={<ErrorPage errorCode="500" />} />
            <Route path="/503" element={<ErrorPage errorCode="503" />} />
            <Route path="*" element={<ErrorPage errorCode="404" />} />
          </Routes>
        </Router>
      </ConversationProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
