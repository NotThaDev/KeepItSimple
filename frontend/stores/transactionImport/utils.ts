import { ImportStep } from "./types";

export function importLoadingMessage(step: ImportStep) {
  if (step === ImportStep.Analyze) {
    return "Analyzing…";
  }
  if (step === ImportStep.Mapping) {
    return "Building preview…";
  }
  if (step === ImportStep.Confirm) {
    return "Saving…";
  }
  return "Loading…";
}

export function importErrorMessage(status: number, step: ImportStep) {
  if (status === 0) {
    return "Server is unreachable.";
  }

  if (status === 404) {
    return "Import session expired. Analyze the file again.";
  }

  if (status === 400) {
    if (step === ImportStep.Analyze) {
      return "The file is invalid or unsupported.";
    }
    if (step === ImportStep.Preview) {
      return "The column mapping is invalid. Amount and Date are required.";
    }
    return "Nothing to save.";
  }

  return "Something went wrong. Please try again.";
}

