import "server-only";

import { getUploadAuthParams } from "@imagekit/next/server";

import {
  hasImageKitEnv,
  requirePublicEnv,
  requireServerEnv,
} from "@/server/env";

export function getImageKitConfig() {
  if (!hasImageKitEnv()) {
    throw new Error("ImageKit environment is not configured.");
  }

  return {
    urlEndpoint: requirePublicEnv("NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT"),
    publicKey: requirePublicEnv("NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY"),
    privateKey: requireServerEnv("IMAGEKIT_PRIVATE_KEY"),
  };
}

export function getImageKitUploadAuth() {
  const config = getImageKitConfig();

  return getUploadAuthParams({
    privateKey: config.privateKey,
    publicKey: config.publicKey,
  });
}
