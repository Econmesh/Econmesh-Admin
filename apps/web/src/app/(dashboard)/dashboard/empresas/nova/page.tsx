"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CompanyForm } from "@/modules/companies/components/company-form";
import { adminCompaniesService } from "@/services/admin/companies.service";
import { adminUsersService } from "@/services/admin/users.service";
import type { AdminUserListItem } from "@/types/api";

export default function NovaEmpresaPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [ownerUserId, setOwnerUserId] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await adminUsersService.list({ page_size: 200 });
        setUsers(data.items);
        if (data.items[0]) {
          setOwnerUserId(data.items[0].id);
        }
      } catch {
        toast.error("Não foi possível carregar usuários.");
      } finally {
        setLoadingUsers(false);
      }
    }
    void loadUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/empresas" className="hover:underline">
            Empresas
          </Link>
          {" / "}Nova empresa
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Cadastrar empresa</h1>
        <p className="text-sm text-muted-foreground">
          Associe a empresa a um usuário da plataforma.
        </p>
      </div>

      <div className="max-w-md space-y-2">
        <label htmlFor="owner_user_id" className="text-sm font-medium">
          Proprietário (usuário)
        </label>
        <select
          id="owner_user_id"
          value={ownerUserId}
          onChange={(e) => setOwnerUserId(e.target.value)}
          disabled={loadingUsers}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name ?? user.email ?? user.id} ({user.role})
            </option>
          ))}
        </select>
      </div>

      <CompanyForm
        mode="create"
        submitLabel="Cadastrar empresa"
        onSubmit={async (payload) => {
          if (!ownerUserId) {
            toast.error("Selecione o usuário proprietário.");
            return;
          }
          const company = await adminCompaniesService.create({
            ...payload,
            owner_user_id: ownerUserId,
          });
          toast.success("Empresa cadastrada com sucesso.");
          router.push(`/dashboard/empresas/${company.id}`);
        }}
      />
    </div>
  );
}
