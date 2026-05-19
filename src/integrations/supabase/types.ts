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
      contatos_estabelecimentos: {
        Row: {
          cidade: string
          criado_em: string
          email: string
          estado: string
          id: string
          interesses: string[]
          mensagem: string | null
          nome_estabelecimento: string
          nome_responsavel: string
          num_colaboradores: string
          origem: string | null
          telefone: string
          tipo_estabelecimento: string
        }
        Insert: {
          cidade: string
          criado_em?: string
          email: string
          estado: string
          id?: string
          interesses?: string[]
          mensagem?: string | null
          nome_estabelecimento: string
          nome_responsavel: string
          num_colaboradores: string
          origem?: string | null
          telefone: string
          tipo_estabelecimento: string
        }
        Update: {
          cidade?: string
          criado_em?: string
          email?: string
          estado?: string
          id?: string
          interesses?: string[]
          mensagem?: string | null
          nome_estabelecimento?: string
          nome_responsavel?: string
          num_colaboradores?: string
          origem?: string | null
          telefone?: string
          tipo_estabelecimento?: string
        }
        Relationships: []
      }
      contatos_gerais: {
        Row: {
          assunto: string | null
          criado_em: string
          email: string
          id: string
          mensagem: string
          nome: string
          origem: string | null
          telefone: string | null
        }
        Insert: {
          assunto?: string | null
          criado_em?: string
          email: string
          id?: string
          mensagem: string
          nome: string
          origem?: string | null
          telefone?: string | null
        }
        Update: {
          assunto?: string | null
          criado_em?: string
          email?: string
          id?: string
          mensagem?: string
          nome?: string
          origem?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      conteudo_eventos: {
        Row: {
          conteudo_id: string
          criado_em: string
          id: string
          referrer: string | null
          sessao_id: string | null
          tipo: string
          url_alvo: string | null
        }
        Insert: {
          conteudo_id: string
          criado_em?: string
          id?: string
          referrer?: string | null
          sessao_id?: string | null
          tipo: string
          url_alvo?: string | null
        }
        Update: {
          conteudo_id?: string
          criado_em?: string
          id?: string
          referrer?: string | null
          sessao_id?: string | null
          tipo?: string
          url_alvo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conteudo_eventos_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudo_tea"
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
          publicar_em: string | null
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
          publicar_em?: string | null
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
          publicar_em?: string | null
          resumo?: string | null
          slug?: string
          titulo?: string
        }
        Relationships: []
      }
      estabelecimento_profiles: {
        Row: {
          atualizado_em: string
          cargo: string | null
          cidade: string | null
          contato_preferido: string | null
          criado_em: string
          email: string | null
          endereco: string | null
          estabelecimento_id: string | null
          estado: string | null
          estrutura: Json
          id: string
          iniciativa_atual: string | null
          last_seen_at: string | null
          nome_responsavel: string | null
          notes: string | null
          num_capacitacao: string | null
          num_colaboradores: string | null
          observacoes: string | null
          origem: string | null
          perfil_completo: boolean
          status: string
          tipo: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          atualizado_em?: string
          cargo?: string | null
          cidade?: string | null
          contato_preferido?: string | null
          criado_em?: string
          email?: string | null
          endereco?: string | null
          estabelecimento_id?: string | null
          estado?: string | null
          estrutura?: Json
          id: string
          iniciativa_atual?: string | null
          last_seen_at?: string | null
          nome_responsavel?: string | null
          notes?: string | null
          num_capacitacao?: string | null
          num_colaboradores?: string | null
          observacoes?: string | null
          origem?: string | null
          perfil_completo?: boolean
          status?: string
          tipo?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          atualizado_em?: string
          cargo?: string | null
          cidade?: string | null
          contato_preferido?: string | null
          criado_em?: string
          email?: string | null
          endereco?: string | null
          estabelecimento_id?: string | null
          estado?: string | null
          estrutura?: Json
          id?: string
          iniciativa_atual?: string | null
          last_seen_at?: string | null
          nome_responsavel?: string | null
          notes?: string | null
          num_capacitacao?: string | null
          num_colaboradores?: string | null
          observacoes?: string | null
          origem?: string | null
          perfil_completo?: boolean
          status?: string
          tipo?: string | null
          website?: string | null
          whatsapp?: string | null
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
          owner_user_id: string | null
          recebe_grupos_escolares_tea: boolean
          selo_azul: boolean | null
          selo_azul_validade: string | null
          selo_governamental: boolean | null
          selo_privado: boolean | null
          selo_privado_nome: string | null
          slug: string
          status: Database["public"]["Enums"]["estab_status"] | null
          subtipo_educativo: string | null
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
          owner_user_id?: string | null
          recebe_grupos_escolares_tea?: boolean
          selo_azul?: boolean | null
          selo_azul_validade?: string | null
          selo_governamental?: boolean | null
          selo_privado?: boolean | null
          selo_privado_nome?: string | null
          slug: string
          status?: Database["public"]["Enums"]["estab_status"] | null
          subtipo_educativo?: string | null
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
          owner_user_id?: string | null
          recebe_grupos_escolares_tea?: boolean
          selo_azul?: boolean | null
          selo_azul_validade?: string | null
          selo_governamental?: boolean | null
          selo_privado?: boolean | null
          selo_privado_nome?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["estab_status"] | null
          subtipo_educativo?: string | null
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
      estabelecimentos_auditoria: {
        Row: {
          acao: string
          ator_email: string | null
          ator_id: string | null
          campo: string | null
          criado_em: string
          estabelecimento_id: string
          estabelecimento_nome: string | null
          id: string
          valor_anterior: Json | null
          valor_novo: Json | null
        }
        Insert: {
          acao: string
          ator_email?: string | null
          ator_id?: string | null
          campo?: string | null
          criado_em?: string
          estabelecimento_id: string
          estabelecimento_nome?: string | null
          id?: string
          valor_anterior?: Json | null
          valor_novo?: Json | null
        }
        Update: {
          acao?: string
          ator_email?: string | null
          ator_id?: string | null
          campo?: string | null
          criado_em?: string
          estabelecimento_id?: string
          estabelecimento_nome?: string | null
          id?: string
          valor_anterior?: Json | null
          valor_novo?: Json | null
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
          atualizado_em: string
          cidade: string | null
          criado_em: string
          email: string | null
          estado: string | null
          id: string
          last_seen_at: string | null
          nome_responsavel: string | null
          notes: string | null
          origem: string | null
          status: string
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          email?: string | null
          estado?: string | null
          id: string
          last_seen_at?: string | null
          nome_responsavel?: string | null
          notes?: string | null
          origem?: string | null
          status?: string
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string
          cidade?: string | null
          criado_em?: string
          email?: string | null
          estado?: string | null
          id?: string
          last_seen_at?: string | null
          nome_responsavel?: string | null
          notes?: string | null
          origem?: string | null
          status?: string
          telefone?: string | null
        }
        Relationships: []
      }
      leads_estabelecimentos: {
        Row: {
          cargo: string | null
          cidade: string
          como_conheceu: string | null
          criado_em: string
          email: string
          estado: string
          id: string
          iniciativa_atual: string | null
          interesses: string[] | null
          nome: string
          nome_estabelecimento: string
          num_colaboradores: string | null
          origem: string | null
          tipo: string | null
          whatsapp: string
        }
        Insert: {
          cargo?: string | null
          cidade: string
          como_conheceu?: string | null
          criado_em?: string
          email: string
          estado: string
          id?: string
          iniciativa_atual?: string | null
          interesses?: string[] | null
          nome: string
          nome_estabelecimento: string
          num_colaboradores?: string | null
          origem?: string | null
          tipo?: string | null
          whatsapp: string
        }
        Update: {
          cargo?: string | null
          cidade?: string
          como_conheceu?: string | null
          criado_em?: string
          email?: string
          estado?: string
          id?: string
          iniciativa_atual?: string | null
          interesses?: string[] | null
          nome?: string
          nome_estabelecimento?: string
          num_colaboradores?: string | null
          origem?: string | null
          tipo?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      leads_familias: {
        Row: {
          cidade: string
          como_conheceu: string | null
          criado_em: string
          email: string
          estado: string
          id: string
          nome: string
          num_filhos_tea: string | null
          origem: string | null
          preocupacoes: string[] | null
          status_diagnostico: string | null
          whatsapp: string | null
        }
        Insert: {
          cidade: string
          como_conheceu?: string | null
          criado_em?: string
          email: string
          estado: string
          id?: string
          nome: string
          num_filhos_tea?: string | null
          origem?: string | null
          preocupacoes?: string[] | null
          status_diagnostico?: string | null
          whatsapp?: string | null
        }
        Update: {
          cidade?: string
          como_conheceu?: string | null
          criado_em?: string
          email?: string
          estado?: string
          id?: string
          nome?: string
          num_filhos_tea?: string | null
          origem?: string | null
          preocupacoes?: string[] | null
          status_diagnostico?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      perfil_sensorial: {
        Row: {
          alimentacao_observacoes: string | null
          alimentacao_restricoes: string[] | null
          alimentacao_seletiva: boolean | null
          apoio_alimentacao: boolean | null
          apoio_higiene: boolean | null
          apoio_mobilidade: boolean | null
          apoio_seguranca: boolean | null
          comunicacao_verbal: boolean | null
          criado_em: string
          dificuldade_esperar: boolean | null
          dificuldade_mudanca_rotina: boolean | null
          estrategias_acalmar: string | null
          estrategias_que_funcionam: string | null
          familia_id: string
          gatilhos: string[] | null
          gosta_animais: boolean | null
          gosta_atividades_agua: boolean | null
          gosta_natureza: boolean | null
          id: string
          idade: number | null
          interesses_extra: string[] | null
          nivel_tea: Database["public"]["Enums"]["tea_nivel"] | null
          nome_autista: string
          notas_adicionais: string | null
          precisa_cardapio_visual: boolean | null
          precisa_checkin_antecipado: boolean | null
          precisa_concierge_tea: boolean | null
          precisa_fila_prioritaria: boolean | null
          precisa_sala_sensorial: boolean | null
          quarto_andar_baixo: boolean | null
          quarto_blackout: boolean | null
          quarto_cama_extra: boolean | null
          quarto_longe_elevador: boolean | null
          quarto_observacoes: string | null
          quarto_sem_estampas: boolean | null
          rotina_horario_acordar: string | null
          rotina_horario_dormir: string | null
          rotina_observacoes: string | null
          sensivel_cheiros: boolean | null
          sensivel_luz: boolean | null
          sensivel_multidao: boolean | null
          sensivel_sons: boolean | null
          sensivel_texturas: boolean | null
          sinais_sobrecarga: string | null
          usa_caa: boolean | null
          usa_libras: boolean | null
        }
        Insert: {
          alimentacao_observacoes?: string | null
          alimentacao_restricoes?: string[] | null
          alimentacao_seletiva?: boolean | null
          apoio_alimentacao?: boolean | null
          apoio_higiene?: boolean | null
          apoio_mobilidade?: boolean | null
          apoio_seguranca?: boolean | null
          comunicacao_verbal?: boolean | null
          criado_em?: string
          dificuldade_esperar?: boolean | null
          dificuldade_mudanca_rotina?: boolean | null
          estrategias_acalmar?: string | null
          estrategias_que_funcionam?: string | null
          familia_id: string
          gatilhos?: string[] | null
          gosta_animais?: boolean | null
          gosta_atividades_agua?: boolean | null
          gosta_natureza?: boolean | null
          id?: string
          idade?: number | null
          interesses_extra?: string[] | null
          nivel_tea?: Database["public"]["Enums"]["tea_nivel"] | null
          nome_autista: string
          notas_adicionais?: string | null
          precisa_cardapio_visual?: boolean | null
          precisa_checkin_antecipado?: boolean | null
          precisa_concierge_tea?: boolean | null
          precisa_fila_prioritaria?: boolean | null
          precisa_sala_sensorial?: boolean | null
          quarto_andar_baixo?: boolean | null
          quarto_blackout?: boolean | null
          quarto_cama_extra?: boolean | null
          quarto_longe_elevador?: boolean | null
          quarto_observacoes?: string | null
          quarto_sem_estampas?: boolean | null
          rotina_horario_acordar?: string | null
          rotina_horario_dormir?: string | null
          rotina_observacoes?: string | null
          sensivel_cheiros?: boolean | null
          sensivel_luz?: boolean | null
          sensivel_multidao?: boolean | null
          sensivel_sons?: boolean | null
          sensivel_texturas?: boolean | null
          sinais_sobrecarga?: string | null
          usa_caa?: boolean | null
          usa_libras?: boolean | null
        }
        Update: {
          alimentacao_observacoes?: string | null
          alimentacao_restricoes?: string[] | null
          alimentacao_seletiva?: boolean | null
          apoio_alimentacao?: boolean | null
          apoio_higiene?: boolean | null
          apoio_mobilidade?: boolean | null
          apoio_seguranca?: boolean | null
          comunicacao_verbal?: boolean | null
          criado_em?: string
          dificuldade_esperar?: boolean | null
          dificuldade_mudanca_rotina?: boolean | null
          estrategias_acalmar?: string | null
          estrategias_que_funcionam?: string | null
          familia_id?: string
          gatilhos?: string[] | null
          gosta_animais?: boolean | null
          gosta_atividades_agua?: boolean | null
          gosta_natureza?: boolean | null
          id?: string
          idade?: number | null
          interesses_extra?: string[] | null
          nivel_tea?: Database["public"]["Enums"]["tea_nivel"] | null
          nome_autista?: string
          notas_adicionais?: string | null
          precisa_cardapio_visual?: boolean | null
          precisa_checkin_antecipado?: boolean | null
          precisa_concierge_tea?: boolean | null
          precisa_fila_prioritaria?: boolean | null
          precisa_sala_sensorial?: boolean | null
          quarto_andar_baixo?: boolean | null
          quarto_blackout?: boolean | null
          quarto_cama_extra?: boolean | null
          quarto_longe_elevador?: boolean | null
          quarto_observacoes?: string | null
          quarto_sem_estampas?: boolean | null
          rotina_horario_acordar?: string | null
          rotina_horario_dormir?: string | null
          rotina_observacoes?: string | null
          sensivel_cheiros?: boolean | null
          sensivel_luz?: boolean | null
          sensivel_multidao?: boolean | null
          sensivel_sons?: boolean | null
          sensivel_texturas?: boolean | null
          sinais_sobrecarga?: string | null
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
      perfil_tea: {
        Row: {
          abafadores_descricao: string | null
          alimentos_aceitos: string | null
          alimentos_recusados: string | null
          apoio_alimentacao: string | null
          apoio_deslocamento: string | null
          apoio_higiene: string | null
          apoio_regras: string | null
          apoio_vestir: string | null
          atividades_preferidas: string | null
          autonomia_espacos: string | null
          checkin_ansiedade: boolean | null
          checkin_equipe_saber: boolean | null
          checkin_evitar_fila: boolean | null
          compreende_instrucoes: string | null
          comunicacao_misto_descricao: string | null
          created_at: string
          desencadeadores: string | null
          dorme_melhor_com: string[]
          espera_fila_restaurante: string | null
          estimulos_acalmam: string | null
          estrategias_ambientes_novos: string | null
          estrategias_funcionam: string[]
          forma_comunicacao: string[]
          formas_abordagem: string | null
          gatilho_sensorial: string | null
          gosta_piscina: string | null
          horario_acordar: string | null
          horario_almoco: string | null
          horario_cafe: string | null
          horario_dormir: string | null
          horario_jantar: string | null
          horario_lanche: string | null
          id: string
          idade: number | null
          marca_favorece_aceitacao: string | null
          mudanca_rotina_sofrimento: boolean | null
          nome_pessoa: string
          o_que_gera_alegria: string | null
          o_que_nao_fazer: string | null
          objetos_adaptacao: string | null
          objetos_personagens: string | null
          observacoes_comunicacao: string | null
          piscina_horario_tranquilo: boolean | null
          piscina_muitas_pessoas: boolean | null
          piscina_supervisao: boolean | null
          piscina_temperatura: boolean | null
          prefere_ambiente_reservado: boolean | null
          preferencia_crise: string[]
          preferencia_localizacao: string | null
          preparacao_especial_quarto: string | null
          recreacao_evitar: string | null
          recreacao_gosta: boolean | null
          recreacao_interesses: string | null
          recreacao_preferencia: string | null
          recreacao_tolera_som: boolean | null
          recursos_comunicacao: string[]
          responde_melhor_a: string | null
          restaurante_apoio_visual: boolean | null
          restaurante_fila: string | null
          restaurante_horario_tranquilo: boolean | null
          restaurante_reservado: boolean | null
          risco_fuga: boolean | null
          risco_recusa_alimentar: string | null
          rotina_matinal_descricao: string | null
          seletividade: string | null
          sensibilidade_ar_condicionado: boolean | null
          sensibilidade_iluminacao: boolean | null
          sensibilidades_alimentares: string[]
          sensorial_barulho_pessoas: string | null
          sensorial_calor: string | null
          sensorial_cheiros_fortes: string | null
          sensorial_eco: string | null
          sensorial_frio: string | null
          sensorial_iluminacao_intensa: string | null
          sensorial_locais_cheios: string | null
          sensorial_luz_piscando: string | null
          sensorial_movimento_visual: string | null
          sensorial_musica_ambiente: string | null
          sensorial_perfumes: string | null
          sensorial_sons_subitos: string | null
          sensorial_superficies_molhadas: string | null
          sensorial_toque_inesperado: string | null
          sinais_desconforto: string[]
          supervisao_constante: boolean | null
          tem_rotina_matinal: boolean | null
          temas_interesses: string | null
          tempo_acalmar: string | null
          updated_at: string
          usa_abafadores: string | null
          user_id: string
          utensilios_especificos: boolean | null
        }
        Insert: {
          abafadores_descricao?: string | null
          alimentos_aceitos?: string | null
          alimentos_recusados?: string | null
          apoio_alimentacao?: string | null
          apoio_deslocamento?: string | null
          apoio_higiene?: string | null
          apoio_regras?: string | null
          apoio_vestir?: string | null
          atividades_preferidas?: string | null
          autonomia_espacos?: string | null
          checkin_ansiedade?: boolean | null
          checkin_equipe_saber?: boolean | null
          checkin_evitar_fila?: boolean | null
          compreende_instrucoes?: string | null
          comunicacao_misto_descricao?: string | null
          created_at?: string
          desencadeadores?: string | null
          dorme_melhor_com?: string[]
          espera_fila_restaurante?: string | null
          estimulos_acalmam?: string | null
          estrategias_ambientes_novos?: string | null
          estrategias_funcionam?: string[]
          forma_comunicacao?: string[]
          formas_abordagem?: string | null
          gatilho_sensorial?: string | null
          gosta_piscina?: string | null
          horario_acordar?: string | null
          horario_almoco?: string | null
          horario_cafe?: string | null
          horario_dormir?: string | null
          horario_jantar?: string | null
          horario_lanche?: string | null
          id?: string
          idade?: number | null
          marca_favorece_aceitacao?: string | null
          mudanca_rotina_sofrimento?: boolean | null
          nome_pessoa: string
          o_que_gera_alegria?: string | null
          o_que_nao_fazer?: string | null
          objetos_adaptacao?: string | null
          objetos_personagens?: string | null
          observacoes_comunicacao?: string | null
          piscina_horario_tranquilo?: boolean | null
          piscina_muitas_pessoas?: boolean | null
          piscina_supervisao?: boolean | null
          piscina_temperatura?: boolean | null
          prefere_ambiente_reservado?: boolean | null
          preferencia_crise?: string[]
          preferencia_localizacao?: string | null
          preparacao_especial_quarto?: string | null
          recreacao_evitar?: string | null
          recreacao_gosta?: boolean | null
          recreacao_interesses?: string | null
          recreacao_preferencia?: string | null
          recreacao_tolera_som?: boolean | null
          recursos_comunicacao?: string[]
          responde_melhor_a?: string | null
          restaurante_apoio_visual?: boolean | null
          restaurante_fila?: string | null
          restaurante_horario_tranquilo?: boolean | null
          restaurante_reservado?: boolean | null
          risco_fuga?: boolean | null
          risco_recusa_alimentar?: string | null
          rotina_matinal_descricao?: string | null
          seletividade?: string | null
          sensibilidade_ar_condicionado?: boolean | null
          sensibilidade_iluminacao?: boolean | null
          sensibilidades_alimentares?: string[]
          sensorial_barulho_pessoas?: string | null
          sensorial_calor?: string | null
          sensorial_cheiros_fortes?: string | null
          sensorial_eco?: string | null
          sensorial_frio?: string | null
          sensorial_iluminacao_intensa?: string | null
          sensorial_locais_cheios?: string | null
          sensorial_luz_piscando?: string | null
          sensorial_movimento_visual?: string | null
          sensorial_musica_ambiente?: string | null
          sensorial_perfumes?: string | null
          sensorial_sons_subitos?: string | null
          sensorial_superficies_molhadas?: string | null
          sensorial_toque_inesperado?: string | null
          sinais_desconforto?: string[]
          supervisao_constante?: boolean | null
          tem_rotina_matinal?: boolean | null
          temas_interesses?: string | null
          tempo_acalmar?: string | null
          updated_at?: string
          usa_abafadores?: string | null
          user_id: string
          utensilios_especificos?: boolean | null
        }
        Update: {
          abafadores_descricao?: string | null
          alimentos_aceitos?: string | null
          alimentos_recusados?: string | null
          apoio_alimentacao?: string | null
          apoio_deslocamento?: string | null
          apoio_higiene?: string | null
          apoio_regras?: string | null
          apoio_vestir?: string | null
          atividades_preferidas?: string | null
          autonomia_espacos?: string | null
          checkin_ansiedade?: boolean | null
          checkin_equipe_saber?: boolean | null
          checkin_evitar_fila?: boolean | null
          compreende_instrucoes?: string | null
          comunicacao_misto_descricao?: string | null
          created_at?: string
          desencadeadores?: string | null
          dorme_melhor_com?: string[]
          espera_fila_restaurante?: string | null
          estimulos_acalmam?: string | null
          estrategias_ambientes_novos?: string | null
          estrategias_funcionam?: string[]
          forma_comunicacao?: string[]
          formas_abordagem?: string | null
          gatilho_sensorial?: string | null
          gosta_piscina?: string | null
          horario_acordar?: string | null
          horario_almoco?: string | null
          horario_cafe?: string | null
          horario_dormir?: string | null
          horario_jantar?: string | null
          horario_lanche?: string | null
          id?: string
          idade?: number | null
          marca_favorece_aceitacao?: string | null
          mudanca_rotina_sofrimento?: boolean | null
          nome_pessoa?: string
          o_que_gera_alegria?: string | null
          o_que_nao_fazer?: string | null
          objetos_adaptacao?: string | null
          objetos_personagens?: string | null
          observacoes_comunicacao?: string | null
          piscina_horario_tranquilo?: boolean | null
          piscina_muitas_pessoas?: boolean | null
          piscina_supervisao?: boolean | null
          piscina_temperatura?: boolean | null
          prefere_ambiente_reservado?: boolean | null
          preferencia_crise?: string[]
          preferencia_localizacao?: string | null
          preparacao_especial_quarto?: string | null
          recreacao_evitar?: string | null
          recreacao_gosta?: boolean | null
          recreacao_interesses?: string | null
          recreacao_preferencia?: string | null
          recreacao_tolera_som?: boolean | null
          recursos_comunicacao?: string[]
          responde_melhor_a?: string | null
          restaurante_apoio_visual?: boolean | null
          restaurante_fila?: string | null
          restaurante_horario_tranquilo?: boolean | null
          restaurante_reservado?: boolean | null
          risco_fuga?: boolean | null
          risco_recusa_alimentar?: string | null
          rotina_matinal_descricao?: string | null
          seletividade?: string | null
          sensibilidade_ar_condicionado?: boolean | null
          sensibilidade_iluminacao?: boolean | null
          sensibilidades_alimentares?: string[]
          sensorial_barulho_pessoas?: string | null
          sensorial_calor?: string | null
          sensorial_cheiros_fortes?: string | null
          sensorial_eco?: string | null
          sensorial_frio?: string | null
          sensorial_iluminacao_intensa?: string | null
          sensorial_locais_cheios?: string | null
          sensorial_luz_piscando?: string | null
          sensorial_movimento_visual?: string | null
          sensorial_musica_ambiente?: string | null
          sensorial_perfumes?: string | null
          sensorial_sons_subitos?: string | null
          sensorial_superficies_molhadas?: string | null
          sensorial_toque_inesperado?: string | null
          sinais_desconforto?: string[]
          supervisao_constante?: boolean | null
          tem_rotina_matinal?: boolean | null
          temas_interesses?: string | null
          tempo_acalmar?: string | null
          updated_at?: string
          usa_abafadores?: string | null
          user_id?: string
          utensilios_especificos?: boolean | null
        }
        Relationships: []
      }
      pre_checkins: {
        Row: {
          criado_em: string
          dados: Json
          data_checkin: string | null
          data_checkout: string | null
          email: string
          estabelecimento_id: string
          estabelecimento_slug: string
          id: string
          idade: number | null
          nome_autista: string
          nome_responsavel: string
          origem: string | null
          telefone: string
        }
        Insert: {
          criado_em?: string
          dados?: Json
          data_checkin?: string | null
          data_checkout?: string | null
          email: string
          estabelecimento_id: string
          estabelecimento_slug: string
          id?: string
          idade?: number | null
          nome_autista: string
          nome_responsavel: string
          origem?: string | null
          telefone: string
        }
        Update: {
          criado_em?: string
          dados?: Json
          data_checkin?: string | null
          data_checkout?: string | null
          email?: string
          estabelecimento_id?: string
          estabelecimento_slug?: string
          id?: string
          idade?: number | null
          nome_autista?: string
          nome_responsavel?: string
          origem?: string | null
          telefone?: string
        }
        Relationships: []
      }
      reservas: {
        Row: {
          acompanhantes: Json | null
          conversa_previa_equipe: boolean | null
          criado_em: string
          data_checkin: string | null
          data_checkout: string | null
          estabelecimento_id: string
          familia_id: string
          historico_negativo: string | null
          id: string
          mensagem: string | null
          notas_especificas: string | null
          num_acompanhantes: number | null
          num_adultos: number | null
          num_autistas: number | null
          objetivo: string | null
          objetivo_viagem: string[]
          perfil_enviado_ao_estabelecimento: boolean | null
          perfil_sensorial_id: string | null
          perfil_tea_id: string | null
          pessoa_referencia: string | null
          recomendacoes_adicionais: string | null
          status: Database["public"]["Enums"]["reserva_status"] | null
        }
        Insert: {
          acompanhantes?: Json | null
          conversa_previa_equipe?: boolean | null
          criado_em?: string
          data_checkin?: string | null
          data_checkout?: string | null
          estabelecimento_id: string
          familia_id: string
          historico_negativo?: string | null
          id?: string
          mensagem?: string | null
          notas_especificas?: string | null
          num_acompanhantes?: number | null
          num_adultos?: number | null
          num_autistas?: number | null
          objetivo?: string | null
          objetivo_viagem?: string[]
          perfil_enviado_ao_estabelecimento?: boolean | null
          perfil_sensorial_id?: string | null
          perfil_tea_id?: string | null
          pessoa_referencia?: string | null
          recomendacoes_adicionais?: string | null
          status?: Database["public"]["Enums"]["reserva_status"] | null
        }
        Update: {
          acompanhantes?: Json | null
          conversa_previa_equipe?: boolean | null
          criado_em?: string
          data_checkin?: string | null
          data_checkout?: string | null
          estabelecimento_id?: string
          familia_id?: string
          historico_negativo?: string | null
          id?: string
          mensagem?: string | null
          notas_especificas?: string | null
          num_acompanhantes?: number | null
          num_adultos?: number | null
          num_autistas?: number | null
          objetivo?: string | null
          objetivo_viagem?: string[]
          perfil_enviado_ao_estabelecimento?: boolean | null
          perfil_sensorial_id?: string | null
          perfil_tea_id?: string | null
          pessoa_referencia?: string | null
          recomendacoes_adicionais?: string | null
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
          {
            foreignKeyName: "reservas_perfil_tea_id_fkey"
            columns: ["perfil_tea_id"]
            isOneToOne: false
            referencedRelation: "perfil_tea"
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
          promoted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          promoted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          promoted_by?: string | null
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
      get_dashboard_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      promote_to_admin: { Args: { _user_id: string }; Returns: undefined }
      publicar_conteudo_agendado: { Args: never; Returns: number }
      registrar_acesso_link_curto: { Args: { _slug: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user" | "estabelecimento"
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
        | "excursao"
        | "passeio_educativo"
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
      app_role: ["admin", "user", "estabelecimento"],
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
        "excursao",
        "passeio_educativo",
      ],
      reserva_status: ["pendente", "confirmada", "cancelada", "concluida"],
      tea_nivel: ["leve", "moderado", "severo"],
    },
  },
} as const
