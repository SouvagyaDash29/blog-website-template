import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, getDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import sanitizeHtml from 'sanitize-html';
import './NewsEventForm.css';

const MAX_CHUNK_SIZE = 900000; // Increased to 900 KB to reduce chunking overhead

const NewsEventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    coverImagePath: '',
    category: 'news',
    content: ''
  });

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: function() {
          const imagePath = prompt('Enter image path (e.g., folder/image.jpg):');
          if (imagePath) {
            const fullImageUrl = `https://cdn.jsdelivr.net/gh/AtomwalkCodeBase/Blogs@main/${imagePath}`;
            const range = this.quill.getSelection();
            this.quill.insertEmbed(range.index, 'image', fullImageUrl);
          }
        }
      }
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list',
    'link',
    'image'
  ];

  useEffect(() => {
    if (id) {
      const fetchItem = async () => {
        try {
          const [metadataDoc, contentDoc] = await Promise.all([
            getDoc(doc(db, 'articles_metadata', id)),
            getDoc(doc(db, 'articles_content', id))
          ]);

          if (metadataDoc.exists() && contentDoc.exists()) {
            const metadata = metadataDoc.data();
            const content = contentDoc.data();
            setFormData({
              title: metadata.title,
              tagline: metadata.tagline,
              coverImagePath: metadata.coverImage.replace('https://cdn.jsdelivr.net/gh/AtomwalkCodeBase/Blogs@main/', ''),
              category: metadata.category,
              content: content.chunks ? content.chunks.join('') : content.content
            });
          }
        } catch (error) {
          console.error('Error fetching news/event:', error);
          alert('Error loading item. Please try again.');
        }
      };

      fetchItem();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
  };

  const fixListStructure = (content) => {
    // Parse the content as HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const listItems = doc.querySelectorAll('li[data-list]');
    
    let currentList = null;
    let currentListType = null;
    const fragment = document.createDocumentFragment();

    listItems.forEach((li, index) => {
      const listType = li.getAttribute('data-list');
      
      // If list type changes or it's the first item, create a new list
      if (listType !== currentListType) {
        if (currentList) {
          fragment.appendChild(currentList);
        }
        currentList = document.createElement(listType === 'bullet' ? 'ul' : 'ol');
        currentListType = listType;
      }

      // Clean up the li element
      li.removeAttribute('data-list');
      li.querySelectorAll('.ql-ui').forEach(span => span.remove());
      if (li.innerHTML.trim() === '<br>' || !li.innerHTML.trim()) {
        return; // Skip empty list items
      }

      currentList.appendChild(li);
    });

    // Append the last list if it exists
    if (currentList) {
      fragment.appendChild(currentList);
    }

    // Replace the original list with the fixed structure
    const originalList = doc.querySelector('ol, ul');
    if (originalList) {
      originalList.replaceWith(fragment);
    }

    // Serialize back to HTML and sanitize
    const sanitizedContent = sanitizeHtml(doc.body.innerHTML, {
      allowedTags: ['p', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'strong', 'em', 'a', 'img', 'br'],
      allowedAttributes: {
        a: ['href'],
        img: ['src', 'alt']
      }
    });

    return sanitizedContent;
  };

  const splitContentIntoChunks = (content) => {
    const chunks = [];
    let currentChunk = '';
    const paragraphs = content.split('</p>');
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i] + (paragraphs[i] ? '</p>' : '');
      if ((currentChunk + paragraph).length > MAX_CHUNK_SIZE) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = paragraph;
      } else {
        currentChunk += paragraph;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const articleId = id || doc(collection(db, 'articles_metadata')).id;
      const coverImageUrl = `https://cdn.jsdelivr.net/gh/AtomwalkCodeBase/Blogs@main/${formData.coverImagePath}`;

      // Fix list structure before saving
      const fixedContent = fixListStructure(formData.content);

      // Save metadata
      await setDoc(doc(db, 'articles_metadata', articleId), {
        title: formData.title,
        tagline: formData.tagline,
        coverImage: coverImageUrl,
        category: formData.category,
        publishedAt: serverTimestamp()
      });

      // Split content into chunks if needed
      const contentChunks = splitContentIntoChunks(fixedContent);

      // Save content chunks
      await setDoc(doc(db, 'articles_content', articleId), {
        articleId,
        type: 'richText',
        updatedAt: serverTimestamp(),
        totalChunks: contentChunks.length,
        chunks: contentChunks
      });

      navigate(`/news-events/${articleId}`);
    } catch (error) {
      console.error('Error saving news/event:', error);
      alert('Error saving item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="news-event-form">
      <h2>{id ? 'Edit News/Event' : 'Create News/Event'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={!!id}
          >
            <option value="news">News</option>
            <option value="event">Event</option>
          </select>
        </div>

        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Tagline</label>
          <input
            type="text"
            name="tagline"
            value={formData.tagline}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Cover Image Path (e.g., folder/image.jpg)</label>
          <input
            type="text"
            name="coverImagePath"
            value={formData.coverImagePath}
            onChange={handleChange}
            placeholder="folder/image.jpg"
            required
          />
        </div>

        <div className="form-group">
          <label>Content</label>
          <div className="editor-container">
            <ReactQuill
              value={formData.content}
              onChange={handleContentChange}
              modules={modules}
              formats={formats}
              className="rich-text-editor"
            />
            <div className="editor-help">
              <p>To add an image:</p>
              <ol>
                <li>Click the image icon in the toolbar</li>
                <li>Enter the image path (e.g., folder/image.jpg)</li>
                {/* <li>The image will be loaded from: https://cdn.jsdelivr.net/gh/AtomwalkCodeBase/Blogs@main/your-image-path</li> */}
              </ol>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (id ? 'Update' : 'Create')}
          </button>
          <button type="button" onClick={() => navigate('/news-events')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewsEventForm;