import { apiInternalError, apiOk } from "@/server/http/response";
import { getPublicCatalog } from "@/server/public/catalog-dal";

export async function GET() {
  try {
    return apiOk(await getPublicCatalog());
  } catch (error) {
    return apiInternalError(error, "public-catalog:get");
  }
}
