# Catálogo de Contrato de Features (clientOnly vs persistidas)

Gerado em: 2026-02-24T16:33:50.936Z

Flows totais: 39
Client-only: 8
Persistidos validados: 16
Mistos/parciais: 15
Não classificados: 0
Validados por catálogo de evidência: 13

| Flow ID | Perfil | Tipo de contrato | ClientOnly | Final esperado | Endpoints | Persistência (P0/P1/P2) | Evidência explícita |
|---|---|---|---|---|---|---|---|
| buscador_ritual_diario | BUSCADOR | MISTO_OU_PARCIAL | Não | HISTORY | /api/metamorphosis/checkin, /api/users/checkin | 0/36/5 | Não |
| buscador_metamorfose_karma_timelapse | BUSCADOR | MISTO_OU_PARCIAL | Não | TIME_LAPSE_EXPERIENCE | /api/metamorphosis/evolution, /api/oracle/history | 0/31/5 | Não |
| buscador_busca_agenda_confirmacao | BUSCADOR | MISTO_OU_PARCIAL | Não | PAYMENT_SUCCESS | /api/appointments/*, /api/checkout/pay, /api/notifications/* | 0/7/7 | Não |
| buscador_marketplace_checkout | BUSCADOR | PERSISTIDO_VALIDADO | Não | PAYMENT_HISTORY | /api/marketplace/products, /api/checkout/pay | 0/2/9 | Sim |
| buscador_tribo_convite | BUSCADOR | PERSISTIDO_VALIDADO | Não | CHAT_ROOM | /api/tribe/*, /api/chat/* | 0/0/13 | Não |
| buscador_retiro_offline | BUSCADOR | MISTO_OU_PARCIAL | Não | TRIBE_DASH | /api/tribe/sync, /api/notifications/* | 0/1/7 | Não |
| buscador_pacto_de_alma | BUSCADOR | MISTO_OU_PARCIAL | Não | TRIBE_DASH | /api/invites/create, /api/tribe/* | 0/1/7 | Não |
| buscador_circulo_de_cura_checkout | BUSCADOR | PERSISTIDO_VALIDADO | Não | PAYMENT_SUCCESS | /api/calendar, /api/checkout/pay | 0/1/14 | Sim |
| buscador_missoes_diarias | BUSCADOR | CLIENT_ONLY | Sim | KARMA_WALLET | — | 0/14/11 | Não |
| buscador_grimorio_colecao | BUSCADOR | CLIENT_ONLY | Sim | DASHBOARD | — | 0/14/15 | Não |
| buscador_oraculo_completo | BUSCADOR | PERSISTIDO_VALIDADO | Não | ORACLE_HISTORY | /api/oracle/* | 0/14/13 | Sim |
| buscador_jornada_analitica_e_journal | BUSCADOR | MISTO_OU_PARCIAL | Não | CLIENT_JOURNAL | /api/metamorphosis/*, /api/oracle/history | 0/49/7 | Não |
| buscador_chat_social | BUSCADOR | PERSISTIDO_VALIDADO | Não | CHAT_SETTINGS | /api/chat/*, /api/tribe/* | 0/14/19 | Sim |
| buscador_metamorfose_ritual_retorno | BUSCADOR | MISTO_OU_PARCIAL | Não | DASHBOARD | /api/metamorphosis/* | 0/19/4 | Não |
| buscador_shell_e_config | BUSCADOR | CLIENT_ONLY | Sim | END | — | 0/14/21 | Não |
| guardiao_escambo | GUARDIAO | PERSISTIDO_VALIDADO | Não | ESCAMBO_CONFIRM | /api/alchemy/offers/*, /api/chat/* | 0/0/8 | Não |
| guardiao_prontuario_consentido | GUARDIAO | PERSISTIDO_VALIDADO | Não | PATIENT_RECORDS | /api/records/* | 0/0/6 | Não |
| guardiao_intervencao_clinica | GUARDIAO | MISTO_OU_PARCIAL | Não | DASHBOARD | /api/clinical/interventions | 0/7/6 | Não |
| guardiao_alquimia_criar_oferta | GUARDIAO | PERSISTIDO_VALIDADO | Não | ESCAMBO_MARKET | /api/marketplace/products | 0/6/12 | Sim |
| guardiao_agenda_video | GUARDIAO | MISTO_OU_PARCIAL | Não | VIDEO_SESSION | /api/appointments/* | 0/24/12 | Não |
| guardiao_financeiro_expandido | GUARDIAO | MISTO_OU_PARCIAL | Não | FINANCIAL_DASHBOARD | /api/finance/* | 0/10/6 | Não |
| guardiao_tribo_chat | GUARDIAO | PERSISTIDO_VALIDADO | Não | CHAT_ROOM | /api/chat/*, /api/tribe/* | 0/6/18 | Sim |
| guardiao_vagas_completas | GUARDIAO | PERSISTIDO_VALIDADO | Não | VAGA_APPLY | /api/recruitment/* | 0/6/12 | Sim |
| guardiao_santuarios_parceria | GUARDIAO | MISTO_OU_PARCIAL | Não | SANTUARIO_CONTRACT | /api/spaces/* | 0/12/6 | Não |
| guardiao_paciente_plano_e_trade | GUARDIAO | PERSISTIDO_VALIDADO | Não | ESCAMBO_CONFIRM | /api/alchemy/*, /api/records/* | 0/0/11 | Não |
| guardiao_shell_e_config | GUARDIAO | CLIENT_ONLY | Sim | END | — | 0/12/14 | Não |
| santuario_vagas_entrevista | SANTUARIO | PERSISTIDO_VALIDADO | Não | VAGA_CANDIDATES | /api/recruitment/* | 3/12/7 | Sim |
| santuario_operacao_completa | SANTUARIO | MISTO_OU_PARCIAL | Não | FINANCE_OVERVIEW | /api/spaces/*, /api/rooms/*, /api/finance/* | 5/25/3 | Não |
| santuario_inteligencia_preditiva | SANTUARIO | CLIENT_ONLY | Sim | ROOM_AGENDA | — | 3/14/5 | Não |
| santuario_auditoria_interna | SANTUARIO | CLIENT_ONLY | Sim | GOVERNANCE | — | 3/12/8 | Não |
| santuario_pacientes_operacao | SANTUARIO | PERSISTIDO_VALIDADO | Não | AGENDA_EDIT | /api/records/*, /api/appointments/* | 3/24/13 | Sim |
| santuario_time_e_avaliacao_servico | SANTUARIO | PERSISTIDO_VALIDADO | Não | SERVICE_EVALUATION | /api/spaces/*, /api/reviews/* | 3/27/3 | Sim |
| santuario_salaseestrutura_expandida | SANTUARIO | MISTO_OU_PARCIAL | Não | ROOM_AGENDA | /api/rooms/* | 6/23/3 | Não |
| santuario_financeiro_expandido | SANTUARIO | MISTO_OU_PARCIAL | Não | FINANCE_FORECAST | /api/finance/* | 3/17/3 | Não |
| santuario_marketplace_eventos_retiros | SANTUARIO | MISTO_OU_PARCIAL | Não | RETREATS_MANAGE | /api/marketplace/*, /api/events/* | 5/19/3 | Não |
| santuario_recrutamento_completo | SANTUARIO | PERSISTIDO_VALIDADO | Não | VAGA_CANDIDATES | /api/recruitment/* | 3/12/8 | Sim |
| santuario_analytics_reputacao_chat | SANTUARIO | PERSISTIDO_VALIDADO | Não | CHAT_ROOM | /api/chat/*, /api/analytics/* | 3/14/6 | Sim |
| santuario_shell_e_encerramento | SANTUARIO | CLIENT_ONLY | Sim | END | — | 3/23/7 | Não |
| santuario_avaliacao_servico | SANTUARIO | CLIENT_ONLY | Sim | EXEC_DASHBOARD | — | 3/16/3 | Sim |
