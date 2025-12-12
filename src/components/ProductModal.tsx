import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/product.service';
import { X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product, Category, Brand } from '../types';

interface ProductModalProps {
  product: Product | null;
  categories: Category[];
  brands?: Brand[];
  onClose: () => void;
  onSuccess: () => void;
}

const ProductModal = ({ product, categories, brands = [], onClose, onSuccess }: ProductModalProps) => {
  const { auth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nameRu: '',
    nameEn: '',
    title: '',
    descriptionRu: '',
    descriptionEn: '',
    description_ru: '',
    description_en: '',
    categoryId: '',
    brandId: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  useEffect(() => {
    if (product) {
      setFormData({
        nameRu: product.nameRu || '',
        nameEn: product.nameEn || '',
        title: product.title || '',
        descriptionRu: product.descriptionRu || '',
        descriptionEn: product.descriptionEn || '',
        description_ru: product.description_ru || '',
        description_en: product.description_en || '',
        categoryId: product.categoryId?.toString() || '',
        brandId: product.brandId?.toString() || '',
      });
      // GPG uses images array, Valesco uses image array
      const productImages = product.images || product.image || [];
      setExistingImages(Array.isArray(productImages) ? productImages : [productImages].filter(Boolean));
    }
  }, [product]);

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
        if (formData.brandId) formDataToSend.append('brandId', formData.brandId);
      } else {
        if (formData.title) formDataToSend.append('title', formData.title);
        if (formData.description_ru) formDataToSend.append('description_ru', formData.description_ru);
        if (formData.description_en) formDataToSend.append('description_en', formData.description_en);
        if (formData.categoryId) formDataToSend.append('categoryId', formData.categoryId);
      }

      // Add images
      images.forEach((image) => {
        formDataToSend.append('images', image);
        if (auth.site === 'valesco') {
          formDataToSend.append('image', image);
        }
      });

      if (product) {
        await productService.update(auth.site, auth.token, product.id, formDataToSend);
        toast.success('Mahsulot yangilandi');
      } else {
        await productService.create(auth.site, auth.token, formDataToSend);
        toast.success('Mahsulot yaratildi');
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
      setImages(Array.from(e.target.files));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {product ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
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
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomi *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          )}

          {auth?.site === 'gpg' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brend *
              </label>
              <select
                required
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Brend tanlang</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.nameRu || brand.name || brand.nameEn}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategoriya *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">Tanlang</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameRu || cat.name || cat.nameEn}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tavsif
            </label>
            <textarea
              value={auth?.site === 'gpg' ? formData.descriptionRu : formData.description_ru}
              onChange={(e) =>
                auth?.site === 'gpg'
                  ? setFormData({ ...formData, descriptionRu: e.target.value })
                  : setFormData({ ...formData, description_ru: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rasmlar
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">Rasm tanlash</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
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
                  // Handle both full URLs and relative paths
                  const imageUrl = img.startsWith('http') || img.startsWith('/') 
                    ? img 
                    : `${auth?.site === 'gpg' ? 'https://gpg-backend-vgrz.onrender.com' : 'https://backend.valescooil.com'}/upload/products/${img}`;
                  return (
                    <img 
                      key={idx} 
                      src={imageUrl} 
                      alt="Existing" 
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        // Fallback to direct URL if relative path fails
                        if (!img.startsWith('http')) {
                          (e.target as HTMLImageElement).src = img;
                        }
                      }}
                    />
                  );
                })}
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
              {loading ? 'Saqlanmoqda...' : product ? 'Yangilash' : 'Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;

