import { useEffect, useRef } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Images,
  Loader2,
  Lock,
  Phone,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ESTAB_TIPOS, ESTAB_TIPO_LABEL } from "@/lib/enums";
import { RECURSOS_TEA, type RecursoTeaKey } from "@/lib/recursos-tea";
import {
  SECOES,
  COLAB_OPTS,
  CONTATO_OPTS,
  INICIATIVA_OPTS,
  estruturaDoDraft,
  type PerfilDraft,
  type SecaoId,
  type SecaoInfo,
} from "@/lib/perfil-estabelecimento";
import { geocodeEndereco, reverseGeocode } from "@/lib/geocode";
import { FotosGaleria } from "@/components/estabelecimento/FotosGaleria";
import { LocationPickerField } from "@/components/estabelecimento/LocationPickerField";

interface PerfilEstabelecimentoEditorProps {
  draft: PerfilDraft;
  /** Última versão persistida - base da detecção de alteração não salva. */
  draftSalvo: PerfilDraft;
  set: <K extends keyof PerfilDraft>(k: K, v: PerfilDraft[K]) => void;
  secaoAtiva: SecaoId;
  onSelecionarSecao: (id: SecaoId) => void;
  onSalvar: (secao: SecaoInfo) => void;
  /** Id da seção sendo gravada, ou null. */
  salvando: SecaoId | null;
  onFechar: () => void;
  /** null enquanto o estabelecimento não existe. */
  estabId: string | null;
  /** Recursos TEA só são editáveis depois do Selo Azul (ver 20260804150000). */
  podeEditarRecursos: boolean;
  uploadPrefixo: string | undefined;
}

export function PerfilEstabelecimentoEditor({
  draft,
  draftSalvo,
  set,
  secaoAtiva,
  onSelecionarSecao,
  onSalvar,
  salvando,
  onFechar,
  estabId,
  podeEditarRecursos,
  uploadPrefixo,
}: PerfilEstabelecimentoEditorProps) {
  const secao = SECOES.find((s) => s.id === secaoAtiva) ?? SECOES[0];
  const bloqueada = secao.exigeEstab && !estabId;

  const sujaEm = (s: SecaoInfo) =>
    s.campos.some((c) => JSON.stringify(draft[c]) !== JSON.stringify(draftSalvo[c]));

  const completas = SECOES.filter((s) => !s.pendente(draft)).length;

  // Enquanto o estabelecimento não existe não há nada persistido para comparar,
  // então "sem alteração" não pode travar o salvamento que justamente o cria.
  const precisaCriar = !estabId && secao.id === "identidade";

  return (
    <div className="space-y-6">
      <button
        onClick={onFechar}
        className="inline-flex items-center text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao painel
      </button>

      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <RailSecoes
          draft={draft}
          secaoAtiva={secaoAtiva}
          onSelecionar={onSelecionarSecao}
          sujaEm={sujaEm}
          completas={completas}
          estabId={estabId}
        />

        <div className="flex-1 min-w-0 bg-white border rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-3 border-b pb-4 mb-6">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-azul-claro text-primary">
              <secao.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-lg text-primary">{secao.label}</h2>
              <p className="text-xs text-foreground/60 mt-0.5">{secao.ajuda}</p>
            </div>
          </div>

          {bloqueada ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-5 py-8 text-center">
              <Lock className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">
                Salve a Identidade primeiro
              </p>
              <p className="mt-1 text-xs text-foreground/60 max-w-sm mx-auto">
                Seu estabelecimento passa a existir na plataforma quando você salva o nome, o tipo e
                o endereço. Só depois disso conseguimos guardar o resto.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-primary text-primary hover:bg-azul-claro"
                onClick={() => onSelecionarSecao("identidade")}
              >
                Ir para Identidade
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-5">
                {secao.id === "identidade" && (
                  <SecaoIdentidade draft={draft} set={set} estabCriado={!!estabId} />
                )}
                {secao.id === "descricao" && <SecaoDescricao draft={draft} set={set} />}
                {secao.id === "fotos" && (
                  <SecaoFotos draft={draft} set={set} uploadPrefixo={uploadPrefixo} />
                )}
                {secao.id === "contato" && <SecaoContato draft={draft} set={set} />}
                {secao.id === "acolhimento" && (
                  <SecaoAcolhimento
                    draft={draft}
                    set={set}
                    podeEditarRecursos={podeEditarRecursos}
                  />
                )}
                {secao.id === "certificacao" && <SecaoCertificacao draft={draft} set={set} />}
              </div>

              <div className="mt-8 flex items-center justify-end gap-3 border-t pt-5">
                {sujaEm(secao) && (
                  <span className="mr-auto inline-flex items-center gap-1.5 text-xs font-medium text-amarelo-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-amarelo" />
                    Alterações não salvas
                  </span>
                )}
                <Button
                  onClick={() => onSalvar(secao)}
                  disabled={salvando !== null || (!sujaEm(secao) && !precisaCriar)}
                  className="bg-secondary hover:bg-secondary/90 text-white"
                >
                  {salvando === secao.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar {secao.label.toLowerCase()}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RailSecoes({
  draft,
  secaoAtiva,
  onSelecionar,
  sujaEm,
  completas,
  estabId,
}: {
  draft: PerfilDraft;
  secaoAtiva: SecaoId;
  onSelecionar: (id: SecaoId) => void;
  sujaEm: (s: SecaoInfo) => boolean;
  completas: number;
  estabId: string | null;
}) {
  return (
    <nav className="md:w-72 md:shrink-0 md:sticky md:top-6">
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b bg-azul-claro/20">
          <p className="font-display font-bold text-sm text-primary">Perfil do local</p>
          <p className="text-[11px] text-foreground/60 mt-0.5">
            {completas} de {SECOES.length} seções completas
          </p>
        </div>
        <ul>
          {SECOES.map((s) => {
            const ativa = s.id === secaoAtiva;
            const bloqueada = s.exigeEstab && !estabId;
            const pendente = s.pendente(draft);
            const suja = sujaEm(s);
            return (
              <li key={s.id}>
                <button
                  onClick={() => onSelecionar(s.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left border-l-2 transition",
                    ativa
                      ? "border-primary bg-azul-claro/40"
                      : "border-transparent hover:bg-azul-claro/20",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm font-medium truncate",
                        ativa ? "text-primary" : "text-foreground",
                      )}
                    >
                      {s.label}
                    </span>
                    <span className="block text-[11px] text-foreground/55 truncate">
                      {bloqueada ? "Aguarda a Identidade" : s.resumo(draft)}
                    </span>
                  </span>
                  {suja ? (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-amarelo"
                      title="Alterações não salvas"
                    />
                  ) : bloqueada ? (
                    <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : pendente ? (
                    <AlertCircle className="h-4 w-4 shrink-0 text-amarelo-foreground" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 md:hidden",
                      ativa ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

type SetDraft = <K extends keyof PerfilDraft>(k: K, v: PerfilDraft[K]) => void;

function SecaoIdentidade({
  draft,
  set,
  estabCriado,
}: {
  draft: PerfilDraft;
  set: SetDraft;
  estabCriado: boolean;
}) {
  const enderecoKey = JSON.stringify([draft.endereco, draft.cidade, draft.estado]);
  const enderecoKeyDebounced = useDebouncedValue(enderecoKey, 900);
  const enderecoInicialRef = useRef(enderecoKey);
  const ultimaFonteRef = useRef<"endereco" | "mapa" | null>(null);

  useEffect(() => {
    if (ultimaFonteRef.current === "mapa") {
      ultimaFonteRef.current = null;
      return;
    }
    if (
      enderecoKeyDebounced === enderecoInicialRef.current &&
      draft.latitude.trim() &&
      draft.longitude.trim()
    ) {
      return;
    }
    const [endereco, cidade, estado] = JSON.parse(enderecoKeyDebounced) as string[];
    if (!endereco.trim() && !cidade.trim()) return;
    let cancelado = false;
    void (async () => {
      const resultado = await geocodeEndereco({ endereco, cidade, estado }).catch(() => null);
      if (!cancelado && resultado) {
        set("latitude", String(resultado.lat));
        set("longitude", String(resultado.lng));
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enderecoKeyDebounced]);

  const handlePinChange = (lat: number, lng: number) => {
    ultimaFonteRef.current = "mapa";
    set("latitude", String(lat));
    set("longitude", String(lng));
    void (async () => {
      const resultado = await reverseGeocode(lat, lng).catch(() => null);
      if (resultado) {
        if (resultado.endereco) set("endereco", resultado.endereco);
        if (resultado.cidade) set("cidade", resultado.cidade);
        if (resultado.estado) set("estado", resultado.estado);
      }
    })();
  };

  return (
    <>
      <Campo label="Nome do estabelecimento" required>
        <Input value={draft.nome} onChange={(e) => set("nome", e.target.value)} maxLength={120} />
      </Campo>
      <div className="grid sm:grid-cols-2 gap-4">
        <Campo
          label="Tipo"
          required
          ajuda={
            estabCriado
              ? "Definido na criação. É o tipo que decide se o local recebe reserva de quarto ou de visita - para trocar, fale com a nossa equipe."
              : undefined
          }
        >
          <select
            value={draft.tipo}
            onChange={(e) => set("tipo", e.target.value)}
            disabled={estabCriado}
            className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white h-10 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground"
          >
            <option value="">Selecione…</option>
            {ESTAB_TIPOS.map((t) => (
              <option key={t} value={t}>
                {ESTAB_TIPO_LABEL[t]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Número de colaboradores">
          <select
            value={draft.num_colaboradores}
            onChange={(e) => set("num_colaboradores", e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md text-sm bg-white h-10"
          >
            <option value="">Selecione…</option>
            {COLAB_OPTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <Campo label="Endereço completo" required>
        <Input
          value={draft.endereco}
          onChange={(e) => set("endereco", e.target.value)}
          maxLength={200}
        />
      </Campo>
      <div className="grid sm:grid-cols-[1fr_120px] gap-4">
        <Campo label="Cidade" required>
          <Input
            value={draft.cidade}
            onChange={(e) => set("cidade", e.target.value)}
            maxLength={80}
          />
        </Campo>
        <Campo label="Estado (UF)" required>
          <Input
            value={draft.estado}
            maxLength={2}
            onChange={(e) => set("estado", e.target.value.toUpperCase())}
          />
        </Campo>
      </div>
      <Campo label="Localização no mapa" required>
        <p className="mb-2 text-xs text-foreground/60">
          O pino é posicionado automaticamente a partir do endereço, cidade e estado. Você também
          pode clicar ou arrastar o pino no mapa para ajustar manualmente.
        </p>
        <LocationPickerField
          latitude={draft.latitude.trim() ? Number(draft.latitude) : null}
          longitude={draft.longitude.trim() ? Number(draft.longitude) : null}
          onChange={handlePinChange}
        />
      </Campo>
      <Campo label="Website (opcional)">
        <Input
          type="url"
          placeholder="https://"
          value={draft.website}
          onChange={(e) => set("website", e.target.value)}
          maxLength={200}
        />
      </Campo>
    </>
  );
}

function SecaoDescricao({ draft, set }: { draft: PerfilDraft; set: SetDraft }) {
  return (
    <>
      <Campo
        label="Sobre o local"
        ajuda="Apresente o lugar como você apresentaria a alguém que nunca foi. Evite jargão de marketing."
      >
        <Textarea
          rows={6}
          value={draft.descricao}
          onChange={(e) => set("descricao", e.target.value)}
          maxLength={2000}
          placeholder="Ex: Restaurante de comida caseira em Curitiba, com salão amplo e uma varanda coberta mais reservada…"
        />
        <ContadorCaracteres valor={draft.descricao} max={2000} />
      </Campo>
      <Campo
        label="O que vocês fazem por famílias atípicas"
        ajuda="Esta é a parte que a família procura. Seja concreto: o que muda na prática quando vocês recebem uma pessoa autista."
      >
        <Textarea
          rows={6}
          value={draft.descricao_tea}
          onChange={(e) => set("descricao_tea", e.target.value)}
          maxLength={2000}
          placeholder="Ex: Reservamos a mesa da varanda, que é a mais silenciosa. A equipe sabe servir sem interromper e não insiste em contato visual…"
        />
        <ContadorCaracteres valor={draft.descricao_tea} max={2000} />
      </Campo>
    </>
  );
}

function SecaoFotos({
  draft,
  set,
  uploadPrefixo,
}: {
  draft: PerfilDraft;
  set: SetDraft;
  uploadPrefixo: string | undefined;
}) {
  return (
    <>
      <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-azul-claro/30 px-4 py-3">
        <Images className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-foreground/75">
          A primeira foto é a <strong className="font-semibold text-primary">capa</strong> - é ela
          que aparece no seu card na busca e no topo da sua página. Mostre o local como a família
          vai encontrar: a entrada, o ambiente principal e os espaços mais tranquilos.
        </p>
      </div>
      <FotosGaleria
        value={draft.fotos}
        onChange={(v) => set("fotos", v)}
        bucket="estabelecimentos-fotos"
        prefixo={uploadPrefixo}
        permitirUrl={false}
      />
      <Campo
        label="Tour 360° (opcional)"
        ajuda="Link de um tour virtual. Aparece como um botão sobre a foto de capa, e ajuda a família a reconhecer o lugar antes de chegar."
      >
        <Input
          type="url"
          placeholder="https://"
          value={draft.tour_360_url}
          onChange={(e) => set("tour_360_url", e.target.value)}
          maxLength={500}
        />
      </Campo>
    </>
  );
}

function SecaoContato({ draft, set }: { draft: PerfilDraft; set: SetDraft }) {
  return (
    <>
      <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-azul-claro/30 px-4 py-3">
        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-foreground/75">
          Enquanto o Selo Azul não está ativo, sua página não aceita reserva - ela mostra estes
          dados para a família falar direto com vocês. Sem telefone aqui, ela fica sem saída.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Campo label="Telefone">
          <Input
            type="tel"
            placeholder="(41) 90000-0000"
            value={draft.telefone}
            onChange={(e) => set("telefone", e.target.value)}
            maxLength={40}
          />
        </Campo>
        <Campo label="E-mail">
          <Input
            type="email"
            placeholder="contato@seulocal.com.br"
            value={draft.email}
            onChange={(e) => set("email", e.target.value)}
            maxLength={255}
          />
        </Campo>
      </div>
      <Campo
        label="Melhor forma de a nossa equipe falar com você"
        ajuda="Uso interno, para o time do Selo Azul. Não aparece na página pública."
      >
        <RadioList
          name="contato"
          value={draft.contato_preferido}
          onChange={(v) => set("contato_preferido", v)}
          options={CONTATO_OPTS}
          inline
        />
      </Campo>
    </>
  );
}

function SecaoAcolhimento({
  draft,
  set,
  podeEditarRecursos,
}: {
  draft: PerfilDraft;
  set: SetDraft;
  podeEditarRecursos: boolean;
}) {
  const togEstrutura = (key: string) =>
    set("estrutura", { ...draft.estrutura, [key]: !draft.estrutura[key] });

  const togRecurso = (key: RecursoTeaKey) =>
    set("recursos", { ...draft.recursos, [key]: !draft.recursos[key] });

  /** A lista é a da categoria do local - um restaurante não vê item de quarto. */
  const itensEstrutura = estruturaDoDraft(draft);

  return (
    <>
      <div>
        <h3 className="text-sm font-semibold text-primary">Estrutura física</h3>
        <p className="text-xs text-foreground/60 mt-0.5 mb-3">
          Marque o que o local já possui. A lista é a do seu tipo de estabelecimento.
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {itensEstrutura.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2.5 px-3 py-2 border rounded-lg text-sm cursor-pointer hover:bg-azul-claro/30"
            >
              <Checkbox
                checked={!!draft.estrutura[item.key]}
                onCheckedChange={() => togEstrutura(item.key)}
              />
              <item.icon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="min-w-0">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {draft.tipo === "passeio_educativo" && (
        <label className="flex items-start gap-3 p-3 border rounded-lg bg-azul-claro/20 cursor-pointer hover:bg-azul-claro/30">
          <Checkbox
            checked={draft.recebe_grupos_escolares_tea}
            onCheckedChange={(v) => set("recebe_grupos_escolares_tea", v === true)}
            className="mt-0.5"
          />
          <span className="text-sm">
            <span className="font-medium">Recebe grupos escolares com alunos TEA</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Se marcado, exibimos um selo discreto na sua ficha pública para famílias e escolas.
            </span>
          </span>
        </label>
      )}

      <div className="pt-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-primary">Recursos verificados</h3>
            <p className="text-xs text-foreground/60 mt-0.5">
              A família filtra a busca por estes itens.
            </p>
          </div>
          {!podeEditarRecursos && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              <Lock className="h-3 w-3" /> Após o selo
            </span>
          )}
        </div>

        {!podeEditarRecursos && (
          <p className="mt-3 rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-xs leading-relaxed text-foreground/70">
            Estes campos são liberados quando o Selo Azul fica ativo. A família confia neles para
            filtrar a busca, então eles valem depois que nossa equipe visita o local - não é uma
            desconfiança de vocês, é o que faz o filtro significar alguma coisa.
          </p>
        )}

        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          {RECURSOS_TEA.map((r) => (
            <label
              key={r.key}
              className={cn(
                "flex items-start gap-2.5 px-3 py-2.5 border rounded-lg text-sm",
                podeEditarRecursos
                  ? "cursor-pointer hover:bg-azul-claro/30"
                  : "opacity-60 cursor-not-allowed bg-muted/20",
              )}
            >
              <Checkbox
                checked={draft.recursos[r.key]}
                disabled={!podeEditarRecursos}
                onCheckedChange={() => togRecurso(r.key)}
                className="mt-0.5"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-medium">
                  <r.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  {r.label}
                </span>
                <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {r.ajuda}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <label
          className={cn(
            "flex items-start gap-3 p-3 border rounded-lg",
            podeEditarRecursos
              ? "cursor-pointer bg-azul-claro/20 hover:bg-azul-claro/30"
              : "opacity-60 cursor-not-allowed bg-muted/20",
          )}
        >
          <Checkbox
            checked={draft.tem_beneficio_tea}
            disabled={!podeEditarRecursos}
            onCheckedChange={(v) => set("tem_beneficio_tea", v === true)}
            className="mt-0.5"
          />
          <span className="text-sm">
            <span className="font-medium">Oferecemos um benefício para famílias atípicas</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Desconto, cortesia ou condição especial. A busca tem um filtro só para isso.
            </span>
          </span>
        </label>
        {draft.tem_beneficio_tea && (
          <div className="mt-3">
            <Campo label="Qual é o benefício">
              <Input
                value={draft.beneficio_tea_descricao}
                disabled={!podeEditarRecursos}
                onChange={(e) => set("beneficio_tea_descricao", e.target.value)}
                maxLength={1000}
                placeholder="Ex: 15% de desconto mediante laudo na recepção."
              />
            </Campo>
          </div>
        )}
      </div>
    </>
  );
}

function SecaoCertificacao({ draft, set }: { draft: PerfilDraft; set: SetDraft }) {
  return (
    <>
      <Campo label="Já tem iniciativa de inclusão para autistas?">
        <RadioList
          name="iniciativa"
          value={draft.iniciativa_atual}
          onChange={(v) => set("iniciativa_atual", v)}
          options={INICIATIVA_OPTS}
        />
      </Campo>
      <Campo label="Quantos colaboradores passariam pela capacitação?">
        <select
          value={draft.num_capacitacao}
          onChange={(e) => set("num_capacitacao", e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border border-input rounded-md text-sm bg-white h-10"
        >
          <option value="">Selecione…</option>
          {COLAB_OPTS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Campo>
      <Campo label="Observações adicionais">
        <Textarea
          rows={3}
          value={draft.observacoes}
          onChange={(e) => set("observacoes", e.target.value)}
          maxLength={1000}
        />
      </Campo>
    </>
  );
}

function Campo({
  label,
  required,
  ajuda,
  children,
}: {
  label: string;
  required?: boolean;
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-primary">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {ajuda && <p className="mt-0.5 text-xs text-foreground/60 leading-relaxed">{ajuda}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ContadorCaracteres({ valor, max }: { valor: string; max: number }) {
  return (
    <p className="mt-1 text-right text-[11px] text-muted-foreground">
      {valor.length} / {max}
    </p>
  );
}

function RadioList({
  name,
  value,
  onChange,
  options,
  inline,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
  inline?: boolean;
}) {
  return (
    <div className={inline ? "flex flex-wrap gap-3" : "space-y-2"}>
      {options.map(([v, label]) => (
        <label
          key={v}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer hover:bg-azul-claro/30"
        >
          <input
            type="radio"
            name={name}
            value={v}
            checked={value === v}
            onChange={() => onChange(v)}
            className="accent-primary"
          />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}
