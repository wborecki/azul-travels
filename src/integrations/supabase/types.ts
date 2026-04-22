export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      avaliacoes: {
        Row: {
          comentario: string | null
          criado_em: string
          estabelecimento_id: string
          familia_id: string
          id: string
          nota_acolhimento: number | null
          nota_comunicacao: number | null
          nota_estrutura: number | null
          nota_geral: number | null
          publica: boolean | null
        }
        Insert: {
          comentario?: string | null
          criado_em?: string
          estabelecimento_id: string
          familia_id: string
          id?: string
          nota_acolhimento?: number | null
          nota_comunicacao?: number | null
          nota_estrutura?: number | null
          nota_geral?: number | null
          publica?: boolean | null
        }
        Update: {
          comentario?: string | null
          criado_em?: string
          estabelecimento_id?: string
          familia_id?: string
          id?: string
          nota_acolhimento?: number | null
          nota_comunicacao?: number | null
          nota_estrutura?: number | null
          nota_geral?: number | null
          publica?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familia_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_tea: {
        Row: {
          autor: string | null
          categoria: Database["public"]["Enums"]["conteudo_categoria"] | null
          conteudo: string | null
          criado_em: string
          foto_capa: string | null
          id: string
          publicado: boolean | null
          resumo: string | null
          slug: string
          titulo: string
        }
        Insert: {
          autor?: string | null
          categoria?: Database["public"]["Enums"]["conteudo_categoria"] | null
          conteudo?: string | null
          criado_em?: string
          foto_capa?: string | null
          id?: string
          publicado?: boolean | null
          resumo?: string | null
          slug: string
          titulo: string
        }
        Update: {
          autor?: string | null
          categoria?: Database["public"]["Enums"]["conteudo_categoria"] | null
          conteudo?: string | null
          criado_em?: string
          foto_capa?: string | null
          id?: string
          publicado?: boolean | null
          resumo?: string | null
          slug?: string
          titulo?: string
        }
        Relationships: []
      }
      estabelecimentos: {
        Row: {
          atualizado_em: string
          beneficio_tea_descricao: string | null
          cep: string | null
          cidade: string | null
          criado_em: string
          descricao: string | null
          descricao_tea: string | null
          destaque: boolean | null
          email: string | null
          endereco: string | null
          estado: string | null
          foto_capa: string | null
          fotos: Json | null
          id: string
          latitude: number | null
          listagem_basica: boolean | null
          longitude: number | null
          mensalidade_ativa: boolean | null
          nome: string
          selo_azul: boolean | null
          selo_azul_validade: string | null
          selo_governamental: boolean | null
          selo_privado: boolean | null
          selo_privado_nome: string | null
          slug: string
          status: Database["public"]["Enums"]["estab_status"] | null
          telefone: string | null
          tem_beneficio_tea: boolean | null
          tem_caa: boolean | null
          tem_cardapio_visual: boolean | null
          tem_checkin_antecipado: boolean | null
          tem_concierge_tea: boolean | null
          tem_fila_prioritaria: boolean | null
          tem_sala_sensorial: boolean | null
          tipo: Database["public"]["Enums"]["estab_tipo"]
          tour_360_url: string | null
          website: string | null
        }
        Insert: {
          atualizado_em?: string
          beneficio_tea_descricao?: string | null
          cep?: string | null
          cidade?: string | null
          criado_em?: string
          descricao?: string | null
          descricao_tea?: string | null
          destaque?: boolean | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          foto_capa?: string | null
          fotos?: Json | null
          id?: string
          latitude?: number | null
          listagem_basica?: boolean | null
          longitude?: number | null
          mensalidade_ativa?: boolean | null
          nome: string
          selo_azul?: boolean | null
          selo_azul_validade?: string | null
          selo_governamental?: boolean | null
          selo_privado?: boolean | null
          selo_privado_nome?: string | null
          slug: string
          status?: Database["public"]["Enums"]["estab_status"] | null
          telefone?: string | null
          tem_beneficio_tea?: boolean | null
          tem_caa?: boolean | null
          tem_cardapio_visual?: boolean | null
          tem_checkin_antecipado?: boolean | null
          tem_concierge_tea?: boolean | null
          tem_fila_prioritaria?: boolean | null
          tem_sala_sensorial?: boolean | null
          tipo: Database["public"]["Enums"]["estab_tipo"]
          tour_360_url?: string | null
          website?: string | null
        }
        Update: {
          atualizado_em?: string
          beneficio_tea_descricao?: string | null
          cep?: string | null
          cidade?: string | null
          criado_em?: string
          descricao?: string | null
          descricao_tea?: string | null
          destaque?: boolean | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          foto_capa?: string | null
          fotos?: Json | null
          id?: string
          latitude?: number | null
          listagem_basica?: boolean | null
          longitude?: number | null
          mensalidade_ativa?: boolean | null
          nome?: string
          selo_azul?: boolean | null
          selo_azul_validade?: string | null
          selo_governamental?: boolean | null
          selo_privado?: boolean | null
          selo_privado_nome?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["estab_status"] | null
          telefone?: string | null
          tem_beneficio_tea?: boolean | null
          tem_caa?: boolean | null
          tem_cardapio_visual?: boolean | null
          tem_checkin_antecipado?: boolean | null
          tem_concierge_tea?: boolean | null
          tem_fila_prioritaria?: boolean | null
          tem_sala_sensorial?: boolean | null
          tipo?: Database["public"]["Enums"]["estab_tipo"]
          tour_360_url?: string | null
          website?: string | null
        }
        Relationships: []
      }
      explorar_filtros_padrao: {
        Row: {
          atualizado_em: string
          criado_em: string
          recursos: string[]
          selos: string[]
          tipos: Database["public"]["Enums"]["estab_tipo"][]
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          recursos?: string[]
          selos?: string[]
          tipos?: Database["public"]["Enums"]["estab_tipo"][]
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          recursos?: string[]
          selos?: string[]
          tipos?: Database["public"]["Enums"]["estab_tipo"][]
          user_id?: string
        }
        Relationships: []
      }
      explorar_links_curtos: {
        Row: {
          criado_em: string
          criado_por: string | null
          id: string
          path: string
          path_hash: string
          slug: string
          ultimo_acesso_em: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          path: string
          path_hash: string
          slug: string
          ultimo_acesso_em?: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          path?: string
          path_hash?: string
          slug?: string
          ultimo_acesso_em?: string
        }
        Relationships: []
      }
      familia_profiles: {
        Row: {
          cidade: string | null
          criado_em: string
          email: string | null
          estado: string | null
          id: string
          nome_responsavel: string | null
          telefone: string | null
        }
        Insert: {
          cidade?: string | null
          criado_em?: string
          email?: string | null
          estado?: string | null
          id: string
          nome_responsavel?: string | null
          telefone?: string | null
        }
        Update: {
          cidade?: string | null
          criado_em?: string
          email?: string | null
          estado?: string | null
          id?: string
          nome_responsavel?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      perfil_sensorial: {
        Row: {
          comunicacao_verbal: boolean | null
          criado_em: string
          dificuldade_esperar: boolean | null
          dificuldade_mudanca_rotina: boolean | null
          familia_id: string
          gosta_animais: boolean | null
          gosta_atividades_agua: boolean | null
          gosta_natureza: boolean | null
          id: string
          idade: number | null
          nivel_tea: Database["public"]["Enums"]["tea_nivel"] | null
          nome_autista: string
          notas_adicionais: string | null
          precisa_cardapio_visual: boolean | null
          precisa_checkin_antecipado: boolean | null
          precisa_concierge_tea: boolean | null
          precisa_fila_prioritaria: boolean | null
          precisa_sala_sensorial: boolean | null
          sensivel_cheiros: boolean | null
          sensivel_luz: boolean | null
          sensivel_multidao: boolean | null
          sensivel_sons: boolean | null
          sensivel_texturas: boolean | null
          usa_caa: boolean | null
          usa_libras: boolean | null
        }
        Insert: {
          comunicacao_verbal?: boolean | null
          criado_em?: string
          dificuldade_esperar?: boolean | null
          dificuldade_mudanca_rotina?: boolean | null
          familia_id: string
          gosta_animais?: boolean | null
          gosta_atividades_agua?: boolean | null
          gosta_natureza?: boolean | null
          id?: string
          idade?: number | null
          nivel_tea?: Database["public"]["Enums"]["tea_nivel"] | null
          nome_autista: string
          notas_adicionais?: string | null
          precisa_cardapio_visual?: boolean | null
          precisa_checkin_antecipado?: boolean | null
          precisa_concierge_tea?: boolean | null
          precisa_fila_prioritaria?: boolean | null
          precisa_sala_sensorial?: boolean | null
          sensivel_cheiros?: boolean | null
          sensivel_luz?: boolean | null
          sensivel_multidao?: boolean | null
          sensivel_sons?: boolean | null
          sensivel_texturas?: boolean | null
          usa_caa?: boolean | null
          usa_libras?: boolean | null
        }
        Update: {
          comunicacao_verbal?: boolean | null
          criado_em?: string
          dificuldade_esperar?: boolean | null
          dificuldade_mudanca_rotina?: boolean | null
          familia_id?: string
          gosta_animais?: boolean | null
          gosta_atividades_agua?: boolean | null
          gosta_natureza?: boolean | null
          id?: string
          idade?: number | null
          nivel_tea?: Database["public"]["Enums"]["tea_nivel"] | null
          nome_autista?: string
          notas_adicionais?: string | null
          precisa_cardapio_visual?: boolean | null
          precisa_checkin_antecipado?: boolean | null
          precisa_concierge_tea?: boolean | null
          precisa_fila_prioritaria?: boolean | null
          precisa_sala_sensorial?: boolean | null
          sensivel_cheiros?: boolean | null
          sensivel_luz?: boolean | null
          sensivel_multidao?: boolean | null
          sensivel_sons?: boolean | null
          sensivel_texturas?: boolean | null
          usa_caa?: boolean | null
          usa_libras?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "perfil_sensorial_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familia_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          criado_em: string
          data_checkin: string | null
          data_checkout: string | null
          estabelecimento_id: string
          familia_id: string
          id: string
          mensagem: string | null
          num_adultos: number | null
          num_autistas: number | null
          perfil_enviado_ao_estabelecimento: boolean | null
          perfil_sensorial_id: string | null
          status: Database["public"]["Enums"]["reserva_status"] | null
        }
        Insert: {
          criado_em?: string
          data_checkin?: string | null
          data_checkout?: string | null
          estabelecimento_id: string
          familia_id: string
          id?: string
          mensagem?: string | null
          num_adultos?: number | null
          num_autistas?: number | null
          perfil_enviado_ao_estabelecimento?: boolean | null
          perfil_sensorial_id?: string | null
          status?: Database["public"]["Enums"]["reserva_status"] | null
        }
        Update: {
          criado_em?: string
          data_checkin?: string | null
          data_checkout?: string | null
          estabelecimento_id?: string
          familia_id?: string
          id?: string
          mensagem?: string | null
          num_adultos?: number | null
          num_autistas?: number | null
          perfil_enviado_ao_estabelecimento?: boolean | null
          perfil_sensorial_id?: string | null
          status?: Database["public"]["Enums"]["reserva_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "reservas_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familia_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_perfil_sensorial_id_fkey"
            columns: ["perfil_sensorial_id"]
            isOneToOne: false
            referencedRelation: "perfil_sensorial"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas_auditoria: {
        Row: {
          acao: string
          ator_email: string | null
          ator_id: string
          criado_em: string
          id: string
          observacao: string | null
          reserva_id: string
          status_anterior: Database["public"]["Enums"]["reserva_status"] | null
          status_novo: Database["public"]["Enums"]["reserva_status"] | null
        }
        Insert: {
          acao: string
          ator_email?: string | null
          ator_id: string
          criado_em?: string
          id?: string
          observacao?: string | null
          reserva_id: string
          status_anterior?: Database["public"]["Enums"]["reserva_status"] | null
          status_novo?: Database["public"]["Enums"]["reserva_status"] | null
        }
        Update: {
          acao?: string
          ator_email?: string | null
          ator_id?: string
          criado_em?: string
          id?: string
          observacao?: string | null
          reserva_id?: string
          status_anterior?: Database["public"]["Enums"]["reserva_status"] | null
          status_novo?: Database["public"]["Enums"]["reserva_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "reservas_auditoria_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          criado_em: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expurgar_links_curtos_inativos: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      registrar_acesso_link_curto: { Args: { _slug: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
      conteudo_categoria:
        | "legislacao"
        | "dicas_viagem"
        | "boas_praticas"
        | "novidades"
        | "destinos"
      estab_status: "ativo" | "inativo" | "pendente"
      estab_tipo:
        | "hotel"
        | "pousada"
        | "resort"
        | "restaurante"
        | "parque"
        | "atracoes"
        | "agencia"
        | "transporte"
      reserva_status: "pendente" | "confirmada" | "cancelada" | "concluida"
      tea_nivel: "leve" | "moderado" | "severo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      conteudo_categoria: [
        "legislacao",
        "dicas_viagem",
        "boas_praticas",
        "novidades",
        "destinos",
      ],
      estab_status: ["ativo", "inativo", "pendente"],
      estab_tipo: [
        "hotel",
        "pousada",
        "resort",
        "restaurante",
        "parque",
        "atracoes",
        "agencia",
        "transporte",
      ],
      reserva_status: ["pendente", "confirmada", "cancelada", "concluida"],
      tea_nivel: ["leve", "moderado", "severo"],
    },
  },
} as const
