import { AgreementManager } from "@/components/admin/agreement-manager";
import { AdminLayout } from "@/components/layout/admin-layout";

export default function AgreementManagementPage() {
  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">
            Seller Agreement Management
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage seller agreements and versions.
          </p>
        </div>
        <AgreementManager />
      </div>
    </AdminLayout>
  );
}
