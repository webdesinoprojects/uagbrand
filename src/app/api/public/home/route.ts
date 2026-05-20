import { apiInternalError, apiOk } from "@/server/http/response";
import { getPublicHomePage } from "@/server/public/home-dal";

export async function GET() {
  try {
    return apiOk(await getPublicHomePage());
  } catch (error) {
    return apiInternalError(error, "public-home:get");
  }
}
