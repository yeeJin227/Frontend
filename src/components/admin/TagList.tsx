import ClientTagList from "@/lib/client/ClientTagList";
import { fetchTagsServer } from "@/lib/server/tags.server";

export const dynamic = 'force-dynamic';

export default async function TagList() {
  const tags = await fetchTagsServer();

  if (!tags?.length) {
    return <p className="text-sm text-gray-600">아직 태그가 없습니다.</p>;
  }

  return <ClientTagList initialTags={tags} />;
}
