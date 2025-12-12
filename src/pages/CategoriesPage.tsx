import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { categoryService } from '../services/category.service';
import { Plus, Edit, Trash2, Search, X, Download, Filter, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import CategoryModal from '../components/CategoryModal';
import type { Category } from '../types';

const CategoriesPage = () => {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'id' | 'name'>('id');

  const { data: categories = [], isLoading } = useQuery(
    ['categories', auth?.site, auth?.token],
    () => {
      if (!auth?.site || !auth?.token) return [];
      return categoryService.getAll(auth.site, auth.token);
    },
    { enabled: !!auth?.site && !!auth?.token }
  );

  const deleteMutation = useMutation(
    (id: number) => categoryService.delete(auth!.site!, auth!.token!, id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['categories']);
        toast.success('Kategoriya o\'chirildi');
        setSelectedCategories([]);
      },
      onError: () => {
        toast.error('Xatolik yuz berdi');
      },
    }
  );

  const bulkDeleteMutation = useMutation(
    async (ids: number[]) => {
      await Promise.all(ids.map(id => categoryService.delete(auth!.site!, auth!.token!, id)));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['categories']);
        toast.success(`${selectedCategories.length} ta kategoriya o'chirildi`);
        setSelectedCategories([]);
      },
      onError: () => {
        toast.error('Xatolik yuz berdi');
      },
    }
  );

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map((c: Category) => c.id));
    }
  };

  const handleSelectCategory = (id: number) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(i => i !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedCategories.length === 0) return;
    if (window.confirm(`${selectedCategories.length} ta kategoriyani o'chirishni tasdiqlaysizmi?`)) {
      bulkDeleteMutation.mutate(selectedCategories);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Nomi (RU)', 'Nomi (EN)', 'Rasm bor'].join(','),
      ...filteredCategories.map((c: Category) => {
        return [
          c.id,
          `"${c.nameRu || c.name || c.title?.ru || ''}"`,
          `"${c.nameEn || c.title?.en || ''}"`,
          (c.img || c.image || c.images?.length) ? 'Ha' : 'Yo\'q',
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `categories_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Ma\'lumotlar yuklab olindi');
  };

  const filteredCategories = categories
    .filter((category: Category) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (category.nameRu?.toLowerCase().includes(searchLower)) ||
        (category.nameEn?.toLowerCase().includes(searchLower)) ||
        (category.name?.toLowerCase().includes(searchLower)) ||
        (category.title?.ru?.toLowerCase().includes(searchLower)) ||
        (category.title?.en?.toLowerCase().includes(searchLower)) ||
        category.id.toString().includes(searchTerm)
      );
    })
    .sort((a: Category, b: Category) => {
      if (sortBy === 'id') return a.id - b.id;
      if (sortBy === 'name') {
        const nameA = (a.nameRu || a.name || a.nameEn || a.title?.ru || a.title?.en || '').toLowerCase();
        const nameB = (b.nameRu || b.name || b.nameEn || b.title?.ru || b.title?.en || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Kategoriyani o\'chirishni tasdiqlaysizmi?')) {
      deleteMutation.mutate(id);
    }
  };

  if (!auth?.site || !auth?.token) {
    return <div>Sayt tanlanmagan</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Kategoriyalar</h2>
            <p className="text-gray-600 mt-1">Barcha kategoriyalarni boshqaring</p>
          </div>
          <div className="flex items-center space-x-2">
            {selectedCategories.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Trash2 className="w-5 h-5" />
                <span>O'chirish ({selectedCategories.length})</span>
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
              <span>Yangi kategoriya</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Saralash:</span>
          </div>
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
            placeholder="Kategoriyalarni qidirish..."
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

      {/* Categories Grid */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSelectAll}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {selectedCategories.length === filteredCategories.length ? (
              <CheckSquare className="w-5 h-5 text-primary-600" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <span className="text-sm text-gray-600">
            {selectedCategories.length > 0 && `${selectedCategories.length} ta tanlangan`}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full p-8 text-center">
            <p className="text-gray-500">Kategoriyalar topilmadi</p>
          </div>
        ) : (
          filteredCategories.map((category: Category) => {
            const isSelected = selectedCategories.includes(category.id);
            // Valesco uses 'img', GPG uses 'images' array
            let categoryImage: string | null = null;
            if (auth?.site === 'gpg') {
              // GPG: images is an array
              const images = category.images || [];
              if (images.length > 0) {
                const firstImage = images[0];
                categoryImage = firstImage.startsWith('http') || firstImage.startsWith('/')
                  ? firstImage
                  : `https://gpg-backend-vgrz.onrender.com/upload/categories/${firstImage}`;
              }
            } else {
              // Valesco: single image
              categoryImage = category.img || category.image || null;
            }
            
            // Valesco uses 'title.ru' and 'title.en', GPG uses 'nameRu' and 'nameEn'
            const categoryName = category.nameRu || category.name || category.nameEn || category.title?.ru || category.title?.en || 'Nomsiz';
            
            return (
            <div
              key={category.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition ${
                isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <div className="w-full h-32 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                {categoryImage ? (
                  <>
                    <img
                      src={categoryImage}
                      alt={categoryName}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // If image fails to load, show placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                    <div className="placeholder w-full h-full flex items-center justify-center absolute inset-0 bg-gray-100" style={{ display: 'none' }}>
                      <span className="text-gray-400 text-sm">Rasm yuklanmadi</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Rasm yo'q</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {categoryName}
                    </h3>
                    {(category.nameEn || category.title?.en) && (category.nameRu || category.name || category.title?.ru) && (
                      <p className="text-sm text-gray-600 mb-2">{category.nameEn || category.title?.en}</p>
                    )}
                    {(category.descriptionRu || category.descriptionEn) && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                        {category.descriptionRu || category.descriptionEn}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleSelectCategory(category.id)}
                    className="ml-2 flex-shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-primary-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">ID: {category.id}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
          })
        )}
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['categories']);
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
        />
      )}
    </div>
  );
};

export default CategoriesPage;

