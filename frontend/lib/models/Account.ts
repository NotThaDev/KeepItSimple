import { del, FetchWrapperResponse, put } from "@/lib/fetchWrapper";

export async function uploadProfilePicture(
  image: Blob,
): Promise<FetchWrapperResponse<void>> {
  const body = new FormData();
  body.append("file", image, "avatar");
  const response = await put<void>("/api/account/picture", body);
  // The API explains a rejected file (size, type) in a ValidationProblemDetails body.
  const message = (
    response.errorData as { errors?: { file?: string[] } } | undefined
  )?.errors?.file?.[0];
  return message ? { ...response, error: message } : response;
}

export async function deleteProfilePicture(): Promise<FetchWrapperResponse<void>> {
  return await del<void>("/api/account/picture");
}
