"use client";
export const dynamic = "force-dynamic";
import NonprotectedFooter from "@/app/components/nonprotectedFooter";
import { theme } from "@/app/lib/theme";
import { getFormikTextFieldProps } from "@/app/utils/formik-helpers";
import { Icon } from "@iconify/react";
import { LoadingButton } from "@mui/lab";
import {
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import Card from "@mui/material/Card";
import { useFormik } from "formik";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import * as Yup from "yup";

export default function AcceptInviteContent() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const handleToggle = () => setShowPassword((prev) => !prev);

  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const formik = useFormik({
    initialValues: { email, password: "", confirm_password: "" },
    enableReinitialize: true,
    validationSchema: Yup.object({
      email: Yup.string().required("email is required"),
      password: Yup.string()
        .required("Password is required")
        .min(6, "Password must be at least 6 characters"),

      confirm_password: Yup.string()
        .required("Confirm password is required")
        .oneOf([Yup.ref("password")], "Passwords must match"),
    }),
    onSubmit: async (data) => {
      data["token"] = token;

      const processingID = toast.loading("redirecting...");
      setIsLoading(true);
      // The server route keeps the tokens in httpOnly cookies.
      await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(async (res) => {
          const body = await res.json().catch(() => null);
          if (!res.ok) {
            throw new Error(body?.error || "Could not accept the invite");
          }
          toast.success("successful");
          router.push("/dashboard");
        })
        .catch((err) => {
          toast.error(err?.message || "Could not accept the invite");
        })
        .finally(() => {
          setIsLoading(false);
          toast.dismiss(processingID);
        });
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center  ">
      <div>
        <Card className="flex flex-col gap-4 p-8 md:w-[400px] w-[300px]">
          <Image
            src="/edge-tech-logo.svg"
            alt="logo"
            width={40}
            height={40}
            className="mx-auto mb-3"
          />
          <Stack sx={{ mb: 4, gap: 0.5 }}>
            <Typography
              className="font-bold"
              color="secondary.light"
              align="center"
              fontWeight={600}
              variant="h6"
            >
              Accept Admin Invite
            </Typography>
            <Typography
              className="font-bold"
              color="secondary.main"
              align="center"
              variant="caption"
            >
              accept your invite by setting up your account
            </Typography>
          </Stack>

          <Stack sx={{ display: "flex", flexDirection: "column", gap: 6.5 }}>
            <TextField
              variant="outlined"
              label="Email"
              size="medium"
              color="secondary.main"
              placeholder="enter email"
              disabled
              value={formik.values.email}
              {...getFormikTextFieldProps(formik, "email")}
            />{" "}
            <TextField
              size="medium"
              variant="outlined"
              label="Password"
              color="secondary.light"
              type={showPassword ? "text" : "password"}
              placeholder="enter password"
              value={formik.values.password}
              {...getFormikTextFieldProps(formik, "password")}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleToggle} edge="end">
                      {showPassword ? (
                        <Tooltip title="hide" arrow>
                          <Icon
                            icon="material-symbols-light:visibility-off-outline-rounded"
                            width="18"
                            height="18"
                            color={theme.palette.secondary.light}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="show" arrow>
                          <Icon
                            icon="material-symbols-light:visibility-outline"
                            width="18"
                            height="18"
                            color={theme.palette.secondary.light}
                          />
                        </Tooltip>
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              size="medium"
              variant="outlined"
              label="Confirm Password"
              color="secondary.light"
              type={showPassword ? "text" : "password"}
              placeholder="enter password"
              value={formik.values.confirm_password}
              {...getFormikTextFieldProps(formik, "confirm_password")}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleToggle} edge="end">
                      {showPassword ? (
                        <Tooltip title="hide" arrow>
                          <Icon
                            icon="material-symbols-light:visibility-off-outline-rounded"
                            width="18"
                            height="18"
                            color={theme.palette.secondary.light}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip title="show" arrow>
                          <Icon
                            icon="material-symbols-light:visibility-outline"
                            width="18"
                            height="18"
                            color={theme.palette.secondary.light}
                          />
                        </Tooltip>
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          <LoadingButton
            loading={isLoading}
            variant="contained"
            type="button"
            color="secondary"
            sx={{ mt: 2 }}
            onClick={() => formik.handleSubmit()}
          >
            Accept Invite
          </LoadingButton>
        </Card>
      </div>

      <NonprotectedFooter />
    </div>
  );
}
