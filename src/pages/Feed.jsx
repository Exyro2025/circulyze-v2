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
  const [articleTitle, setArticleTitle] = useState('');
  const [articleBody, setArticleBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [postSnap, articleSnap, bookmarkSnap] = await Promise.all([
        getDocs(query(collection(db, 'posts'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'articles'), orderBy('created_at', 'desc'))),
        getDocs(collection(db, 'bookmarks')),
      ]);
      setPosts(postSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setArticles(articleSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const mine = bookmarkSnap.docs.map(d => d.data()).filter(b => b.user_id === user.uid);
      setBookmarks(mine.map(b => b.post_id));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handlePost = async () => {
    if (!newPost.trim() || posting) return;
    setPosting(true);
    try {
      const data = {
        content: newPost,
        author_id: user.uid,
        author_name: userProfile?.full_name || 'Member',
        author_title: userProfile?.title || '',
        author_company: userProfile?.company || '',
        author_image: userProfile?.profile_image || null,
        likes: [], comment_count: 0,
        created_at: serverTimestamp()
      };
      const ref = await addDoc(collection(db, 'posts'), data);
      setPosts(prev => [{ id: ref.id, ...data, created_at: new Date() }, ...prev]);
      setNewPost('');
    } catch (err) { console.error(err); }
    finally { setPosting(false); }
  };

  const handlePublish = async () => {
    if (!articleTitle.trim() || !articleBody.trim() || publishing) return;
    setPublishing(true);
    try {
      const data = {
        title: articleTitle, body: articleBody,
        author_id: user.uid,
        author_name: userProfile?.full_name || 'Member',
        author_title: userProfile?.title || '',
        author_company: userProfile?.company || '',
        author_image: userProfile?.profile_image || null,
        likes: [], created_at: serverTimestamp()
      };
      const ref = await addDoc(collection(db, 'articles'), data);
      setArticles(prev => [{ id: ref.id, ...data, created_at: new Date() }, ...prev]);
      setArticleTitle('');
      setArticleBody('');
    } catch (err) { console.error(err); }
    finally { setPublishing(false); }
  };

  const handleLike = async (postId, likes) => {
    const liked = likes?.includes(user.uid);
    await updateDoc(doc(db, 'posts', postId), {
      likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p, likes: liked ? p.likes.filter(id => id !== user.uid) : [...(p.likes || []), user.uid]
    } : p));
  };

  const handleBookmark = async (postId) => {
    const isBookmarked = bookmarks.includes(postId);
    if (isBookmarked) {
      setBookmarks(prev => prev.filter(id => id !== postId));
    } else {
      await addDoc(collection(db, 'bookmarks'), { post_id: postId, user_id: user.uid, created_at: serverTimestamp() });
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

      {/* POST COMPOSE */}
      {activeTab === 'posts' && (
        <div className="compose-card">
          <div className="compose-avatar">
            {userProfile?.profile_image
              ? <img src={userProfile.profile_image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
              : userProfile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="compose-content">
            <textarea
              className="compose-input"
              placeholder="Share an insight with your circle..."
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              rows={3}
            />
            <div className="compose-footer">
              <button className="compose-btn" onClick={handlePost} disabled={!newPost.trim() || posting}>
                {posting ? 'POSTING...' : 'POST'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARTICLE COMPOSE */}
      {activeTab === 'articles' && (
        <div className="article-compose">
          <input
            className="article-title-input"
            placeholder="Article title..."
            value={articleTitle}
            onChange={e => setArticleTitle(e.target.value)}
          />
          <textarea
            className="article-body-input"
            placeholder="Write your article..."
            value={articleBody}
            onChange={e => setArticleBody(e.target.value)}
            rows={6}
          />
          <div className="compose-footer">
            <button className="compose-btn" onClick={handlePublish} disabled={!articleTitle.trim() || !articleBody.trim() || publishing}>
              {publishing ? 'PUBLISHING...' : 'PUBLISH ARTICLE'}
            </button>
          </div>
        </div>
      )}

      {/* TABS */}
      <div className="feed-tabs">
        <button className={`feed-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>Posts</button>
        <button className={`feed-tab ${activeTab === 'articles' ? 'active' : ''}`} onClick={() => setActiveTab('articles')}>
          Articles {articles.length > 0 && `(${articles.length})`}
        </button>
        <button className={`feed-tab ${activeTab === 'bookmarks' ? 'active' : ''}`} onClick={() => setActiveTab('bookmarks')}>
          Saved {bookmarks.length > 0 && `(${bookmarks.length})`}
        </button>
      </div>

      {loading ? <div className="feed-loading">Loading...</div> : (
        <>
          {activeTab === 'posts' && (
            <div className="posts-list">
              {posts.length === 0 ? (
                <div className="feed-empty"><div className="empty-icon">◈</div><h3>Your Feed Awaits</h3><p>Share your first insight</p></div>
              ) : posts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-avatar">
                      {post.author_image ? <img src={post.author_image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} /> : post.author_name?.charAt(0) || 'M'}
                    </div>
                    <div className="post-author-info">
                      <div className="post-author-name">{post.author_name}</div>
                      <div className="post-author-meta">{post.author_title}{post.author_title && post.author_company ? ' · ' : ''}{post.author_company}</div>
                      <div className="post-time">{formatTime(post.created_at)}</div>
                    </div>
                  </div>
                  <div className="post-content">{post.content}</div>
                  <div className="post-actions">
                    <button className={`post-action ${post.likes?.includes(user.uid) ? 'liked' : ''}`} onClick={() => handleLike(post.id, post.likes)}>♦ {post.likes?.length || 0}</button>
                    <button className="post-action">◻ {post.comment_count || 0}</button>
                    <button className={`post-action ${bookmarks.includes(post.id) ? 'liked' : ''}`} onClick={() => handleBookmark(post.id)}>
                      {bookmarks.includes(post.id) ? '★ Saved' : '☆ Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'articles' && (
            <div className="posts-list">
              {articles.length === 0 ? (
                <div className="feed-empty"><div className="empty-icon">◈</div><h3>No Articles Yet</h3><p>Share long-form insights with the circle</p></div>
              ) : articles.map(article => (
                <div key={article.id} className="article-card">
                  <div className="post-header">
                    <div className="post-avatar">
                      {article.author_image ? <img src={article.author_image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} /> : article.author_name?.charAt(0) || 'M'}
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
                    <button className="post-action">♦ {article.likes?.length || 0}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div className="posts-list">
              {bookmarkedPosts.length === 0 ? (
                <div className="feed-empty"><div className="empty-icon">◈</div><h3>No Saved Posts</h3><p>Save posts to read later</p></div>
              ) : bookmarkedPosts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-avatar">
                      {post.author_image ? <img src={post.author_image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} /> : post.author_name?.charAt(0) || 'M'}
                    </div>
                    <div className="post-author-info">
                      <div className="post-author-name">{post.author_name}</div>
                      <div className="post-author-meta">{post.author_title}{post.author_title && post.author_company ? ' · ' : ''}{post.author_company}</div>
                      <div className="post-time">{formatTime(post.created_at)}</div>
                    </div>
                  </div>
                  <div className="post-content">{post.content}</div>
                  <div className="post-actions">
                    <button className={`post-action ${post.likes?.includes(user.uid) ? 'liked' : ''}`} onClick={() => handleLike(post.id, post.likes)}>♦ {post.likes?.length || 0}</button>
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



