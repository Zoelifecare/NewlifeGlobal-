import EditResource from "../[id]/page";

export default async function NewResource({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  return EditResource({ params: Promise.resolve({ resource, id: "new" }), searchParams: Promise.resolve({}) });
}
