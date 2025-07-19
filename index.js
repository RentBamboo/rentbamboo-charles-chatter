// index.js - The main script file that will be hosted on a CDN
(function () {
  // Get client ID from script tag data attribute
  const scriptTag = document.querySelector("#rentbamboo-charles");
  const clientId = scriptTag
    ? scriptTag.getAttribute("data-client-id")
    : "demo";

  const position = scriptTag ? scriptTag.getAttribute("data-position") : "left";
  const color = scriptTag ? scriptTag.getAttribute("data-color") : "#16a34a";

  const apiEndpoint = "http://localhost:8080";
  // const apiEndpoint ="http://rentbamboo-com-charles-api.fly.dev"

  // SimpleChatbot namespace
  window.SimpleChatbot = window.SimpleChatbot || {};

  // Store team data
  let teamData = {
    city: "",
    state: "",
    name: "",
    description: "",
    logoUrl: "",
  };

  // Default configuration
  const defaultConfig = {
    clientId: clientId,
    primaryColor: color,
    welcomeMessage: "Welcome! How can I help you today?",
    companyName: "Charles Chatter",
    size: "small", // small, medium,
    position: position,
    autoShow: true,
    autoShowDelay: 2000,
    showNotification: true,
  };

  // Merge user config with defaults
  const config = Object.assign({}, defaultConfig, window.SimpleChatbot);

  // Store the merged config back into the global object
  window.SimpleChatbot = config;

  // Main initialization function
  function init() {
    // Check if mobile
    const isMobile = window.innerWidth <= 768;

    // Inject CSS styles
    injectStyles(isMobile);

    // Fetch team info before injecting HTML
    fetchTeamInfo().then(() => {
      // Create and inject HTML with team data
      injectHTML();

      // Set up event listeners and functionality
      setupFunctionality();

      // Log initialization for debugging
      console.log(
        `Rentbamboo charles is Initialized for client: ${config.clientId}`,
      );

      // Send initialization event to server
      sendToServer({
        type: "init",
        timestamp: new Date().toISOString(),
        page: window.location.href,
        userAgent: navigator.userAgent,
      });

      // Handle mobile viewport changes
      window.addEventListener("resize", () => {
        const isMobile = window.innerWidth <= 768;
        const chatWindow = document.getElementById("sc-chatWindow");
        const chatButton = document.getElementById("sc-chatButton");

        if (isMobile) {
          chatWindow.style.width = "100%";
          chatWindow.style.height = "100%";
          chatWindow.style.bottom = "0";
          chatWindow.style.right = "0";
          chatWindow.style.left = "0";
          chatWindow.style.borderRadius = "0";

          // Ensure chat button is visible on mobile
          chatButton.style.display = "flex";
          chatButton.style.bottom = "10px";
          chatButton.style[config.position] = "20px";
        } else {
          chatWindow.style.width = config.size === "small" ? "350px" : "450px";
          chatWindow.style.height = config.size === "small" ? "450px" : "600px";
          chatWindow.style.bottom = "90px";
          chatWindow.style[config.position] = "20px";
          chatWindow.style.borderRadius = "12px";

          chatButton.style.display = "flex";
          chatButton.style.bottom = "20px";
          chatButton.style[config.position] = "20px";
        }
      });

      // Set up auto-show if enabled
      if (config.autoShow) {
        setTimeout(() => {
          if (
            !document.getElementById("sc-chatWindow").style.display === "flex"
          ) {
            showChatWindow();

            // Send event to server
            sendToServer({
              type: "autoShow",
              timestamp: new Date().toISOString(),
            });
          }
        }, config.autoShowDelay);
      }
    });
  }

  // Inject CSS styles
  function injectStyles(isMobile) {
    const css = `
            /* ChatBot Container */
            #sc-chatbot-container {
                font-family: Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                font-size: ${isMobile ? "16px" : "14px"}; // left side is mobile
                line-height: 1.4;
                color: #333;
                box-sizing: border-box;
                -webkit-tap-highlight-color: transparent;
            }

            #sc-chatbot-container * {
                box-sizing: border-box;
            }

            /* Chat button */
            .sc-chat-button {
                position: fixed;
                bottom: ${isMobile ? "10px" : "20px"};
                ${config.position === "right" ? "right: 20px;" : "left: 20px;"}
                width: ${isMobile ? "50px" : "40px"};
                height: ${isMobile ? "50px" : "40px"};
                border-radius: 20%;
                background-color: ${config.primaryColor};
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                z-index: 999999;
                transition: transform 0.2s ease;
            }

            .sc-chat-button:hover {
                transform: scale(1.05);
            }

            .sc-chat-icon {
                color: white;
                font-size: ${isMobile ? "28px" : "24px"};
            }

            /* Chat window */
            .sc-chat-window {
                position: fixed;
                bottom: ${isMobile ? "0" : "90px"};
                ${isMobile ? "left: 0; right: 0;" : `${config.position}: 20px;`}
                width: ${isMobile ? "100%" : config.size === "small" ? "350px" : "450px"};
                height: ${isMobile ? "100%" : config.size === "small" ? "450px" : "600px"};
                background-color: white;
                border-radius: ${isMobile ? "0" : "12px"};
                box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
                display: none;
                flex-direction: column;
                overflow: hidden;
                z-index: 999998;
                transition: opacity 0.3s ease, transform 0.3s ease;
                opacity: 0;
                transform: translateY(10px);
            }

            .sc-chat-window.sc-active {
                opacity: 1;
                transform: translateY(0);
            }

            .sc-chat-header {
                background-color: ${config.primaryColor};
                color: white;
                padding: ${isMobile ? "20px 15px" : "15px 12px"};
                font-weight: 600;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .sc-header-content {
                display: flex;
                align-items: center;
                gap: ${isMobile ? "15px" : "10px"};
            }

            .sc-header-logo {
                width: ${isMobile ? "40px" : "32px"};
                height: ${isMobile ? "40px" : "32px"};
                border-radius: 20%;
                overflow: hidden;
            }

            .sc-header-logo img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .sc-header-text {
                display: flex;
                flex-direction: column;
            }

            .sc-header-name {
                font-size: ${isMobile ? "16px" : "14px"};
                font-weight: 600;
            }

            .sc-header-location {
                font-size: ${isMobile ? "14px" : "12px"};
                opacity: 0.8;
            }

            .sc-close-chat {
                cursor: pointer;
                opacity: 0.8;
                transition: opacity 0.2s ease;
                padding: ${isMobile ? "10px" : "0"};
            }

            .sc-expand-chat {
                cursor: pointer;
                opacity: 0.8;
                transition: opacity 0.2s ease;
                padding: ${isMobile ? "10px" : "0"};
            }

            .sc-expand-icon {
                width: ${isMobile ? "14px" : "12px"};
                height: ${isMobile ? "14px" : "12px"};
                color: #fff;
            }

            .sc-expand-chat:hover {
                opacity: 1;
            }

            .sc-close-chat:hover {
                opacity: 1;
            }

            .sc-chat-messages {
                flex: 1;
                padding: ${isMobile ? "20px" : "15px"};
                overflow-y: auto;
                background-color: #f8f9fb;
                display: flex;
                flex-direction: column;
                -webkit-overflow-scrolling: touch;
            }

            .sc-message {
                margin-bottom: 10px;
                max-width: 80%;
                padding: ${isMobile ? "14px 18px" : "12px 16px"};
                border-radius: 18px;
                line-height: 1;
                word-wrap: break-word;
                position: relative;
            }

            .sc-bot-message {
                background-color: #f0f0f0;
                align-self: flex-start;
                border-bottom-left-radius: 4px;
                color: #333;
            }

            .sc-user-message {
                background-color: ${config.primaryColor};
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
            }

            .sc-chat-input-area {
                display: flex;
                padding: ${isMobile ? "15px" : "12px"};
                border-top: 1px solid #eee;
                background-color: white;
                position: relative;
            }

            .sc-chat-input {
                flex: 1;
                padding: ${isMobile ? "12px 45px 12px 18px" : "10px 40px 10px 16px"};
                border: 1px solid #ddd;
                border-radius: 20px;
                outline: none;
                font-size: ${isMobile ? "16px" : "14px"};
                transition: border 0.2s ease;
                width: 100%;
            }

            .sc-chat-input:focus {
                border-color: #e5e7eb;
            }

            .sc-send-button {
                background-color: ${config.primaryColor};
                color: white;
                border: none;
                border-radius: 50%;
                width: ${isMobile ? "40px" : "36px"};
                height: ${isMobile ? "40px" : "36px"};
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: background-color 0.2s ease;
                position: absolute;
                right: ${isMobile ? "22px" : "18px"};
                top: 50%;
                transform: translateY(-50%);
            }

            .sc-send-button:hover {
                background-color: ${adjustColor(config.primaryColor, -20)};
            }

            .sc-notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background-color: #ff5252;
                color: white;
                border-radius: 50%;
                width: ${isMobile ? "24px" : "20px"};
                height: ${isMobile ? "24px" : "20px"};
                font-size: ${isMobile ? "14px" : "12px"};
                display: flex;
                justify-content: center;
                align-items: center;
                display: none;
                font-weight: bold;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            }

            .sc-typing-indicator {
                display: none;
                padding: ${isMobile ? "10px 14px" : "8px 12px"};
                background-color: #f0f0f0;
                border-radius: 10px;
                margin-bottom: 10px;
                align-self: flex-start;
                font-style: italic;
                color: #666;
                font-size: ${isMobile ? "14px" : "13px"};
            }

            @media (max-width: 768px) {
                .sc-chat-window {
                    width: 100%;
                    height: 100%;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    border-radius: 0;
                }
            }
        `;

    const styleElement = document.createElement("style");
    styleElement.type = "text/css";
    styleElement.appendChild(document.createTextNode(css));
    document.head.appendChild(styleElement);
  }

  // Helper function to adjust color brightness
  function adjustColor(color, amount) {
    // Remove # if present
    color = color.replace("#", "");
    const num = parseInt(color, 16);

    // Split into R, G, B components
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00ff) + amount;
    let b = (num & 0x0000ff) + amount;

    // Clamp values between 0-255
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    // Convert back to hex
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }

  // Inject HTML elements
  function injectHTML() {
    // Create chat button
    const chatButtonHTML = `
            <div class="sc-chat-button" id="sc-chatButton">
                <div class="sc-chat-icon"><img src="${teamData.logoUrl || "https://rentbamboo.com/charles.png"}" style="padding: 2px; width: 100%; height: 100%; object-fit: cover; border-radius: 20%;"></div>
                <div class="sc-notification-badge" id="sc-notificationBadge">1</div>
            </div>
        `;

    // Create chat window
    const chatWindowHTML = `
            <div class="sc-chat-window" id="sc-chatWindow">
                <div class="sc-chat-header">
                    <div class="sc-header-content">
                        <div class="sc-header-logo">
                            <img sty src="${teamData.logoUrl || "https://rentbamboo.com/charles.png"}" alt="${teamData.name || config.companyName}">
                        </div>
                        <div class="sc-header-text">
                            <div class="sc-header-name">${teamData.name || config.companyName}</div>
                            <div class="sc-header-location">${teamData.city ? `${teamData.city}, ${teamData.state}` : ""}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="sc-expand-chat" id="sc-expand">
                        </div>
                        <div class="sc-close-chat" id="sc-closeChat">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x-icon lucide-circle-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                        </div>
                    </div>
                </div>
                <div class="sc-chat-messages" id="sc-chatMessages">
                    <!-- Messages will be added here dynamically -->
                    </div>
                    <div class="sc-message sc-bot-message" id="sc-typingIndicator" style="display:none; gap: 2px; align-items: center; justify-content: center;">
                        <img src="https://rentbamboo.com/charles.png" style="width: 20px; height: 20px; display: inline; border-radius: 50%;">
                        Charles is thinking...
                    </div>
                <div class="sc-chat-input-area">
                    <input type="text" class="sc-chat-input" id="sc-chatInput" placeholder="Any 2 Bedroom Apartments in...">
                    <button class="sc-send-button" id="sc-sendButton">➤</button>
                </div>
            </div>
        `;

    // Create a container for the chatbot elements
    const container = document.createElement("div");
    container.id = "sc-chatbot-container";
    container.innerHTML = chatButtonHTML + chatWindowHTML;

    // Append the container to the body
    document.body.appendChild(container);

    // Add expand icon dynamically
    const expandIcon = document.getElementById("sc-expand");

    function updateExpandIcon() {
      expandIcon.innerHTML =
        config.size === "small"
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize-icon lucide-maximize"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minimize-icon lucide-minimize"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>`;
    }
    updateExpandIcon();
    window.SimpleChatbot.updateExpandIcon = updateExpandIcon;
  }

  // Set up chatbot functionality
  function setupFunctionality() {
    // Session ID for tracking conversations
    const sessionId = generateSessionId();

    // Store chat history
    const chatHistory = [];

    // DOM elements
    const chatButton = document.getElementById("sc-chatButton");
    const chatWindow = document.getElementById("sc-chatWindow");
    const closeChat = document.getElementById("sc-closeChat");
    const expand = document.getElementById("sc-expand");
    const chatMessages = document.getElementById("sc-chatMessages");
    const chatInput = document.getElementById("sc-chatInput");
    const sendButton = document.getElementById("sc-sendButton");
    const notificationBadge = document.getElementById("sc-notificationBadge");
    const typingIndicator = document.getElementById("sc-typingIndicator");

    // Event listeners
    chatButton.addEventListener("click", toggleChat);
    closeChat.addEventListener("click", closeWindow);
    expand.addEventListener("click", expandWindow);
    sendButton.addEventListener("click", sendMessage);

    chatInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        sendMessage();
      }
    });

    // Functions
    function toggleChat() {
      if (chatWindow.style.display === "flex") {
        closeWindow();
      } else {
        showChatWindow();
      }
    }

    function showChatWindow() {
      // Show the window
      chatWindow.style.display = "flex";

      // Add the active class after a small delay to trigger the transition
      setTimeout(() => {
        chatWindow.classList.add("sc-active");
      }, 10);

      // Hide notification badge
      notificationBadge.style.display = "none";

      // Focus input
      chatInput.focus();

      // Send event to server
      sendToServer({
        type: "chatOpened",
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        page: window.location.href,
      });

      // If first time opening, show welcome message
      if (chatMessages.children.length === 0) {
        setTimeout(() => {
          addBotMessage(config.welcomeMessage);
        }, 500);
      }
    }

    function closeWindow() {
      // Start the closing animation
      chatWindow.classList.remove("sc-active");

      // Hide the window after the animation completes
      setTimeout(() => {
        chatWindow.style.display = "none";
      }, 300);

      // Reset size to small
      config.size = "small";
      chatWindow.style.width = "350px";
      chatWindow.style.height = "450px";
      window.SimpleChatbot.updateExpandIcon();

      // Send event to server
      sendToServer({
        type: "chatClosed",
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
      });
    }

    function expandWindow() {
      if (config.size === "small") {
        config.size = "medium";
        chatWindow.style.width = "450px";
        chatWindow.style.height = "600px";
      } else {
        config.size = "small";
        chatWindow.style.width = "350px";
        chatWindow.style.height = "450px";
      }

      // Update expand icon
      window.SimpleChatbot.updateExpandIcon();

      // Toggle the expanded state
      chatWindow.classList.toggle("sc-expanded");

      // Send event to server
      sendToServer({
        type: "chatExpanded",
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
      });
    }

    function sendMessage() {
      const message = chatInput.value.trim();
      if (message) {
        // Add user message to UI
        addUserMessage(message);

        // Add to chat history
        chatHistory.push({
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
          sessionId: sessionId,
        });

        // Clear input
        chatInput.value = "";

        // Send to server
        sendToServer({
          type: "userMessage",
          sessionId: sessionId,
          message: message,
          timestamp: new Date().toISOString(),
        });

        // Show typing indicator
        typingIndicator.style.display = "block";
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Get response (either from server or local)
        setTimeout(() => {
          // Try to get response from server first
          getResponseFromServer(message, sessionId)
            .then((response) => {
              // Hide typing indicator
              typingIndicator.style.display = "none";

              // Add bot response to UI
              addBotMessage(response);

              // Add to chat history
              chatHistory.push({
                role: "bot",
                content: response,
                timestamp: new Date().toISOString(),
              });
            })
            .catch(() => {
              // If server fails, use local processing as fallback
              const localResponse = getLocalResponse(message);

              // Hide typing indicator
              typingIndicator.style.display = "none";

              // Add bot response to UI
              addBotMessage(localResponse);

              // Add to chat history
              chatHistory.push({
                role: "bot",
                content: localResponse,
                timestamp: new Date().toISOString(),
                sessionId: sessionId,
              });
            });
        }, 1000); // Delay to simulate thinking
      }
    }

    function addUserMessage(message) {
      const messageElement = document.createElement("div");
      messageElement.classList.add("sc-message", "sc-user-message");
      messageElement.textContent = message;
      chatMessages.appendChild(messageElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addBotMessage(message) {
      const messageElement = document.createElement("div");
      messageElement.classList.add("sc-message", "sc-bot-message");
      messageElement.innerHTML = message;

      // Style any links in the message
      const links = messageElement.getElementsByTagName("a");
      for (let link of links) {
        link.style.color = "#3b82f6"; // blue-500
      }

      chatMessages.appendChild(messageElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Show notification if enabled
    if (config.showNotification) {
      setTimeout(() => {
        if (chatWindow.style.display !== "flex") {
          notificationBadge.style.display = "flex";

          // Send event to server
          sendToServer({
            type: "notificationShown",
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
          });
        }
      }, config.autoShowDelay || 30000);
    }
  }

  // We need to fetch some public team info using the clientId
  async function fetchTeamInfo() {
    try {
      const response = await fetch(
        `${apiEndpoint}/team?clientId=${config.clientId}`,
        {
          method: "GET",
        },
      );

      const data = await response.json();
      teamData = data.data;
    } catch (error) {
      console.error("Error fetching team data:", error);
    }
  }

  // Send data to server
  async function sendToServer(data) {
    // Add clientId to all requests
    data.clientId = config.clientId;

    try {
      const response = await fetch(`${apiEndpoint}/events`, {
        method: "POST",
        body: JSON.stringify(data),
      });

      return response.ok;
    } catch (error) {
      console.error("Error sending data to server:", error);
      return false;
    }
  }

  // Get response from server
  async function getResponseFromServer(message, session) {
    try {
      const response = await fetch(`${apiEndpoint}/message`, {
        method: "POST",
        body: JSON.stringify({
          clientId: config.clientId,
          message: message,
          timestamp: new Date().toISOString(),
          page: window.location.href,
          sessionId: session,
        }),
      });

      if (!response.ok) {
        throw new Error("Server response not ok");
      }

      const data = await response.json();
      return data.data; // Changed from data.response to data.data to match server response format
    } catch (error) {
      console.error("Error getting response from server:", error);
      throw error;
    }
  }

  // Local response generation (fallback)
  function getLocalResponse(message) {
    // Simple response patterns
    message = message.toLowerCase();

    if (
      message.includes("hello") ||
      message.includes("hi") ||
      message.includes("hey")
    ) {
      return "Hello! How can I help you today?";
    } else if (message.includes("thank")) {
      return "You're welcome!";
    } else if (message.includes("bye") || message.includes("goodbye")) {
      return "Goodbye! Have a great day!";
    } else {
      throw new Error("Use server response");
    }
  }

  // Generate a random session ID
  function generateSessionId() {
    return (
      "sc-" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  // Initialize when the DOM is fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
