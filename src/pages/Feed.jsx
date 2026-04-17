import { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './Feed.css';

export default function Feed() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  async function submitPost() {
    if (!text.trim() || posting) return;
    setPosting(true);
    await addDoc(collection(db, 'posts'), {
      text: text.trim(),
      authorId: user.uid,
      authorName: profile?.displayName || user.displayName || user.email,
      authorTitle: profile?.title || '',
      type: 'post',
      likes: [],
      createdAt: serverTimestamp(),
    });
    setText('');
    setPosting(false);
  }

  async function toggleLike(post) {
    const ref = doc(db, 'posts', post.id);
    const liked = post.likes?.includes(user.uid);
    await updateDoc(ref, { likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid) });
  }

  const initials = (name) => (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const articles = posts.filter(p => p.type === 'article');
  const regularPosts = posts.filter(p => p.type !== 'article');

  return (
    <div className="feed-page">
      <div className="feed-container">
        {/* Composer */}
        <div className="composer">
          <div className="composer-avatar">{initials(profile?.displayName || user?.displayName)}</div>
          <div className="composer-body">
            <textarea
              className="composer-input"
              placeholder="Share an insight with your circle..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
            />
            <div className="composer-footer">
              <button className="post-btn" onClick={submitPost} disabled={!text.trim() || posting}>
                {posting ? 'Posting...' : 'POST'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="feed-tabs">
          {['posts', 'articles'].map(tab => (
            <button key={tab} className={`feed-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="posts-list">
          {(activeTab === 'posts' ? regularPosts : articles).map(post => {
            const liked = post.likes?.includes(user?.uid);
            return (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-avatar">{initials(post.authorName)}</div>
                  <div className="post-meta">
                    <span className="post-author">{post.authorName}</span>
                    {post.authorTitle && <span className="post-author-title">{post.authorTitle}</span>}
                    <span className="post-time">{post.createdAt?.toDate?.()?.toLocaleDateString() || ''}</span>
                  </div>
                </div>
                <p className="post-text">{post.text}</p>
                <div className="post-actions">
                  <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={() => toggleLike(post)}>
                    {liked ? '♦' : '◇'} {post.likes?.length || 0}
                  </button>
                </div>
              </div>
            );
          })}
          {(activeTab === 'posts' ? regularPosts : articles).length === 0 && (
            <div className="feed-empty">
              <div className="empty-icon">◈</div>
              <p>Your Feed Awaits</p>
              <span>Share your first insight</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
