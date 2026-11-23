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
import type { CreateHostInput } from "@/app/endpoints/user/user-api-slice";

const GENDERS = [
  { value: "", label: "Not specified" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

const validationSchema = Yup.object({
  first_name: Yup.string().trim().max(100, "Use 100 characters or less.").required("Enter a first name."),
  last_name: Yup.string().trim().max(100, "Use 100 characters or less.").required("Enter a last name."),
  email: Yup.string().trim().email("Enter a valid email.").required("Enter an email."),
  phone_number: Yup.string()
    .trim()
    .min(10, "Use 10 to 30 characters.")
    .max(30, "Use 10 to 30 characters.")
    .required("Enter a phone number."),
  gender: Yup.string().max(30),
});

/** Dialog for staff to create a host account on behalf of a client. */
export function CreateHostModal({
  open,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateHostInput) => Promise<boolean>;
  isLoading?: boolean;
}) {
  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      gender: "",
    },
    validationSchema,
    onSubmit: async (values, helpers) => {
      const payload: CreateHostInput = {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim(),
        phone_number: values.phone_number.trim(),
        ...(values.gender ? { gender: values.gender } : {}),
      };
      if (await onSubmit(payload)) helpers.resetForm();
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
            <Modal.Heading>Create host account</Modal.Heading>
            <p className="text-sm text-muted">
              The account starts active without a password. We email the host instructions to set their password in the app.
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
                name="email"
                type="email"
                value={formik.values.email}
                onChange={(v) => formik.setFieldValue("email", v)}
                onBlur={() => formik.setFieldTouched("email")}
                isInvalid={!!errorOf("email")}
                fullWidth
                className="smallPhone:col-span-2"
              >
                <Label>Email</Label>
                <Input autoComplete="off" placeholder="host@example.com" />
                <FieldError>{errorOf("email")}</FieldError>
              </TextField>

              <TextField
                name="phone_number"
                type="tel"
                value={formik.values.phone_number}
                onChange={(v) => formik.setFieldValue("phone_number", v)}
                onBlur={() => formik.setFieldTouched("phone_number")}
                isInvalid={!!errorOf("phone_number")}
                fullWidth
              >
                <Label>Phone number</Label>
                <Input autoComplete="off" placeholder="+2348012345678" />
                <FieldError>{errorOf("phone_number")}</FieldError>
              </TextField>

              <Select
                aria-label="Gender"
                selectedKey={formik.values.gender}
                onSelectionChange={(k) => formik.setFieldValue("gender", String(k ?? ""))}
              >
                <Label>Gender (optional)</Label>
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
                    {isPending ? "Creating host" : "Create host"}
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
