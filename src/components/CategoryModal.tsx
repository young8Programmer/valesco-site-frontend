import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { categoryService } from '../services/category.service';
import { X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Category } from '../types';

interface CategoryModalProps {
  category: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CategoryModal = ({ category, onClose, onSuccess }: CategoryModalProps) => {
  const { auth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nameRu: '',
    nameEn: '',
    name: '',
    descriptionRu: '',
    descriptionEn: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  useEffect(() => {
    if (category) {
      setFormData({
        nameRu: category.nameRu || '',
        nameEn: category.nameEn || '',
        name: category.name || '',
        descriptionRu: category.descriptionRu || '',
        descriptionEn: category.descriptionEn || '',
      });
      // GPG uses images array, Valesco uses single image
      const categoryImages = category.images || (category.image ? [category.image] : []);
      setExistingImages(Array.isArray(categoryImages) ? categoryImages : [categoryImages].filter(Boolean));
    } else {
      // Reset when creating new category
      setFormData({
        nameRu: '',
        nameEn: '',
        name: '',
        descriptionRu: '',
        descriptionEn: '',
      });
      setImages([]);
      setImagePreviews([]);
      setExistingImages([]);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.site || !auth?.token) return;

    // Validate required fields
    if (auth.site === 'gpg') {
      if (!formData.nameRu || formData.nameRu.trim() === '') {
        toast.error('Nomi (RU) majburiy');
        return;
      }
    } else {
      if (!formData.name || formData.name.trim() === '') {
        toast.error('Nomi majburiy');
        return;
      }
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      // Add form fields based on site
      if (auth.site === 'gpg') {
        formDataToSend.append('nameRu', formData.nameRu.trim());
        if (formData.nameEn && formData.nameEn.trim()) {
          formDataToSend.append('nameEn', formData.nameEn.trim());
        }
        if (formData.descriptionRu && formData.descriptionRu.trim()) {
          formDataToSend.append('descriptionRu', formData.descriptionRu.trim());
        }
        if (formData.descriptionEn && formData.descriptionEn.trim()) {
          formDataToSend.append('descriptionEn', formData.descriptionEn.trim());
        }
        // GPG supports multiple images - send only new images
        images.forEach((img) => {
          formDataToSend.append('images', img);
        });
        
        // Debug: Log FormData contents
        console.log('Sending category data:', {
          nameRu: formData.nameRu.trim(),
          nameEn: formData.nameEn?.trim(),
          descriptionRu: formData.descriptionRu?.trim(),
          descriptionEn: formData.descriptionEn?.trim(),
          imagesCount: images.length,
        });
      } else {
        formDataToSend.append('name', formData.name.trim());
        if (images.length > 0) {
          formDataToSend.append('img', images[0]);
        }
      }

      if (category) {
        await categoryService.update(auth.site, auth.token, category.id, formDataToSend);
        toast.success('Kategoriya yangilandi');
      } else {
        await categoryService.create(auth.site, auth.token, formDataToSend);
        toast.success('Kategoriya yaratildi');
      }

      // Clean up object URLs
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImages([]);
      setImagePreviews([]);
      onSuccess();
    } catch (error: any) {
      console.error('Category creation error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Xatolik yuz berdi';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      if (auth?.site === 'gpg') {
        // GPG supports multiple images - add to existing
        setImages(prev => [...prev, ...newFiles]);
        // Create previews for new images
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
      } else {
        // Valesco supports single image
        setImages([e.target.files[0]]);
        setImagePreviews([URL.createObjectURL(e.target.files[0])]);
      }
    }
    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    if (auth?.site === 'gpg') {
      setImages(prev => prev.filter((_, i) => i !== index));
      // Revoke object URL to free memory
      URL.revokeObjectURL(imagePreviews[index]);
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      setImages([]);
      if (imagePreviews[0]) {
        URL.revokeObjectURL(imagePreviews[0]);
      }
      setImagePreviews([]);
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {category ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {auth?.site === 'gpg' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomi (RU) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nameRu}
                  onChange={(e) => setFormData({ ...formData, nameRu: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomi (EN)
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tavsif (RU)
                </label>
                <textarea
                  value={formData.descriptionRu}
                  onChange={(e) => setFormData({ ...formData, descriptionRu: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tavsif (EN)
                </label>
                <textarea
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomi *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rasm
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">Rasm tanlash</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple={auth?.site === 'gpg'}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {images.length > 0 && (
                <span className="text-sm text-gray-600">{images.length} fayl tanlandi</span>
              )}
            </div>
            {existingImages.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {existingImages.map((img, idx) => {
                  // Backend returns full URL or just filename
                  let imageUrl: string;
                  if (auth?.site === 'gpg') {
                    if (img.startsWith('http://') || img.startsWith('https://')) {
                      imageUrl = img;
                    } else if (img.startsWith('/')) {
                      imageUrl = `https://gpg-backend-vgrz.onrender.com${img}`;
                    } else {
                      // Just filename - backend saves directly to upload root
                      imageUrl = `https://gpg-backend-vgrz.onrender.com/${img}`;
                    }
                  } else {
                    // Valesco
                    imageUrl = img.startsWith('http') || img.startsWith('/') 
                      ? img 
                      : `https://backend.valescooil.com/upload/categories/${img}`;
                  }
                  return (
                    <div key={idx} className="relative">
                      <img 
                        src={imageUrl} 
                        alt="Existing" 
                        className="w-32 h-32 object-cover rounded"
                        onError={(e) => {
                          console.error('Image load error:', imageUrl);
                          if (!img.startsWith('http')) {
                            (e.target as HTMLImageElement).src = img;
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {imagePreviews.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded" 
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex items-center justify-end space-x-3 pt-4 border-t bg-white sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Saqlanmoqda...' : category ? 'Yangilash' : 'Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;




