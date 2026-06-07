import { Home, RefreshCw, ArrowLeft } from "lucide-react";
import { ERROR_TYPES } from "../utils/errorType";

const flatColorMap = {
  blue: "bg-blue-500 text-blue-600",
  red: "bg-red-500 text-red-600",
  yellow: "bg-yellow-500 text-yellow-600",
  purple: "bg-purple-500 text-purple-600",
  orange: "bg-orange-500 text-orange-600",
};

const ErrorPage = ({ errorCode = "404" }) => {
  const errorData = ERROR_TYPES[errorCode] || ERROR_TYPES["404"];
  const Icon = errorData.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 ">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl/30 p-10 text-center">
        <div
          style={{ marginTop: "20px" }}
          className={`mx-auto w-24 h-24 flex items-center justify-center rounded-full ${
            flatColorMap[errorData.color]
          } mb-6`}
        >
          <Icon className="w-12 h-12 text-white" />
        </div>

        {/* Error Code */}
        <h1 className="text-7xl font-black text-gray-900 mb-2">
          {errorData.code}
        </h1>

        {/* Error Title */}
        <h2
          className={`text-2xl font-semibold mb-4 ${
            flatColorMap[errorData.color].split(" ")[1]
          }`}
        >
          {errorData.title}
        </h2>

        <p className="text-gray-600 text-base max-w-md mx-auto mb-10 leading-relaxed">
          {errorData.message}
        </p>

        <div className="flex flex-wrap justify-center gap-6 error-buttons">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium shadow-sm transition p-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium shadow-sm transition p-3"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>

          {/* Home Button */}
          <button
            onClick={() => (window.location.href = "/")}
            className={`flex items-center gap-2 px-6 py-3 text-white font-medium shadow-md transition bg-${errorData.color}-600 hover:bg-${errorData.color}-700 p-3`}
          >
            <Home className="w-5 h-5" />
            Home Page
          </button>
        </div>

        {/* Support Link */}
        <p className="text-gray-500 text-sm mt-10">
          Need help?{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default ErrorPage;
