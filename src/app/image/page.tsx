"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getImage } from "@/lib/imageStore";

export default function ImagePage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    getImage()
      .then((blob) => {
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setImageSrc(objectUrl);
        }
      })
      .finally(() => setLoaded(true));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 8 } }}>
      <Stack spacing={3} alignItems="center">
        {imageSrc ? (
          <Box
            component="img"
            src={imageSrc}
            alt="Uploaded image"
            sx={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: 1,
            }}
          />
        ) : (
          loaded && (
            <Typography variant="body1" color="text.secondary">
              No image found. Please upload one.
            </Typography>
          )
        )}

        <Link component={NextLink} href="/" variant="body1" underline="hover">
          Upload a New Image
        </Link>
      </Stack>
    </Container>
  );
}
