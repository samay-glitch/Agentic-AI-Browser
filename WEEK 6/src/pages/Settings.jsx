import { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../services/api';
import Toast from '../components/Toast';
import './Settings.css';

export default function Settings() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    resume_text: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getUserProfile();
        setFormData(prev => ({ ...prev, ...profile }));
      } catch (err) {
        console.error('Failed to load profile:', err);
        showToast('Failed to load profile from backend.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showToast = (message, type) => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile(formData);
      showToast('Profile saved successfully.', 'success');
    } catch (err) {
      console.error('Failed to save profile:', err);
      showToast('Failed to save profile. Is the backend running?', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="settings-page page-container">
        <div className="settings-header">
          <h2>Profile Settings</h2>
          <p>Manage your personal information for the AI agent</p>
        </div>
        <div className="glass-card skeleton-card">
          <div className="skeleton-field"></div>
          <div className="skeleton-field"></div>
          <div className="skeleton-field"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page page-container">
      <div className="settings-header">
        <h2>Profile Settings</h2>
        <p>Manage your personal information for the AI agent</p>
      </div>

      <form className="settings-form glass-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g. Jane Doe" />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="e.g. jane@example.com" />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="e.g. +1 555-0100" />
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input type="text" id="address" name="address" value={formData.address || ''} onChange={handleChange} placeholder="e.g. 123 Main St, City" />
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="resume_text">Resume Text</label>
          <textarea 
            id="resume_text" 
            name="resume_text" 
            value={formData.resume_text || ''} 
            onChange={handleChange} 
            rows="6"
            placeholder="Paste your resume or bio here..."
          ></textarea>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="loader"></span>
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </form>

      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </div>
  );
}
