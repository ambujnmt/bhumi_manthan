// Property images: max 200 KB each (same limit as backend "max:200")
import { showToast } from "../store/toast";

export const MAX_IMAGE_KB = 200;

/**
 * File from <input type="file"> change event.
 * Too big -> error toast, input cleared, returns null.
 */
export function pickImageFile(event) {
    const input = event.target;
    const file = input.files?.[0] || null;

    if (file && file.size > MAX_IMAGE_KB * 1024) {
        showToast(
            `"${file.name}" is ${Math.ceil(file.size / 1024)} KB. Image must be ${MAX_IMAGE_KB} KB or smaller.`,
            "error"
        );
        input.value = "";
        return null;
    }

    return file;
}
