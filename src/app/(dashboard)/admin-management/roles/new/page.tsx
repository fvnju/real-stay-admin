"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { PageHeader, useGuardedAction } from "@/components/admin";
import { rbacApi } from "@/app/endpoints/rbac/rbac-api-slice";
import { roleErrorMessage } from "@/lib/role-text";
import { useMyPermissions } from "@/lib/use-permission";
import { RoleForm } from "../../components/role-form";

export default function NewRolePage() {
  const router = useRouter();
  const guard = useGuardedAction();
  const { data: me } = useMyPermissions();
  const [createRole, { isLoading }] = rbacApi.useCreateRoleMutation();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader showBack title="New role" description="You can give only the permissions that you have." />
      <RoleForm
        me={me}
        submitText="Make the role"
        isSaving={isLoading}
        onSubmit={guard("roles:actions", (input) =>
          createRole(input)
            .unwrap()
            .then(() => {
              toast.success(`Role ${input.name} made.`);
              router.push("/admin-management?view=roles");
            })
            .catch((err) => toast.error(roleErrorMessage(err))),
        )}
      />
    </div>
  );
}
