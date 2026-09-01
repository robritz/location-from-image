"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { saveImage } from "@/lib/imageStore";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  };

  const handleContinue = async () => {
    if (!file) return;

    await saveImage(file);
    router.push("/image");
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        pt: 8,
        pb: "calc(env(safe-area-inset-bottom) + 96px)",
      }}
    >
      <Stack spacing={4} alignItems="center">
        <Typography variant="h4" component="h1" fontWeight={600}>
          Location from Image
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Upload an image to get started.
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            width: "100%",
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            borderStyle: "dashed",
          }}
        >
          {previewUrl ? (
            <Box
              component="img"
              src={previewUrl}
              alt="Uploaded preview"
              sx={{
                maxWidth: "100%",
                maxHeight: 320,
                borderRadius: 1,
                objectFit: "contain",
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No image selected
            </Typography>
          )}

          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => inputRef.current?.click()}
          >
            {file ? "Change Image" : "Upload Image"}
          </Button>

          {file && (
            <Typography variant="caption" color="text.secondary">
              {file.name}
            </Typography>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
        </Paper>

        {file && (
          <Button variant="outlined" size="large" onClick={handleContinue}>
            Continue
          </Button>
        )}
      </Stack>
    </Container>
  );
}
