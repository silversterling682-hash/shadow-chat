import { useState, useEffect, useRef } from 'react';
import './App.css';
import CryptoJS from 'crypto-js';

const SERVER = "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const [key, setKey] = useState(null);
  const [messages, setMessages] = useState([]);
  const [timer, setTimer] = useState(0);
  const [lastCount, setLastCount] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🛡️ PROTECTION
  useEffect(() => {
    console.log("%c 🟢 SHADOW WHATSAPP ", "background:green;color:white;font-size:15px");
    document.addEventListener('contextmenu', e => e.preventDefault());
  }, []);

  // 🔐 LOGIN / REGISTER
  const register = async () => {
    const username = document.getElementById('user').value;
    const password = document.getElementById('pass').value;
    const name = document.getElementById('name').value;
    const secret = CryptoJS.SHA256(username + password).toString();
    setKey(secret);

    const res = await fetch(SERVER + "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, name })
    });
    const data = await res.json();
    data.status === "success" ? setUser(data.user) : alert(data.msg);
  };

  const login = async () => {
    const username = document.getElementById('user').value;
    const password = document.getElementById('pass').value;
    const secret = CryptoJS.SHA256(username + password).toString();
    setKey(secret);

    const res = await fetch(SERVER + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    data.status === "success" ? setUser(data.user) : alert("❌ Wrong Details!");
  };

  // 💬 SEND MESSAGE
  const sendMsg = async () => {
    const text = document.getElementById('msgInput').value;
    if (!text) return;
    const encrypted = CryptoJS.AES.encrypt(text, key).toString();
    await fetch(SERVER + "/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: user.name, text: encrypted, timer: timer })
    });
    document.getElementById('msgInput').value = '';
  };

  // 🔄 REFRESH ONLY NEW MESSAGES
  useEffect(() => {
    if (user) {
      const interval = setInterval(async () => {
        const res = await fetch(SERVER + "/messages");
        const newMsgs = await res.json();
        if (newMsgs.length > lastCount) {
          setMessages(newMsgs);
          setLastCount(newMsgs.length);
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [user, lastCount]);

  // LOGIN SCREEN
  if (!user) return (
    <div className="login-screen">
      <div className="login-box">
        <h1>🟢 SHADOW WHATSAPP</h1>
        <input id="user" placeholder="Username" />
        <input id="pass" type="password" placeholder="Password" />
        <input id="name" placeholder="Full Name" />
        <button className="btn" onClick={register}>📝 CREATE ACCOUNT</button>
        <button className="btn secondary" onClick={login}>🔐 LOGIN</button>
      </div>
    </div>
  );

  // MAIN APP
  return (
    <div className="app-container">
      <div className="app-header">
        <div className="profile-pic">👤</div>
        <div className="header-name">{user.name}</div>
      </div>

      <div className="chat-body">
        <div className="chat-content">

          {/* SETTINGS PANEL */}
          <div className="settings-panel">
            <p>⏱️ Auto Delete:</p>
            <button onClick={() => setTimer(0)}>🚫 OFF</button>
            <button onClick={() => setTimer(5)}>5s</button>
            <button onClick={() => setTimer(10)}>10s</button>
            <button onClick={() => setTimer(30)}>30s</button>
            <button onClick={() => setTimer(60)}>1m</button>
          </div>

          <div className="messages">
            {messages.map((msg, i) => (
              <Message key={i} data={msg} myName={user.name} secretKey={key} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <input id="msgInput" placeholder="Type a message" onKeyPress={(e) => e.key === 'Enter' && sendMsg()} />
            <button className="send-btn" onClick={sendMsg}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// MESSAGE COMPONENT
function Message({ data, myName, secretKey }) {
  const [timeLeft, setTimeLeft] = useState(data.timer || 0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) setVisible(false);
  }, [timeLeft]);

  if (!visible) return null;

  const isMe = data.from === myName;
  let text = "🔒 Encrypted";
  try {
    const bytes = CryptoJS.AES.decrypt(data.text, secretKey);
    text = bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) { }

  return (
    <div className={`msg ${isMe ? 'me' : 'other'}`}>
      {data.timer > 0 && <span className="timer-badge">{timeLeft}s</span>}
      <div className="msg-text">{text}</div>
      <div className="msg-time">
        {data.time} <span className="checks">✓✓</span>
      </div>
    </div>
  );
}

export default App;