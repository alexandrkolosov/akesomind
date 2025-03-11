import React, { useState } from 'react';
import { ClientProfileData } from '../../hooks/useProfileData';

interface EditClientProfileFormProps {
  data: ClientProfileData;
  onSave: (updatedData: Partial<ClientProfileData>) => Promise<void>;
  onCancel: () => void;
}

// Input field configuration type
interface FieldConfig {
  name: keyof ClientProfileData;
  label: string;
  type: string;
  required?: boolean;
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

  // Define field configurations for the form
  const fields: FieldConfig[] = [
    { name: 'firstName', label: 'First Name', type: 'text', required: true },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'birthday', label: 'Birthday', type: 'date' },
    { name: 'timezone', label: 'Timezone', type: 'text' },
  ];

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

  // Helper to render a form input field
  const renderField = (field: FieldConfig) => {
    let value = formData[field.name] as string || '';
    
    // Special handling for date fields
    if (field.type === 'date' && value) {
      // Extract date part if it's an ISO string
      value = value.split('T')[0];
    }
    
    return (
      <div key={field.name}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type={field.type}
          name={field.name}
          value={value}
          onChange={handleChange}
          required={field.required}
          className="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(renderField)}
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