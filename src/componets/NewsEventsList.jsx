import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import './NewsEventsList.css';

const NewsEventsList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const q = query(
          collection(db, 'articles_metadata'),
          orderBy('publishedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const itemsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          publishedAt: doc.data().publishedAt?.toDate()
        }));
        setItems(itemsList);
      } catch (error) {
        console.error('Error fetching news and events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="news-events-list">
      <h2>News & Events</h2>
      <div className="items-grid">
        {items.map(item => (
          <div
            key={item.id}
            className="item-card"
            onClick={() => navigate(`/news-events/${item.id}`)}
          >
            <div className="item-image">
              <img src={item.coverImage} alt={item.title} />
              <span className={`category-badge ${item.category}`}>
                {item.category}
              </span>
            </div>
            <div className="item-content">
              <h3>{item.title}</h3>
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
        ))}
      </div>
    </div>
  );
};

export default NewsEventsList; 