import PageDiscussion from "@/components/PageDiscussion";
import { listPageComments } from "@/lib/pageComments";
import type { PageDiscussionKey } from "@/lib/pageDiscussionKeys";

/** Server wrapper: load comments for a page and render the discussion UI. */
export default async function PageDiscussionSection({
  pageKey,
}: {
  pageKey: PageDiscussionKey;
}) {
  const { data } = await listPageComments(pageKey);
  return <PageDiscussion pageKey={pageKey} initialComments={data} />;
}
