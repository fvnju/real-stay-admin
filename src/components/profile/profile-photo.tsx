"use client";

import { Button, Dropdown, Label, Modal, Slider, Spinner } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "react-toastify";
import { UserAvatar } from "@/components/admin";
import { Icon } from "@/components/icon";
import { userApi } from "@/app/endpoints/user/user-api-slice";
import type { User } from "@/app/endpoints/user/user-types";
import { GetErrorMessage } from "@/app/utils/error-handler";
import { cropToJpeg } from "./crop-image";

/** Larger files are refused before the browser opens them. */
const MAX_FILE_MB = 20;

/**
 * The profile photo of the signed-in admin, as in the mobile app: "Choose a
 * photo" (crop to a square, then upload) or "Remove photo".
 */
export function ProfilePhoto({ user }: { user?: User | null }) {
  const userId = user?._id || user?.id;
  const hasPhoto = !!user?.image_url?.trim();
  const inputRef = useRef<HTMLInputElement>(null);

  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const [setProfilePhoto, { isLoading }] = userApi.useSetProfilePhotoMutation();

  // Free the memory of the chosen file when the dialog closes.
  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source);
    };
  }, [source]);

  const choose = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (JPEG, PNG or WebP).");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Choose a photo of ${MAX_FILE_MB} MB or less.`);
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setSource(URL.createObjectURL(file));
  };

  const close = () => {
    setSource(null);
    setArea(null);
  };

  const save = async () => {
    if (!source || !area || !userId) return;
    setIsCropping(true);
    try {
      const photo = await cropToJpeg(source, area);
      await setProfilePhoto({ id: userId, photo }).unwrap();
      toast.success("Profile photo updated.");
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : GetErrorMessage(err));
    } finally {
      setIsCropping(false);
    }
  };

  const remove = async () => {
    if (!userId) return;
    await setProfilePhoto({ id: userId, photo: null })
      .unwrap()
      .then(() => toast.success("Profile photo removed."))
      .catch((err) => toast.error(GetErrorMessage(err)));
  };

  const busy = isLoading || isCropping;

  return (
    <>
      <div className="relative shrink-0">
        <UserAvatar user={user} size="lg" />
        {isLoading && !source ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-backdrop">
            <Spinner size="sm" color="current" className="text-white" />
          </div>
        ) : null}
        <Dropdown>
          <Button
            isIconOnly
            size="sm"
            variant="secondary"
            aria-label="Change profile photo"
            isDisabled={!userId || busy}
            className="absolute -bottom-1 -right-1 size-7 min-w-7 rounded-full border-2 border-surface"
          >
            <Icon name="camera" size={14} />
          </Button>
          <Dropdown.Popover placement="bottom start" className="min-w-48">
            <Dropdown.Menu
              aria-label="Profile photo"
              onAction={(key) => {
                if (key === "choose") inputRef.current?.click();
                if (key === "remove") void remove();
              }}
            >
              <Dropdown.Item id="choose" textValue="Choose a photo">
                <Icon name="image-outline" size={16} />
                <Label>Choose a photo</Label>
              </Dropdown.Item>
              {hasPhoto ? (
                <Dropdown.Item id="remove" textValue="Remove photo" variant="danger">
                  <Icon name="trash-outline" size={16} />
                  <Label>Remove photo</Label>
                </Dropdown.Item>
              ) : null}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            choose(e.target.files?.[0]);
            // The same file can be chosen again after a cancel.
            e.target.value = "";
          }}
        />
      </div>

      <Modal.Backdrop isOpen={!!source} onOpenChange={(open) => !open && !busy && close()}>
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Crop your photo</Modal.Heading>
              <p className="text-sm text-muted">Drag to move the photo. Use the slider to zoom.</p>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
                {source ? (
                  <Cropper
                    image={source}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, pixels) => setArea(pixels)}
                  />
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <Icon name="image-outline" size={14} className="text-muted" />
                <Slider
                  aria-label="Zoom"
                  minValue={1}
                  maxValue={3}
                  step={0.01}
                  value={zoom}
                  onChange={(v) => setZoom(Array.isArray(v) ? v[0]! : v)}
                  className="flex-1"
                >
                  <Slider.Track>
                    <Slider.Fill />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
                <Icon name="image-outline" size={20} className="text-muted" />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={close} isDisabled={busy}>
                Cancel
              </Button>
              <Button variant="primary" onPress={() => void save()} isPending={busy} isDisabled={!area}>
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? "Saving" : "Save photo"}
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
