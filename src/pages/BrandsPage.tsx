import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { brandService } from '../services/brand.service';
import { categoryService } from '../services/category.service';
import { Plus, Edit, Trash2, Search, X, Download, Filter, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import BrandModal from '../components/BrandModal';
import type { Brand, Category } from '../types';

const BrandsPage = () => {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'id' | 'name'>('id');

  const { data: brands = [], isLoading } = useQuery(
    ['brands', auth?.site, auth?.token, categoryFilter],
    () => {
      if (!auth?.site || !auth?.token || auth.site !== 'gpg') return [];
      return brandService.getAll(auth.site, auth.token, categoryFilter || undefined);
    },
    { enabled: !!auth?.site && !!auth?.token && auth.site === 'gpg' }
  );

  const { data: categories = [], isLoading: categoriesLoading } = useQuery(
    ['categories', auth?.site, auth?.token],
    () => {
      if (!auth?.site || !auth?.token) return [];
      return categoryService.getAll(auth.site, auth.token);
    },
    { enabled: !!auth?.site && !!auth?.token }
  );

  const deleteMutation = useMutation(
    (id: number) => brandService.delete(auth!.site!, auth!.token!, id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['brands']);
        toast.success('Brend o\'chirildi');
        setSelectedBrands([]);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
      },
    }
  );

  const bulkDeleteMutation = useMutation(
    async (ids: number[]) => {
      await Promise.all(ids.map(id => brandService.delete(auth!.site!, auth!.token!, id)));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['brands']);
        toast.success(`${selectedBrands.length} ta brend o'chirildi`);
        setSelectedBrands([]);
      },
      onError: () => {
        toast.error('Xatolik yuz berdi');
      },
    }
  );

  const handleSelectAll = () => {
    if (selectedBrands.length === filteredBrands.length) {
      setSelectedBrands([]);
    } else {
      setSelectedBrands(filteredBrands.map((b: Brand) => b.id));
    }
  };

  const handleSelectBrand = (id: number) => {
    if (selectedBrands.includes(id)) {
      setSelectedBrands(selectedBrands.filter(i => i !== id));
    } else {
      setSelectedBrands([...selectedBrands, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedBrands.length === 0) return;
    if (window.confirm(`${selectedBrands.length} ta brendni o'chirishni tasdiqlaysizmi?`)) {
      bulkDeleteMutation.mutate(selectedBrands);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Nomi', 'Nomi (RU)', 'Nomi (EN)', 'Kategoriya', 'Rasmlar soni'].join(','),
      ...filteredBrands.map((b: Brand) => {
        const brand = b as any;
        const category = categories.find((c: Category) => c.id === brand.categoryId);
        return [
          b.id,
          `"${b.name || ''}"`,
          `"${b.nameRu || ''}"`,
          `"${b.nameEn || ''}"`,
          `"${category ? (category.nameRu || category.name || category.nameEn) : ''}"`,
          (brand.images?.length || 0).toString(),
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `brands_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Ma\'lumotlar yuklab olindi');
  };

  const filteredBrands = brands
    .filter((brand: Brand) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (brand.name?.toLowerCase().includes(searchLower)) ||
        (brand.nameRu?.toLowerCase().includes(searchLower)) ||
        (brand.nameEn?.toLowerCase().includes(searchLower)) ||
        brand.id.toString().includes(searchTerm)
      );
    })
    .sort((a: Brand, b: Brand) => {
      if (sortBy === 'id') return a.id - b.id;
      if (sortBy === 'name') {
        const nameA = (a.name || a.nameRu || a.nameEn || '').toLowerCase();
        const nameB = (b.name || b.nameRu || b.nameEn || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingBrand(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Brendni o\'chirishni tasdiqlaysizmi?')) {
      deleteMutation.mutate(id);
    }
  };

  if (!auth?.site || !auth?.token) {
    return <div>Sayt tanlanmagan</div>;
  }

  if (auth.site !== 'gpg') {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Brendlar faqat GPG uchun mavjud</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Brendlar</h2>
            <p className="text-gray-600 mt-1">Barcha brendlarni boshqaring</p>
          </div>
          <div className="flex items-center space-x-2">
            {selectedBrands.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Trash2 className="w-5 h-5" />
                <span>O'chirish ({selectedBrands.length})</span>
              </button>
            )}
            <button
              onClick={handleExport}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
            <button
              onClick={handleAdd}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Yangi brend</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtr:</span>
          </div>
          <select
            value={categoryFilter || ''}
            onChange={(e) => {
              const value = e.target.value;
              setCategoryFilter(value ? parseInt(value) : null);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
            disabled={categoriesLoading}
          >
            <option value="">Barcha kategoriyalar</option>
            {categories.length > 0 ? (
              categories.map((cat: Category) => {
                const catName = cat.nameRu || cat.name || cat.nameEn || `Kategoriya ${cat.id}`;
                return (
                  <option key={cat.id} value={cat.id}>
                    {catName}
                  </option>
                );
              })
            ) : (
              <option value="" disabled>Kategoriyalar yuklanmoqda...</option>
            )}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'id' | 'name')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            <option value="id">ID bo'yicha</option>
            <option value="name">Nomi bo'yicha</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Brendlarni qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Brendlar topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center"
                    >
                      {selectedBrands.length === filteredBrands.length ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nomi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategoriya
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rasm
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBrands.map((brand: Brand) => {
                  const brandData = brand as any;
                  const category = categories.find((c: Category) => c.id === brandData.categoryId);
                  const isSelected = selectedBrands.includes(brand.id);
                  const brandImages = brandData.images || [];
                  const firstImage = brandImages[0];
                  const imageUrl = firstImage 
                    ? (firstImage.startsWith('http') || firstImage.startsWith('/') 
                        ? firstImage 
                        : `https://gpg-backend-vgrz.onrender.com/upload/brands/${firstImage}`)
                    : null;
                  
                  return (
                    <tr key={brand.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-primary-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSelectBrand(brand.id)}
                          className="flex items-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {brand.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {brand.name || brand.nameRu || brand.nameEn || 'Nomsiz'}
                          </div>
                          {brand.nameRu && brand.nameRu !== brand.name && (
                            <div className="text-xs text-gray-500 mt-1">
                              {brand.nameRu}
                            </div>
                          )}
                          {brand.nameEn && (
                            <div className="text-xs text-gray-500">
                              {brand.nameEn}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category ? (category.nameRu || category.name || category.nameEn) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="Brand"
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => {
                              if (!firstImage?.startsWith('http')) {
                                (e.target as HTMLImageElement).src = firstImage || '';
                              }
                            }}
                          />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(brand)}
                            className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(brand.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Brand Modal */}
      {isModalOpen && (
        <BrandModal
          brand={editingBrand}
          categories={categories}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBrand(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['brands']);
            setIsModalOpen(false);
            setEditingBrand(null);
          }}
        />
      )}
    </div>
  );
};

export default BrandsPage;

