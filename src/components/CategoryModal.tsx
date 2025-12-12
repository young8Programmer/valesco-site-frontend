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
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.site || !auth?.token) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      // Add form fields based on site
      if (auth.site === 'gpg') {
        if (formData.nameRu) formDataToSend.append('nameRu', formData.nameRu);
        if (formData.nameEn) formDataToSend.append('nameEn', formData.nameEn);
        if (formData.descriptionRu) formDataToSend.append('descriptionRu', formData.descriptionRu);
        if (formData.descriptionEn) formDataToSend.append('descriptionEn', formData.descriptionEn);
        // GPG supports multiple images
        images.forEach((img) => {
          formDataToSend.append('images', img);
        });
      } else {
        if (formData.name) formDataToSend.append('name', formData.name);
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

      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (auth?.site === 'gpg') {
        // GPG supports multiple images
        setImages(Array.from(e.target.files));
      } else {
        // Valesco supports single image
        setImages(e.target.files[0] ? [e.target.files[0]] : []);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            {existingImages.length > 0 && images.length === 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {existingImages.map((img, idx) => {
                  const imageUrl = img.startsWith('http') || img.startsWith('/') 
                    ? img 
                    : `${auth?.site === 'gpg' ? 'https://gpg-backend-vgrz.onrender.com' : 'https://backend.valescooil.com'}/upload/categories/${img}`;
                  return (
                    <img 
                      key={idx} 
                      src={imageUrl} 
                      alt="Existing" 
                      className="w-32 h-32 object-cover rounded"
                      onError={(e) => {
                        if (!img.startsWith('http')) {
                          (e.target as HTMLImageElement).src = img;
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
            {images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={URL.createObjectURL(img)} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded" 
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
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




