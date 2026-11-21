"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
} from "@heroui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ALL_ROLES_ARGS, rbacApi } from "@/app/endpoints/rbac/rbac-api-slice";
import { useMyPermissions } from "@/lib/use-permission";
import { RoleSelect } from "./role-select";

export interface InviteAdminFormValues {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role_id: string;
}

const validationSchema = Yup.object({
  email: Yup.string().email("Enter a valid email.").required("Enter an email."),
  first_name: Yup.string().trim().required("Enter a first name."),
  last_name: Yup.string().trim().required("Enter a last name."),
  phone_number: Yup.string()
    .min(11, "Use 11 to 15 digits.")
    .max(15, "Use 11 to 15 digits.")
    .required("Enter a phone number."),
  role_id: Yup.string().required("Choose a role."),
});

const FIELDS: {
  name: Exclude<keyof InviteAdminFormValues, "role_id">;
  label: string;
  type?: string;
  autoComplete: string;
}[] = [
  { name: "first_name", label: "First name", autoComplete: "off" },
  { name: "last_name", label: "Last name", autoComplete: "off" },
  { name: "email", label: "Email", type: "email", autoComplete: "off" },
  { name: "phone_number", label: "Phone number", type: "tel", autoComplete: "off" },
];

/** A dialog that sends an admin invite by email. */
export function InviteAdminModal({
  open,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  /** Resolves after the invite is sent; the form then clears. */
  onSubmit: (values: InviteAdminFormValues) => Promise<boolean>;
  isLoading?: boolean;
}) {
  // The backend refuses an invite without a role.
  const { data: rolesData, isFetching: rolesLoading } = rbacApi.useGetRolesQuery(
    ALL_ROLES_ARGS,
    { skip: !open },
  );
  const roles = rolesData?.data?.roles ?? [];
  // A role above the own role cannot be picked; the backend refuses it too.
  const { data: me } = useMyPermissions();

  const formik = useFormik<InviteAdminFormValues>({
    initialValues: { email: "", first_name: "", last_name: "", phone_number: "", role_id: "" },
    validationSchema,
    onSubmit: async (values, helpers) => {
      if (await onSubmit(values)) helpers.resetForm();
    },
  });

  const errorOf = (name: keyof InviteAdminFormValues) =>
    formik.touched[name] ? formik.errors[name] : undefined;

  return (
    <Modal.Backdrop
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Modal.Container size="md">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header className="pb-2">
            <Modal.Heading>Invite an admin</Modal.Heading>
            <p className="text-sm text-muted">
              They get an email with a link to set a password.
            </p>
          </Modal.Header>
          <Form
            validationBehavior="aria"
            onSubmit={(e) => {
              e.preventDefault();
              formik.handleSubmit();
            }}
          >
            <Modal.Body className="grid grid-cols-1 gap-4 smallPhone:grid-cols-2">
              {FIELDS.map((field) => (
                <TextField
                  key={field.name}
                  name={field.name}
                  type={field.type ?? "text"}
                  value={formik.values[field.name]}
                  onChange={(v) => formik.setFieldValue(field.name, v)}
                  onBlur={() => formik.setFieldTouched(field.name)}
                  isInvalid={!!errorOf(field.name)}
                  fullWidth
                  className={field.name === "email" ? "smallPhone:col-span-2" : undefined}
                >
                  <Label>{field.label}</Label>
                  <Input autoComplete={field.autoComplete} />
                  <FieldError>{errorOf(field.name)}</FieldError>
                </TextField>
              ))}
              <RoleSelect
                className="smallPhone:col-span-2"
                roles={roles}
                me={me}
                value={formik.values.role_id}
                onChange={(id) => formik.setFieldValue("role_id", id)}
                onBlur={() => formik.setFieldTouched("role_id")}
                isLoading={rolesLoading}
                error={errorOf("role_id")}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isPending={isLoading}>
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? "Sending invite" : "Send invite"}
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
