import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <EmptyState
      title={t("title")}
      body={t("body")}
      action={
        <ButtonLink href="/" variant="primary">
          {t("home")}
        </ButtonLink>
      }
    />
  );
}
