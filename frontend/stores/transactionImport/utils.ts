export function importErrorMessage(
  status: number,
  step: "analyze" | "preview" | "confirm",
) {
  if (status === 0) {
    return "Server is unreachable.";
  }

  if (status === 404) {
    return "Import session expired. Analyze the file again.";
  }

  if (status === 400) {
    if (step === "analyze") {
      return "The file is invalid or unsupported.";
    }
    if (step === "preview") {
      return "The column mapping is invalid. Amount and Date are required.";
    }
    return "Nothing to save.";
  }

  return "Something went wrong. Please try again.";
}
