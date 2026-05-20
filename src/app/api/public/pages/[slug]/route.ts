import { apiInternalError, apiNotFound, apiOk } from "@/server/http/response";
import { getPublicStaticPage } from "@/server/public/pages-dal";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const result = await getPublicStaticPage(slug);

    if (!result) {
      return apiNotFound("We could not find that page.");
    }

    return apiOk(result);
  } catch (error) {
    return apiInternalError(error, "public-page:get");
  }
}
