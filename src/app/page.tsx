"use client";

import { useState, useRef, ChangeEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import exifr from "exifr";
import type { Business } from "@/app/api/nearby/route";

type Status = "idle" | "loading" | "done" | "no-gps" | "error";

type GpsData = {
  latitude: number;
  longitude: number;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
    setBusinesses([]);
    setStatus("idle");

    // Read EXIF geolocation as soon as the image is selected.
    let coords: GpsData | null = null;
    try {
      const result = await exifr.gps(selected);
      if (
        result &&
        typeof result.latitude === "number" &&
        typeof result.longitude === "number"
      ) {
        coords = { latitude: result.latitude, longitude: result.longitude };
      }
    } catch {
      // Ignore parse errors; treated as "no geolocation data".
    }

    if (!coords) {
      setStatus("no-gps");
      return;
    }

    // Fetch nearby businesses as soon as the coordinates are known.
    setStatus("loading");
    try {
      const res = await fetch(
        `/api/nearby?lat=${coords.latitude}&lon=${coords.longitude}`,
      );
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as { businesses: Business[] };
      setBusinesses(data.businesses);
      setStatus("done");
    } catch {
      setStatus("error");
    }
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

        {file && status !== "idle" && (
          <Paper variant="outlined" sx={{ width: "100%", p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom>
              Nearby Businesses
            </Typography>

            {status === "no-gps" && (
              <Typography variant="body1" color="text.secondary">
                No geolocation data found in this image.
              </Typography>
            )}

            {status === "loading" && (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CircularProgress size={20} />
                <Typography variant="body1" color="text.secondary">
                  Finding nearby businesses…
                </Typography>
              </Stack>
            )}

            {status === "error" && (
              <Typography variant="body1" color="error">
                Unable to load nearby businesses.
              </Typography>
            )}

            {status === "done" &&
              (businesses.length > 0 ? (
                <List disablePadding>
                  {businesses.map((business, index) => (
                    <Box key={`${business.name}-${index}`}>
                      {index > 0 && <Divider component="li" />}
                      <ListItem disableGutters>
                        <ListItemText
                          primary={business.name}
                          secondary={business.address || undefined}
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No businesses found near this location.
                </Typography>
              ))}
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
