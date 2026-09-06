import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers, X, Save } from 'lucide-react';
import { adminAPI } from '../services/api';
import PageHeader from '../pages/paymentmanager/PageHeader';
import Loading from '../components/Loader';

const IndexCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    displayOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllCategories();
      console.log('✅ Categories response:', response.data);

      setCategories(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert(error.response?.data?.message || 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox'
        ? checked
        : name === 'displayOrder'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        displayOrder: Number(formData.displayOrder || 0),
        isActive: formData.isActive,
      };

      if (editingCategory) {
        await adminAPI.updateCategory(editingCategory._id, payload);
        alert('✅ Category updated successfully!');
      } else {
        await adminAPI.createCategory(payload);
        alert('✅ Category created successfully!');
      }

      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive !== false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await adminAPI.deleteCategory(id);
      alert('✅ Category deleted successfully!');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      displayOrder: 0,
      isActive: true,
    });
  };

  if (loading) {
    return <Loading message="Loading All Index Categories..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Index Categories"
        subtitle={`Manage index categories (${categories.length} categories)`}
      />

      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Categories</p>
            <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Active Categories</p>
            <p className="text-2xl font-bold text-green-600">
              {categories.filter((c) => c.isActive).length}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Create Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Layers className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No categories created yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first index category to organize indices
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category._id}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Layers className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{category.name}</h3>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${category.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {category.description && (
                  <p className="text-sm text-gray-600 mt-2">{category.description}</p>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Display Order</p>
                    <p className="text-lg font-bold text-gray-900">
                      {category.displayOrder || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Indices Count</p>
                    <p className="text-lg font-bold text-blue-600">
                      {category.indicesCount || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition"
                >
                  <Edit2 size={16} />
                  <span className="text-sm font-medium">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(category._id, category.name)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition"
                >
                  <Trash2 size={16} />
                  <span className="text-sm font-medium">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., High Growth, Value Stocks, Tech Stocks"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this category"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active (Visible to users)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {editingCategory ? 'Update' : 'Create'} Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndexCategories;