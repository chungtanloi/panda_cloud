import { SalesCustomerDetail } from "@/components/sales/SalesCustomerDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SalesCustomerDetail id={id} />;
}
