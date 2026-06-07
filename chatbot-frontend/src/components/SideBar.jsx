import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "../components/ConfirmationModal";
import SearchModal from "../components/SearchUserChatModal";
import { searchApi } from "../api/ChatbotApis";

function getDateLabel(timestamp) {
  if (!timestamp) return "Recent";
  const now = new Date();
  const date = new Date(timestamp);
  const nowDayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const dateDayStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
  const diffDays = Math.floor(
    (nowDayStart - dateDayStart) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "Last 7 days";
  return date.toLocaleDateString();
}

function SideBar() {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState({
    keyword_conversations: [],
    keyword_messages: [],
    semantic_messages: [],
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [userdata, setUserdata] = useState(null);
  const [theme, setTheme] = useState("light");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [confirmationType, setConfirmationType] = useState("");
  const [onConfirm, setOnConfirm] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const handleCloseConfirm = () => setShowConfirm(false);

  const handleLogout = () => {
    setConfirmationMessage("Are you sure you want to logout?");
    setConfirmationTitle("Logout");
    setConfirmationType("warning");

    setOnConfirm(() => () => {
      localStorage.removeItem("userdata");
      localStorage.removeItem("activeChatId");
      localStorage.removeItem("isLoggedIn");
      handleCloseConfirm();
      navigate("/");
    });

    setShowConfirm(true);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleOpenNewChatFromSearch = () => {
    const btn = document.getElementById("new-chat");
    if (btn) btn.click();
    setShowSearchModal(false);
    setSearchQuery("");
  };

  const messagesToShow =
    (searchResults.semantic_messages.length > 0 &&
      searchResults.semantic_messages) ||
    searchResults.keyword_messages ||
    [];

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((m) => {
      const label = getDateLabel(m.created_at);
      if (!groups[label]) groups[label] = [];
      groups[label].push(m);
    });
    return groups;
  };

  const groupedMessages = groupMessagesByDate(
    messagesToShow.filter((m) => m.is_search_result)
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (theme === "dark") document.body.classList.add("dark-mode");
    else document.body.classList.remove("dark-mode");
  }, [theme]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("userdata"));
    setUserdata(saved);
  }, []);

  useEffect(() => {
    if (!showSearchModal) return;

    const q = searchQuery.trim();
    let aborted = false;

    setSearchLoading(true);
    setSearchError(null);

    const timeoutId = setTimeout(() => {
      searchApi(q)
        .then((data) => {
          if (!aborted) {
            setSearchResults({
              ...data,
              keyword_messages: data.keyword_messages.map((m) => ({
                ...m,
                is_search_result: true,
              })),
              semantic_messages: data.semantic_messages.map((m) => ({
                ...m,
                is_search_result: true,
              })),
            });
          }
        })

        .catch((err) => {
          if (!aborted) setSearchError(err.message || "Failed to search");
        })
        .finally(() => {
          if (!aborted) setSearchLoading(false);
        });
    }, 300);

    return () => {
      aborted = true;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, showSearchModal]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showProfileMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !document.getElementById("profile").contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  return (
    <div className="app-sidebar relative">
      <ConfirmationModal
        show={showConfirm}
        handleClose={handleCloseConfirm}
        onConfirm={onConfirm}
        message={confirmationMessage}
        type={confirmationType}
        title={confirmationTitle}
      />

      <div className="app-logo">
        <img
          src="../public/logo.png"
          alt="Logo"
          className="h-0 min-w-16 min-h-16 object-cover dark:border-gray-600"
        />
      </div>

      <button id="new-chat" className="new-chat-btn custom-radius">
        <i className="far fa-edit"></i>
        <span>New Chat</span>
      </button>

      <button
        onClick={() => setShowSearchModal(true)}
        className="w-full text-left px-3 py-2 rounded-md flex items-center gap-2 custom-search custom-font-size-12"
      >
        <i className="fas fa-search" style={{ marginRight: "5px" }}></i>
        <span>Search</span>
      </button>

      <div className="history-container">
        <h3>Your chats</h3>
        <div id="chat-history"></div>
      </div>

      <div className="app-settings relative">
        <button
          id="profile"
          title="Profile"
          onClick={() => setShowProfileMenu((prev) => !prev)}
          className="relative flex items-center gap-3 px-1 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
        >
          {userdata?.profile_image ? (
            <img
              src={userdata.profile_image}
              alt="Profile"
              className="w-10 h-10 min-w-10 min-h-10 rounded-full object-cover border border-gray-300 dark:border-gray-600"
            />
          ) : (
            <div className="w-8 h-8 min-w-8 min-h-8 rounded-full flex items-center justify-center text-white font-semibold shadow-sm custom-profile-image-color">
              {(userdata?.first_name?.[0] || "U").toUpperCase() +
                (userdata?.last_name?.[0] || "").toUpperCase()}
            </div>
          )}

          <div className="flex flex-col overflow-hidden">
            <span className="text-xs dark:text-gray-100 truncate max-w-[130px] custom-font-size-12">
              {userdata?.first_name} {userdata?.last_name}
            </span>
            <span className="text-gray-500 dark:text-gray-400 truncate max-w-[200px] custom-font-size-12">
              {userdata?.email?.split("@")[0]}
            </span>
          </div>
        </button>

        {showProfileMenu && (
          <div
            ref={menuRef}
            className="profile-button absolute bottom-14 left-0 w-100 shadow-lg rounded-lg p-2 z-50 dark:bg-gray-800 dark:border-gray-700 transition-all"
          >
            <button
              onClick={toggleTheme}
              className="w-full text-left px-3 py-2 rounded-md flex items-center gap-2"
            >
              {theme === "light" ? (
                <>
                  <i className="fa-regular fa-moon"></i>
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <i className="fa-regular fa-sun"></i>
                  <span>Light Mode</span>
                </>
              )}
            </button>
            <button
              id="logout"
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-md flex items-center gap-2"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      <SearchModal
        theme={theme}
        show={showSearchModal}
        onClose={() => {
          setShowSearchModal(false);
          setSearchQuery("");
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchLoading={searchLoading}
        searchError={searchError}
        searchResults={searchResults}
        messagesToShow={messagesToShow}
        groupedMessages={groupedMessages}
        handleOpenNewChatFromSearch={handleOpenNewChatFromSearch}
      />
    </div>
  );
}

export default SideBar;
