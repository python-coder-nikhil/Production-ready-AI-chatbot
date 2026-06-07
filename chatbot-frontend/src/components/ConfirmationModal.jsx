import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

function ConfirmationModal({
  show,
  handleClose,
  onConfirm,
  message,
  title,
  type,
}) {
  useEffect(() => {
    function handleKeyPress(e) {
      if (show && e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
      if (show && e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    }

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [show, onConfirm, handleClose]);

  if (!show) return null;

  const typeStyles = {
    warning: {
      icon: "text-amber-500",
      bg: "bg-amber-50",
      button: "bg-amber-600 hover:bg-amber-700",
      border: "border-amber-200",
    },
    danger: {
      icon: "text-red-500",
      bg: "bg-red-50",
      button: "bg-red-600 hover:bg-red-700",
      border: "border-red-200",
    },
    info: {
      icon: "text-blue-500",
      bg: "bg-blue-50",
      button: "bg-blue-600 hover:bg-blue-700",
      border: "border-blue-200",
    },
  };

  const currentType = typeStyles[type];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={handleClose}
      />

      <div
        className={`relative confirmation-modal-bg rounded-xl shadow-xl max-w-md w-full border ${currentType.border} animate-in zoom-in-95 duration-200`}
      >
        <div
          className={`flex items-center justify-between p-4 ${currentType.bg} rounded-t-xl dark-mode-bg`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${currentType.bg}`}>
              <AlertTriangle className={currentType.icon} size={20} />
            </div>
            <h4 className="text-sm font-semibold confirmation-modal-title">
              {title}
            </h4>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg transition-all duration-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 h-auto">
          <p
            className="text-center leading-relaxed mb-6 whitespace-pre-line custom-font-size-only"
            style={{ margin: "10px 20px 0 20px" }}
          >
            {message}
          </p>

          <div
            className="flex gap-4 justify-between"
            style={{ margin: "20px" }}
          >
            <button
              onClick={handleClose}
              className="flex-1 rounded-lg border custom-border transition-all duration-200 font-semibold text-xs max-w-30 custom-font-size-12"
              style={{ borderRadius: "10px", padding: "12px 0px" }}
            >
              Cancel
            </button>
            <button
              style={{ borderRadius: "10px", padding: "12px 0px" }}
              onClick={onConfirm}
              className={`flex-1 rounded-lg font-medium ${currentType.button} active:scale-95 transition-all duration-200 font-semibold text-xs max-w-30 custom-font-size-12 text-white`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
