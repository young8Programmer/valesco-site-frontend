import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/product.service';
import { categoryService } from '../services/category.service';
import { brandService } from '../services/brand.service';
import { Plus, Edit, Trash2, Search, X, Download, Filter, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductModal from '../components/ProductModal';
import type { Product, Brand } from '../types';

const ProductsPage = () => {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [brandFilter, setBrandFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'id' | 'name'>('id');

  const { data: products = [], isLoading } = useQuery(
    ['products', auth?.site, auth?.token],
    () => {
      if (!auth?.site || !auth?.token) return [];
      return productService.getAll(auth.site, auth.token);
    },
    { enabled: !!auth?.site && !!auth?.token }
  );

  const { data: categories = [], isLoading: categoriesLoading } = useQuery(
    ['categories', auth?.site, auth?.token],
    () => {
      if (!auth?.site || !auth?.token) return [];
      return categoryService.getAll(auth.site, auth.token);
    },
    { enabled: !!auth?.site && !!auth?.token }
  );

  console.log('Categories for filter:', categories);

  const { data: brands = [] } = useQuery(
    ['brands', auth?.site, auth?.token],
    () => {
      if (!auth?.site || !auth?.token || auth.site !== 'gpg') return [];
      return brandService.getAll(auth.site, auth.token);
    },
    { enabled: !!auth?.site && !!auth?.token && auth.site === 'gpg' }
  );

  const deleteMutation = useMutation(
    (id: number) => productService.delete(auth!.site!, auth!.token!, id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        toast.success('Mahsulot o\'chirildi');
        setSelectedProducts([]);
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'Xatolik yuz berdi';
        toast.error(errorMessage);
      },
    }
  );

  const bulkDeleteMutation = useMutation(
    async (ids: number[]) => {
      await Promise.all(ids.map(id => productService.delete(auth!.site!, auth!.token!, id)));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        toast.success(`${selectedProducts.length} ta mahsulot o'chirildi`);
        setSelectedProducts([]);
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'Xatolik yuz berdi';
        toast.error(errorMessage);
      },
    }
  );

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p: Product) => p.id));
    }
  };

  const handleSelectProduct = (id: number) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(i => i !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    if (window.confirm(`${selectedProducts.length} ta mahsulotni o'chirishni tasdiqlaysizmi?`)) {
      bulkDeleteMutation.mutate(selectedProducts);
    }
  };

  const handleExport = () => {
    const headers = auth?.site === 'gpg' 
      ? ['ID', 'Nomi (RU)', 'Nomi (EN)', 'Brend', 'Rasmlar soni']
      : ['ID', 'Nomi', 'Kategoriya', 'Rasmlar soni'];
    
    const csvContent = [
      headers.join(','),
      ...filteredProducts.map((p: Product) => {
        if (auth?.site === 'gpg') {
          const brand = brands.find((b: Brand) => b.id === p.brandId);
          return [
            p.id,
            `"${p.nameRu || p.title || ''}"`,
            `"${p.nameEn || ''}"`,
            `"${brand ? (brand.nameRu || brand.name || brand.nameEn) : ''}"`,
            (p.images?.length || p.image?.length || 0).toString(),
          ].join(',');
        } else {
          const productCategoryId = p.category?.id || p.categoryId;
          const category = categories.find((c: any) => c.id === productCategoryId);
          return [
            p.id,
            `"${p.title || p.nameRu || p.nameEn || ''}"`,
            `"${category ? (category.nameRu || category.name || category.nameEn) : ''}"`,
            (p.image?.length || p.images?.length || 0).toString(),
          ].join(',');
        }
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Ma\'lumotlar yuklab olindi');
  };

  const filteredProducts = products
    .filter((product: Product) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (product.nameRu?.toLowerCase().includes(searchLower)) ||
        (product.nameEn?.toLowerCase().includes(searchLower)) ||
        (product.title?.toLowerCase().includes(searchLower)) ||
        product.id.toString().includes(searchTerm);
      
      // Filter logic based on site
      let matchesFilter = true;
      
      if (auth?.site === 'gpg') {
        // GPG: Filter by brandId
        if (brandFilter !== null && brandFilter !== undefined) {
          const filterBrandId = Number(brandFilter);
          matchesFilter = product.brandId === filterBrandId;
        }
      } else {
        // Valesco: Filter by categoryId
        if (categoryFilter !== null && categoryFilter !== undefined) {
          let productCategoryId: number | null = null;
          
          // Valesco: category is an object with id
          productCategoryId = product.category?.id 
            ? Number(product.category.id) 
            : (product.categoryId ? Number(product.categoryId) : null);
          
          const filterCategoryId = Number(categoryFilter);
          matchesFilter = productCategoryId === filterCategoryId;
        }
      }
      
      return matchesSearch && matchesFilter;
    })
    .sort((a: Product, b: Product) => {
      if (sortBy === 'id') return a.id - b.id;
      if (sortBy === 'name') {
        const nameA = (a.nameRu || a.title || a.nameEn || '').toLowerCase();
        const nameB = (b.nameRu || b.title || b.nameEn || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Mahsulotni o\'chirishni tasdiqlaysizmi?')) {
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
            <h2 className="text-3xl font-bold text-gray-900">Mahsulotlar</h2>
            <p className="text-gray-600 mt-1">Barcha mahsulotlarni boshqaring</p>
          </div>
          <div className="flex items-center space-x-2">
            {selectedProducts.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Trash2 className="w-5 h-5" />
                <span>O'chirish ({selectedProducts.length})</span>
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
              <span>Yangi mahsulot</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtr:</span>
          </div>
          {auth?.site === 'gpg' ? (
            <select
              value={brandFilter || ''}
              onChange={(e) => {
                const value = e.target.value;
                setBrandFilter(value ? parseInt(value) : null);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
            >
              <option value="">Barcha brendlar</option>
              {brands.length > 0 ? (
                brands.map((brand: Brand) => {
                  const brandName = brand.nameRu || brand.name || brand.nameEn || `Brend ${brand.id}`;
                  return (
                    <option key={brand.id} value={brand.id}>
                      {brandName}
                    </option>
                  );
                })
              ) : (
                <option value="" disabled>Brendlar topilmadi</option>
              )}
            </select>
          ) : (
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
                categories.map((cat: any) => {
                  const catName = cat.nameRu || cat.name || cat.nameEn || cat.title?.ru || cat.title?.en || `Kategoriya ${cat.id}`;
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
          )}
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
            placeholder="Mahsulotlarni qidirish..."
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

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Mahsulotlar topilmadi</p>
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
                      {selectedProducts.length === filteredProducts.length ? (
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
                  {auth?.site === 'gpg' ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brend
                      </th>
                    </>
                  ) : (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategoriya
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rasm
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product: Product) => {
                  // Valesco uses category object, GPG uses brandId
                  const productCategoryId = auth?.site === 'valesco' 
                    ? (product.category?.id || product.categoryId)
                    : null;
                  const category = auth?.site === 'valesco' 
                    ? categories.find((c: any) => c.id === productCategoryId)
                    : null;
                  const brand = auth?.site === 'gpg' ? brands.find((b: Brand) => b.id === product.brandId) : null;
                  const isSelected = selectedProducts.includes(product.id);
                  
                  // Handle image URLs
                  const productImages = product.images || product.image || [];
                  const firstImage = Array.isArray(productImages) ? productImages[0] : productImages;
                  const imageUrl = firstImage 
                    ? (firstImage.startsWith('http') || firstImage.startsWith('/') 
                        ? firstImage 
                        : `${auth?.site === 'gpg' ? 'https://gpg-backend-vgrz.onrender.com' : 'https://backend.valescooil.com'}/upload/products/${firstImage}`)
                    : null;
                  
                  return (
                    <tr key={product.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-primary-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSelectProduct(product.id)}
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
                        {product.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {product.nameRu || product.title || product.nameEn || 'Nomsiz'}
                          </div>
                          {product.descriptionRu && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {product.descriptionRu}
                            </div>
                          )}
                        </div>
                      </td>
                      {auth?.site === 'gpg' ? (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {brand ? (brand.nameRu || brand.name || brand.nameEn) : '-'}
                        </td>
                      ) : (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category ? (category.nameRu || category.name || category.nameEn || category.title?.ru || category.title?.en) : '-'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="Product"
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
                            onClick={() => handleEdit(product)}
                            className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
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

      {/* Product Modal */}
      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          brands={auth?.site === 'gpg' ? brands : undefined}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['products']);
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductsPage;

