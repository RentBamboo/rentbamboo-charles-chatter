// index.js - The main script file that will be hosted on a CDN
(function () {
  // SimpleChatbot namespace
  window.SimpleChatbot = window.SimpleChatbot || {};

  // Default configuration
  const defaultConfig = {
    clientId: "demo",
    primaryColor: "#0066ff",
    welcomeMessage: "Welcome! How can I help you today?",
    companyName: "Chat Support",
    position: "left", // 'right' or 'left'
    autoShow: false, // whether to automatically show the chatbot after a delay
    autoShowDelay: 30000, // delay in ms before showing chatbot automatically
    showNotification: true, // whether to show notification badge
    apiEndpoint: "https://api.simplechatbot.com", // endpoint for server communication
  };

  // Merge user config with defaults
  const config = Object.assign({}, defaultConfig, window.SimpleChatbot);

  // Store the merged config back into the global object
  window.SimpleChatbot = config;

  // Main initialization function
  function init() {
    // Gather some team information using the client id.

    // Inject CSS styles
    injectStyles();

    // Create and inject HTML
    injectHTML();

    // Set up event listeners and functionality
    setupFunctionality();

    // Log initialization for debugging
    console.log(`SimpleChatbot initialized for client: ${config.clientId}`);

    // Send initialization event to server
    sendToServer({
      type: "init",
      timestamp: new Date().toISOString(),
      page: window.location.href,
      userAgent: navigator.userAgent,
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
  }

  // Inject CSS styles
  function injectStyles() {
    const css = `
            /* ChatBot Container */
            #sc-chatbot-container {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                font-size: 14px;
                line-height: 1.4;
                color: #333;
                box-sizing: border-box;
            }

            #sc-chatbot-container * {
                box-sizing: border-box;
            }

            /* Chat button */
            .sc-chat-button {
                position: fixed;
                bottom: 20px;
                ${config.position === "right" ? "right: 20px;" : "left: 20px;"}
                width: 60px;
                height: 60px;
                border-radius: 50%;
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
                font-size: 24px;
            }

            /* Chat window */
            .sc-chat-window {
                position: fixed;
                bottom: 90px;
                ${config.position === "right" ? "right: 20px;" : "left: 20px;"}
                width: 350px;
                height: 450px;
                background-color: white;
                border-radius: 12px;
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
                padding: 15px 20px;
                font-weight: 600;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .sc-close-chat {
                cursor: pointer;
                opacity: 0.8;
                transition: opacity 0.2s ease;
            }

            .sc-close-chat:hover {
                opacity: 1;
            }

            .sc-chat-messages {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                background-color: #f8f9fb;
                display: flex;
                flex-direction: column;
            }

            .sc-message {
                margin-bottom: 10px;
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 18px;
                line-height: 1.5;
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
                padding: 12px;
                border-top: 1px solid #eee;
                background-color: white;
            }

            .sc-chat-input {
                flex: 1;
                padding: 10px 16px;
                border: 1px solid #ddd;
                border-radius: 20px;
                outline: none;
                font-size: 14px;
                transition: border 0.2s ease;
            }

            .sc-chat-input:focus {
                border-color: ${config.primaryColor};
            }

            .sc-send-button {
                background-color: ${config.primaryColor};
                color: white;
                border: none;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                margin-left: 10px;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: background-color 0.2s ease;
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
                width: 20px;
                height: 20px;
                font-size: 12px;
                display: flex;
                justify-content: center;
                align-items: center;
                display: none;
                font-weight: bold;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            }

            .sc-typing-indicator {
                display: none;
                padding: 8px 12px;
                background-color: #f0f0f0;
                border-radius: 10px;
                margin-bottom: 10px;
                align-self: flex-start;
                font-style: italic;
                color: #666;
                font-size: 13px;
            }

            @media (max-width: 480px) {
                .sc-chat-window {
                    width: calc(100% - 40px);
                    height: 60vh;
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
                <div class="sc-chat-icon">💬</div>
                <div class="sc-notification-badge" id="sc-notificationBadge">1</div>
            </div>
        `;

    // Create chat window
    const chatWindowHTML = `
            <div class="sc-chat-window" id="sc-chatWindow">
                <div class="sc-chat-header">
                    <div>${config.companyName}</div>
                    <div class="sc-close-chat" id="sc-closeChat">✕</div>
                </div>
                <div class="sc-chat-messages" id="sc-chatMessages">
                    <!-- Messages will be added here dynamically -->
                </div>
                <div class="sc-typing-indicator" id="sc-typingIndicator">
                    Bot is typing...
                </div>
                <div class="sc-chat-input-area">
                    <input type="text" class="sc-chat-input" id="sc-chatInput" placeholder="Type your message here...">
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
    const chatMessages = document.getElementById("sc-chatMessages");
    const chatInput = document.getElementById("sc-chatInput");
    const sendButton = document.getElementById("sc-sendButton");
    const notificationBadge = document.getElementById("sc-notificationBadge");
    const typingIndicator = document.getElementById("sc-typingIndicator");

    // Event listeners
    chatButton.addEventListener("click", toggleChat);
    closeChat.addEventListener("click", closeWindow);
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

      // Send event to server
      sendToServer({
        type: "chatClosed",
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

        // Get response (either from server or local)
        setTimeout(() => {
          // Try to get response from server first
          getResponseFromServer(message)
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
      messageElement.textContent = message;
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

  // Send data to server
  async function sendToServer(data) {
    // Add clientId to all requests
    data.clientId = config.clientId;

    try {
      const response = await fetch(`${config.apiEndpoint}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      return response.ok;
    } catch (error) {
      console.error("Error sending data to server:", error);
      return false;
    }
  }

  // Get response from server
  async function getResponseFromServer(message) {
    try {
      const response = await fetch(`${config.apiEndpoint}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: config.clientId,
          message: message,
          timestamp: new Date().toISOString(),
          page: window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error("Server response not ok");
      }

      const data = await response.json();
      return data.response;
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
      return "You're welcome! Is there anything else you need help with?";
    } else if (message.includes("bye") || message.includes("goodbye")) {
      return "Goodbye! Feel free to chat again if you have more questions.";
    } else if (message.includes("help")) {
      return "I'm here to help! What do you need assistance with?";
    } else if (
      message.includes("price") ||
      message.includes("cost") ||
      message.includes("pricing")
    ) {
      return "Our pricing starts at $9.99/month. Would you like more details about our pricing plans?";
    } else if (message.includes("feature") || message.includes("product")) {
      return "Our product includes many great features! Would you like to know about something specific?";
    } else {
      return "Thanks for your message. We'll get back to you soon. In the meantime, is there anything else I can help with?";
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
