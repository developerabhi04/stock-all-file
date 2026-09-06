// BannerManagement.jsx
import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Link as LinkIcon, X, ImageIcon } from 'lucide-react';
import { adminAPI } from '../../services/api';
import PageHeader from '../paymentmanager/PageHeader';
import Loading from '../../components/Loader';


const BannerManagement = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [linkUrlInput, setLinkUrlInput] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllBanners();
            if (response.data?.data?.banners) {
                setBanners(response.data.data.banners);
            } else {
                setBanners([]);
            }
        } catch (error) {
            alert('Failed to fetch banners: ' + (error.response?.data?.message || error.message));
            setBanners([]);
        } finally {
            setLoading(false);
        }
    };

    const isValidUrl = (value) => {
        try {
            const parsed = new URL(value);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isValidUrl(imageUrlInput.trim())) {
            alert('Please enter a valid image URL (must start with http:// or https://)');
            return;
        }

        if (linkUrlInput.trim() && !isValidUrl(linkUrlInput.trim())) {
            alert('Please enter a valid link URL');
            return;
        }

        try {
            setSaving(true);
            await adminAPI.uploadBanner({
                imageUrl: imageUrlInput.trim(),
                linkUrl: linkUrlInput.trim(),
            });

            alert('Banner added successfully!');
            setShowModal(false);
            resetForm();
            fetchBanners();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add banner');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;
        try {
            await adminAPI.deleteBanner(id);
            fetchBanners();
        } catch {
            alert('Failed to delete banner');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await adminAPI.toggleBannerStatus(id);
            fetchBanners();
        } catch {
            alert('Failed to update banner status');
        }
    };

    const resetForm = () => {
        setImageUrlInput('');
        setLinkUrlInput('');
    };

    if (loading) {
        return <Loading message="Loading Banner..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Banner Management"
                subtitle={`Manage promotional banners for mobile app (${banners.length} banners)`}
            />

            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex gap-6">
                    <div>
                        <p className="text-sm text-gray-600">Total Banners</p>
                        <p className="text-2xl font-bold text-gray-900">{banners.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Active Banners</p>
                        <p className="text-2xl font-bold text-green-600">
                            {banners.filter(b => b.isActive).length}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    Add Banner
                </button>
            </div>

            {banners.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <ImageIcon className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No banners added yet</h3>
                    <p className="text-gray-600 mb-4">Add your first banner using an image URL</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Add Banner
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banners.map((banner, index) => (
                        <div key={banner._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                            <div className="relative h-48 bg-gray-100">
                                <img
                                    src={banner.imageUrl}
                                    alt={`Banner ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = 'https://placehold.co/400x200?text=Image+Not+Found';
                                    }}
                                />
                                <div className="absolute top-2 right-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${banner.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {banner.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-gray-500">
                                        {new Date(banner.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {banner.linkUrl && (
                                    <p className="text-xs text-gray-500 truncate mb-2 flex items-center gap-1">
                                        <LinkIcon size={12} /> {banner.linkUrl}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleStatus(banner._id)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition ${banner.isActive
                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            }`}
                                    >
                                        {banner.isActive ? (<><EyeOff size={16} /><span className="text-sm">Hide</span></>) : (<><Eye size={16} /><span className="text-sm">Show</span></>)}
                                    </button>

                                    <button
                                        onClick={() => handleDelete(banner._id)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition"
                                    >
                                        <Trash2 size={16} />
                                        <span className="text-sm">Delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">Add Banner</h2>
                            <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                                <input
                                    type="text"
                                    value={imageUrlInput}
                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                    placeholder="https://example.com/banner.jpg"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {imageUrlInput && isValidUrl(imageUrlInput.trim()) && (
                                    <img
                                        src={imageUrlInput.trim()}
                                        alt="Preview"
                                        className="mt-3 w-full h-40 object-cover rounded-lg border border-gray-200"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Redirect Link (optional)
                                </label>
                                <input
                                    type="text"
                                    value={linkUrlInput}
                                    onChange={(e) => setLinkUrlInput(e.target.value)}
                                    placeholder="https://example.com/offer"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Where the user goes when they tap this banner in the app</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Saving...</>
                                    ) : (
                                        <><Plus size={16} />Add Banner</>
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

export default BannerManagement;