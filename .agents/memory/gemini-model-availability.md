---
name: Gemini model availability
description: Provider-specific model availability and access behavior for the waste scanner.
---

The Google project used by the scanner retired older Gemini Flash model names and currently permits the newer Flash model configured in the API route. A valid key can still return temporary 503 capacity errors, so the UI should present those as retryable provider availability rather than as bad image input.

**Why:** Direct `@google/generative-ai` calls are dependent on the models enabled for the specific Google project behind the secret, not only on the SDK version.

**How to apply:** When changing the scanner model, test the live endpoint with a small image and preserve distinct messages for access denial, temporary provider capacity, and invalid image/classification responses.