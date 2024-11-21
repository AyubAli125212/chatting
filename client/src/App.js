import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = "http://localhost:8000";
const socket = io(API_URL);

const App = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    socket.on("chat message", (messageData) => {
      setChatHistory((prev) => [...prev, messageData]);
    });

    return () => socket.off("chat message");
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      const { token } = response.data;
      setToken(token);
      setIsLoggedIn(true);
      socket.emit("join", username);
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  const fetchChatHistory = async () => {
    if (!recipient) return;
    try {
      const response = await axios.get(`${API_URL}/chat/${username}/${recipient}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatHistory(response.data);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!message || !recipient) return;
    const messageData = { sender: username, receiver: recipient, content: message };

    try {
      await axios.post(`${API_URL}/chat`, messageData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // setChatHistory((prev) => [...prev, { ...messageData, from: "You" }]);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="container">
      <h1>Private Chat App</h1>
      {!isLoggedIn ? (
        <div className="input-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div>
          <h2>Welcome, {username}!</h2>
          <div className="input-group">
            <input
              type="text"
              placeholder="Recipient's username"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <button onClick={fetchChatHistory}>Load Chat</button>
          </div>
          <div className="input-group">
            <input
              type="text"
              placeholder="Type a message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
          <div className="chat-box">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={chat.sender === username ? "from-me" : "from-them"}
              >
                <strong>{chat.sender === username ? "You" : chat.sender}:</strong> {chat.content}
              </div>
            ))}
          </div>
        </div>
      )}
      <footer>© 2024 ChatApp. All rights reserved.</footer>
    </div>
  );
};

export default App;