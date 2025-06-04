import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, collection, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const ArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [articleType, setArticleType] = useState('news'); // 'news' or 'event'
  
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    coverImagePath: '',
    sections: [],
    category: 'news'
  });

  useEffect(() => {
    if (id) {
      const fetchArticle = async () => {
        try {
          const [metadataDoc, contentDoc] = await Promise.all([
            getDoc(doc(db, 'articles_metadata', id)),
            getDoc(doc(db, 'articles_content', id))
          ]);

          if (metadataDoc.exists() && contentDoc.exists()) {
            const metadata = metadataDoc.data();
            const content = contentDoc.data();
            setArticleType(metadata.category);
            
            setFormData({
              title: metadata.title,
              tagline: metadata.tagline,
              coverImagePath: metadata.coverImage.replace('https://cdn.jsdelivr.net/gh/AtomwalkCodeBase/Blogs@main/', ''),
              sections: content.sections,
              category: metadata.category
            });
          }
        } catch (error) {
          console.error('Error fetching article:', error);
          alert('Error loading article. Please try again.');
        }
      };

      fetchArticle();
    }
  }, [id]);

  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { title: '', subtitle: '', contents: [] }]
    }));
  };

  const removeSection = (index) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const updateSection = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  const addContent = (sectionIndex, type) => {
    const newContent = {
      type,
      data: type === 'paragraph' || type === 'image' || type === 'richText' ? '' : []
    };
    
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex ? {
          ...section,
          contents: [...section.contents, newContent]
        } : section
      )
    }));
  };

  const removeContent = (sectionIndex, contentIndex) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex ? {
          ...section,
          contents: section.contents.filter((_, j) => j !== contentIndex)
        } : section
      )
    }));
  };

  const updateContent = (sectionIndex, contentIndex, value) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex ? {
          ...section,
          contents: section.contents.map((content, j) => 
            j === contentIndex ? { ...content, data: value } : content
          )
        } : section
      )
    }));
  };

  const handleListItemChange = (sectionIndex, contentIndex, itemIndex, value) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex ? {
          ...section,
          contents: section.contents.map((content, j) => 
            j === contentIndex ? {
              ...content,
              data: content.data.map((item, k) => k === itemIndex ? value : item)
            } : content
          )
        } : section
      )
    }));
  };

  const addListItem = (sectionIndex, contentIndex) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex ? {
          ...section,
          contents: section.contents.map((content, j) => 
            j === contentIndex ? {
              ...content,
              data: [...content.data, '']
            } : content
          )
        } : section
      )
    }));
  };

  const removeListItem = (sectionIndex, contentIndex, itemIndex) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex ? {
          ...section,
          contents: section.contents.map((content, j) => 
            j === contentIndex ? {
              ...content,
              data: content.data.filter((_, k) => k !== itemIndex)
            } : content
          )
        } : section
      )
    }));
  };

  const formatText = (text, format) => {
    switch (format) {
      case 'bold':
        return `<strong>${text}</strong>`;
      case 'italic':
        return `<em>${text}</em>`;
      case 'underline':
        return `<u>${text}</u>`;
      case 'h1':
        return `<h1>${text}</h1>`;
      case 'h2':
        return `<h2>${text}</h2>`;
      // case 'ul':
      //   return `<ul><li>${text}</li></ul>`;
      // case 'ol':
      //   return `<ol><li>${text}</li></ol>`;
      default:
        return text;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const articleId = id || doc(collection(db, 'articles_metadata')).id;
      const coverImageUrl = `https://cdn.jsdelivr.net/gh/AtomwalkCodeBase/Blogs@main/${formData.coverImagePath}`;

      // Save article metadata
      await setDoc(doc(db, 'articles_metadata', articleId), {
        title: formData.title,
        tagline: formData.tagline,
        coverImage: coverImageUrl,
        category: articleType,
        publishedAt: serverTimestamp()
      });

      // Process sections to convert image paths to full URLs
      const processedSections = formData.sections.map(section => ({
        ...section,
        contents: section.contents.map(content => ({
          ...content,
          data: content.type === 'image' 
            ? `https://cdn.jsdelivr.net/gh/AtomwalkCodeBase/Blogs@main/${content.data}`
            : content.data
        }))
      }));

      // Save article content
      await setDoc(doc(db, 'articles_content', articleId), {
        articleId,
        header: {
          title: formData.title,
          tagline: formData.tagline,
          coverImage: coverImageUrl
        },
        sections: processedSections,
        summary: formData.tagline,
        category: articleType
      });

      navigate(`/${articleType}/${articleId}`);
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Error saving article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderContentForm = (content, sectionIndex, contentIndex) => {
    switch (content.type) {
      case 'paragraph':
        return (
          <textarea
            value={content.data}
            onChange={(e) => updateContent(sectionIndex, contentIndex, e.target.value)}
            placeholder="Enter paragraph text..."
            rows={4}
          />
        );
      case 'richText':
        return (
          <div className="rich-text-editor">
            <div className="formatting-toolbar">
              <button type="button" onClick={() => {
                const text = content.data;
                const selection = window.getSelection();
                const selectedText = selection.toString();
                if (selectedText) {
                  const newText = text.replace(selectedText, formatText(selectedText, 'bold'));
                  updateContent(sectionIndex, contentIndex, newText);
                }
              }}>Bold</button>
              <button type="button" onClick={() => {
                const text = content.data;
                const selection = window.getSelection();
                const selectedText = selection.toString();
                if (selectedText) {
                  const newText = text.replace(selectedText, formatText(selectedText, 'italic'));
                  updateContent(sectionIndex, contentIndex, newText);
                }
              }}>Italic</button>
              <button type="button" onClick={() => {
                const text = content.data;
                const selection = window.getSelection();
                const selectedText = selection.toString();
                if (selectedText) {
                  const newText = text.replace(selectedText, formatText(selectedText, 'underline'));
                  updateContent(sectionIndex, contentIndex, newText);
                }
              }}>Underline</button>
              <button type="button" onClick={() => {
                const text = content.data;
                const selection = window.getSelection();
                const selectedText = selection.toString();
                if (selectedText) {
                  const newText = text.replace(selectedText, formatText(selectedText, 'h1'));
                  updateContent(sectionIndex, contentIndex, newText);
                }
              }}>H1</button>
              <button type="button" onClick={() => {
                const text = content.data;
                const selection = window.getSelection();
                const selectedText = selection.toString();
                if (selectedText) {
                  const newText = text.replace(selectedText, formatText(selectedText, 'h2'));
                  updateContent(sectionIndex, contentIndex, newText);
                }
              }}>H2</button>
              {/* <button type="button" onClick={() => {
                const text = content.data;
                const selection = window.getSelection();
                const selectedText = selection.toString();
                if (selectedText) {
                  const newText = text.replace(selectedText, formatText(selectedText, 'ul'));
                  updateContent(sectionIndex, contentIndex, newText);
                }
              }}>Bullet List</button>
              <button type="button" onClick={() => {
                const text = content.data;
                const selection = window.getSelection();
                const selectedText = selection.toString();
                if (selectedText) {
                  const newText = text.replace(selectedText, formatText(selectedText, 'ol'));
                  updateContent(sectionIndex, contentIndex, newText);
                }
              }}>Numbered List</button> */}
            </div>
            <textarea
              value={content.data}
              onChange={(e) => updateContent(sectionIndex, contentIndex, e.target.value)}
              placeholder="Enter rich text content..."
              rows={6}
              className="rich-textarea"
            />
            <div className="preview" dangerouslySetInnerHTML={{ __html: content.data }} />
          </div>
        );
      case 'image':
        return (
          <input
            type="text"
            value={content.data}
            onChange={(e) => updateContent(sectionIndex, contentIndex, e.target.value)}
            placeholder="folder/image.jpg"
          />
        );
      case 'bullets':
      case 'steps':
        return (
          <div className="list-items">
            {content.data.map((item, itemIndex) => (
              <div key={itemIndex} className="list-item">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleListItemChange(sectionIndex, contentIndex, itemIndex, e.target.value)}
                  placeholder={`${content.type === 'bullets' ? 'Bullet' : 'Step'} ${itemIndex + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeListItem(sectionIndex, contentIndex, itemIndex)}
                  className="remove-btn"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addListItem(sectionIndex, contentIndex)}
              className="add-btn"
            >
              Add {content.type === 'bullets' ? 'Bullet' : 'Step'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="article-form">
      <h2>{id ? 'Edit Article' : 'Create New Article'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Article Type</label>
          <select
            value={articleType}
            onChange={(e) => setArticleType(e.target.value)}
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
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Tagline</label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Cover Image Path (e.g., folder/image.jpg)</label>
          <input
            type="text"
            value={formData.coverImagePath}
            onChange={(e) => setFormData(prev => ({ ...prev, coverImagePath: e.target.value }))}
            placeholder="folder/image.jpg"
            required
          />
        </div>

        <div className="sections">
          <h3>Sections</h3>
          {formData.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="section-form">
              <div className="section-header">
                <h4>Section {sectionIndex + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeSection(sectionIndex)}
                  className="remove-btn"
                >
                  Remove Section
                </button>
              </div>

              <div className="form-group">
                <label>Section Title (optional)</label>
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Section Subtitle (optional)</label>
                <input
                  type="text"
                  value={section.subtitle}
                  onChange={(e) => updateSection(sectionIndex, 'subtitle', e.target.value)}
                />
              </div>

              <div className="contents">
                <h5>Content Blocks</h5>
                {section.contents.map((content, contentIndex) => (
                  <div key={contentIndex} className="content-form">
                    <div className="content-header">
                      <span>Type: {content.type}</span>
                      <button
                        type="button"
                        onClick={() => removeContent(sectionIndex, contentIndex)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="content-body">
                      {renderContentForm(content, sectionIndex, contentIndex)}
                    </div>
                  </div>
                ))}
                
                <div className="add-content-buttons">
                  <button type="button" onClick={() => addContent(sectionIndex, 'paragraph')}>
                    Add Paragraph
                  </button>
                  <button type="button" onClick={() => addContent(sectionIndex, 'richText')}>
                    Add Rich Text
                  </button>
                  <button type="button" onClick={() => addContent(sectionIndex, 'bullets')}>
                    Add Bullets
                  </button>
                  <button type="button" onClick={() => addContent(sectionIndex, 'steps')}>
                    Add Steps
                  </button>
                  <button type="button" onClick={() => addContent(sectionIndex, 'image')}>
                    Add Image
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <button type="button" onClick={addSection} className="add-section-btn">
            Add Section
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (id ? 'Update Article' : 'Create Article')}
          </button>
          <button type="button" onClick={() => navigate('/')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArticleForm; 