import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

type UploadVisibility = "public" | "private";

type StoreFileInput = {
  directory: string;
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  visibility?: UploadVisibility;
};

type StoredFile = {
  fileName: string;
  path: string;
  url: string;
  bucket?: string;
  provider: "local" | "supabase";
};

@Injectable()
export class StorageService {
  constructor(private readonly config: ConfigService) {}

  async storeFile(input: StoreFileInput): Promise<StoredFile> {
    if (this.storageProvider() === "supabase") {
      return this.storeSupabaseFile(input);
    }

    return this.storeLocalFile(input);
  }

  async deleteFile(url: string) {
    await this.deleteSupabaseFile(url);
    await this.deleteLocalFile(url);
  }

  private async storeSupabaseFile(input: StoreFileInput): Promise<StoredFile> {
    const supabaseUrl = this.requiredConfig("SUPABASE_URL").replace(/\/$/, "");
    const serviceRoleKey = this.requiredConfig("SUPABASE_SERVICE_ROLE_KEY");
    const bucket = input.visibility === "private"
      ? this.config.get<string>("SUPABASE_PRIVATE_BUCKET")?.trim() || "cca-private"
      : this.config.get<string>("SUPABASE_PUBLIC_BUCKET")?.trim() || "cca-public";
    const path = this.storagePath(input.directory, input.fileName);
    const encodedPath = this.encodeStoragePath(path);
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": input.mimeType,
        "x-upsert": "false",
      },
      body: new Uint8Array(input.buffer),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`Impossible d'envoyer le fichier vers Supabase Storage. ${details.slice(0, 240)}`);
    }

    return {
      fileName: input.fileName,
      path,
      url: `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`,
      bucket,
      provider: "supabase",
    };
  }

  private async storeLocalFile(input: StoreFileInput): Promise<StoredFile> {
    const relativeDirectory = this.storagePath(input.directory);
    const uploadsRoot = resolve(process.cwd(), this.config.get<string>("UPLOADS_DIR") ?? "uploads");
    const directory = join(uploadsRoot, relativeDirectory);

    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, input.fileName), input.buffer);

    return {
      fileName: input.fileName,
      path: this.storagePath(relativeDirectory, input.fileName),
      url: `${this.publicBackendUrl()}/uploads/${relativeDirectory}/${input.fileName}`,
      provider: "local",
    };
  }

  private async deleteSupabaseFile(url: string) {
    const supabaseUrl = this.config.get<string>("SUPABASE_URL")?.trim().replace(/\/$/, "");

    if (!supabaseUrl || !url.startsWith(`${supabaseUrl}/storage/v1/object/public/`)) {
      return;
    }

    const serviceRoleKey = this.requiredConfig("SUPABASE_SERVICE_ROLE_KEY");
    const relativePath = url.slice(`${supabaseUrl}/storage/v1/object/public/`.length);
    const [bucket, ...pathParts] = relativePath.split("/");

    if (!bucket || !pathParts.length) {
      return;
    }

    const encodedPath = pathParts.join("/");
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`, {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      const details = await response.text().catch(() => "");
      throw new Error(`Impossible de supprimer le fichier Supabase Storage. ${details.slice(0, 240)}`);
    }
  }

  private async deleteLocalFile(url: string) {
    const publicUploadsPrefix = `${this.publicBackendUrl()}/uploads/`;

    if (!url.startsWith(publicUploadsPrefix)) {
      return;
    }

    const uploadsRoot = resolve(process.cwd(), this.config.get<string>("UPLOADS_DIR") ?? "uploads");
    const relativePath = decodeURIComponent(url.slice(publicUploadsPrefix.length));
    const filePath = resolve(uploadsRoot, relativePath);

    if (filePath !== uploadsRoot && !filePath.startsWith(`${uploadsRoot}${sep}`)) {
      return;
    }

    await unlink(filePath).catch(() => undefined);
  }

  private storageProvider() {
    return this.config.get<string>("STORAGE_PROVIDER")?.trim().toLowerCase() === "supabase" ? "supabase" : "local";
  }

  private storagePath(...parts: Array<string | undefined>) {
    return parts
      .filter((part): part is string => Boolean(part))
      .flatMap((part) => part.split(/[\\/]+/))
      .map((part) => part.trim())
      .filter(Boolean)
      .join("/");
  }

  private encodeStoragePath(path: string) {
    return path.split("/").map(encodeURIComponent).join("/");
  }

  private publicBackendUrl() {
    return this.config.get<string>("PUBLIC_BACKEND_URL")?.replace(/\/$/, "") ?? `http://localhost:${this.config.get<number>("PORT") ?? 4000}`;
  }

  private requiredConfig(key: string) {
    const value = this.config.get<string>(key)?.trim();

    if (!value) {
      throw new Error(`Configuration stockage manquante: ${key}`);
    }

    return value;
  }
}
