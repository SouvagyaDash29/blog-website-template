import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import sanitizeHtml from 'sanitize-html'; // Add sanitize-html
import './NewsEventDetail.css';

const NewsEventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const [metadataDoc, contentDoc] = await Promise.all([
          getDoc(doc(db, 'articles_metadata', id)),
          getDoc(doc(db, 'articles_content', id))
        ]);

        if (metadataDoc.exists() && contentDoc.exists()) {
          const content = contentDoc.data();
          // Combine chunks if they exist
          const fullContent = content.chunks ? content.chunks.join('') : content.content;
          // Sanitize content
          const sanitizedContent = sanitizeHtml(fullContent, {
            allowedTags: ['p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'strong', 'em', 'a', 'img', 'br'],
            allowedAttributes: {
              a: ['href'],
              img: ['src', 'alt']
            }
          });
          console.log('Sanitized content:', sanitizedContent); // Debug content
          
          setItem({
            id,
            ...metadataDoc.data(),
            content: sanitizedContent,
            publishedAt: metadataDoc.data().publishedAt?.toDate()
          });
        } else {
          navigate('/news-events');
        }
      } catch (error) {
        console.error('Error fetching news/event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!item) {
    return <div className="error">Item not found</div>;
  }

  return (
    <div className="news-event-detail">
      <div className="header">
        <div className="cover-image">
          <img src={item.coverImage} alt={item.title} />
          <span className={`category-badge ${item.category}`}>
            {item.category}
          </span>
        </div>
        <div className="header-content">
          <h1>{item.title}</h1>
          <p className="tagline">{item.tagline}</p>
          <p className="date">
            {item.publishedAt?.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      <div className="content">
        <div 
          className="rich-text-content"
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      </div>
    </div>
  );
};

export default NewsEventDetail;