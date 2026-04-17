import { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, doc, setDoc, getDoc, getDocs, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './Messages.css';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [members, setMembers] = useState({});
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    loadConversations();
    loadMembers();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMembers() {
    const snap = await getDocs(collection(db, 'users'));
    const map = {};
    snap.docs.forEach(d => { map[d.id] = d.data(); });
    setMembers(map);
  }

  function loadConversations() {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setConversations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }

  function openConversation(conv) {
    setActiveConv(conv);
    if (unsubRef.current) unsubRef.current();
    const q = query(
      collection(db, 'conversations', conv.id, 'messages'),
      orderBy('createdAt', 'asc')
    );
    unsubRef.current = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }

  async function sendMessage() {
    if (!newMsg.trim() || !activeConv) return;
    const text = newMsg.trim();
    setNewMsg('');
    await addDoc(collection(db, 'conversations', activeConv.id, 'messages'), {
      text, senderId: user.uid, createdAt: serverTimestamp()
    });
    await setDoc(doc(db, 'conversations', activeConv.id), {
      lastMessage: text, lastMessageAt: serverTimestamp(), lastSenderId: user.uid
    }, { merge: true });
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function getOtherParticipant(conv) {
    const otherId = conv.participants.find(p => p !== user.uid);
    return { id: otherId, ...( members[otherId] || {}) };
  }

  function initials(member) {
    const name = member?.displayName || member?.email || 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function formatTime(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return (
    <div className="messages-page">
      {/* Sidebar */}
      <div className="messages-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-eyebrow">DIRECT</span>
          <h2 className="sidebar-title">Messages</h2>
        </div>

        {loading ? (
          <div className="conv-loading">
            {[1,2,3].map(i => <div key={i} className="conv-skeleton" />)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="conv-empty">
            <span className="empty-icon-sm">◈</span>
            <p>No conversations yet.<br />Connect with members to message.</p>
          </div>
        ) : (
          <div className="conv-list">
            {conversations.map(conv => {
              const other = getOtherParticipant(conv);
              const isActive = activeConv?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  className={`conv-item ${isActive ? 'active' : ''}`}
                  onClick={() => openConversation(conv)}
                >
                  <div className="conv-avatar">{initials(other)}</div>
                  <div className="conv-info">
                    <div className="conv-name">{other.displayName || other.email?.split('@')[0] || 'Member'}</div>
                    <div className="conv-preview">{conv.lastMessage || 'Start a conversation'}</div>
                  </div>
                  {conv.lastMessageAt && (
                    <div className="conv-time">{formatTime(conv.lastMessageAt)}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="messages-main">
        {!activeConv ? (
          <div className="no-conv-selected">
            <div className="no-conv-icon">◈</div>
            <h3>Intelligence in Circulation</h3>
            <p>Select a conversation to begin.</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              {(() => {
                const other = getOtherParticipant(activeConv);
                return (
                  <>
                    <div className="chat-avatar">{initials(other)}</div>
                    <div>
                      <div className="chat-name">{other.displayName || other.email?.split('@')[0]}</div>
                      {other.title && <div className="chat-title">{other.title}</div>}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="chat-messages">
              {messages.map((msg, i) => {
                const isMine = msg.senderId === user.uid;
                const showAvatar = !isMine && (i === 0 || messages[i-1]?.senderId !== msg.senderId);
                return (
                  <div key={msg.id} className={`msg-row ${isMine ? 'mine' : 'theirs'}`}>
                    {!isMine && (
                      <div className={`msg-avatar-sm ${showAvatar ? '' : 'hidden'}`}>
                        {showAvatar ? initials(getOtherParticipant(activeConv)) : ''}
                      </div>
                    )}
                    <div className="msg-bubble">
                      <span className="msg-text">{msg.text}</span>
                      <span className="msg-time">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <textarea
                className="chat-input"
                placeholder="Write a message..."
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
              />
              <button
                className="chat-send"
                onClick={sendMessage}
                disabled={!newMsg.trim()}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
