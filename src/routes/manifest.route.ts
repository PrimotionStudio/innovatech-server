import { Hono } from "hono";
import {
  ActivateManifest,
  DeleteManifest,
  GetActiveManifest,
  GetManifests,
  NewManifest,
} from "../services/manifest.service.js";
import { AuthMiddleware } from "../middleware/auth.middleware.js";

const Manifest = new Hono();

Manifest.get("/active", GetActiveManifest);

Manifest.use(AuthMiddleware);

Manifest.get("/", GetManifests);

Manifest.post("/", NewManifest);

Manifest.patch("/:id", ActivateManifest);

Manifest.delete("/:id", DeleteManifest);

export default Manifest;
