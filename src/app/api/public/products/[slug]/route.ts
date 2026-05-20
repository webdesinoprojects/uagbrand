import { apiInternalError, apiNotFound, apiOk } from "@/server/http/response";
import { getPublicProductBySlug } from "@/server/public/products-dal";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const result = await getPublicProductBySlug(slug);

    if (!result) {
      return apiNotFound("We could not find that product.");
    }

    return apiOk(result);
  } catch (error) {
    return apiInternalError(error, "public-product:get");
  }
}
