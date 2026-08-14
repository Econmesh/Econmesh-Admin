import { Button } from "@econmesh-admin/ui/components/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground">Esse endereço não existe no painel admin.</p>
      <Link href="/dashboard" className="inline-flex">
        <Button>Ir ao dashboard</Button>
      </Link>
    </div>
  );
}
