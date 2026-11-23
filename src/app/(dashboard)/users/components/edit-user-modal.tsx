"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import type { UpdateUserInput } from "@/app/endpoints/user/user-api-slice";
import type { User } from "@/app/endpoints/user/user-types";

const GENDERS = [
  { value: "", label: "Not specified" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

const USER_TYPES: { value: "guest" | "host"; label: string }[] = [
  { value: "guest", label: "Guest" },
  { value: "host", label: "Host" },
];

const validationSchema = Yup.object({
  first_name: Yup.string().trim().max(100, "Use 100 characters or less.").required("Enter a first name."),
  last_name: Yup.string().trim().max(100, "Use 100 characters or less.").required("Enter a last name."),
  phone_number: Yup.string()
    .trim()
    .min(10, "Use 10 to 30 characters.")
    .max(30, "Use 10 to 30 characters.")
    .required("Enter a phone number."),
  gender: Yup.string().max(30),
  user_type: Yup.string().oneOf(["guest", "host"]).required(),
});

/** Dialog for editing a guest or host profile. */
export function EditUserModal({
  user,
  open,
  onClose,
  onSubmit,
  isLoading,
}: {
  user: User;
  open: boolean;
  onClose: () => void;
  onSubmit: (values: UpdateUserInput) => Promise<boolean>;
  isLoading?: boolean;
}) {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      phone_number: user.phone_number ?? "",
      gender: user.gender ?? "",
      user_type: (user.user_type === "host" ? "host" : "guest") as "guest" | "host",
    },
    validationSchema,
    onSubmit: async (values) => {
      const payload: UpdateUserInput = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        phone_number: values.phone_number.trim(),
        user_type: values.user_type,
        ...(values.gender ? { gender: values.gender } : {}),
      };
      await onSubmit(payload);
    },
  });

  const errorOf = (name: keyof typeof formik.values) =>
    formik.touched[name] ? formik.errors[name] : undefined;

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Modal.Container size="md">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header className="pb-2">
            <Modal.Heading>Edit user</Modal.Heading>
            <p className="text-sm text-muted">
              Update profile details for {user.email}. Changes are recorded in the audit log.
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
              <TextField
                name="first_name"
                value={formik.values.first_name}
                onChange={(v) => formik.setFieldValue("first_name", v)}
                onBlur={() => formik.setFieldTouched("first_name")}
                isInvalid={!!errorOf("first_name")}
                fullWidth
              >
                <Label>First name</Label>
                <Input autoComplete="off" />
                <FieldError>{errorOf("first_name")}</FieldError>
              </TextField>

              <TextField
                name="last_name"
                value={formik.values.last_name}
                onChange={(v) => formik.setFieldValue("last_name", v)}
                onBlur={() => formik.setFieldTouched("last_name")}
                isInvalid={!!errorOf("last_name")}
                fullWidth
              >
                <Label>Last name</Label>
                <Input autoComplete="off" />
                <FieldError>{errorOf("last_name")}</FieldError>
              </TextField>

              <TextField
                name="phone_number"
                type="tel"
                value={formik.values.phone_number}
                onChange={(v) => formik.setFieldValue("phone_number", v)}
                onBlur={() => formik.setFieldTouched("phone_number")}
                isInvalid={!!errorOf("phone_number")}
                fullWidth
                className="smallPhone:col-span-2"
              >
                <Label>Phone number</Label>
                <Input autoComplete="off" />
                <FieldError>{errorOf("phone_number")}</FieldError>
              </TextField>

              <Select
                aria-label="Account role"
                selectedKey={formik.values.user_type}
                onSelectionChange={(k) => k && formik.setFieldValue("user_type", String(k))}
              >
                <Label>Account type</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {USER_TYPES.map((t) => (
                      <ListBox.Item key={t.value} id={t.value} textValue={t.label}>
                        {t.label}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select
                aria-label="Gender"
                selectedKey={formik.values.gender}
                onSelectionChange={(k) => formik.setFieldValue("gender", String(k ?? ""))}
              >
                <Label>Gender</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {GENDERS.map((g) => (
                      <ListBox.Item key={g.value || "none"} id={g.value} textValue={g.label}>
                        {g.label}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isPending={isLoading}>
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? "Saving" : "Save changes"}
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
