import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, orderBy, query, updateDoc, doc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import './Feed.css';

export default function Feed() {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [articles, setArticles] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [bookmarks, setBookmarks] = useState([]);

  // Article compose state
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articleForm, setArticleForm] = useState({ title: '', body: '' });
  const [publishingArticle, setPublishingArticle] = useState(false);

  useEffect(() => {
    loadPosts();
    loadArticles();
    loadBookmarks();
  }, []);

  const loadPosts = async () => {
    try {
      const q = query(collection(db, 'posts'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async () => {
    try {
      const q = query(collection(db, 'articles'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const loadBookmarks = async () => {
    try {
      const q = query(collection(db, 'bookmarks'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      const myBookmarks = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(b => b.user_id === user.uid);
      setBookmarks(myBookmarks.map(b => b.post_id));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() || posting) return;
    setPosting(true);
    try {
      const postData = {
        content: newPost,
        author_id: user.uid,
        author_name: userProfile?.full_name || 'Member',
        author_title: userProfile?.title || '',
        author_company: userProfile?.company || '',
        author_image: userProfile?.profile_image || null,
        likes: [],
        comment_count: 0,
        created_at: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'posts'), postData);
      setPosts(prev => [{ id: docRef.id, ...postData, created_at: new Date() }, ...prev]);
      setNewPost('');
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handlePublishArticle = async () => {
    if (!articleForm.title.trim() || !articleForm.body.trim() || publishingArticle) return;
    setPublishingArticle(true);
    try {
      const articleData = {
        title: articleForm.title,
        body: articleForm.body,
        author_id: user.uid,
        author_name: userProfile?.full_name || 'Member',
        author_title: userProfile?.title || '',
        author_company: userProfile?.company || '',
        author_image: userProfile?.profile_image || null,
        likes: [],
        created_at: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'articles'), articleData);
      setArticles(prev => [{ id: docRef.id, ...articleData, created_at: new Date() }, ...prev]);
      setArticleForm({ title: '', body: '' });
      setShowArticleForm(false);
      setActiveTab('articles');
    } catch (err) {
      console.error(err);
    } finally {
      setPublishingArticle(false);
    }
  };

  const handleLike = async (postId, likes) => {
    const postRef = doc(db, 'posts', postId);
    const liked = likes?.includes(user.uid);
    await updateDoc(postRef, { likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid) });
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p, likes: liked ? p.likes.filter(id => id !== user.uid) : [...(p.likes || []), user.uid]
    } : p));
  };

  const handleBookmark = async (postId) => {
    const isBookmarked = bookmarks.includes(postId);
    if (isBookmarked) {
      setBookmarks(prev => prev.filter(id => id !== postId));
    } else {
      await addDoc(collection(db, 'bookmarks'), {
        post_id: postId, user_id: user.uid, created_at: serverTimestamp()
      });
      setBookmarks(prev => [...prev, postId]);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return 'just now';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const bookmarkedPosts = posts.filter(p => bookmarks.includes(p.id));

  return (
    <div className="feed-page">

      {/* Compose — shows different form based on active tab */}
      {activeTab === 'articles' && showArticleForm ? (
        <div className="article-compose">
          <div className="article-compose-header">
            <span>New Article</span>
            <button className="article-cancel" onClick={() => setShowArticleForm(false)}>Cancel</button>
          </div>
          <input
            className="article-title-input"
            placeholder="Article title..."
            value={articleForm.title}
            onChange={e => setArticleForm(p => ({ ...p, title: e.target.value }))}
          />
          <textarea
            className="article-body-input"
            placeholder="Write your article..."
            value={articleForm.body}
            onChange={e => setArticleForm(p => ({ ...p, body: e.target.value }))}
            rows={10}
          />
          <div className="compose-footer">
            <button className="compose-btn" onClick={handlePublishArticle} disabled={!articleForm.title.trim() || !articleForm.body.trim() || publishingArticle}>
              {publishingArticle ? 'PUBLISHING...' : 'PUBLISH'}
            </button>
          </div>
        </div>
      ) : (
        <div className="compose-card">
          <div className="compose-avatar">
            {userProfile?.profile_image ? (
              <img src={userProfile.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              userProfile?.full_name?.charAt(0) || 'U'
            )}
          </div>
          <div className="compose-content">
            <textarea
              className="compose-input"
              placeholder={activeTab === 'articles' ? 'Start a new article...' : 'Share an insight with your circle...'}
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              rows={3}
            />
            <div className="compose-footer">
              {activeTab === 'articles' ? (
                <button className="compose-btn" onClick={() => setShowArticleForm(true)}>
                  WRITE ARTICLE
                </button>
              ) : (
                <button className="compose-btn" onClick={handlePost} disabled={!newPost.trim() || posting}>
                  {posting ? 'POSTING...' : 'POST'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="feed-tabs">
        <button className={`feed-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>Posts</button>
        <button className={`feed-tab ${activeTab === 'articles' ? 'active' : ''}`} onClick={() => setActiveTab('articles')}>
          Articles {articles.length > 0 && `(${articles.length})`}
        </button>
        <button className={`feed-tab ${activeTab === 'bookmarks' ? 'active' : ''}`} onClick={() => setActiveTab('bookmarks')}>
          Saved {bookmarks.length > 0 && `(${bookmarks.length})`}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="feed-loading">Loading...</div>
      ) : (
        <>
          {/* POSTS TAB */}
          {activeTab === 'posts' && (
            <div className="posts-list">
              {posts.length === 0 ? (
                <div className="feed-empty">
                  <div className="empty-icon">◈</div>
                  <h3>Your Feed Awaits</h3>
                  <p>Share your first insight</p>
                </div>
              ) : posts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-avatar">
                      {post.author_image ? (
                        <img src={post.author_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : post.author_name?.charAt(0) || 'M'}
                    </div>
                    <div className="post-author-info">
                      <div className="post-author-name">{post.author_name}</div>
                      <div className="post-author-meta">{post.author_title}{post.author_title && post.author_company ? ' · ' : ''}{post.author_company}</div>
                      <div className="post-time">{formatTime(post.created_at)}</div>
                    </div>
                  </div>
                  <div className="post-content">{post.content}</div>
                  <div className="post-actions">
                    <button className={`post-action ${post.likes?.includes(user.uid) ? 'liked' : ''}`} onClick={() => handleLike(post.id, post.likes)}>
                      ♦ {post.likes?.length || 0}
                    </button>
                    <button className="post-action">◻ {post.comment_count || 0}</button>
                    <button className={`post-action ${bookmarks.includes(post.id) ? 'liked' : ''}`} onClick={() => handleBookmark(post.id)}>
                      {bookmarks.includes(post.id) ? '★ Saved' : '☆ Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ARTICLES TAB */}
          {activeTab === 'articles' && (
            <div className="posts-list">
              {articles.length === 0 ? (
                <div className="feed-empty">
                  <div className="empty-icon">◈</div>
                  <h3>No Articles Yet</h3>
                  <p>Share long-form insights with the circle</p>
                </div>
              ) : articles.map(article => (
                <div key={article.id} className="article-card">
                  <div className="post-header">
                    <div className="post-avatar">
                      {article.author_image ? (
                        <img src={article.author_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : article.author_name?.charAt(0) || 'M'}
                    </div>
                    <div className="post-author-info">
                      <div className="post-author-name">{article.author_name}</div>
                      <div className="post-author-meta">{article.author_title}{article.author_title && article.author_company ? ' · ' : ''}{article.author_company}</div>
                      <div className="post-time">{formatTime(article.created_at)}</div>
                    </div>
                  </div>
                  <div className="article-title">{article.title}</div>
                  <div className="article-body">{article.body}</div>
                  <div className="post-actions">
                    <button className={`post-action ${article.likes?.includes(user.uid) ? 'liked' : ''}`}>
                      ♦ {article.likes?.length || 0}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SAVED TAB */}
          {activeTab === 'bookmarks' && (
            <div className="posts-list">
              {bookmarkedPosts.length === 0 ? (
                <div className="feed-empty">
                  <div className="empty-icon">◈</div>
                  <h3>No Saved Posts</h3>
                  <p>Save posts to read later</p>
                </div>
              ) : bookmarkedPosts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-avatar">
                      {post.author_image ? (
                        <img src={post.author_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : post.author_name?.charAt(0) || 'M'}
                    </div>
                    <div className="post-author-info">
                      <div className="post-author-name">{post.author_name}</div>
                      <div className="post-author-meta">{post.author_title}{post.author_title && post.author_company ? ' · ' : ''}{post.author_company}</div>
                      <div className="post-time">{formatTime(post.created_at)}</div>
                    </div>
                  </div>
                  <div className="post-content">{post.content}</div>
                  <div className="post-actions">
                    <button className={`post-action ${post.likes?.includes(user.uid) ? 'liked' : ''}`} onClick={() => handleLike(post.id, post.likes)}>
                      ♦ {post.likes?.length || 0}
                    </button>
                    <button className="post-action">◻ {post.comment_count || 0}</button>
                    <button className="post-action liked" onClick={() => handleBookmark(post.id)}>★ Saved</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}


