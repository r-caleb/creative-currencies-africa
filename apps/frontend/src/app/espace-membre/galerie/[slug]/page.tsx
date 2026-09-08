import { GalleryAlbumDetailPage } from "@/components/gallery-album-detail-page";

export default async function GalerieAlbumDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return <GalleryAlbumDetailPage slug={slug} />;
}
