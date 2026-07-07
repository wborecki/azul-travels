import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import {
  criarItemReservavel,
  atualizarItemReservavel,
  fetchBloqueiosDoItem,
  criarItemReservavelBloqueio,
  excluirItemReservavelBloqueio,
  type ItemReservavel,
} from "@/lib/queries";
import { ESTADOS_BR } from "@/lib/brazil";
import { COMODIDADES_ITEM } from "@/lib/itens-comodidades";
import { cn } from "@/lib/utils";
import { FotosGaleria } from "@/components/estabelecimento/FotosGaleria";
import { ItemReservavelPreviewCard } from "@/components/estabelecimento/ItemReservavelPreviewCard";

const BUCKET = "itens-reservaveis-fotos";

interface ItemReservavelDraft {
  nome: string;
  descricao: string;
  preco: string;
  quantidade: string;
  capacidadeTotal: string;
  capacidadeAdultos: string;
  capacidadeCriancas: string;
  quantidadeCamas: string;
  comodidades: string[];
  checkInPadrao: string;
  checkOutPadrao: string;
  imagens: string[];
  usaEnderecoProprio: boolean;
  endereco: string;
  cidade: string;
  estado: string;
  latitude: string;
  longitude: string;
}

const DRAFT_VAZIO: ItemReservavelDraft = {
  nome: "",
  descricao: "",
  preco: "",
  quantidade: "1",
  capacidadeTotal: "2",
  capacidadeAdultos: "",
  capacidadeCriancas: "",
  quantidadeCamas: "1",
  comodidades: [],
  checkInPadrao: "",
  checkOutPadrao: "",
  imagens: [],
  usaEnderecoProprio: false,
  endereco: "",
  cidade: "",
  estado: "",
  latitude: "",
  longitude: "",
};

function toDraft(item: ItemReservavel): ItemReservavelDraft {
  return {
    nome: item.nome,
    descricao: item.descricao ?? "",
    preco: String(item.preco),
    quantidade: String(item.quantidade),
    capacidadeTotal: String(item.capacidade_total),
    capacidadeAdultos: item.capacidade_adultos != null ? String(item.capacidade_adultos) : "",
    capacidadeCriancas: item.capacidade_criancas != null ? String(item.capacidade_criancas) : "",
    quantidadeCamas: String(item.quantidade_camas),
    comodidades: item.comodidades ?? [],
    checkInPadrao: item.check_in_padrao ? item.check_in_padrao.slice(0, 5) : "",
    checkOutPadrao: item.check_out_padrao ? item.check_out_padrao.slice(0, 5) : "",
    imagens: Array.isArray(item.imagens) ? (item.imagens as string[]) : [],
    usaEnderecoProprio: item.usa_endereco_proprio,
    endereco: item.endereco ?? "",
    cidade: item.cidade ?? "",
    estado: item.estado ?? "",
    latitude: item.latitude != null ? String(item.latitude) : "",
    longitude: item.longitude != null ? String(item.longitude) : "",
  };
}

function draftParaPayload(draft: ItemReservavelDraft) {
  const precoTrim = draft.preco.trim();
  const latTrim = draft.latitude.trim();
  const lngTrim = draft.longitude.trim();
  return {
    nome: draft.nome.trim(),
    descricao: draft.descricao.trim() || null,
    preco: Number(precoTrim.replace(",", ".")),
    quantidade: Math.max(1, Number(draft.quantidade) || 1),
    capacidade_total: Math.max(1, Number(draft.capacidadeTotal) || 1),
    capacidade_adultos: draft.capacidadeAdultos.trim()
      ? Math.max(1, Number(draft.capacidadeAdultos))
      : null,
    capacidade_criancas: draft.capacidadeCriancas.trim()
      ? Math.max(0, Number(draft.capacidadeCriancas))
      : null,
    quantidade_camas: Math.max(1, Number(draft.quantidadeCamas) || 1),
    comodidades: draft.comodidades,
    check_in_padrao: draft.checkInPadrao || null,
    check_out_padrao: draft.checkOutPadrao || null,
    imagens: draft.imagens,
    usa_endereco_proprio: draft.usaEnderecoProprio,
    endereco: draft.usaEnderecoProprio ? draft.endereco.trim() || null : null,
    cidade: draft.usaEnderecoProprio ? draft.cidade.trim() || null : null,
    estado: draft.usaEnderecoProprio ? draft.estado.trim() || null : null,
    latitude: draft.usaEnderecoProprio && latTrim ? Number(latTrim) : null,
    longitude: draft.usaEnderecoProprio && lngTrim ? Number(lngTrim) : null,
  };
}

function formatEnderecoEstab(estab?: EstabEndereco | null): string {
  if (!estab) return "Endereço ainda não cadastrado no estabelecimento";
  const cidadeEstado =
    estab.cidade && estab.estado
      ? `${estab.cidade} - ${estab.estado}`
      : estab.cidade || estab.estado || "";
  const partes = [estab.endereco, cidadeEstado].filter(Boolean);
  return partes.length ? partes.join(", ") : "Endereço ainda não cadastrado no estabelecimento";
}

interface BloqueioDraft {
  id: string;
  persistido: boolean;
  inicio: string;
  fim: string;
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatBloqueioResumo(inicio: string, fim: string): string {
  const fmt = (v: string) =>
    new Date(v).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  return `${fmt(inicio)} até ${fmt(fim)}`;
}

interface EstabEndereco {
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
}

interface ItemReservavelFormularioProps {
  estabId: string;
  estabEndereco?: EstabEndereco | null;
  itemExistente?: ItemReservavel | null;
}

const STEPS = [
  { key: "basico", label: "O básico" },
  { key: "capacidade", label: "Capacidade" },
  { key: "comodidades", label: "Comodidades" },
  { key: "fotos", label: "Fotos e descrição" },
  { key: "disponibilidade", label: "Disponibilidade" },
  { key: "preco", label: "Preço e revisão" },
] as const;

const DESCRICAO_MIN = 30;

function validarPasso(draft: ItemReservavelDraft, index: number): string | null {
  switch (STEPS[index].key) {
    case "basico":
      return draft.nome.trim() ? null : "Dê um nome para a opção antes de continuar.";
    case "capacidade":
      if (!draft.capacidadeTotal.trim() || Number(draft.capacidadeTotal) <= 0) {
        return "Informe quantas pessoas cabem no quarto.";
      }
      if (!draft.quantidade.trim() || Number(draft.quantidade) <= 0) {
        return "Informe a quantidade total de unidades.";
      }
      return null;
    case "comodidades":
      if (!draft.quantidadeCamas.trim() || Number(draft.quantidadeCamas) <= 0) {
        return "Informe a quantidade de camas.";
      }
      return null;
    case "fotos":
      if (draft.imagens.length < 1) return "Adicione pelo menos uma foto.";
      if (draft.descricao.trim().length < DESCRICAO_MIN) {
        return `A descrição precisa ter pelo menos ${DESCRICAO_MIN} caracteres.`;
      }
      return null;
    case "disponibilidade":
      return null;
    case "preco": {
      const precoNum = Number(draft.preco.trim().replace(",", "."));
      if (!draft.preco.trim() || !Number.isFinite(precoNum) || precoNum <= 0) {
        return "Informe o preço por noite.";
      }
      return null;
    }
  }
}

export function ItemReservavelFormulario({
  estabId,
  estabEndereco,
  itemExistente,
}: ItemReservavelFormularioProps) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ItemReservavelDraft>(
    itemExistente ? toDraft(itemExistente) : DRAFT_VAZIO,
  );
  const [salvando, setSalvando] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const [bloqueios, setBloqueios] = useState<BloqueioDraft[]>([]);
  const [bloqueiosRemovidos, setBloqueiosRemovidos] = useState<string[]>([]);
  const [novoInicio, setNovoInicio] = useState("");
  const [novoFim, setNovoFim] = useState("");

  useEffect(() => {
    if (!itemExistente) return;
    void (async () => {
      try {
        const data = await fetchBloqueiosDoItem(itemExistente.id);
        setBloqueios(
          data.map((b) => ({
            id: b.id,
            persistido: true,
            inicio: toDatetimeLocal(b.inicio),
            fim: toDatetimeLocal(b.fim),
          })),
        );
      } catch (err) {
        toast.error("Erro ao carregar períodos bloqueados", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    })();
  }, [itemExistente]);

  const set = <K extends keyof ItemReservavelDraft>(k: K, v: ItemReservavelDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const alternarComodidade = (key: string) => {
    setDraft((d) => ({
      ...d,
      comodidades: d.comodidades.includes(key)
        ? d.comodidades.filter((k) => k !== key)
        : [...d.comodidades, key],
    }));
  };

  const adicionarBloqueio = () => {
    if (!novoInicio || !novoFim) {
      toast.error("Informe início e fim do período.");
      return;
    }
    if (new Date(novoFim) <= new Date(novoInicio)) {
      toast.error("O fim deve ser depois do início.");
      return;
    }
    setBloqueios((b) => [
      ...b,
      { id: crypto.randomUUID(), persistido: false, inicio: novoInicio, fim: novoFim },
    ]);
    setNovoInicio("");
    setNovoFim("");
  };

  const removerBloqueio = (id: string) => {
    setBloqueios((list) => {
      const alvo = list.find((b) => b.id === id);
      if (alvo?.persistido) setBloqueiosRemovidos((r) => [...r, id]);
      return list.filter((b) => b.id !== id);
    });
  };

  const avancar = () => {
    const erro = validarPasso(draft, stepIndex);
    if (erro) {
      toast.error(erro);
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const voltar = () => setStepIndex((i) => Math.max(i - 1, 0));

  const salvar = async () => {
    for (let i = 0; i < STEPS.length; i++) {
      const erro = validarPasso(draft, i);
      if (erro) {
        toast.error(erro);
        setStepIndex(i);
        return;
      }
    }
    setSalvando(true);
    try {
      const payload = draftParaPayload(draft);
      let itemId: string;
      if (itemExistente) {
        await atualizarItemReservavel(itemExistente.id, payload);
        itemId = itemExistente.id;
        toast.success("Opção atualizada");
      } else {
        const criado = await criarItemReservavel({ ...payload, estabelecimento_id: estabId });
        itemId = criado.id;
        toast.success("Opção criada");
      }

      for (const id of bloqueiosRemovidos) {
        await excluirItemReservavelBloqueio(id);
      }
      for (const b of bloqueios) {
        if (b.persistido) continue;
        await criarItemReservavelBloqueio({
          item_reservavel_id: itemId,
          inicio: new Date(b.inicio).toISOString(),
          fim: new Date(b.fim).toISOString(),
        });
      }

      void navigate({ to: "/meu-estabelecimento/itens" });
    } catch (err) {
      toast.error("Não foi possível salvar", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSalvando(false);
    }
  };

  const localResumoPreview = draft.usaEnderecoProprio
    ? [draft.endereco, draft.cidade && draft.estado ? `${draft.cidade} - ${draft.estado}` : ""]
        .filter(Boolean)
        .join(", ") || null
    : null;

  return (
    <div className="space-y-6">
      <Link
        to="/meu-estabelecimento/itens"
        className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para opções
      </Link>

      <h1 className="font-display font-bold text-2xl text-primary">
        {itemExistente ? "Editar quarto" : "Novo quarto"}
      </h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="bg-white border rounded-2xl p-6 space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-foreground/50">
              <span>
                Passo {stepIndex + 1} de {STEPS.length} — {STEPS[stepIndex].label}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-secondary transition-all"
                style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {STEPS[stepIndex].key === "basico" && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="nome">
                  Nome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  value={draft.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  placeholder="Ex: Suíte com jardim"
                  maxLength={120}
                />
                <p className="text-[11px] text-foreground/50">
                  Você pode alterar o nome quando quiser.
                </p>
              </div>

              <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
                <Label className="text-sm">Local desta opção</Label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={!draft.usaEnderecoProprio}
                      onChange={() => set("usaEnderecoProprio", false)}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground/90">
                        Usar o endereço do estabelecimento
                      </p>
                      <p className="text-xs text-foreground/50">
                        {formatEnderecoEstab(estabEndereco)}
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={draft.usaEnderecoProprio}
                      onChange={() => set("usaEnderecoProprio", true)}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground/90">
                        Definir um endereço diferente para esta opção
                      </p>
                      <p className="text-xs text-foreground/50">
                        Use para passeios, experiências ou unidades fora do local principal.
                      </p>
                    </div>
                  </label>
                </div>

                {draft.usaEnderecoProprio && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input
                        placeholder="Endereço"
                        value={draft.endereco}
                        onChange={(e) => set("endereco", e.target.value)}
                      />
                      <Input
                        placeholder="Cidade"
                        value={draft.cidade}
                        onChange={(e) => set("cidade", e.target.value)}
                      />
                    </div>
                    <Select
                      value={draft.estado || "none"}
                      onValueChange={(v) => set("estado", v === "none" ? "" : v)}
                    >
                      <SelectTrigger className="sm:w-56">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-</SelectItem>
                        {ESTADOS_BR.map((e) => (
                          <SelectItem key={e.sigla} value={e.sigla}>
                            {e.sigla} - {e.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <GeocodeButton
                      endereco={draft.endereco}
                      cidade={draft.cidade}
                      estado={draft.estado}
                      onResult={(lat, lng) => {
                        set("latitude", String(lat));
                        set("longitude", String(lng));
                      }}
                    />
                    {draft.latitude && draft.longitude && (
                      <p className="flex items-center gap-1.5 text-xs text-foreground/50">
                        <MapPin className="h-3.5 w-3.5" /> Coordenadas encontradas: {draft.latitude}
                        , {draft.longitude}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {STEPS[stepIndex].key === "capacidade" && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="capacidadeTotal">
                  Quantas pessoas cabem no quarto? <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="capacidadeTotal"
                  type="number"
                  min={1}
                  value={draft.capacidadeTotal}
                  onChange={(e) => set("capacidadeTotal", e.target.value)}
                  className="max-w-[160px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="capacidadeAdultos">
                    Máximo de adultos{" "}
                    <span className="text-foreground/40 font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="capacidadeAdultos"
                    type="number"
                    min={1}
                    value={draft.capacidadeAdultos}
                    onChange={(e) => set("capacidadeAdultos", e.target.value)}
                    placeholder="Sem limite específico"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="capacidadeCriancas">
                    Máximo de crianças até 13 anos{" "}
                    <span className="text-foreground/40 font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="capacidadeCriancas"
                    type="number"
                    min={0}
                    value={draft.capacidadeCriancas}
                    onChange={(e) => set("capacidadeCriancas", e.target.value)}
                    placeholder="Sem limite específico"
                  />
                </div>
              </div>
              <p className="text-[11px] text-foreground/50">
                Deixe em branco se não quiser diferenciar adultos e crianças dentro do limite total.
              </p>

              <div className="space-y-1.5 pt-2 border-t">
                <Label htmlFor="quantidade">
                  Quantidade total de unidades <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantidade"
                  type="number"
                  min={1}
                  value={draft.quantidade}
                  onChange={(e) => set("quantidade", e.target.value)}
                  className="max-w-[160px]"
                />
                <p className="text-[11px] text-foreground/50">
                  Você pode alterar isso quando quiser.
                </p>
              </div>
            </div>
          )}

          {STEPS[stepIndex].key === "comodidades" && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label>O que este quarto oferece?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMODIDADES_ITEM.map((c) => {
                    const ativa = draft.comodidades.includes(c.key);
                    const Icon = c.icon;
                    return (
                      <button
                        type="button"
                        key={c.key}
                        onClick={() => alternarComodidade(c.key)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition text-left",
                          ativa
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" /> {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 max-w-[200px]">
                <Label htmlFor="quantidadeCamas">
                  Quantidade de camas <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantidadeCamas"
                  type="number"
                  min={1}
                  value={draft.quantidadeCamas}
                  onChange={(e) => set("quantidadeCamas", e.target.value)}
                />
              </div>
            </div>
          )}

          {STEPS[stepIndex].key === "fotos" && (
            <div className="space-y-5">
              <FotosGaleria
                value={draft.imagens}
                onChange={(v) => set("imagens", v)}
                bucket={BUCKET}
                permitirUrl={false}
              />
              {draft.imagens.length === 0 ? (
                <p className="text-xs text-destructive">Pelo menos 1 foto é obrigatória.</p>
              ) : (
                draft.imagens.length < 3 && (
                  <p className="text-xs text-amarelo-foreground bg-amarelo/10 border border-amarelo/30 rounded-lg px-3 py-2">
                    Adicione pelo menos 3 fotos para atrair mais famílias.
                  </p>
                )
              )}

              <div className="space-y-1.5">
                <Label htmlFor="descricao">
                  Descrição <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="descricao"
                  rows={6}
                  value={draft.descricao}
                  onChange={(e) => set("descricao", e.target.value)}
                  placeholder="O que diferencia esta opção… Suporta markdown: **negrito**, _itálico_, listas, links."
                  maxLength={2000}
                />
                <p
                  className={cn(
                    "text-[11px]",
                    draft.descricao.trim().length < DESCRICAO_MIN
                      ? "text-destructive"
                      : "text-foreground/50",
                  )}
                >
                  {draft.descricao.trim().length < DESCRICAO_MIN
                    ? `Mínimo de ${DESCRICAO_MIN} caracteres (${draft.descricao.trim().length}/${DESCRICAO_MIN}).`
                    : "Suporta markdown (títulos, negrito, listas, links) - a prévia ao lado mostra o resultado."}
                </p>
              </div>
            </div>
          )}

          {STEPS[stepIndex].key === "disponibilidade" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="checkIn">
                    Check-in padrão{" "}
                    <span className="text-foreground/40 font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="checkIn"
                    type="time"
                    value={draft.checkInPadrao}
                    onChange={(e) => set("checkInPadrao", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="checkOut">
                    Check-out padrão{" "}
                    <span className="text-foreground/40 font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="checkOut"
                    type="time"
                    value={draft.checkOutPadrao}
                    onChange={(e) => set("checkOutPadrao", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-xl border p-4 bg-muted/20">
                <Label className="text-sm">
                  Períodos em que o quarto não estará disponível{" "}
                  <span className="text-foreground/40 font-normal">(opcional)</span>
                </Label>
                <p className="text-[11px] text-foreground/50">
                  Use para manutenção ou datas já comprometidas fora da plataforma.
                </p>

                {bloqueios.length > 0 && (
                  <ul className="space-y-1.5">
                    {bloqueios.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between gap-2 text-sm bg-white border rounded-lg px-3 py-2"
                      >
                        <span>{formatBloqueioResumo(b.inicio, b.fim)}</span>
                        <button
                          type="button"
                          onClick={() => removerBloqueio(b.id)}
                          className="text-destructive hover:underline text-xs shrink-0"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-end pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs" htmlFor="bloqueioInicio">
                      Início
                    </Label>
                    <Input
                      id="bloqueioInicio"
                      type="datetime-local"
                      value={novoInicio}
                      onChange={(e) => setNovoInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs" htmlFor="bloqueioFim">
                      Fim
                    </Label>
                    <Input
                      id="bloqueioFim"
                      type="datetime-local"
                      value={novoFim}
                      onChange={(e) => setNovoFim(e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={adicionarBloqueio}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {STEPS[stepIndex].key === "preco" && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="preco">
                  Preço por noite (R$) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="preco"
                  inputMode="decimal"
                  value={draft.preco}
                  onChange={(e) => set("preco", e.target.value)}
                  placeholder="Ex: 250,00"
                  className="max-w-[200px]"
                />
                <p className="text-[11px] text-foreground/50">
                  Preço de vitrine por noite - você pode alterar quando quiser.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-2 pt-2">
            {stepIndex === 0 ? (
              <Button asChild variant="ghost" disabled={salvando}>
                <Link to="/meu-estabelecimento/itens">Cancelar</Link>
              </Button>
            ) : (
              <Button variant="ghost" onClick={voltar} disabled={salvando}>
                Voltar
              </Button>
            )}

            {stepIndex < STEPS.length - 1 ? (
              <Button onClick={avancar} className="bg-secondary hover:bg-secondary/90 text-white">
                Avançar
              </Button>
            ) : (
              <Button
                onClick={() => void salvar()}
                disabled={salvando}
                className="bg-secondary hover:bg-secondary/90 text-white"
              >
                {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar
              </Button>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            Como a família vai ver
          </p>
          <ItemReservavelPreviewCard
            nome={draft.nome}
            descricao={draft.descricao}
            preco={draft.preco.trim() ? Number(draft.preco.replace(",", ".")) : null}
            quantidade={Math.max(1, Number(draft.quantidade) || 1)}
            capacidadeTotal={Math.max(1, Number(draft.capacidadeTotal) || 1)}
            capacidadeAdultos={
              draft.capacidadeAdultos.trim() ? Number(draft.capacidadeAdultos) : null
            }
            capacidadeCriancas={
              draft.capacidadeCriancas.trim() ? Number(draft.capacidadeCriancas) : null
            }
            quantidadeCamas={Math.max(1, Number(draft.quantidadeCamas) || 1)}
            comodidades={draft.comodidades}
            checkInPadrao={draft.checkInPadrao || null}
            checkOutPadrao={draft.checkOutPadrao || null}
            imagens={draft.imagens}
            localResumo={localResumoPreview}
          />
        </div>
      </div>
    </div>
  );
}

function GeocodeButton({
  endereco,
  cidade,
  estado,
  onResult,
}: {
  endereco: string;
  cidade: string;
  estado: string;
  onResult: (lat: number, lng: number) => void;
}) {
  const [loading, setLoading] = useState(false);
  const canSearch = Boolean(endereco.trim() || cidade.trim());

  const handleSearch = async () => {
    if (!canSearch) {
      toast.error("Preencha pelo menos endereço ou cidade.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        addressdetails: "0",
        limit: "1",
        countrycodes: "br",
      });
      if (endereco.trim()) params.set("street", endereco.trim());
      if (cidade.trim()) params.set("city", cidade.trim());
      if (estado.trim()) params.set("state", estado.trim());

      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (!data.length) {
        toast.error("Endereço não encontrado. Tente refinar os campos.");
        return;
      }
      const lat = Number(data[0].lat);
      const lng = Number(data[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        toast.error("Coordenadas inválidas retornadas pelo serviço.");
        return;
      }
      onResult(lat, lng);
      toast.success("Coordenadas encontradas!");
    } catch (err) {
      console.error("[geocode] erro:", err);
      toast.error("Não foi possível buscar as coordenadas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void handleSearch()}
      disabled={loading || !canSearch}
      className="gap-2"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      Buscar coordenadas
    </Button>
  );
}
