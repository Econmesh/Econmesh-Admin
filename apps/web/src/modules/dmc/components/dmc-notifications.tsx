"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Input } from "@econmesh-admin/ui/components/input";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  dmcAgentService,
  type DmcCompanyUser,
  type DmcNotificationBatch,
} from "@/services/dmc/dmc.service";
import { ApiError } from "@/utils/errors";

export function DmcNotificationsView() {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<DmcCompanyUser[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [history, setHistory] = useState<DmcNotificationBatch[]>([]);

  useEffect(() => {
    void dmcAgentService.companies().then((data) =>
      setCompanies(
        data.items.map((company) => ({
          id: company.id,
          name: company.trade_name || company.legal_name,
        })),
      ),
    );
    void dmcAgentService.sentNotifications().then((data) => setHistory(data.items));
  }, []);

  async function loadUsers(companyId: string) {
    const data = await dmcAgentService.companyUsers(companyId);
    setUsers(data);
    setSelected([]);
  }

  async function send() {
    try {
      await dmcAgentService.sendNotification(title, body, selected);
      toast.success("Notificação enviada para a carteira.");
      setTitle("");
      setBody("");
      const sent = await dmcAgentService.sentNotifications();
      setHistory(sent.items);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Envio recusado.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notificações</h1>
        <p className="text-sm text-muted-foreground">
          O envio fica limitado aos usuários das empresas da sua carteira.
        </p>
      </div>
      <div className="space-y-3 rounded-xl border p-4">
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          defaultValue=""
          onChange={(event) => void loadUsers(event.target.value)}
        >
          <option value="" disabled>
            Empresa da carteira
          </option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <div className="space-y-1 text-sm">
          {users.map((user) => (
            <label key={user.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(user.id)}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, user.id]
                      : current.filter((id) => id !== user.id),
                  )
                }
              />
              {user.name ?? user.email}
            </label>
          ))}
        </div>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título" />
        <Input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Mensagem" />
        <Button type="button" disabled={selected.length === 0} onClick={() => void send()}>
          Enviar
        </Button>
      </div>
      <section className="space-y-2">
        <h2 className="font-medium">Enviadas por você</h2>
        {history.map((item) => (
          <p key={item.id} className="text-sm">
            {item.title} · {item.recipient_user_ids.length} destinatário(s)
          </p>
        ))}
      </section>
    </div>
  );
}
