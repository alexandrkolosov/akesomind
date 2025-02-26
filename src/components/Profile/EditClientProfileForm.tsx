import React, { useState } from 'react';
import { ClientProfileData } from '../../hooks/useProfileData';

interface EditClientProfileFormProps {
  data: ClientProfileData;
  onSave: (updatedData: Partial<ClientProfileData>) => Promise<void>;
  onCancel: () => void;
}

const EditClientProfileForm: React.FC<EditClientProfileFormProps> = ({
  data,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<ClientProfileData>>({
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    birthday: data.birthday || '',
    timezone: data.timezone || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
            Birthday
          </label>
          <input
            type="date"
            name="birthday"
            value={formData.birthday?.split('T')[0]}
            onChange={handleChange}
            className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          />
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

export default EditClientProfileForm; 