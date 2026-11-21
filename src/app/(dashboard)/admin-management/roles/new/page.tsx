"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { PageHeader, useGuardedAction } from "@/components/admin";
import { rbacApi } from "@/app/endpoints/rbac/rbac-api-slice";
import { newRolePermissions } from "@/lib/permissions";
import { roleErrorMessage } from "@/lib/role-text";
import { useMyPermissions } from "@/lib/use-permission";
import { RoleForm } from "../../components/role-form";

export default function NewRolePage() {
  const router = useRouter();
  const guard = useGuardedAction();
  const { data: me } = useMyPermissions();
  const [createRole, { isLoading }] = rbacApi.useCreateRoleMutation();
  // From an access request: the asked permissions, and the request to go back to.
  const params = useSearchParams();
  const fromRequest = params.get("request");
  const asked = (params.get("permissions") ?? "").split(",").filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader showBack title="New role" description="You can give only the permissions that you have." />
      <RoleForm
        me={me}
        initial={{ name: "", description: "", permissions: newRolePermissions(asked) }}
        submitText="Make the role"
        isSaving={isLoading}
        onSubmit={guard("roles:actions", (input) =>
          createRole(input)
            .unwrap()
            .then((res) => {
              toast.success(`Role ${input.name} made.`);
              const roleId = res.data?._id;
              router.push(
                fromRequest && roleId
                  ? `/admin-management?view=requests&request=${fromRequest}&role=${roleId}`
                  : "/admin-management?view=roles",
              );
            })
            .catch((err) => toast.error(roleErrorMessage(err))),
        )}
      />
    </div>
  );
}
