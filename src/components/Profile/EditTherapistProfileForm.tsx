import React, { useState } from 'react';
import { TherapistProfileData } from '../../hooks/useProfileData';

interface EditTherapistProfileFormProps {
  data: TherapistProfileData;
  onSave: (updatedData: Partial<TherapistProfileData>) => Promise<void>;
  onCancel: () => void;
}

const EditTherapistProfileForm: React.FC<EditTherapistProfileFormProps> = ({
  data,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<TherapistProfileData>>({
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    specialization: data.specialization || '',
    yearsOfExperience: data.yearsOfExperience || 0,
    certifications: data.certifications || [],
    education: data.education || '',
    languages: data.languages || [],
    bio: data.bio || '',
    timezone: data.timezone || '',
    availability: data.availability || {},
    rates: data.rates || {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCertification, setNewCertification] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), newCertification.trim()],
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index),
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim()) {
      setFormData(prev => ({
        ...prev,
        languages: [...(prev.languages || []), newLanguage.trim()],
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Specialization
          </label>
          <input
            type="text"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Years of Experience
          </label>
          <input
            type="number"
            name="yearsOfExperience"
            value={formData.yearsOfExperience}
            onChange={handleNumberChange}
            min="0"
            className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Education
          </label>
          <input
            type="text"
            name="education"
            value={formData.education}
            onChange={handleChange}
            className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bio
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Certifications
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              className="flex-1 rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              placeholder="Add certification"
            />
            <button
              type="button"
              onClick={addCertification}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-opacity-90"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.certifications?.map((cert, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full"
              >
                <span className="text-sm">{cert}</span>
                <button
                  type="button"
                  onClick={() => removeCertification(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Languages
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              className="flex-1 rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              placeholder="Add language"
            />
            <button
              type="button"
              onClick={addLanguage}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-opacity-90"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.languages?.map((lang, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full"
              >
                <span className="text-sm">{lang}</span>
                <button
                  type="button"
                  onClick={() => removeLanguage(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Timezone
          </label>
          <input
            type="text"
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-opacity-90"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default EditTherapistProfileForm; 