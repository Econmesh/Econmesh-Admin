"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { UserForm } from "@/modules/users/components/user-form";
import { adminUsersService } from "@/services/admin/users.service";

export default function NovoUsuarioPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/usuarios" className="hover:underline">
            Usuários
          </Link>
          {" / "}Novo usuário
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Cadastrar usuário</h1>
        <p className="text-sm text-muted-foreground">
          Crie usuários normais ou outros administradores.
        </p>
      </div>

      <UserForm
        mode="create"
        submitLabel="Criar usuário"
        onSubmit={async (values) => {
          await adminUsersService.create({
            full_name: values.full_name,
            email: values.email,
            phone: values.phone,
            password: values.password,
            password_confirm: values.password_confirm,
            role: values.role,
            auto_confirm: values.auto_confirm,
          });
          toast.success("Usuário criado com sucesso.");
          router.push("/dashboard/usuarios");
        }}
      />
    </div>
  );
}
