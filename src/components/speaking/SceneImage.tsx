import type { SceneImage as SceneImageData } from "@/lib/content/schemas/speaking";
import { localized } from "@/lib/content/localize";
import { SCENE_DRAWINGS } from "./scenes";

/** An original scene drawn in the theme's colours, announced by its alternative text. */
export function SceneImage({
  image,
  locale,
}: {
  image: SceneImageData;
  locale: string;
}) {
  const Drawing = SCENE_DRAWINGS[image.sceneId];
  return (
    <svg
      role="img"
      aria-label={localized(image.alt, locale)}
      viewBox="0 0 480 320"
      className="block h-auto w-full overflow-hidden rounded-page border-[1.5px] border-hairline"
    >
      <Drawing />
    </svg>
  );
}
