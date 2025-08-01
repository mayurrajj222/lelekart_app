import { useLocation } from 'wouter';
import AdminLayout from '@/components/layout/admin-layout';
import AddProductForm from '@/components/product/add-product-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Admin Add Product Page
 * 
 * This page provides an interface for adding new products in the admin panel.
 * It uses the AddProductForm component which handles form submission.
 */
export default function AdminAddProductPage() {
  const [, navigate] = useLocation();
  
  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        <div className="mb-4 md:mb-6 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <Button 
              variant="ghost" 
              className="gap-1 text-sm md:text-base px-2 md:px-3 py-1 md:py-2"
              onClick={() => navigate('/admin/products')}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:inline">Back to Products</span>
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Add New Product</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Create a new product with detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddProductForm redirectTo="/admin/products" />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}