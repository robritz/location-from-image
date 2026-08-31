"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import exifr from "exifr";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getImage } from "@/lib/imageStore";
import type { Business } from "@/app/api/nearby/route";

type Status = "idle" | "loading" | "done" | "no-gps" | "error";

type GpsData = {
  latitude: number;
  longitude: number;
};

export default function ImagePage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [gps, setGps] = useState<GpsData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    let objectUrl: string | null = null;

    getImage()
      .then(async (blob) => {
        if (!blob) return;

        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);

        let gps: { latitude: number; longitude: number } | undefined;
        try {
          const result = await exifr.gps(blob);
          if (
            result &&
            typeof result.latitude === "number" &&
            typeof result.longitude === "number"
          ) {
            gps = { latitude: result.latitude, longitude: result.longitude };
          }
        } catch {
          // Ignore parse errors; treated as "no geolocation data".
        }

        if (!gps) {
          setStatus("no-gps");
          return;
        }

        setStatus("loading");
        try {
          const res = await fetch(
            `/api/nearby?lat=${gps.latitude}&lon=${gps.longitude}`,
          );
          if (!res.ok) throw new Error("Request failed");
          const data = (await res.json()) as { businesses: Business[] };
          setBusinesses(data.businesses);
          setStatus("done");
        } catch {
          setStatus("error");
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

        <Link component={NextLink} href="/" variant="body1" underline="hover">
          Upload a New Image
        </Link>
      </Stack>
    </Container>
  );
}
