import { useNavigate } from "react-router-dom";

function SearchModal({
  theme,
  show,
  onClose,
  searchQuery,
  setSearchQuery,
  searchLoading,
  searchError,
  searchResults,
  messagesToShow,
  groupedMessages,
  handleOpenNewChatFromSearch,
}) {
  const navigate = useNavigate();

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        theme === "dark" ? "bg-black/60" : "bg-black/30"
      } backdrop-blur-[1px]`}
    >
      <div
        className={`w-full max-w-lg max-h-[80vh] rounded-2xl shadow-xl flex flex-col ${
          theme === "dark"
            ? "dark-mode-bg border border-gray-700"
            : "bg-white border border-gray-200"
        }`}
      >
        <div
          className={`flex items-center gap-3 px-4 py-3 border-b ${
            theme === "dark" ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className={`w-full px-4 py-2.5 custom-font-size custom-radius ${
                theme === "dark"
                  ? "bg-gray-800 text-gray-100"
                  : "bg-gray-50 text-gray-900"
              } border-none outline-none text-sm placeholder-gray-400 p-2`}
            />
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
            }`}
          >
            <svg
              className={`w-5 h-5 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <button
          onClick={handleOpenNewChatFromSearch}
          className="mx-4 mt-4 mb-2 px-4 py-2 flex items-center gap-3 custom-radius custom-font-size custom-search"
        >
          <svg
            className={`w-5 h-5 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>New chat</span>
        </button>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {searchLoading && (
            <div
              className={`text-center py-10 custom-font-size-12 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            ></div>
          )}

          {!searchLoading && searchError && (
            <div
              className={`text-center py-10 custom-font-size-12 ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            >
              {searchError}
            </div>
          )}

          {searchQuery.trim() === "" && (
            <div
              className={`text-center py-10 custom-font-size-12 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Start typing to search...
            </div>
          )}

          {searchQuery.trim() !== "" &&
            !searchLoading &&
            !searchError &&
            searchResults.keyword_conversations.length === 0 &&
            messagesToShow.length === 0 && (
              <div
                className={`text-center py-10 custom-font-size ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No results found
              </div>
            )}

          {searchQuery.trim() !== "" && (
            <>
              {searchResults.keyword_conversations.length > 0 && (
                <div className="mb-6">
                  <h3
                    className={`mb-2 px-2 custom-font-size ${
                      theme === "dark" ? "dark-mode-bg" : "text-gray-500"
                    }`}
                  >
                    Conversations
                  </h3>

                  {searchResults.keyword_conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        navigate(`/chat/${conv.id}`);
                        onClose();
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg custom-radius custom-font-size p-2 custom-margin ${
                        theme === "dark"
                          ? "hover:bg-gray-800 text-gray-200"
                          : "hover:bg-gray-100 text-gray-800"
                      }`}
                    >
                      {conv.title}
                    </button>
                  ))}
                </div>
              )}

              {messagesToShow.length > 0 &&
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date} className="mb-6">
                    <h3
                      className={`mb-2 px-2 custom-font-size ${
                        theme === "dark" ? "dark-mode-bg" : "text-gray-500"
                      }`}
                    >
                      {date}
                    </h3>

                    {msgs.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => {
                          navigate(`/chat/${msg.conversation_id}`);
                          onClose();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg transition-colors custom-radius custom-font-size p-2 custom-margin"
                      >
                        <div className="text-sm">{msg.conversation_title}</div>
                        <div className="text-xs opacity-40 line-clamp-1">
                          {msg.text}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
