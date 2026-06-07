import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SideBar from "../components/SideBar";
import {
  getConversations,
  getUserMessages,
  getAIResponseAPI,
  createConversationOrMessage,
  deleteConversation,
  updateConversationTitle,
} from "../api/ChatbotApis";
import ConfirmationModal from "../components/ConfirmationModal";
import { useConversations } from "../utils/ConversationContext";
export default function Index() {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { setConversations } = useConversations();
  const [onConfirm, setOnConfirm] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [confirmationType, setConfirmationType] = useState("");
  const handleCloseConfirm = () => setShowConfirm(false);
  const handleShowConfirm = () => setShowConfirm(true);
  const conversationsRef = useRef([]);
  const messagesContainerRef = useRef(null);
  const hasStartedChatRef = useRef(false);
  const userInputRef = useRef(null);
  const sendButtonRef = useRef(null);
  const newChatButtonRef = useRef(null);
  const toggleThemeButtonRef = useRef(null);
  const chatHistoryContainerRef = useRef(null);
  const currentChatTitleRef = useRef(null);
  const exportChatButtonRef = useRef(null);
  const stopResponseButtonRef = useRef(null);
  const fileUploadInputRef = useRef(null);
  const pendingPreviewRef = useRef(null);
  const currentChatIdRef = useRef(null);
  const isTypingRef = useRef(false);
  const letterTimeoutRef = useRef(null);
  const pendingFileRef = useRef(null);
  const activeAIMessageDivRef = useRef(null);
  const isUpdatingSidebarRef = useRef(false);
  const isLoadingChatRef = useRef(false);

  const INTRO_HTML = `
    <div class=intro-container>
      <div class="intro-message">
        <h1 class="intro-message-title">Welcome to AI Chatbot</h1>
        <p class="intro-message-description custom-font-size-12">Ask me anything. I'm an open source AI assistant.</p>
        <div class="suggestion-chips">
          <button class="suggestion-chip custom-font-size-12">Tell me a story</button>
          <button class="suggestion-chip custom-font-size-12">Explain quantum computing</button>
          <button class="suggestion-chip custom-font-size-12">Write a poem</button>
          <button class="suggestion-chip custom-font-size-12">Help me learn JavaScript</button>
        </div>
      </div>
    </div>
  `;

  function resetUIForNewChat() {
    currentChatIdRef.current = null;
    localStorage.removeItem("activeChatId");

    if (currentChatTitleRef.current) {
      currentChatTitleRef.current.textContent = "";
    }

    if (messagesContainerRef.current) {
      messagesContainerRef.current.innerHTML = INTRO_HTML;
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }

    pendingFileRef.current = null;
    if (pendingPreviewRef.current) {
      pendingPreviewRef.current.innerHTML = "";
      pendingPreviewRef.current.style.display = "none";
    }

    const exportButtons = document.querySelectorAll("#export-chat");
    exportButtons.forEach((btn) => {
      btn.style.display = "none";
    });
  }

  async function createNewChat() {
    navigate("/new");
    resetUIForNewChat();
    await updateChatHistorySidebar(false);
  }

  function addMessageToUI(sender, content) {
    if (!messagesContainerRef.current) return;
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    const messageContent = document.createElement("div");
    messageContent.className = "message-content";
    messageContent.textContent = content;
    messageDiv.appendChild(messageContent);
    messagesContainerRef.current.appendChild(messageDiv);
    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;
  }

  function addFormattedMessageToUI(sender, content) {
    if (!messagesContainerRef.current) return;
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    const processed = processMarkdownContent(content);
    processed.forEach((segment) => {
      if (segment.type === "code") {
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        if (segment.language) {
          code.className = `language-${segment.language}`;
        }
        code.classList.add("hljs");
        code.textContent = segment.content;

        const copyBtn = document.createElement("button");
        copyBtn.className = "code-copy-button";
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(segment.content).then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(
              () => (copyBtn.innerHTML = '<i class="fas fa-copy"></i>'),
              2000
            );
          });
        });

        const container = document.createElement("div");
        container.className = "code-copy-container";
        container.appendChild(copyBtn);
        pre.appendChild(container);
        pre.appendChild(code);
        messageContent.appendChild(pre);
        try {
          hljs.highlightElement(code);
        } catch (e) {
          console.error("Highlight error:", e);
        }
      } else {
        const textDiv = document.createElement("div");
        textDiv.innerHTML = marked.parse(segment.content);
        while (textDiv.firstChild) {
          messageContent.appendChild(textDiv.firstChild);
        }
      }
    });

    messageDiv.appendChild(messageContent);
    messagesContainerRef.current.appendChild(messageDiv);
    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;
  }

  function processMarkdownContent(content) {
    if (!content || typeof content !== "string") return [];
    const segments = [];
    let currentPos = 0;
    const codeBlockRegex = /```([\w]*)\n([\s\S]*?)\n```/g;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > currentPos) {
        segments.push({
          type: "text",
          content: content.substring(currentPos, match.index),
        });
      }
      segments.push({
        type: "code",
        language: match[1] || "plaintext",
        content: match[2],
      });
      currentPos = match.index + match[0].length;
    }
    if (currentPos < content.length) {
      segments.push({ type: "text", content: content.substring(currentPos) });
    }
    return segments;
  }

  function updateActiveChatInSidebar() {
    const container = document.querySelectorAll(
      "#chat-history .chat-history-item"
    );
    container.forEach((item) => {
      item.classList.remove("active");
      if (item.dataset.chatId === String(currentChatIdRef.current)) {
        item.classList.add("active");
      }
    });

    const exportChatButton2 = document.getElementById("export-chat");
    if (exportChatButton2) {
      if (currentChatIdRef.current) {
        exportChatButton2.style.display = "inline-block";
      } else {
        exportChatButton2.style.display = "none";
      }
    }
  }

  async function loadChat(chatIdParam) {
    if (isLoadingChatRef.current) return;
    if (!messagesContainerRef.current) return;

    isLoadingChatRef.current = true;
    try {
      currentChatIdRef.current = chatIdParam;
      const response = await getUserMessages(chatIdParam);
      messagesContainerRef.current.innerHTML = "";

      if (!response || response.status !== 1) {
        messagesContainerRef.current.innerHTML =
          "<div class='error-chat'>Failed to load messages.</div>";
        return;
      }

      const userMessages = response.data || [];
      if (!userMessages.length) {
        messagesContainerRef.current.innerHTML =
          "<div class='empty-chat'>No messages in this conversation.</div>";
      } else {
        userMessages.forEach((msg) => {
          if (msg.role === "user") addMessageToUI("user", msg.text);
          else addFormattedMessageToUI("assistant", msg.text);
        });
      }

      updateActiveChatInSidebar();
    } catch (error) {
      console.error("Failed to load chat:", error);
      if (messagesContainerRef.current) {
        messagesContainerRef.current.innerHTML =
          "<div class='error-chat'>Failed to load messages.</div>";
      }
    } finally {
      isLoadingChatRef.current = false;
    }
  }

  async function updateChatHistorySidebar(skipFetch = false) {
    if (isUpdatingSidebarRef.current) return;
    isUpdatingSidebarRef.current = true;

    const container = chatHistoryContainerRef.current;
    if (!container) {
      isUpdatingSidebarRef.current = false;
      return;
    }

    container.innerHTML = "";

    try {
      let conversations;
      if (!skipFetch) {
        conversations = await getConversations();
      } else {
        conversations = conversationsRef.current || [];
      }

      conversationsRef.current = conversations || [];
      setConversations(conversationsRef.current);
      if (!conversations || conversations.length === 0) {
        container.innerHTML = "<div class='empty-chat'>No chat history</div>";
        localStorage.removeItem("activeChatId");
        currentChatIdRef.current = null;

        if (!hasStartedChatRef.current && messagesContainerRef.current) {
          messagesContainerRef.current.innerHTML = INTRO_HTML;
        }

        return;
      }

      const sorted = conversations.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      const unique = Array.from(new Map(sorted.map((c) => [c.id, c])).values());

      const savedId = localStorage.getItem("activeChatId");
      const validActive = unique.find((c) => c.id === savedId);

      if (!validActive && !skipFetch) {
        localStorage.removeItem("activeChatId");
        currentChatIdRef.current = null;
      }

      unique.forEach((chat) => {
        const eachChatId = chat.id;
        const chatTitle = chat.title;
        const item = document.createElement("div");
        item.className = `chat-history-item ${
          savedId === eachChatId ? "active" : ""
        }`;
        item.dataset.chatId = eachChatId;

        const icon = document.createElement("i");
        icon.className = "fas fa-comment";

        const title = document.createElement("span");
        title.className = "chat-title";
        title.textContent = chatTitle;

        item.appendChild(icon);
        item.appendChild(title);

        item.addEventListener("click", async () => {
          navigate(`/chat/${eachChatId}`);
          currentChatIdRef.current = eachChatId;
          if (currentChatTitleRef.current) {
            currentChatTitleRef.current.textContent = chatTitle;
          }
          localStorage.setItem("activeChatId", eachChatId);

          document
            .querySelectorAll(".chat-history-item.active")
            .forEach((it) => it.classList.remove("active"));

          item.classList.add("active");

          await loadChat(eachChatId);
        });

        const optionsButton = document.createElement("button");
        optionsButton.className = "chat-options-button";
        optionsButton.innerHTML = '<i class="fas fa-ellipsis-v"></i>';

        const optionsMenu = document.createElement("div");
        optionsMenu.className = "chat-options-menu";
        optionsMenu.style.display = "none";
        optionsMenu.innerHTML = `
          <div class="chat-options-item rename-chat">
            <i class="fa-solid fa-pen"></i>
            <span class="rename-text">Rename</span>
          </div>
          <div class="chat-options-item delete-chat">
            <i class="fa-solid fa-trash"></i>
            <span class="delete-text">Delete</span>
          </div>
      `;

        optionsButton.addEventListener("click", (e) => {
          e.stopPropagation();
          document.querySelectorAll(".chat-options-menu").forEach((menu) => {
            if (menu !== optionsMenu) {
              menu.style.display = "none";
            }
          });

          optionsMenu.style.display =
            optionsMenu.style.display === "none" ? "block" : "none";
        });

        const renameBtn = optionsMenu.querySelector(".rename-chat");

        if (renameBtn) {
          renameBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            optionsMenu.style.display = "none";
            const span = item.querySelector("span");
            const oldTitle = span.textContent;
            const input = document.createElement("input");
            input.type = "text";
            input.value = oldTitle;
            input.className = "rename-input";
            input.style.width = "100%";
            input.style.border = "none";
            input.style.fontSize = "var(--custom-font-size)";
            item.replaceChild(input, span);
            input.focus();
            input.select();

            let renameDone = false;
            const finishRename = async (save) => {
              if (renameDone) return;
              renameDone = true;

              const newTitle = input.value.trim();
              span.textContent = save && newTitle ? newTitle : oldTitle;

              if (item.contains(input)) {
                item.replaceChild(span, input);
              }

              if (!save || !newTitle || newTitle === oldTitle) return;

              try {
                const activeItem = document.querySelector(
                  `.chat-history-item[data-chat-id="${eachChatId}"] span`
                );
                if (activeItem) activeItem.textContent = newTitle;
                if (
                  currentChatIdRef.current === eachChatId &&
                  currentChatTitleRef.current
                ) {
                  currentChatTitleRef.current.textContent = newTitle;
                }

                await updateConversationTitle(eachChatId, newTitle);
                await updateChatHistorySidebar(false);
              } catch (err) {
                console.error("Rename failed:", err);
              }
            };

            input.addEventListener("keydown", async (ev) => {
              if (ev.key === "Enter") await finishRename(true);
              if (ev.key === "Escape") finishRename(false);
            });

            input.addEventListener("blur", () => finishRename(true));
          });
        }

        const deleteBtn = optionsMenu.querySelector(".delete-chat");
        if (deleteBtn) {
          deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();

            setConfirmationMessage(
              "Are you sure you want to delete this chat?\nThis action cannot be undone."
            );
            setConfirmationTitle("Delete Chat");
            setConfirmationType("danger");
            handleShowConfirm();

            setOnConfirm(() => async () => {
              try {
                await deleteConversation(eachChatId);
                if (
                  localStorage.getItem("activeChatId") === String(eachChatId)
                ) {
                  localStorage.removeItem("activeChatId");
                  currentChatIdRef.current = null;
                }
                await updateChatHistorySidebar();
                await createNewChat();
              } catch (err) {
                console.error("Error deleting conversation:", err);
              } finally {
                handleCloseConfirm();
              }
            });
          });
        }

        item.appendChild(optionsButton);
        item.appendChild(optionsMenu);
        container.appendChild(item);
      });

      const activeId = localStorage.getItem("activeChatId");
      if (activeId && currentChatTitleRef.current) {
        const activeChat = conversationsRef.current.find(
          (c) => c.id === activeId
        );
        if (activeChat) {
          currentChatTitleRef.current.textContent = activeChat.title;
        }
      }

      if (
        !validActive &&
        !hasStartedChatRef.current &&
        messagesContainerRef.current
      ) {
        messagesContainerRef.current.innerHTML = INTRO_HTML;
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      container.innerHTML =
        "<div class='error-chat'>Failed to load conversations.</div>";
    } finally {
      isUpdatingSidebarRef.current = false;
    }
  }

  useEffect(() => {
    const messagesContainer = document.getElementById("user-messages");
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");
    const newChatButtonEl = document.getElementById("new-chat");
    const toggleThemeButtonEl = document.getElementById("toggle-theme");
    const chatHistoryContainer = document.getElementById("chat-history");
    const currentChatTitle = document.getElementById("current-chat-title");
    const exportChatButton = document.getElementById("export-chat");
    const stopResponseButtonEl = document.getElementById("stop-response");
    const stopRecordingButton = document.getElementById(
      "stop-recording-button"
    );
    const recordAudioButton = document.getElementById("record-audio-button");
    const fileUploadInput = document.getElementById("file-upload");
    const pendingPreview = document.getElementById("pending-file-preview");

    if (!messagesContainer || !userInput || !sendButton) {
      console.error("Required chat elements not found in DOM.");
      return;
    }

    messagesContainerRef.current = messagesContainer;
    userInputRef.current = userInput;
    sendButtonRef.current = sendButton;
    newChatButtonRef.current = newChatButtonEl;
    toggleThemeButtonRef.current = toggleThemeButtonEl;
    chatHistoryContainerRef.current = chatHistoryContainer;
    currentChatTitleRef.current = currentChatTitle;
    exportChatButtonRef.current = exportChatButton;
    stopResponseButtonRef.current = stopResponseButtonEl;
    fileUploadInputRef.current = fileUploadInput;
    pendingPreviewRef.current = pendingPreview;

    let recognition;
    let stopSpeak = false;

    const listeners = [];
    function addListener(el, ev, fn) {
      if (!el) return;
      el.addEventListener(ev, fn);
      listeners.push([el, ev, fn]);
    }

    function removeAllListeners() {
      listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
      listeners.length = 0;
    }

    let currentTheme = localStorage.getItem("theme") || "light";
    if (currentTheme === "dark") {
      document.body.classList.add("dark-mode");
      if (toggleThemeButtonEl) {
        toggleThemeButtonEl.innerHTML =
          '<i class="fa-regular fa-sun"></i><span>Light Mode</span>';
      }
    }

    function autoResizeTextarea() {
      const el = userInputRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }

    addListener(userInput, "input", autoResizeTextarea);

    async function handleSendMessage(isRecorded = false) {
      if (isTypingRef.current) {
        alert("Please wait until the current response is completed.");
        return;
      }
      const message = (userInputRef.current?.value || "").trim();
      if (!message && !pendingFileRef.current) return;

      hasStartedChatRef.current = true;
      const intro =
        messagesContainerRef.current?.querySelector(".intro-message");
      if (intro) intro.remove();

      if (userInputRef.current) {
        userInputRef.current.value = "";
      }
      autoResizeTextarea();

      let conversationId = localStorage.getItem("activeChatId");

      try {
        addMessageToUI("user", message);

        const response = await createConversationOrMessage(
          conversationId,
          message
        );
        if (response?.status === 1) {
          if (response.data?.conversation_id && !conversationId) {
            conversationId = response.data.conversation_id;
            localStorage.setItem("activeChatId", conversationId);
            navigate(`/chat/${conversationId}`);

            if (currentChatTitleRef.current) {
              const title =
                message.split(" ").slice(0, 4).join(" ") +
                (message.split(" ").length > 4 ? "..." : "");
              currentChatTitleRef.current.textContent = title;
            }

            await updateChatHistorySidebar();
          }
        } else {
          throw new Error(response?.message || "Failed to send message");
        }

        if (pendingFileRef.current) {
          await processPendingFile();
        }

        showTypingIndicator();

        const aiText = await getAIResponse(message, conversationId);
        if (isRecorded && aiText) {
          speakText(aiText);
        }
      } catch (err) {
        console.error("Error in handleSendMessage:", err);
        removeTypingIndicator();
        addMessageToUI(
          "assistant",
          "Sorry, I encountered an error. Please try again after some time."
        );
      }
    }

    async function processPendingFile() {
      const file = pendingFileRef.current;
      if (!file) return;
      const previewContainer = pendingPreviewRef.current;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          let previewHTML = "";
          if (file.type.startsWith("image/")) {
            previewHTML = `<img src="${e.target.result}" alt="${file.name}" style="max-width:100%;"/>`;
          } else if (
            file.type.startsWith("text/") ||
            file.type === "application/json"
          ) {
            previewHTML = `<pre style="white-space: pre-wrap;">${escapeHtml(
              e.target.result
            )}</pre>`;
          } else {
            previewHTML = `<div>Uploaded file: ${file.name}</div>`;
          }
          addMessageToUI("user", previewHTML);
          if (previewContainer) {
            previewContainer.style.display = "none";
            previewContainer.innerHTML = "";
          }
          pendingFileRef.current = null;
          resolve();
        };
        if (file.type.startsWith("image/")) reader.readAsDataURL(file);
        else reader.readAsText(file);
      });
    }

    function showTypingIndicator() {
      removeTypingIndicator();
      if (!messagesContainerRef.current) return;
      const typingDiv = document.createElement("div");
      typingDiv.className = "typing-indicator";
      typingDiv.id = "typing-indicator";
      for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.className = "typing-dot";
        typingDiv.appendChild(dot);
      }
      messagesContainerRef.current.appendChild(typingDiv);
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }

    function removeTypingIndicator() {
      document
        .querySelectorAll("#typing-indicator")
        .forEach((el) => el.remove());
      document
        .querySelectorAll(".message.assistant.empty-placeholder")
        .forEach((div) => {
          if (!div.textContent.trim()) div.remove();
        });
    }

    function getStableRendering(text) {
      if (!text || typeof text !== "string") return "";
      try {
        const parts = text.split("```");
        if (parts.length % 2 === 1) {
          return marked.parse(text);
        } else {
          const closedPart = parts.slice(0, parts.length - 1).join("```");
          const openPart = parts[parts.length - 1];
          return (
            marked.parse(closedPart) + marked.parse("```" + openPart + "\n```")
          );
        }
      } catch (e) {
        return escapeHtml(text);
      }
    }

    function addAssistantDivIfNeeded() {
      if (!messagesContainerRef.current) return null;
      const existing = messagesContainerRef.current.querySelector(
        ".message.assistant.empty-placeholder"
      );
      if (existing) return existing;
      const div = document.createElement("div");
      div.className = "message assistant empty-placeholder";
      const content = document.createElement("div");
      content.className = "message-content";
      div.appendChild(content);
      messagesContainerRef.current.appendChild(div);
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
      return div;
    }

    async function getAIResponse(userMessage, conversationId) {
      if (isTypingRef.current) {
        console.warn("Already typing — ignoring duplicate call.");
        return "";
      }

      isTypingRef.current = true;
      if (stopResponseButtonRef.current) {
        stopResponseButtonRef.current.style.display = "inline-block";
      }

      showTypingIndicator();

      let assistantDiv = null;
      let messageContent = null;
      let accumulated = "";

      try {
        const response = await getAIResponseAPI(userMessage, conversationId);
        if (response instanceof Response) {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("text/event-stream")) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let doneReading = false;

            while (!doneReading) {
              let { done, value } = await reader.read();
              if (done) {
                doneReading = true;
                break;
              }
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                if (jsonStr === "[DONE]") {
                  doneReading = true;
                  break;
                }
                try {
                  const obj = JSON.parse(jsonStr);
                  const text = obj.delta || obj.text || "";
                  if (text) {
                    if (!assistantDiv) {
                      removeTypingIndicator();
                      assistantDiv = addAssistantDivIfNeeded();
                      if (!assistantDiv) continue;
                      messageContent =
                        assistantDiv.querySelector(".message-content");
                      assistantDiv.classList.remove("empty-placeholder");
                    }
                    accumulated += text;
                    if (messageContent) {
                      messageContent.innerHTML =
                        getStableRendering(accumulated);
                    }
                    if (messagesContainerRef.current) {
                      messagesContainerRef.current.scrollTop =
                        messagesContainerRef.current.scrollHeight;
                    }
                  }
                } catch (e) {
                  console.error("Failed to parse SSE response:", e);
                }
              }
            }

            removeTypingIndicator();

            if (!assistantDiv && accumulated.trim()) {
              assistantDiv = addAssistantDivIfNeeded();
              messageContent =
                assistantDiv?.querySelector(".message-content") || null;
              if (messageContent) {
                messageContent.innerHTML = getStableRendering(accumulated);
              }
              assistantDiv?.classList.remove("empty-placeholder");
            } else if (assistantDiv && !accumulated.trim()) {
              assistantDiv.remove();
            }

            return accumulated;
          }

          const data = await response.json().catch(() => ({}));
          const aiText = data.message || data.text || "";
          removeTypingIndicator();
          if (aiText && aiText.trim()) {
            assistantDiv = addAssistantDivIfNeeded();
            messageContent = assistantDiv?.querySelector(".message-content");
            if (messageContent) {
              messageContent.innerHTML = getStableRendering(aiText);
            }
            assistantDiv?.classList.remove("empty-placeholder");
          }
          return aiText;
        }

        if (typeof response === "object" && response !== null) {
          const aiText = response.message || response.text || "";
          removeTypingIndicator();
          if (aiText && aiText.trim()) {
            assistantDiv = addAssistantDivIfNeeded();
            messageContent = assistantDiv?.querySelector(".message-content");
            if (messageContent) {
              messageContent.innerHTML = getStableRendering(aiText);
            }
            assistantDiv?.classList.remove("empty-placeholder");
          }
          return aiText;
        }

        throw new Error("Unexpected API response");
      } catch (error) {
        console.error("Backend Error:", error);
        removeTypingIndicator();
        const div = addAssistantDivIfNeeded();
        const content = div?.querySelector(".message-content");
        if (content) {
          content.textContent = "Error: Unable to contact backend.";
        }
        div?.classList.remove("empty-placeholder");
        return "";
      } finally {
        isTypingRef.current = false;
        if (stopResponseButtonRef.current) {
          stopResponseButtonRef.current.style.display = "none";
        }
        activeAIMessageDivRef.current = null;
      }
    }

    function escapeHtml(text) {
      if (!text) return "";
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return String(text).replace(/[&<>"']/g, (m) => map[m]);
    }

    function speakText(text) {
      try {
        speechSynthesis.cancel();
        stopSpeak = false;
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-IN";
        const voices = speechSynthesis.getVoices();
        const googleVoice =
          voices.find((v) => v.name === "Google US English") ||
          voices.find((v) => v.name.includes("Google"));
        if (googleVoice) {
          utter.voice = googleVoice;
        } else {
          console.warn("Google voice not available, using default");
        }
        utter.onboundary = () => {
          if (stopSpeak) speechSynthesis.cancel();
        };
        speechSynthesis.speak(utter);
      } catch (error) {
        console.error("Speech error:", error);
      }
    }

    async function handleVoiceRecording(isRecorded = false) {
      try {
        if (!recordAudioButton || !stopRecordingButton) return;

        if (!isRecording) {
          recordAudioButton.style.display = "none";
          stopRecordingButton.style.display = "block";

          const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SpeechRecognition) {
            alert("Speech recognition not supported in this browser.");
            recordAudioButton.style.display = "inline-block";
            stopRecordingButton.style.display = "none";
            return;
          }

          recognition = new SpeechRecognition();
          recognition.lang = "en-IN";
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;
          isRecorded = true;

          recognition.onstart = () => {
            console.log("🎤 Speech recognition started");
          };

          recognition.onresult = (event) => {
            const text = event.results[0][0].transcript.trim();
            if (!text) {
              console.log("Empty speech detected");
              stopRecording();
              return;
            }
            if (userInputRef.current) {
              userInputRef.current.value = text;
            }
            handleSendMessage(isRecorded);
          };

          recognition.onend = () => {
            if (!userInputRef.current?.value.trim()) {
              stopRecording();
            }
          };

          recognition.onerror = () => {
            stopRecording();
          };

          recognition.start();
          setIsRecording(true);
        } else {
          stopRecording();
        }
      } catch (error) {
        console.error("Voice recording error:", error);
      }
    }

    function stopRecording() {
      try {
        if (recognition) recognition.stop();
        speechSynthesis.cancel();
        stopSpeak = true;
        if (recordAudioButton) {
          recordAudioButton.style.display = "inline-block";
        }
        if (stopRecordingButton) {
          stopRecordingButton.style.display = "none";
        }
        setIsRecording(false);
      } catch (error) {
        console.error("Stop recording error:", error);
      }
    }

    function toggleTheme() {
      if (currentTheme === "light") {
        document.body.classList.add("dark-mode");
        currentTheme = "dark";
        if (toggleThemeButtonEl) {
          toggleThemeButtonEl.innerHTML =
            '<i class="fa-regular fa-sun"></i><span>Light Mode</span>';
        }
      } else {
        document.body.classList.remove("dark-mode");
        currentTheme = "light";
        if (toggleThemeButtonEl) {
          toggleThemeButtonEl.innerHTML =
            '<i class="fa-regular fa-moon"></i><span>Dark Mode</span>';
        }
      }
      localStorage.setItem("theme", currentTheme);
    }

    function exportCurrentChat() {
      const activeId = localStorage.getItem("activeChatId");
      const title = currentChatTitleRef.current?.textContent || "Untitled Chat";
      if (!messagesContainerRef.current) return;

      const messageElements =
        messagesContainerRef.current.querySelectorAll(".message");

      const chatLines = [];
      messageElements.forEach((msg) => {
        const isUser = msg.classList.contains("user");
        const content =
          msg.querySelector(".message-content")?.textContent.trim() || "";
        if (content) {
          chatLines.push(`${isUser ? "User" : "AI"}: ${content}`);
        }
      });

      const exportText = `Title: ${title}\n\n${chatLines.join("\n")}`;
      const blob = new Blob([exportText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat_${activeId || Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    async function handleSendMessageWrapper(e) {
      e?.preventDefault?.();
      await handleSendMessage();
    }

    addListener(sendButton, "click", handleSendMessageWrapper);

    addListener(userInput, "keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });

    if (newChatButtonEl) {
      addListener(newChatButtonEl, "click", createNewChat);
    }
    if (toggleThemeButtonEl) {
      addListener(toggleThemeButtonEl, "click", toggleTheme);
    }
    if (exportChatButton) {
      addListener(exportChatButton, "click", exportCurrentChat);
    }

    addListener(fileUploadInput, "change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (file) {
        pendingFileRef.current = file;
        displayPendingFilePreview(file);
      }
    });

    addListener(messagesContainer, "click", (e) => {
      const chip = e.target.closest(".suggestion-chip");
      if (!chip) return;
      if (userInputRef.current) {
        userInputRef.current.value = chip.textContent || "";
      }
      handleSendMessage();
    });

    addListener(window, "click", () => {
      document.querySelectorAll(".chat-options-menu").forEach((menu) => {
        menu.style.display = "none";
      });
    });

    addListener(recordAudioButton, "click", () => handleVoiceRecording(false));
    addListener(stopRecordingButton, "click", stopRecording);

    function displayPendingFilePreview(file) {
      const previewContainer = pendingPreviewRef.current;
      if (!previewContainer) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        let previewHTML = "";
        if (file.type.startsWith("image/")) {
          previewHTML = `<img src="${e.target.result}" alt="${file.name}" style="max-width: 100px; max-height: 100px;"/>`;
        } else if (
          file.type.startsWith("text/") ||
          file.type === "application/json"
        ) {
          let content = e.target.result;
          if (content.length > 200) {
            content = content.substring(0, 200) + "...";
          }
          previewHTML = `<pre style="white-space: pre-wrap; font-size: 12px;">${escapeHtml(
            content
          )}</pre>`;
        } else {
          previewHTML = `<div style="font-size: 12px;">${file.name}</div>`;
        }
        previewContainer.innerHTML = previewHTML;
        previewContainer.style.display = "block";
      };

      if (file.type.startsWith("image/")) reader.readAsDataURL(file);
      else reader.readAsText(file);
    }

    updateChatHistorySidebar();

    return () => {
      removeAllListeners();
      clearTimeout(letterTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) navigate("/");
  }, [navigate]);

  useEffect(() => {
    if (chatId) {
      localStorage.setItem("activeChatId", chatId);
      currentChatIdRef.current = chatId;
      loadChat(chatId);
    } else {
      createNewChat();
    }
  }, [chatId]);

  return (
    <>
      <title>ChatBot AI - Dashboard</title>
      <div className="main-chat-container">
        <div className="app-container">
          <SideBar />
          <ConfirmationModal
            show={showConfirm}
            handleClose={handleCloseConfirm}
            onConfirm={onConfirm}
            message={confirmationMessage}
            type={confirmationType}
            title={confirmationTitle}
          />
          <div className="chat-container">
            <div className="chat-header">
              <div className="current-chat-title" id="current-chat-title"></div>
              <div className="header-actions">
                <button
                  id="export-chat"
                  title="Export conversation"
                  style={{ display: "none" }}
                >
                  <i className="fas fa-download" />
                </button>
              </div>
            </div>

            <div className="user-messages" id="user-messages">
              <div className="intro-container">
                <div className="intro-message">
                  <h1>Welcome to AI Chatbot</h1>
                  <p className="custom-font-size-12">
                    Ask me anything. I'm an open source AI assistant.
                  </p>
                  <div className="suggestion-chips">
                    <button className="suggestion-chip">Tell me a story</button>
                    <button className="suggestion-chip">
                      Explain quantum computing
                    </button>
                    <button className="suggestion-chip">Write a poem</button>
                    <button className="suggestion-chip">
                      Help me learn JavaScript
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="input-area">
              <div className="input-container">
                <button id="record-audio-button" title="Record Audio">
                  <i className="fas fa-microphone-lines" />
                </button>
                <button
                  id="stop-recording-button"
                  title="Stop Recording"
                  style={{ display: "none" }}
                >
                  <i className="fas fa-stop" />
                </button>
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: "none" }}
                />
                <textarea
                  id="user-input"
                  placeholder="Type your message here..."
                  rows={1}
                  spellCheck={true}
                />
                <button id="send-button" title="Send message">
                  <i className="fas fa-paper-plane" />
                </button>
              </div>
              <div id="pending-file-preview" ref={pendingPreviewRef} />
              <div className="disclaimer">
                AI Chatbot may produce inaccurate information because it is still
                in development.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
