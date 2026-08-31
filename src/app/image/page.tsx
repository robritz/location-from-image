"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import exifr from "exifr";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getImage } from "@/lib/imageStore";

type GpsData = {
  latitude: number;
  longitude: number;
};

export default function ImagePage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [gps, setGps] = useState<GpsData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    getImage()
      .then(async (blob) => {
        if (!blob) return;

        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);

        try {
          const result = await exifr.gps(blob);
          if (
            result &&
            typeof result.latitude === "number" &&
            typeof result.longitude === "number"
          ) {
            setGps({
              latitude: result.latitude,
              longitude: result.longitude,
            });
          }
        } catch {
          // Ignore parse errors; treated as "no geolocation data".
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

        {imageSrc && loaded && (
          <Paper
            variant="outlined"
            sx={{ width: "100%", p: { xs: 2, sm: 3 } }}
          >
            <Typography variant="h6" gutterBottom>
              Geolocation
            </Typography>
            {gps ? (
              <Stack spacing={1}>
                <Typography variant="body1">
                  Latitude: {gps.latitude.toFixed(6)}
                </Typography>
                <Typography variant="body1">
                  Longitude: {gps.longitude.toFixed(6)}
                </Typography>
                <Link
                  href={`https://www.google.com/maps/search/?api=1&query=${gps.latitude},${gps.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body1"
                  underline="hover"
                >
                  View on Google Maps
                </Link>
              </Stack>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No geolocation data found in this image.
              </Typography>
            )}
          </Paper>
        )}

        <Link component={NextLink} href="/" variant="body1" underline="hover">
          Upload a New Image
        </Link>
      </Stack>
    </Container>
  );
}
