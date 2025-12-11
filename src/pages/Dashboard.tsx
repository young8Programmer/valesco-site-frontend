import { useAuth } from '../context/AuthContext';
import { Package, FolderTree, Image } from 'lucide-react';
import { useQuery } from 'react-query';
import { productService } from '../services/product.service';
import { categoryService } from '../services/category.service';

const Dashboard = () => {
  const { auth } = useAuth();

  const { data: products = [] } = useQuery(
    ['products', auth?.site, auth?.token],
    () => {
      if (!auth?.site || !auth?.token) return [];
      return productService.getAll(auth.site, auth.token);
    },
    { enabled: !!auth?.site && !!auth?.token }
  );

  const { data: categories = [] } = useQuery(
    ['categories', auth?.site, auth?.token],
    () => {
      if (!auth?.site || !auth?.token) return [];
      return categoryService.getAll(auth.site, auth.token);
    },
    { enabled: !!auth?.site && !!auth?.token }
  );

  // Calculate total images
  const totalImages = 
    products.reduce((sum: number, p: any) => sum + (p.images?.length || p.image?.length || 0), 0) +
    categories.reduce((sum: number, c: any) => sum + (c.images?.length || (c.image ? 1 : 0) || (c.img ? 1 : 0)), 0);

  const stats = [
    {
      name: 'Jami Mahsulotlar',
      value: products.length,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      name: 'Jami Kategoriyalar',
      value: categories.length,
      icon: FolderTree,
      color: 'bg-green-500',
    },
    {
      name: 'Jami Rasmlar',
      value: totalImages,
      icon: Image,
      color: 'bg-pink-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">So'nggi Mahsulotlar</h3>
          <div className="space-y-3">
            {[...products]
              .sort((a: any, b: any) => {
                // Sort by createdAt or updatedAt (newest first)
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
                return dateB - dateA;
              })
              .slice(0, 5)
              .map((product: any) => (
              <div
                key={product.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <Package className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {product.nameRu || product.title || product.nameEn}
                  </p>
                  <p className="text-sm text-gray-500">
                    ID: {product.id}
                  </p>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-gray-500 text-center py-4">Mahsulotlar mavjud emas</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">So'ngi Kategoriyalar</h3>
          <div className="space-y-3">
            {[...categories]
              .sort((a: any, b: any) => {
                // Sort by createdAt or updatedAt (newest first)
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
                return dateB - dateA;
              })
              .slice(0, 5)
              .map((category: any) => (
              <div
                key={category.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <FolderTree className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {category.nameRu || category.name || category.nameEn || category.title?.ru || category.title?.en || 'Nomsiz'}
                  </p>
                  <p className="text-sm text-gray-500">
                    ID: {category.id}
                  </p>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-gray-500 text-center py-4">Kategoriyalar mavjud emas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

