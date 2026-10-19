import { createLocalStore, parseJson } from "@/lib/storage/localStore";
import { MockState } from "./state";

export const mockStore = createLocalStore<MockState | null>(
  "sello:mock",
  (raw) => {
    const result = MockState.safeParse(parseJson(raw));
    return result.success ? result.data : null;
  },
  null,
);
